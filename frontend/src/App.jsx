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
import StudentQuizzes from './pages/student/StudentQuizzes';
import StudentAssignments from './pages/student/StudentAssignments';
// New student pages
import StudentGPA from './pages/student/StudentGPA';
import StudentMaterials from './pages/student/StudentMaterials';
import StudentLeave from './pages/student/StudentLeave';
import StudentDocuments from './pages/student/StudentDocuments';

// Faculty Pages
import FacultyDashboard from './pages/faculty/FacultyDashboard';
import FacultySubjects from './pages/faculty/FacultySubjects';
import FacultyAttendance from './pages/faculty/FacultyAttendance';
import FacultyStudents from './pages/faculty/FacultyStudents';
import FacultyMarks from './pages/faculty/FacultyMarks';
import FacultyTimetable from './pages/faculty/FacultyTimetable';
import FacultyProfile from './pages/faculty/FacultyProfile';
import FacultyAnnouncements from './pages/faculty/FacultyAnnouncements';
import FacultyComplaints from './pages/faculty/FacultyComplaints';
import FacultyQuizzes from './pages/faculty/FacultyQuizzes';
import FacultyAssignments from './pages/faculty/FacultyAssignments';
import FacultyLeave from './pages/faculty/FacultyLeave';
import FacultyMaterials from './pages/faculty/FacultyMaterials';
import FacultyNotifications from './pages/faculty/FacultyNotifications';

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
import AdminAnnouncements from './pages/admin/AdminAnnouncements';
import AdminAttendanceAlerts from './pages/admin/AdminAttendanceAlerts';
import AdminComplaints from './pages/admin/AdminComplaints';
import AdminSettings from './pages/admin/AdminSettings';
// New admin pages
import AdminAcademicCalendar from './pages/admin/AdminAcademicCalendar';
import AdminFacultyPerformance from './pages/admin/AdminFacultyPerformance';
import AdminLeave from './pages/admin/AdminLeave';
import AdminDocuments from './pages/admin/AdminDocuments';

function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner message="Checking security credentials..." />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
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

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error('App ErrorBoundary caught:', error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-100 flex items-center justify-center p-6">
          <div className="bg-white rounded-xl max-w-md w-full p-6 text-center shadow-lg border border-slate-200">
            <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4 font-bold text-xl">!</div>
            <h2 className="text-base font-bold text-slate-900 mb-2">Something went wrong</h2>
            <p className="text-xs text-slate-500 mb-6 leading-relaxed">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => { localStorage.clear(); window.location.href = '/login'; }}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold py-2.5 rounded-lg transition-colors"
              >
                Reset & Sign In
              </button>
              <button
                onClick={() => window.location.reload()}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold py-2.5 rounded-lg transition-colors"
              >
                Reload Page
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// Helper to reduce boilerplate
const Protected = ({ path, roles, component: Component }) => (
  <Route
    path={path}
    element={
      <ProtectedRoute allowedRoles={roles}>
        <Component />
      </ProtectedRoute>
    }
  />
);

