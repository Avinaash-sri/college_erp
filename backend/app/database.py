import re
import logging
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.config import settings

logger = logging.getLogger("erp_database")
logging.basicConfig(level=logging.INFO)

Base = declarative_base()

def sanitize_db_url(url: str) -> str:
    """Masks password in database URL for safe logging."""
    if not url:
        return "None"
    return re.sub(r":([^:@]+)@", ":****@", url)

def normalize_database_url(url: str) -> str:
    """
    Normalizes Postgres connection strings for SQLAlchemy & psycopg2.
    Supabase URLs typically begin with postgres:// or postgresql://.
    SQLAlchemy requires postgresql+psycopg2:// for psycopg2 driver.
    """
    if not url:
        return url
    trimmed = url.strip()
    if trimmed.startswith("postgres://"):
        return "postgresql+psycopg2://" + trimmed[len("postgres://"):]
    if trimmed.startswith("postgresql://") and not trimmed.startswith("postgresql+"):
        return "postgresql+psycopg2://" + trimmed[len("postgresql://"):]
    return trimmed

def get_engine():
    raw_db_url = (settings.DATABASE_URL or "").strip()
    is_production = settings.ENVIRONMENT.lower() == "production"

    if raw_db_url:
        if raw_db_url.startswith("http://") or raw_db_url.startswith("https://"):
            logger.warning(
                f"Notice: '{raw_db_url}' is a Supabase HTTP REST URL, not a direct PostgreSQL URI. "
                "FastAPI requires PostgreSQL connection string format (postgresql://postgres:[PASSWORD]@...). "
                "Falling back safely to local database so the service boots without crashing."
            )
            raw_db_url = ""

        db_url = normalize_database_url(raw_db_url)
        sanitized = sanitize_db_url(db_url)

        # 1. Supabase / PostgreSQL Connection
        if "postgresql" in db_url:
            try:
                # Connection options suitable for Supabase direct (5432) or pooler (6543) connections
                connect_args = {}
                # Supabase requires SSL. Ensure sslmode=require
                if "sslmode=" not in db_url:
                    connect_args["sslmode"] = "require"

                # Check if Supabase transaction pooler (port 6543)
                is_pooler = ":6543" in db_url or "pooler.supabase.com" in db_url

                logger.info(f"Connecting to Supabase PostgreSQL: {sanitized} (Pooler: {is_pooler})")
                pg_engine = create_engine(
                    db_url,
                    pool_pre_ping=True,      # Tests connection liveness before checking out
                    pool_recycle=300,        # Recycle connections every 5 minutes to avoid stale sockets
                    pool_size=5 if is_pooler else 10,
                    max_overflow=10,
                    connect_args=connect_args
                )
                # Test connectivity
                with pg_engine.connect():
                    logger.info("Successfully established connection to Supabase PostgreSQL database.")
                return pg_engine
            except Exception as e:
                err_msg = (
                    f"CRITICAL: Failed to connect to Supabase PostgreSQL database ({sanitized}): {str(e)}"
                )
                logger.error(err_msg)
                if is_production or settings.DATABASE_URL:
                    # In production or when cloud DB is explicitly configured, never fall back silently to SQLite
                    raise RuntimeError(
                        f"Database connection to Supabase PostgreSQL failed: {e}. Refusing silent SQLite fallback."
                    )
                logger.warning(f"Development mode fallback: Using local SQLite database at {settings.FALLBACK_SQLITE_URL}")

        # 2. MySQL Connection
        elif db_url.startswith("mysql"):
            try:
                logger.info(f"Connecting to MySQL database: {sanitized}")
                mysql_engine = create_engine(
                    db_url,
                    pool_pre_ping=True,
                    pool_recycle=3600,
                    connect_args={"connect_timeout": 5}
                )
                with mysql_engine.connect():
                    logger.info("Successfully connected to MySQL database.")
                return mysql_engine
            except Exception as e:
                err_msg = f"Could not connect to MySQL ({e})."
                logger.warning(err_msg)
                if is_production:
                    raise RuntimeError(f"Database connection to MySQL failed in production mode: {e}")
                logger.warning(f"Development mode fallback: Using local SQLite database at {settings.FALLBACK_SQLITE_URL}")

    # 3. SQLite Database (Fallback when DATABASE_URL is not set)
    if is_production and not raw_db_url:
        logger.warning(
            "DATABASE_URL is not configured in production environment. "
            "Falling back to local SQLite database so the FastAPI SMTP and AI API service remains online."
        )

    logger.info(f"Initializing local SQLite database at {settings.FALLBACK_SQLITE_URL}")
    return create_engine(
        settings.FALLBACK_SQLITE_URL,
        connect_args={"check_same_thread": False}
    )

engine = get_engine()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
