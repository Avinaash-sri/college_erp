import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import client from '../../api/client';
import {
  GraduationCap,
  ShieldCheck,
  UserCheck,
  BookOpen,
  AlertCircle,
  ArrowRight,
  UserPlus,
  KeyRound,
  CheckCircle2,
  LogIn
} from 'lucide-react';

export default function LoginPage() {
  const [activeTab, setActiveTab] = useState('login'); // 'login', 'signup', 'forgot'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const { login, setUser } = useAuth();
  const navigate = useNavigate();

  // Signup form state
  const [signupData, setSignupData] = useState({
    name: '',
    email: '',
    password: '',
    reg_no: '',
    department_id: 1,
    semester: 6,
    section: 'A',
    parent_name: '',
    parent_email: '',
    phone: '',
    address: ''
  });
  const [departments, setDepartments] = useState([]);

  // Forgot password form state
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [recoveryToken, setRecoveryToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [recoveryStep, setRecoveryStep] = useState(1); // 1: request, 2: reset

  useEffect(() => {
    // Load departments for registration
    client.get('/admin/departments')
      .then((res) => {
        setDepartments(res.data);
        if (res.data.length > 0) {
          setSignupData((prev) => ({ ...prev, department_id: res.data[0].id }));
        }
      })
      .catch(() => {});
  }, []);

  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const userData = await login(email, password);
      if (userData.role === 'admin') navigate('/admin/dashboard');
      else if (userData.role === 'faculty') navigate('/faculty/dashboard');
      else navigate('/student/dashboard');
    } catch (err) {
      if (!err.response) {
        setError('Cannot connect to the ERP backend server (http://127.0.0.1:8000). Please ensure the backend is running.');
      } else {
        setError(err.response.data?.detail || 'Authentication failed. Please verify your credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const res = await client.post('/auth/register', signupData);
      const { access_token, ...userData } = res.data;
      localStorage.setItem('erp_token', access_token);
      localStorage.setItem('erp_user', JSON.stringify(userData));
      setUser(userData);
      navigate('/student/dashboard');
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed. Please check your information.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const res = await client.post('/auth/forgot-password', { email: recoveryEmail });
      setSuccessMsg(res.data.message || 'Recovery instructions dispatched.');
      if (res.data.reset_token) {
        setRecoveryToken(res.data.reset_token);
      }
      setRecoveryStep(2);
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not process password recovery request.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const res = await client.post('/auth/reset-password', {
        email: recoveryEmail,
        reset_token: recoveryToken,
        new_password: newPassword
      });
      setSuccessMsg(res.data.message || 'Password reset successfully. Please log in.');
      setEmail(recoveryEmail);
      setPassword('');
      setRecoveryStep(1);
      setTimeout(() => {
        setActiveTab('login');
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to reset password. Please check your recovery token.');
    } finally {
      setLoading(false);
    }
  };

  const selectDemoAccount = (demoEmail, demoPassword) => {
    setActiveTab('login');
    setEmail(demoEmail);
    setPassword(demoPassword);
    setError('');
    setSuccessMsg('');
  };

  const demoAccounts = [
    {
      role: 'Admin',
      name: 'System Administrator',
      email: 'admin@college.edu',
      password: 'admin123',
      icon: ShieldCheck,
      color: 'purple',
      badge: 'Full Access',
      badgeClass: 'bg-purple-50 text-purple-700 border-purple-200'
    },
    {
      role: 'Faculty',
      name: 'Dr. Rajesh Kulkarni (HOD)',
      email: 'rajesh.kulkarni@college.edu',
      password: 'faculty123',
      icon: UserCheck,
      color: 'blue',
      badge: 'CSE Dept',
      badgeClass: 'bg-blue-50 text-blue-700 border-blue-200'
    },
    {
      role: 'Student',
      name: 'Aarav Sharma (21CS101)',
      email: 'aarav.sharma@student.edu',
      password: 'student123',
      icon: BookOpen,
      color: 'emerald',
      badge: '82% Safe',
      badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200'
    },
    {
      role: 'Student',
      name: 'Ananya Iyer (21CS104)',
      email: 'ananya.iyer@student.edu',
      password: 'student123',
      icon: BookOpen,
      color: 'amber',
      badge: '68% Warning',
      badgeClass: 'bg-amber-50 text-amber-700 border-amber-200'
    },
    {
      role: 'Student',
      name: 'Vikram Singh (21CS105)',
      email: 'vikram.singh@student.edu',
      password: 'student123',
      icon: BookOpen,
      color: 'rose',
      badge: '58% High Risk',
      badgeClass: 'bg-rose-50 text-rose-700 border-rose-200'
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="mx-auto h-12 w-12 rounded-xl bg-blue-700 flex items-center justify-center text-white shadow-sm mb-4">
          <GraduationCap className="h-7 w-7" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Cloud-Based ERP for Colleges</h2>
        <p className="mt-1 text-xs text-slate-500 font-medium">Academic Management &amp; Intelligent Attendance Portal</p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        {/* Navigation Tabs */}
        <div className="flex rounded-xl bg-slate-200/70 p-1 mb-4 text-xs font-semibold">
          <button
            type="button"
            onClick={() => { setActiveTab('login'); setError(''); setSuccessMsg(''); }}
            className={`flex-1 py-2 rounded-lg flex items-center justify-center space-x-1.5 transition-all ${
              activeTab === 'login' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Sign In</span>
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('signup'); setError(''); setSuccessMsg(''); }}
            className={`flex-1 py-2 rounded-lg flex items-center justify-center space-x-1.5 transition-all ${
              activeTab === 'signup' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Student Sign Up</span>
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('forgot'); setError(''); setSuccessMsg(''); }}
            className={`flex-1 py-2 rounded-lg flex items-center justify-center space-x-1.5 transition-all ${
              activeTab === 'forgot' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Recovery</span>
          </button>
        </div>

        <div className="bg-white py-8 px-6 sm:px-8 rounded-xl border border-slate-200 shadow-sm">
          {error && (
            <div className="mb-4 rounded-lg bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700 flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-800 flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* 1. SIGN IN FORM */}
          {activeTab === 'login' && (
            <form className="space-y-4" onSubmit={handleLogin}>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                  College Email Address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@college.edu"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => { setActiveTab('forgot'); setRecoveryEmail(email); }}
                    className="text-[11px] text-blue-700 hover:underline"
                  >
                    Forgot Password?
                  </button>
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 flex items-center justify-center space-x-2 rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-blue-800 transition-colors disabled:opacity-50"
              >
                {loading ? (
                  <span>Authenticating...</span>
                ) : (
                  <>
                    <span>Sign In to ERP</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* 2. STUDENT REGISTRATION FORM */}
          {activeTab === 'signup' && (
            <form className="space-y-3" onSubmit={handleSignup}>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={signupData.name}
                  onChange={(e) => setSignupData({ ...signupData, name: e.target.value })}
                  placeholder="e.g. John Doe"
                  className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-900 focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                    Student Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={signupData.email}
                    onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                    placeholder="john@student.edu"
                    className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-900 focus:border-blue-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                    Register Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={signupData.reg_no}
                    onChange={(e) => setSignupData({ ...signupData, reg_no: e.target.value })}
                    placeholder="e.g. 21CS205"
                    className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-900 focus:border-blue-600 focus:outline-none uppercase"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                  Department *
                </label>
                <select
                  value={signupData.department_id}
                  onChange={(e) => setSignupData({ ...signupData, department_id: parseInt(e.target.value) })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-900 focus:border-blue-600 focus:outline-none bg-white"
                >
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.code} - {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                    Semester
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="8"
                    value={signupData.semester}
                    onChange={(e) => setSignupData({ ...signupData, semester: parseInt(e.target.value) })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-900 focus:border-blue-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                    Section
                  </label>
                  <input
                    type="text"
                    value={signupData.section}
                    onChange={(e) => setSignupData({ ...signupData, section: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-900 focus:border-blue-600 focus:outline-none uppercase"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                  Parent Details (Attendance Alerts Target)
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                      Parent Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={signupData.parent_name}
                      onChange={(e) => setSignupData({ ...signupData, parent_name: e.target.value })}
                      placeholder="e.g. Robert Doe"
                      className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-900 focus:border-blue-600 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                      Parent Email *
                    </label>
                    <input
                      type="email"
                      required
                      value={signupData.parent_email}
                      onChange={(e) => setSignupData({ ...signupData, parent_email: e.target.value })}
                      placeholder="parent@example.com"
                      className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-900 focus:border-blue-600 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                  Choose Account Password *
                </label>
                <input
                  type="password"
                  required
                  value={signupData.password}
                  onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                  placeholder="Minimum 6 characters"
                  className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-900 focus:border-blue-600 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-3 flex items-center justify-center space-x-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 transition-colors disabled:opacity-50"
              >
                {loading ? 'Creating Student Account...' : 'Complete Student Registration'}
              </button>
            </form>
          )}

          {/* 3. FORGOT / RESET PASSWORD FORM */}
          {activeTab === 'forgot' && (
            <div className="space-y-4">
              {recoveryStep === 1 ? (
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <p className="text-xs text-slate-500">
                    Enter your registered college email address to receive password recovery instructions.
                  </p>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                      Account Email Address
                    </label>
                    <input
                      type="email"
                      required
                      value={recoveryEmail}
                      onChange={(e) => setRecoveryEmail(e.target.value)}
                      placeholder="user@college.edu"
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center space-x-2 rounded-lg bg-blue-700 px-4 py-2 text-xs font-bold text-white hover:bg-blue-800 disabled:opacity-50"
                  >
                    {loading ? 'Generating Recovery Token...' : 'Request Password Reset Token'}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleResetPassword} className="space-y-3">
                  <p className="text-xs text-slate-500">
                    Enter the recovery token and choose your new password.
                  </p>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                      One-Time Recovery Token *
                    </label>
                    <input
                      type="text"
                      required
                      value={recoveryToken}
                      onChange={(e) => setRecoveryToken(e.target.value)}
                      placeholder="Enter token from email"
                      className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-900 font-mono focus:border-blue-600 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                      New Password *
                    </label>
                    <input
                      type="password"
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-900 focus:border-blue-600 focus:outline-none"
                    />
                  </div>
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={() => setRecoveryStep(1)}
                      className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 rounded-lg bg-blue-700 px-3 py-2 text-xs font-bold text-white hover:bg-blue-800 disabled:opacity-50"
                    >
                      {loading ? 'Updating...' : 'Set New Password'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* Quick Demo Credentials Switcher */}
          <div className="mt-6 pt-6 border-t border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Quick 1-Click Demo Accounts</span>
              <span className="text-[11px] text-slate-400">Click to autofill</span>
            </div>
            <div className="space-y-2">
              {demoAccounts.map((acc, idx) => {
                const Icon = acc.icon;
                const isSelected = email === acc.email && activeTab === 'login';
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => selectDemoAccount(acc.email, acc.password)}
                    className={`w-full flex items-center justify-between p-2.5 rounded-lg border text-left transition-all ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/50'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5">
                      <div className="w-7 h-7 rounded-md bg-slate-100 flex items-center justify-center text-slate-600">
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-slate-800">{acc.name}</div>
                        <div className="text-[11px] text-slate-400">{acc.email}</div>
                      </div>
                    </div>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${acc.badgeClass}`}>
                      {acc.badge}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
