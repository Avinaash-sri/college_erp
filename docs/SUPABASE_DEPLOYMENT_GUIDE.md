# Complete Setup & Supabase Deployment Guide

This guide walks you step-by-step through setting up Supabase, configuring SMTP email alerts, running the system locally, and deploying both backend and frontend to free-tier cloud platforms.

---

## 1. Supabase Cloud Database Setup

### Step 1: Create a Free Supabase Project
1. Go to [supabase.com](https://supabase.com) and sign in (or create a free account).
2. Click **New Project**.
3. Choose your organization, name your project (e.g., `college-erp`), set a strong database password, and select the region nearest to your users.
4. Click **Create new project** and wait 1–2 minutes for the database to provision.

### Step 2: Run the SQL Schema Migration
1. In your Supabase project dashboard, navigate to the **SQL Editor** from the left sidebar.
2. Click **+ New Query**.
3. Open the file [supabase_schema.sql](file:///c:/Users/Avinaash%20Sri/OneDrive/Documents/cloud_based_erp/database/supabase_schema.sql) from this project.
4. Copy the entire contents, paste it into the Supabase SQL Editor, and click **Run**.
5. You will see: `"Cloud-Based College ERP PostgreSQL Schema Successfully Initialized!"`
6. Verify in the **Table Editor** that all 18 tables are present (`users`, `students`, `faculty`, `departments`, `subjects`, `attendance`, `attendance_alerts`, `complaints`, `assignments`, etc.).

### Step 3: Copy Your PostgreSQL Connection String
1. In Supabase, go to **Project Settings** (gear icon) -> **Database**.
2. Under **Connection string**, select **URI**:
   - **For Serverless/Cloud Deployments (Recommended)**: Select **Connection pooler** (Port 6543, Transaction mode).
     Example:
     `postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?sslmode=require`
   - **For Long-running Servers**: Select **Direct connection** (Port 5432).
     Example:
     `postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres?sslmode=require`
3. Replace `[YOUR-PASSWORD]` with the database password you created in Step 1.

---

## 2. Environment Configuration

### Backend (`backend/.env`)
Copy [backend/.env.example](file:///c:/Users/Avinaash%20Sri/OneDrive/Documents/cloud_based_erp/backend/.env.example) to `backend/.env`:
```ini
ENVIRONMENT=production
DATABASE_URL=postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?sslmode=require
SECRET_KEY=generate_a_secure_random_32_character_key
ACCESS_TOKEN_EXPIRE_MINUTES=1440
FRONTEND_URL=https://your-frontend.vercel.app

# SMTP Settings
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=notifications@yourcollege.edu
SMTP_PASSWORD=your_16_character_app_password
SMTP_FROM_EMAIL=notifications@yourcollege.edu
SMTP_FROM_NAME="College Academic Administration"
SMTP_USE_TLS=true

SAFE_THRESHOLD=75.0
WARNING_THRESHOLD=65.0
```

### Frontend (`frontend/.env`)
```ini
VITE_API_URL=https://your-backend.onrender.com
```
*(For local development, keep `VITE_API_URL=http://127.0.0.1:8000`)*

---

## 3. Configuring SMTP (Gmail App Password Guide)

If using Google Gmail / Google Workspace for sending automated parent attendance alerts:
1. Log in to your Google Account.
2. Go to **Security** -> **2-Step Verification** (must be enabled).
3. Scroll to the bottom and click **App passwords**.
4. In the "App name" box, type `College ERP Mailer` and click **Create**.
5. Copy the generated 16-character password (e.g., `abcd efgh ijkl mnop`).
6. Set in `backend/.env`:
   - `SMTP_HOST=smtp.gmail.com`
   - `SMTP_PORT=587`
   - `SMTP_USERNAME=your-email@gmail.com`
   - `SMTP_PASSWORD=abcdefghijklmnop` (without spaces)
   - `SMTP_USE_TLS=true`
7. Test it live in the Admin Portal under **System Settings** -> **Test SMTP Gateway Dispatch**.

---

## 4. Local Execution Commands

### Seed Initial Development Demo Accounts
To seed initial demo accounts into your local SQLite or Supabase database:
```bash
cd backend
python run_seed.py
```

### Start FastAPI Backend
```bash
cd backend
uvicorn app.main:app --reload --port 8000
```
API Documentation will be live at: `http://127.0.0.1:8000/docs`

### Start React Frontend
```bash
cd frontend
cmd /c npm run dev
```
Frontend will be live at: `http://localhost:5173`

---

## 5. Free-Tier Cloud Deployment Guide

### Option A: Backend on Render / Railway
1. **Create Account**: Sign up at [render.com](https://render.com) or [railway.app](https://railway.app).
2. **New Web Service**: Connect your GitHub repository.
3. **Root Directory**: `backend`
4. **Environment**: Python 3
5. **Build Command**: `pip install -r requirements.txt`
6. **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
7. **Environment Variables**: Add all variables from your `backend/.env` (especially `DATABASE_URL`, `SECRET_KEY`, and `ENVIRONMENT=production`).

### Option B: Frontend on Vercel
1. Sign up at [vercel.com](https://vercel.com) and import your Git repository.
2. **Root Directory**: `frontend`
3. **Framework Preset**: Vite
4. **Build Command**: `npm run build`
5. **Output Directory**: `dist`
6. **Environment Variables**:
   `VITE_API_URL` = `https://your-backend-service.onrender.com`
7. Click **Deploy**.

---

## 6. How to Verify Production Data in Supabase
1. Open your Supabase Dashboard -> **Table Editor**.
2. Navigate to `attendance` or `attendance_alerts`.
3. In the ERP application, log in as Faculty and mark a student absent.
4. Refresh the Supabase Table Editor; you will see the row inserted with the real timestamp, student ID, and status.
5. In the Admin Portal, open **Attendance Alert Center** to view the live logged dispatch attempt.
