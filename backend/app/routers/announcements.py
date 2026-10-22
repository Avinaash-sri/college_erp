import datetime
import logging
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, schemas
from app.auth import get_current_user

logger = logging.getLogger("erp_announcements")

router = APIRouter(tags=["Announcements & Notifications"])


def get_logged_in_admin(current_user: models.User = Depends(get_current_user)) -> models.User:
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Administrative privileges required"
        )
    return current_user


# ==============================================================================
# ADMIN ANNOUNCEMENT MANAGEMENT
# ==============================================================================

@router.get("/admin/announcements", response_model=List[schemas.AnnouncementResponse])
def get_admin_announcements(
    category: Optional[str] = Query(None),
    status_filter: Optional[str] = Query(None),
    admin: models.User = Depends(get_logged_in_admin),
    db: Session = Depends(get_db)
):
    """
    Returns all announcements with optional category and status filtering.
    """
    query = db.query(models.Announcement)
    if category and category != "All":
        query = query.filter(models.Announcement.category == category)
    if status_filter and status_filter != "All":
        query = query.filter(models.Announcement.status == status_filter)

    announcements = query.order_by(models.Announcement.created_at.desc()).all()

    result = []
    for a in announcements:
        creator_name = a.creator.email if a.creator else "Administrator"
        dept_name = a.target_department.name if a.target_department else None

        result.append(schemas.AnnouncementResponse(
            id=a.id,
            title=a.title,
            description=a.description,
            category=a.category,
            poster_url=a.poster_url,
            event_date=a.event_date,
            registration_url=a.registration_url,
            audience_type=a.audience_type,
            target_department_id=a.target_department_id,
            target_department_name=dept_name,
            target_semester=a.target_semester,
            target_section=a.target_section,
            status=a.status,
            created_by_name=creator_name,
            created_at=a.created_at,
            published_at=a.published_at or a.created_at
        ))

    return result


@router.post("/admin/announcements", response_model=schemas.AnnouncementResponse)
def create_announcement(
    payload: schemas.AnnouncementCreate,
    admin: models.User = Depends(get_logged_in_admin),
    db: Session = Depends(get_db)
):
    """
    Creates an administrative announcement and, when published, automatically
    generates notification records scoped strictly to the intended audience.
    """
    now = datetime.datetime.utcnow()

    announcement = models.Announcement(
        title=payload.title.strip(),
        description=payload.description.strip(),
        category=payload.category,
        poster_url=payload.poster_url,
        event_date=payload.event_date,
        registration_url=payload.registration_url,
        audience_type=payload.audience_type,
        target_department_id=payload.target_department_id,
        target_semester=payload.target_semester,
        target_section=payload.target_section,
        status=payload.status,
        created_by=admin.id,
        created_at=now,
        published_at=now if payload.status == "published" else None
    )
    db.add(announcement)
    db.flush()

    # If published, generate notifications for intended recipients
    if payload.status == "published":
        _dispatch_announcement_notifications(db, announcement)

    db.commit()
    db.refresh(announcement)

    dept_name = announcement.target_department.name if announcement.target_department else None

    return schemas.AnnouncementResponse(
        id=announcement.id,
        title=announcement.title,
        description=announcement.description,
        category=announcement.category,
        poster_url=announcement.poster_url,
        event_date=announcement.event_date,
        registration_url=announcement.registration_url,
        audience_type=announcement.audience_type,
        target_department_id=announcement.target_department_id,
        target_department_name=dept_name,
        target_semester=announcement.target_semester,
        target_section=announcement.target_section,
        status=announcement.status,
        created_by_name=admin.email,
        created_at=announcement.created_at,
        published_at=announcement.published_at or now
    )