export default function App() {
  return (
    <ErrorBoundary>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Authenticated Layout Routes */}
        <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>

          {/* ── Student Routes ── */}
          <Route path="/student/dashboard"    element={<ProtectedRoute allowedRoles={['student']}><StudentDashboard /></ProtectedRoute>} />
          <Route path="/student/attendance"   element={<ProtectedRoute allowedRoles={['student']}><StudentAttendance /></ProtectedRoute>} />
          <Route path="/student/timetable"    element={<ProtectedRoute allowedRoles={['student']}><StudentTimetable /></ProtectedRoute>} />
          <Route path="/student/exams"        element={<ProtectedRoute allowedRoles={['student']}><StudentExams /></ProtectedRoute>} />
          <Route path="/student/fees"         element={<ProtectedRoute allowedRoles={['student']}><StudentFees /></ProtectedRoute>} />
          <Route path="/student/placements"   element={<ProtectedRoute allowedRoles={['student']}><StudentPlacements /></ProtectedRoute>} />
          <Route path="/student/notifications" element={<ProtectedRoute allowedRoles={['student']}><StudentNotifications /></ProtectedRoute>} />
          <Route path="/student/profile"      element={<ProtectedRoute allowedRoles={['student']}><StudentProfile /></ProtectedRoute>} />
          <Route path="/student/notes"        element={<ProtectedRoute allowedRoles={['student']}><AIAssistant /></ProtectedRoute>} />
          <Route path="/student/ai-assistant" element={<ProtectedRoute allowedRoles={['student']}><AIAssistant /></ProtectedRoute>} />
          <Route path="/student/complaints"   element={<ProtectedRoute allowedRoles={['student']}><StudentComplaints /></ProtectedRoute>} />
          <Route path="/student/quizzes"      element={<ProtectedRoute allowedRoles={['student']}><StudentQuizzes /></ProtectedRoute>} />
          <Route path="/student/assignments"  element={<ProtectedRoute allowedRoles={['student']}><StudentAssignments /></ProtectedRoute>} />
          {/* New Student Routes */}
          <Route path="/student/gpa"          element={<ProtectedRoute allowedRoles={['student']}><StudentGPA /></ProtectedRoute>} />
          <Route path="/student/materials"    element={<ProtectedRoute allowedRoles={['student']}><StudentMaterials /></ProtectedRoute>} />
          <Route path="/student/leave"        element={<ProtectedRoute allowedRoles={['student']}><StudentLeave /></ProtectedRoute>} />
          <Route path="/student/documents"    element={<ProtectedRoute allowedRoles={['student']}><StudentDocuments /></ProtectedRoute>} />

          {/* ── Faculty Routes ── */}
          <Route path="/faculty/dashboard"    element={<ProtectedRoute allowedRoles={['faculty']}><FacultyDashboard /></ProtectedRoute>} />
          <Route path="/faculty/attendance"   element={<ProtectedRoute allowedRoles={['faculty']}><FacultyAttendance /></ProtectedRoute>} />
          <Route path="/faculty/students"     element={<ProtectedRoute allowedRoles={['faculty']}><FacultyStudents /></ProtectedRoute>} />
          <Route path="/faculty/marks"        element={<ProtectedRoute allowedRoles={['faculty']}><FacultyMarks /></ProtectedRoute>} />
          <Route path="/faculty/timetable"    element={<ProtectedRoute allowedRoles={['faculty']}><FacultyTimetable /></ProtectedRoute>} />
          <Route path="/faculty/profile"      element={<ProtectedRoute allowedRoles={['faculty']}><FacultyProfile /></ProtectedRoute>} />
          <Route path="/faculty/subjects"     element={<ProtectedRoute allowedRoles={['faculty']}><FacultySubjects /></ProtectedRoute>} />
          <Route path="/faculty/announcements" element={<ProtectedRoute allowedRoles={['faculty']}><FacultyAnnouncements /></ProtectedRoute>} />
          <Route path="/faculty/complaints"   element={<ProtectedRoute allowedRoles={['faculty']}><FacultyComplaints /></ProtectedRoute>} />
          <Route path="/faculty/quizzes"      element={<ProtectedRoute allowedRoles={['faculty']}><FacultyQuizzes /></ProtectedRoute>} />
          <Route path="/faculty/assignments"  element={<ProtectedRoute allowedRoles={['faculty']}><FacultyAssignments /></ProtectedRoute>} />
          {/* New Faculty Routes */}
          <Route path="/faculty/leave"        element={<ProtectedRoute allowedRoles={['faculty']}><FacultyLeave /></ProtectedRoute>} />
          <Route path="/faculty/materials"    element={<ProtectedRoute allowedRoles={['faculty']}><FacultyMaterials /></ProtectedRoute>} />
          <Route path="/faculty/notifications" element={<ProtectedRoute allowedRoles={['faculty']}><FacultyNotifications /></ProtectedRoute>} />

          {/* ── Admin Routes ── */}
          <Route path="/admin/dashboard"          element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/students"           element={<ProtectedRoute allowedRoles={['admin']}><AdminStudents /></ProtectedRoute>} />
          <Route path="/admin/faculty"            element={<ProtectedRoute allowedRoles={['admin']}><AdminFaculty /></ProtectedRoute>} />
          <Route path="/admin/departments"        element={<ProtectedRoute allowedRoles={['admin']}><AdminDepartments /></ProtectedRoute>} />
          <Route path="/admin/subjects"           element={<ProtectedRoute allowedRoles={['admin']}><AdminSubjects /></ProtectedRoute>} />
          <Route path="/admin/timetable"          element={<ProtectedRoute allowedRoles={['admin']}><AdminTimetable /></ProtectedRoute>} />
          <Route path="/admin/exams"              element={<ProtectedRoute allowedRoles={['admin']}><AdminExams /></ProtectedRoute>} />
          <Route path="/admin/fees"               element={<ProtectedRoute allowedRoles={['admin']}><AdminFees /></ProtectedRoute>} />
          <Route path="/admin/placements"         element={<ProtectedRoute allowedRoles={['admin']}><AdminPlacements /></ProtectedRoute>} />
          <Route path="/admin/notifications"      element={<ProtectedRoute allowedRoles={['admin']}><AdminNotifications /></ProtectedRoute>} />
          <Route path="/admin/announcements"      element={<ProtectedRoute allowedRoles={['admin']}><AdminAnnouncements /></ProtectedRoute>} />
          <Route path="/admin/attendance-alerts"  element={<ProtectedRoute allowedRoles={['admin']}><AdminAttendanceAlerts /></ProtectedRoute>} />
          <Route path="/admin/complaints"         element={<ProtectedRoute allowedRoles={['admin']}><AdminComplaints /></ProtectedRoute>} />
          <Route path="/admin/settings"           element={<ProtectedRoute allowedRoles={['admin']}><AdminSettings /></ProtectedRoute>} />
          {/* New Admin Routes */}
          <Route path="/admin/academic-calendar"  element={<ProtectedRoute allowedRoles={['admin']}><AdminAcademicCalendar /></ProtectedRoute>} />
          <Route path="/admin/faculty-performance" element={<ProtectedRoute allowedRoles={['admin']}><AdminFacultyPerformance /></ProtectedRoute>} />
          <Route path="/admin/leave"              element={<ProtectedRoute allowedRoles={['admin']}><AdminLeave /></ProtectedRoute>} />
          <Route path="/admin/documents"          element={<ProtectedRoute allowedRoles={['admin']}><AdminDocuments /></ProtectedRoute>} />

        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ErrorBoundary>
  );
}
