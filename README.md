# Cloud-Based ERP for Colleges

A full-stack, production-grade mini-project built for higher education institutions. Designed for university and college administration, faculty operations, and student self-service.

Featuring an **Intelligent Attendance Engine with Consecutive-Class Recovery Prediction**, **Automated Parent Email Notifications**, a **Student AI ERP Assistant**, and a **Dedicated Admin Attendance Alert Center**.

---

## 🌟 Key Highlights & Major Features

### 1. Intelligent Attendance Engine
- **Attendance Percentage Formula**:
  $$\text{Percentage} = \left(\frac{\text{Attended Classes}}{\text{Total Conducted Classes}}\right) \times 100$$
- **Rule-Based Risk Classification**:
  - $\ge 75.0\%$ &rarr; **SAFE** (Eligible for university semester examinations)
  - $65.0\% \text{ to } 74.99\%$ &rarr; **WARNING** (Shortage alert threshold)
  - $< 65.0\%$ &rarr; **HIGH RISK** (Critical attendance shortage)
- **Mathematical Recovery Prediction**:
  Calculates the exact minimum number of consecutive classes $x$ a student must attend without unexcused absence to restore attendance back to $75\%$:
  $$\frac{\text{attended} + x}{\text{total} + x} \ge 0.75 \implies x = \max(0, \lceil 3 \times \text{total} - 4 \times \text{attended} \rceil)$$
  *Displays: "Attend X more consecutive classes to reach 75%."* Only shown when attendance $< 75\%$.

### 2. Automated Parent Email Notification Workflow
- Each student record maintains a registered **Parent Name** and **Parent Email** in the database.
- Whenever faculty submits attendance, the backend calculates the student's prior and new attendance percentage.
- **Threshold Crossing Detection**: If the student's attendance crosses from $\ge 75\%$ down to $< 75\%$, the system:
  1. Creates an official `AttendanceAlert` record in the database.
  2. Generates an in-app notification in the student's ERP portal.
  3. Dispatches a formatted HTML and plain-text alert to the registered parent email via SMTP.
- **Anti-Spam Logic**: Does not send redundant emails while the student continuously remains below 75%; triggers only upon crossing the threshold or upon explicit administrative action.
- **Safe Demo Mode**: If external SMTP credentials are not configured in `.env`, the system safely logs and renders full HTML previews in the Admin console without crashing.

### 3. Dedicated Admin Attendance Alert Center
- A real-time executive dashboard listing all students currently below 75%.
- **Send Test Alert**: Allows administrators and project evaluators to test the parent email notification workflow on demand without altering live academic attendance records.
- **View Email Preview**: In-app modal viewer displaying the exact HTML template delivered to parents, complete with student metrics, recovery guidance, and college branding.
- **Historical Audit Trail**: Full log of all alerts dispatched with timestamps, recipient addresses, and delivery statuses.

### 4. Student AI ERP Assistant
- Chat interface allowing students to query their academic records using natural language.
- Contextual intent handling mapped directly to the logged-in student's live relational database records:
  - *"What is my attendance?"* &rarr; Returns overall % and subject-wise metrics.
  - *"Which subjects am I below 75%?"* &rarr; Filters shortage subjects.
  - *"How many classes should I attend to reach 75%?"* &rarr; Answers using the recovery prediction formula.
  - *"What is my timetable today?"* &rarr; Retrieves today's lecture schedule and rooms.
  - *"When is my next exam?"* &rarr; Displays upcoming examination dates and venues.
  - *"Do I have any pending fees?"* &rarr; Queries fee balance and due dates.
  - *"What placements are available?"* &rarr; Lists campus hiring drives.
- Provides clickable inquiry suggestion pills and strict student data privacy isolation.

---

## 🛠️ Technology Stack

### Frontend
- **Framework**: React.js 18 with Vite
- **Styling**: Tailwind CSS (Clean, minimalist academic palette: white/light slate `#f8fafc` background with institutional blue `#026fc7` / `#1e40af` primary accents)
- **Routing**: React Router v6 with Role-Based Route Guards
- **HTTP Client**: Axios with automatic JWT bearer token interceptors
- **Icons**: Lucide React

### Backend
- **Framework**: Python 3.13 / FastAPI (High-performance REST API)
- **Validation**: Pydantic v2 schemas
- **ORM**: SQLAlchemy 2.0
- **Security**: JWT Authentication (python-jose) + Bcrypt password hashing (passlib)
- **API Documentation**: Interactive Swagger UI (`/docs`) & ReDoc (`/redoc`)

### Database
- **Primary Engine**: MySQL 8.0+ / MariaDB (production)
- **Seamless Local Fallback**: SQLite (`college_erp.db`) auto-selected when MySQL is not active, enabling zero-config local testing.
- **Relational Schema**: Complete SQL dump provided in `database/schema.sql`.

### Email Service
- SMTP-based mailer (`smtplib`) supporting TLS/SSL.
- Environment-variable configuration with graceful simulation mode.

---

## 📂 Project Structure