def _dispatch_announcement_notifications(db: Session, announcement: models.Announcement):
    """
    Determines matching recipients based on audience criteria and generates
    individual, private notification records in Supabase PostgreSQL.
    """
    now = datetime.datetime.utcnow()

    # Query matching students
    std_query = db.query(models.Student)
    if announcement.audience_type == "department" and announcement.target_department_id:
        std_query = std_query.filter(models.Student.department_id == announcement.target_department_id)
    elif announcement.audience_type == "semester":
        if announcement.target_department_id:
            std_query = std_query.filter(models.Student.department_id == announcement.target_department_id)
        if announcement.target_semester:
            std_query = std_query.filter(models.Student.semester == announcement.target_semester)
    elif announcement.audience_type == "section":
        if announcement.target_department_id:
            std_query = std_query.filter(models.Student.department_id == announcement.target_department_id)
        if announcement.target_semester:
            std_query = std_query.filter(models.Student.semester == announcement.target_semester)
        if announcement.target_section and announcement.target_section != "All":
            std_query = std_query.filter(models.Student.section == announcement.target_section)

    students = std_query.all()
    user_ids = {s.user_id for s in students if s.user_id}

    # Also notify faculty if audience is all or department
    if announcement.audience_type in ["all", "department"]:
        fac_query = db.query(models.Faculty)
        if announcement.audience_type == "department" and announcement.target_department_id:
            fac_query = fac_query.filter(models.Faculty.department_id == announcement.target_department_id)
        faculty_members = fac_query.all()
        for f in faculty_members:
            if f.user_id:
                user_ids.add(f.user_id)

    short_msg = (announcement.description[:140] + "...") if len(announcement.description) > 140 else announcement.description

    for uid in user_ids:
        notif = models.Notification(
            user_id=uid,
            announcement_id=announcement.id,
            title=announcement.title,
            message=short_msg,
            type=announcement.category,
            link_url=None,
            is_read=False,
            is_cleared=False,
            created_at=now
        )
        db.add(notif)


@router.put("/admin/announcements/{announcement_id}", response_model=schemas.AnnouncementResponse)
def update_announcement(
    announcement_id: int,
    payload: schemas.AnnouncementUpdate,
    admin: models.User = Depends(get_logged_in_admin),
    db: Session = Depends(get_db)
):
    """
    Updates an announcement. If changing from draft to published, dispatches notifications.
    """
    announcement = db.query(models.Announcement).filter(
        models.Announcement.id == announcement_id
    ).first()

    if not announcement:
        raise HTTPException(status_code=404, detail="Announcement not found")

    was_draft = announcement.status == "draft"

    if payload.title is not None:
        announcement.title = payload.title.strip()
    if payload.description is not None:
        announcement.description = payload.description.strip()
    if payload.category is not None:
        announcement.category = payload.category
    if payload.poster_url is not None:
        announcement.poster_url = payload.poster_url
    if payload.event_date is not None:
        announcement.event_date = payload.event_date
    if payload.registration_url is not None:
        announcement.registration_url = payload.registration_url
    if payload.status is not None:
        announcement.status = payload.status
        if payload.status == "published" and was_draft:
            announcement.published_at = datetime.datetime.utcnow()
            _dispatch_announcement_notifications(db, announcement)

    db.commit()
    db.refresh(announcement)

    dept_name = announcement.target_department.name if announcement.target_department else None
    return schemas.AnnouncementResponse(
        id=announcement.id,
        title=announcement.title,
        description=announcement.description,
        category=announcement.category,
        poster_url=announcement.poster_url,
        event_date=announcement.event_date,
        registration_url=announcement.registration_url,
        audience_type=announcement.audience_type,
        target_department_id=announcement.target_department_id,
        target_department_name=dept_name,
        target_semester=announcement.target_semester,
        target_section=announcement.target_section,
        status=announcement.status,
        created_by_name=admin.email,
        created_at=announcement.created_at,
        published_at=announcement.published_at or announcement.created_at
    )


