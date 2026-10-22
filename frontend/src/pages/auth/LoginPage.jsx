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
  UserPlus,
  KeyRound,
  CheckCircle2,
  LogIn,
  Eye,
  EyeOff,
  Sparkles,
  ArrowRight,
  School,
  Check
} from 'lucide-react';

export default function LoginPage() {
  const [activeTab, setActiveTab] = useState('login'); // 'login', 'signup', 'forgot'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const { login, setUser } = useAuth();
  const navigate = useNavigate();

  // Signup form state (Student public registration only)
  const [signupData, setSignupData] = useState({
    name: '',
    email: '',
    password: '',
    reg_no: '',
    department_id: 3, // CSE default
    semester: 6,
    section: 'A',
    parent_name: '',
    parent_email: '',
    phone: '',
    address: ''
  });
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [departments, setDepartments] = useState([
    { id: 1, code: 'ECE', name: 'Electronics and Communication Engineering' },
    { id: 2, code: 'IT', name: 'Information Technology' },
    { id: 3, code: 'CSE', name: 'Computer Science and Engineering' }
  ]);

  // Forgot password form state
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [recoveryToken, setRecoveryToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [recoveryStep, setRecoveryStep] = useState(1); // 1: request, 2: reset

  useEffect(() => {
    client.get('/admin/departments')
      .then((res) => {
        if (res.data && res.data.length > 0) {
          setDepartments(res.data);
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
      const detail = err.response?.data?.detail;
      setError(detail || 'Authentication failed. Please verify your credentials or use the demo accounts.');
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
      setSuccessMsg(res.data.message || 'Recovery instructions dispatched to your college email.');
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
      }, 1200);
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

  // Seeded Demo Accounts (Chennai-based, authentic attendance distributions, initial password 'password123')
  const demoAccounts = [
    {
      category: 'Student — Good Attendance (>75%)',
      role: 'Student',
      name: 'Arun Kumar',
      reg_no: '21CS101',
      dept: 'CSE Dept',
      email: 'arun@college.edu',
      password: 'password123',
      icon: BookOpen,
      badge: '84% Safe Attendance',
      badgeClass: 'bg-emerald-500/20 text-emerald-200 border-emerald-400/40',
      academicSummary: 'Quiz: 10/10 • Assignment: Graded (9.5/10)'
    },
    {
      category: 'Student — Medium Attendance (65-75%)',
      role: 'Student',
      name: 'Nivetha S',
      reg_no: '21CS102',
      dept: 'CSE Dept',
      email: 'nivetha@college.edu',
      password: 'password123',
      icon: BookOpen,
      badge: '68% Warning Attendance',
      badgeClass: 'bg-amber-500/20 text-amber-200 border-amber-400/40',
      academicSummary: 'Quiz: 7.5/10 • Assignment: Submitted'
    },
    {
      category: 'Student — Low Attendance (<65%)',
      role: 'Student',
      name: 'Sanjay Kumar',
      reg_no: '21CS105',
      dept: 'CSE Dept',
      email: 'sanjay@college.edu',
      password: 'password123',
      icon: BookOpen,
      badge: '58% High Risk Attendance',
      badgeClass: 'bg-rose-500/20 text-rose-200 border-rose-400/40',
      academicSummary: 'Quiz: Pending • Assignment: Pending (Not Submitted)'
    },
    {
      category: 'Faculty Demo Account',
      role: 'Faculty',
      name: 'Dr. Kavitha Raman',
      reg_no: 'EMP_CSE_01',
      dept: 'Professor & HOD, CSE',
      email: 'kavitha@college.edu',
      password: 'password123',
      icon: UserCheck,
      badge: 'Faculty Privileges',
      badgeClass: 'bg-blue-500/20 text-blue-200 border-blue-400/40',
      academicSummary: 'Quiz & Assignment Management, Grading & Releases'
    },
    {
      category: 'Admin Demo Account',
      role: 'Admin',
      name: 'System Administrator',
      reg_no: 'ADMIN_01',
      dept: 'Campus Operations',
      email: 'admin@college.edu',
      password: 'password123',
      icon: ShieldCheck,
      badge: 'Full Campus Access',
      badgeClass: 'bg-purple-500/20 text-purple-200 border-purple-400/40',
      academicSummary: '60 Students across ECE, IT, CSE, Analytics & Alerts'
    }
  ];

  return (
    <div className="min-h-screen bg-slate-900 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900 via-slate-900 to-slate-950 flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8 font-sans">
      
      {/* Top Branding Bar */}
      <div className="max-w-6xl mx-auto w-full mb-8 text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="h-11 w-11 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
            <GraduationCap className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center space-x-2">
              <span>Cloud-Based College ERP</span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30">
                Supabase Cloud
              </span>
            </h1>
            <p className="text-xs text-blue-200/70 font-medium">
              Academic Operations, Smart Attendance &amp; Role-Based Governance Portal
            </p>
          </div>
        </div>

        <div className="text-xs text-blue-200/80 bg-white/5 border border-white/10 px-3.5 py-1.5 rounded-full backdrop-blur-xs flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>Chennai Campus Deployment &bull; 60 Students</span>
        </div>
      </div>

      {/* Main Two-Column Balanced Grid: LEFT = Demo Accounts Glass Card; RIGHT = Authentication Card */}
      <div className="max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* ==================================================================== */}
        {/* LEFT COLUMN: DEMO ACCOUNTS SECTION (Translucent / Glass Effect) */}
        {/* ==================================================================== */}
        <div className="lg:col-span-5 bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-5 sm:p-6 shadow-2xl text-white space-y-4">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-300 flex items-center space-x-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                <span>One-Click Demo Credentials</span>
              </span>
              <span className="text-[11px] font-mono text-emerald-300 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                password123
              </span>
            </div>
            <p className="text-xs text-blue-100/70 mt-1">
              Select any verified account below to immediately populate login credentials.
            </p>
          </div>

          <div className="space-y-2.5">
            {demoAccounts.map((acc, idx) => {
              const Icon = acc.icon;
              const isSelected = email === acc.email && activeTab === 'login';
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => selectDemoAccount(acc.email, acc.password)}
                  className={`w-full text-left p-3 rounded-xl border transition-all duration-150 ${
                    isSelected
                      ? 'bg-blue-600/30 border-blue-400 shadow-md shadow-blue-500/20 translate-x-1'
                      : 'bg-white/5 hover:bg-white/10 border-white/10 hover:border-white/25'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center space-x-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0 text-blue-200">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-white flex items-center space-x-1.5">
                          <span className="truncate">{acc.name}</span>
                          <span className="text-[10px] text-blue-300/80 font-normal">({acc.reg_no})</span>
                        </div>
                        <div className="text-[11px] text-blue-200/60 font-mono truncate">{acc.email}</div>
                      </div>
                    </div>

                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border shrink-0 ${acc.badgeClass}`}>
                      {acc.badge}
                    </span>
                  </div>

                  <div className="mt-2 pt-2 border-t border-white/10 flex items-center justify-between text-[11px] text-blue-200/70">
                    <span className="truncate">{acc.academicSummary}</span>
                    <span className="text-blue-300 font-semibold shrink-0 ml-2 hover:underline flex items-center space-x-0.5">
                      <span>Autofill</span>
                      <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="rounded-xl bg-blue-950/40 border border-blue-800/40 p-3 text-[11px] text-blue-200/80 space-y-1">
            <p className="font-semibold text-blue-300 flex items-center space-x-1">
              <School className="w-3.5 h-3.5" />
              <span>Campus Scope &bull; 3 Departments (60 Students)</span>
            </p>
            <p className="text-[10px] leading-relaxed">
              Departments: <strong>ECE</strong> (20 students), <strong>IT</strong> (20 students), <strong>CSE</strong> (20 students). All seeded with realistic Tamil Nadu attendance records.
            </p>
          </div>
        </div>

        {/* ==================================================================== */}
        {/* RIGHT COLUMN: AUTHENTICATION CARD (Login, Register, Recovery) */}
        {/* ==================================================================== */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-2xl p-6 sm:p-8">
          
          {/* Navigation Tabs */}
          <div className="flex rounded-xl bg-slate-100 p-1 mb-6 text-xs font-semibold">
            <button
              type="button"
              onClick={() => { setActiveTab('login'); setError(''); setSuccessMsg(''); }}
              className={`flex-1 py-2.5 rounded-lg flex items-center justify-center space-x-1.5 transition-all ${
                activeTab === 'login' ? 'bg-white text-blue-700 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab('signup'); setError(''); setSuccessMsg(''); }}
              className={`flex-1 py-2.5 rounded-lg flex items-center justify-center space-x-1.5 transition-all ${
                activeTab === 'signup' ? 'bg-white text-blue-700 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Student Registration</span>
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab('forgot'); setError(''); setSuccessMsg(''); }}
              className={`flex-1 py-2.5 rounded-lg flex items-center justify-center space-x-1.5 transition-all ${
                activeTab === 'forgot' ? 'bg-white text-blue-700 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Recovery</span>
            </button>
          </div>

          {/* Alert Messages */}
          {error && (
            <div className="mb-5 rounded-xl bg-rose-50 border border-rose-200 p-3.5 text-xs text-rose-700 flex items-start space-x-2.5">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-500 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-5 rounded-xl bg-emerald-50 border border-emerald-200 p-3.5 text-xs text-emerald-800 flex items-start space-x-2.5">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* 1. SIGN IN FORM */}
          {activeTab === 'login' && (
            <form className="space-y-4" onSubmit={handleLogin}>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                  College Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@college.edu"
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                    Account Password *
                  </label>
                  <button
                    type="button"
                    onClick={() => { setActiveTab('forgot'); setRecoveryEmail(email); }}
                    className="text-xs text-blue-700 hover:underline font-semibold"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 pr-10 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 flex items-center justify-center space-x-2 rounded-xl bg-blue-700 px-4 py-3 text-sm font-bold text-white shadow-md hover:bg-blue-800 transition-colors disabled:opacity-50"
              >
                {loading ? 'Authenticating...' : 'Sign In to Portal'}
              </button>
            </form>
          )}

          {/* 2. STUDENT REGISTRATION FORM (Student Role strictly locked) */}
          {activeTab === 'signup' && (
            <form className="space-y-3.5" onSubmit={handleSignup}>
              {/* Role lock notice */}
              <div className="rounded-lg bg-blue-50 border border-blue-200 p-2.5 text-xs text-blue-800 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <BookOpen className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>Public registration provides <strong>Student</strong> access.</span>
                </div>
                <span className="text-[10px] font-bold bg-blue-600 text-white px-2 py-0.5 rounded">
                  Student Only
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={signupData.name}
                    onChange={(e) => setSignupData({ ...signupData, name: e.target.value })}
                    placeholder="e.g. Kavin Raj"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-blue-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Student Reg No *</label>
                  <input
                    type="text"
                    required
                    value={signupData.reg_no}
                    onChange={(e) => setSignupData({ ...signupData, reg_no: e.target.value })}
                    placeholder="e.g. 21CS145"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-blue-600 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">College Email *</label>
                  <input
                    type="email"
                    required
                    value={signupData.email}
                    onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                    placeholder="name@college.edu"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-blue-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Department *</label>
                  <select
                    value={signupData.department_id}
                    onChange={(e) => setSignupData({ ...signupData, department_id: parseInt(e.target.value) })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-blue-600 focus:outline-none"
                  >
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.code} — {d.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Parent / Guardian Name *</label>
                  <input
                    type="text"
                    required
                    value={signupData.parent_name}
                    onChange={(e) => setSignupData({ ...signupData, parent_name: e.target.value })}
                    placeholder="e.g. Ramanathan S"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-blue-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Parent Email *</label>
                  <input
                    type="email"
                    required
                    value={signupData.parent_email}
                    onChange={(e) => setSignupData({ ...signupData, parent_email: e.target.value })}
                    placeholder="parent@gmail.com"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-blue-600 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Choose Account Password *</label>
                <div className="relative">
                  <input
                    type={showSignupPassword ? 'text' : 'password'}
                    required
                    value={signupData.password}
                    onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                    placeholder="Minimum 6 characters"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 pr-10 text-xs text-slate-900 focus:border-blue-600 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSignupPassword(!showSignupPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                  >
                    {showSignupPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-3 flex items-center justify-center space-x-2 rounded-xl bg-blue-700 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-blue-800 transition-colors disabled:opacity-50"
              >
                {loading ? 'Creating Student Profile...' : 'Complete Student Registration'}
              </button>
            </form>
          )}

          {/* 3. RECOVERY FORM */}
          {activeTab === 'forgot' && (
            <div className="space-y-4">
              {recoveryStep === 1 ? (
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <p className="text-xs text-slate-500">
                    Enter your registered college email address to receive password reset instructions.
                  </p>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                      Account College Email
                    </label>
                    <input
                      type="email"
                      required
                      value={recoveryEmail}
                      onChange={(e) => setRecoveryEmail(e.target.value)}
                      placeholder="user@college.edu"
                      className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:border-blue-600 focus:outline-none"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center space-x-2 rounded-xl bg-blue-700 px-4 py-2.5 text-xs font-bold text-white hover:bg-blue-800 disabled:opacity-50"
                  >
                    {loading ? 'Sending Instructions...' : 'Request Password Reset Token'}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleResetPassword} className="space-y-3.5">
                  <p className="text-xs text-slate-500">
                    Enter the token and choose a new password for your account.
                  </p>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                      Recovery Token *
                    </label>
                    <input
                      type="text"
                      required
                      value={recoveryToken}
                      onChange={(e) => setRecoveryToken(e.target.value)}
                      placeholder="Enter token from email"
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 font-mono focus:border-blue-600 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                      New Password *
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 pr-10 text-xs text-slate-900 focus:border-blue-600 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                      >
                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
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

        </div>
      </div>
    </div>
  );
}