```
cloud_based_erp/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                 # FastAPI application, CORS, lifespan startup & seeding
│   │   ├── config.py               # Pydantic BaseSettings for .env
│   │   ├── database.py             # Dual MySQL / SQLite engine manager
│   │   ├── models.py               # SQLAlchemy ORM relational models
│   │   ├── schemas.py              # Pydantic request/response validation
│   │   ├── auth.py                 # JWT token creation & role authorization
│   │   ├── attendance_service.py   # Attendance calculations & recovery formula
│   │   ├── email_service.py        # SMTP dispatcher & HTML email templates
│   │   ├── ai_assistant.py         # Student AI chatbot query engine
│   │   ├── seed_data.py            # Pre-populated realistic demo dataset
│   │   └── routers/
│   │       ├── auth.py             # /auth/login, /auth/me, /auth/demo-accounts
│   │       ├── students.py         # Student portal endpoints
│   │       ├── faculty.py          # Faculty attendance & marks endpoints
│   │       ├── admin.py            # Admin CRUD, Alert Center & settings
│   │       └── chat.py             # AI ERP assistant endpoint
│   ├── requirements.txt
│   ├── run.py                      # Backend launcher
│   ├── .env.example
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── api/client.js           # Axios instance with auth interceptors
│   │   ├── context/AuthContext.jsx # Auth state provider & demo switcher
│   │   ├── components/common/      # Reusable Header, Sidebar, StatCard, Badge, Modal
│   │   ├── pages/
│   │   │   ├── auth/               # LoginPage with 1-click demo switcher
│   │   │   ├── student/            # Dashboard, Attendance, Timetable, Exams, Fees, Placements, AIAssistant
│   │   │   ├── faculty/            # Dashboard, Attendance marking, Students, Marks, Timetable
│   │   │   └── admin/              # Dashboard, Students, Faculty, Attendance Alerts, Settings, Timetable
│   │   ├── App.jsx                 # Route definitions & guards
│   │   ├── main.jsx
│   │   └── index.css
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── .env.example
│   └── .env
├── database/
│   └── schema.sql                  # MySQL database initialization script
└── README.md
```

---

## 🚀 Quick Setup & Installation

### Prerequisites
- **Python 3.10+** (Tested on Python 3.13)
- **Node.js 18+** and **npm**
- *(Optional)* **MySQL 8.0+** if you wish to run on a live MySQL instance instead of the automatic SQLite engine.

---

### Step 1: Backend Setup

1. Open a terminal in the `backend/` directory:
   ```bash
   cd backend
   ```
2. Install Python dependencies:
   ```bash
   python -m pip install -r requirements.txt
   ```
3. *(Optional)* Configure your `.env` file (copy from `.env.example`):
   ```ini
   APP_NAME="Cloud-Based ERP for Colleges"
   SECRET_KEY="your-secret-key"
   DATABASE_URL=mysql+pymysql://root:password@localhost:3306/college_erp
   FALLBACK_SQLITE_URL=sqlite:///./college_erp.db
   SAFE_THRESHOLD=75.0
   WARNING_THRESHOLD=65.0

   # SMTP Configuration (Optional)
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USERNAME=your-email@gmail.com
   SMTP_PASSWORD=your-app-password
   SMTP_FROM_EMAIL=noreply@college-erp.edu
   ```
   > **Note**: If `SMTP_HOST` is left blank, the application automatically runs in **Demo Mode**, logging and previewing all emails in full HTML within the Admin console without crashing.

4. Run the FastAPI backend:
   ```bash
   python run.py
   ```
   The backend starts on `http://127.0.0.1:8000`. Database tables and realistic seed data are populated automatically!
   - API Docs: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

---

### Step 2: Frontend Setup

1. Open a new terminal in the `frontend/` directory:
   ```bash
   cd frontend
   ```
2. Install frontend dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
4. Open your browser and navigate to:
   ```
   http://localhost:5173
   ```

---

## 🔑 Demo Accounts & 1-Click Credentials

The login screen features an instant **1-Click Demo Account Switcher** allowing immediate sign-in with any role:

| Role | Account Name | Email | Password | Description / Attendance |
|---|---|---|---|---|
| **Admin** | System Administrator | `admin@college.edu` | `admin123` | Institutional KPIs, CRUD, Alert Center |
| **Faculty** | Dr. Rajesh Kulkarni | `rajesh.kulkarni@college.edu` | `faculty123` | HOD CSE, Marks Attendance, Student Risk Monitor |
| **Student** | Aarav Sharma | `aarav.sharma@student.edu` | `student123` | **81.6% SAFE** (Normal standing) |
| **Student** | Ananya Iyer | `ananya.iyer@student.edu` | `student123` | **68.0% WARNING** (Parent alert logged) |
| **Student** | Vikram Singh | `vikram.singh@student.edu` | `student123` | **57.6% HIGH RISK** (Critical shortage) |

---

## 🗄️ MySQL Database Setup (Optional)

If you prefer to connect to an external MySQL server:
1. Start your local MySQL service.
2. Open MySQL CLI or Workbench and run:
   ```sql
   CREATE DATABASE college_erp;
   ```
3. Import the provided schema:
   ```bash
   mysql -u root -p college_erp < database/schema.sql
   ```
4. Update `DATABASE_URL` in `backend/.env`:
   ```ini
   DATABASE_URL=mysql+pymysql://<user>:<password>@localhost:3306/college_erp
   ```
5. Restart the backend server. It will automatically detect MySQL and verify seed data.

---

## 📡 Key REST API Endpoints

- `POST /auth/login`: Authenticate and receive JWT bearer token.
- `GET /students/me/dashboard`: Consolidated student metrics and timetable.
- `GET /students/me/attendance`: Full attendance breakdown and recovery calculation.
- `POST /faculty/attendance`: Batch attendance submission with automatic threshold-crossing detection and parent email dispatch.
- `GET /faculty/students?risk_filter=High Risk`: Filter department students by attendance risk standing.
- `GET /admin/dashboard-stats`: Executive institutional statistics.
- `GET /admin/attendance-alerts`: Attendance Alert Center records for all students $< 75\%$.
- `POST /admin/attendance-alerts/test`: Safe manual trigger for parent email alerts.
- `POST /chat`: Student AI ERP assistant query endpoint.