@router.delete("/admin/announcements/{announcement_id}")
def delete_announcement(
    announcement_id: int,
    admin: models.User = Depends(get_logged_in_admin),
    db: Session = Depends(get_db)
):
    """
    Deletes an announcement and cascades removal of notifications.
    """
    announcement = db.query(models.Announcement).filter(
        models.Announcement.id == announcement_id
    ).first()

    if not announcement:
        raise HTTPException(status_code=404, detail="Announcement not found")

    db.delete(announcement)
    db.commit()
    return {"status": "success", "message": "Announcement deleted successfully"}


# ==============================================================================
# USER NOTIFICATION INTERACTIONS (OPEN, READ, CLEAR, MARK ALL AS READ)
# ==============================================================================

@router.get("/notifications/me")
def get_my_notifications(
    category: Optional[str] = Query(None),
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Returns only active (non-cleared) notifications for the authenticated user.
    Students never see another student's notifications.
    Includes full announcement details if linked.
    """
    query = db.query(models.Notification).filter(
        models.Notification.user_id == current_user.id,
        models.Notification.is_cleared == False
    )

    if category and category != "All":
        query = query.filter(models.Notification.type == category)

    notifs = query.order_by(models.Notification.created_at.desc()).all()

    result = []
    for n in notifs:
        ann = n.announcement
        ann_detail = None
        if ann:
            ann_detail = {
                "id": ann.id,
                "title": ann.title,
                "description": ann.description,
                "category": ann.category,
                "poster_url": ann.poster_url,
                "event_date": ann.event_date.isoformat() if ann.event_date else None,
                "registration_url": ann.registration_url,
                "published_at": (ann.published_at or ann.created_at).isoformat()
            }

        result.append({
            "id": n.id,
            "title": n.title,
            "message": n.message,
            "type": n.type,
            "link_url": n.link_url,
            "announcement_id": n.announcement_id,
            "announcement": ann_detail,
            "is_read": n.is_read,
            "created_at": n.created_at.isoformat(),
            "read_at": n.read_at.isoformat() if n.read_at else None
        })

    return result


@router.get("/notifications/unread-count")
def get_unread_notification_count(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Accurately calculates the current unread count for the active user badge.
    Excludes cleared notifications.
    """
    count = db.query(models.Notification).filter(
        models.Notification.user_id == current_user.id,
        models.Notification.is_read == False,
        models.Notification.is_cleared == False
    ).count()

    return {"unread_count": count}


@router.put("/notifications/{notif_id}/read")
def mark_notification_as_read(
    notif_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Marks an individual notification as read on the backend.
    Preserves state across refresh, logout, and login.
    """
    notif = db.query(models.Notification).filter(
        models.Notification.id == notif_id,
        models.Notification.user_id == current_user.id
    ).first()

    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")

    notif.is_read = True
    notif.read_at = datetime.datetime.utcnow()
    db.commit()

    return {"status": "success", "message": "Notification marked as read"}


@router.put("/notifications/{notif_id}/clear")
def clear_individual_notification(
    notif_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Clears an individual notification from the user's active list.
    Persists cleared state in the database so it never reappears on refresh.
    CRITICAL: Does NOT delete the original announcement!
    """
    notif = db.query(models.Notification).filter(
        models.Notification.id == notif_id,
        models.Notification.user_id == current_user.id
    ).first()

    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")

    notif.is_cleared = True
    notif.cleared_at = datetime.datetime.utcnow()
    db.commit()

    return {"status": "success", "message": "Notification cleared successfully"}


@router.put("/notifications/read-all")
def mark_all_my_notifications_read(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Marks all non-cleared notifications for the logged-in user as read.
    """
    now = datetime.datetime.utcnow()
    db.query(models.Notification).filter(
        models.Notification.user_id == current_user.id,
        models.Notification.is_read == False,
        models.Notification.is_cleared == False
    ).update({"is_read": True, "read_at": now})
    db.commit()

    return {"status": "success", "message": "All notifications marked as read"}
