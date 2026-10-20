import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/common/Layout';
import LoadingSpinner from './components/common/LoadingSpinner';

// Auth Page
import LoginPage from './pages/auth/LoginPage';

// Student Pages
import StudentDashboard from './pages/student/StudentDashboard';
import StudentAttendance from './pages/student/StudentAttendance';
import StudentTimetable from './pages/student/StudentTimetable';
import StudentExams from './pages/student/StudentExams';
import StudentFees from './pages/student/StudentFees';
import StudentPlacements from './pages/student/StudentPlacements';
import StudentNotifications from './pages/student/StudentNotifications';
import StudentProfile from './pages/student/StudentProfile';
import AIAssistant from './pages/student/AIAssistant';
import StudentComplaints from './pages/student/StudentComplaints';

// Faculty Pages
import FacultyDashboard from './pages/faculty/FacultyDashboard';
import FacultyAttendance from './pages/faculty/FacultyAttendance';
import FacultyStudents from './pages/faculty/FacultyStudents';
import FacultyMarks from './pages/faculty/FacultyMarks';
import FacultyTimetable from './pages/faculty/FacultyTimetable';
import FacultyProfile from './pages/faculty/FacultyProfile';
import FacultyAnnouncements from './pages/faculty/FacultyAnnouncements';
import FacultyComplaints from './pages/faculty/FacultyComplaints';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminStudents from './pages/admin/AdminStudents';
import AdminFaculty from './pages/admin/AdminFaculty';
import AdminDepartments from './pages/admin/AdminDepartments';
import AdminSubjects from './pages/admin/AdminSubjects';
import AdminTimetable from './pages/admin/AdminTimetable';
import AdminExams from './pages/admin/AdminExams';
import AdminFees from './pages/admin/AdminFees';
import AdminPlacements from './pages/admin/AdminPlacements';
import AdminNotifications from './pages/admin/AdminNotifications';
import AdminAttendanceAlerts from './pages/admin/AdminAttendanceAlerts';
import AdminComplaints from './pages/admin/AdminComplaints';
import AdminSettings from './pages/admin/AdminSettings';

function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner message="Checking security credentials..." />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to their own dashboard
    if (user.role === 'admin') return <Navigate to="/admin/dashboard" replace />;
    if (user.role === 'faculty') return <Navigate to="/faculty/dashboard" replace />;
    return <Navigate to="/student/dashboard" replace />;
  }

  return children;
}

function RoleHomeRedirect() {
  const { user, loading } = useAuth();

  if (loading) return <LoadingSpinner />;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'admin') return <Navigate to="/admin/dashboard" replace />;
  if (user.role === 'faculty') return <Navigate to="/faculty/dashboard" replace />;
  return <Navigate to="/student/dashboard" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      {/* Root redirect based on role */}
      <Route path="/" element={<RoleHomeRedirect />} />

      {/* Authenticated Layout Routes */}
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        {/* Student Routes */}
        <Route
          path="/student/dashboard"
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <StudentDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/attendance"
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <StudentAttendance />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/timetable"
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <StudentTimetable />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/exams"
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <StudentExams />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/fees"
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <StudentFees />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/placements"
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <StudentPlacements />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/notifications"
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <StudentNotifications />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/profile"
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <StudentProfile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/ai-assistant"
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <AIAssistant />
            </ProtectedRoute>
          }
        />

        <Route
          path="/student/complaints"
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <StudentComplaints />
            </ProtectedRoute>
          }
        />

        {/* Faculty Routes */}
        <Route
          path="/faculty/dashboard"
          element={
            <ProtectedRoute allowedRoles={['faculty']}>
              <FacultyDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/faculty/attendance"
          element={
            <ProtectedRoute allowedRoles={['faculty']}>
              <FacultyAttendance />
            </ProtectedRoute>
          }
        />
        <Route
          path="/faculty/students"
          element={
            <ProtectedRoute allowedRoles={['faculty']}>
              <FacultyStudents />
            </ProtectedRoute>
          }
        />
        <Route
          path="/faculty/marks"
          element={
            <ProtectedRoute allowedRoles={['faculty']}>
              <FacultyMarks />
            </ProtectedRoute>
          }
        />
        <Route
          path="/faculty/timetable"
          element={
            <ProtectedRoute allowedRoles={['faculty']}>
              <FacultyTimetable />
            </ProtectedRoute>
          }
        />
        <Route
          path="/faculty/profile"
          element={
            <ProtectedRoute allowedRoles={['faculty']}>
              <FacultyProfile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/faculty/subjects"
          element={
            <ProtectedRoute allowedRoles={['faculty']}>
              <FacultyStudents />
            </ProtectedRoute>
          }
        />
        <Route
          path="/faculty/announcements"
          element={
            <ProtectedRoute allowedRoles={['faculty']}>
              <FacultyAnnouncements />
            </ProtectedRoute>
          }
        />
        <Route
          path="/faculty/complaints"
          element={
            <ProtectedRoute allowedRoles={['faculty']}>
              <FacultyComplaints />
            </ProtectedRoute>
          }
        />

        {/* Admin Routes */}
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/students"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminStudents />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/faculty"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminFaculty />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/departments"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDepartments />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/subjects"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminSubjects />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/timetable"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminTimetable />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/exams"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminExams />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/fees"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminFees />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/placements"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminPlacements />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/notifications"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminNotifications />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/attendance-alerts"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminAttendanceAlerts />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/complaints"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminComplaints />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/settings"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminSettings />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
