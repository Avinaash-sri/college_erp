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
  Lock,
  BarChart3,
  Bot,
  Award,
  Calendar,
  Layers,
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

  // Active role selector for the Demo Credentials Showcase
  const [demoRole, setDemoRole] = useState('student');

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

  // Seeded Demo Accounts
  const demoAccounts = {
    student: [
      {
        name: 'Arun Kumar',
        reg_no: '21CS101',
        dept: 'CSE Dept • Sem 6',
        email: 'arun@college.edu',
        password: 'password123',
        badge: '84% Safe Attendance',
        badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
        note: 'High Standing • Quiz 10/10 • Assignment Graded'
      },
      {
        name: 'Nivetha S',
        reg_no: '21CS102',
        dept: 'CSE Dept • Sem 6',
        email: 'nivetha@college.edu',
        password: 'password123',
        badge: '68% Warning Attendance',
        badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
        note: 'Moderate Standing • 3 Recovery Classes Required'
      },
      {
        name: 'Sanjay Kumar',
        reg_no: '21CS105',
        dept: 'CSE Dept • Sem 6',
        email: 'sanjay@college.edu',
        password: 'password123',
        badge: '58% High Risk',
        badgeClass: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
        note: 'Action Required • Parent Alerts Triggered'
      }
    ],
    faculty: [
      {
        name: 'Dr. Kavitha Raman',
        reg_no: 'EMP_CSE_01',
        dept: 'Professor & HOD, Computer Science',
        email: 'kavitha@college.edu',
        password: 'password123',
        badge: 'Faculty Privileges',
        badgeClass: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
        note: 'Roster Attendance Marking, Quiz Releases & Grading'
      }
    ],
    admin: [
      {
        name: 'System Administrator',
        reg_no: 'ADMIN_01',
        dept: 'Academic Governance Office',
        email: 'admin@college.edu',
        password: 'password123',
        badge: 'Full Executive Access',
        badgeClass: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
        note: 'Attendance Alert Center, SMTP Config & Analytics'
      }
    ]
  };

  return (
    <div className="min-h-screen bg-slate-950 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-blue-950 flex flex-col justify-center py-6 sm:py-10 px-3 sm:px-6 lg:px-8 font-sans selection:bg-blue-600 selection:text-white">
      
      {/* Top University Branding Bar */}
      <header className="max-w-6xl mx-auto w-full mb-6 sm:mb-8 flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div className="flex items-center space-x-3.5">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-blue-700 to-blue-600 flex items-center justify-center text-white shadow-xl shadow-blue-600/30 border border-blue-400/20 shrink-0">
            <GraduationCap className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center space-x-2">
              <span>Cloud-Based College ERP</span>
            </h1>
            <p className="text-xs text-slate-400 font-medium">
              Academic Operations, Smart Attendance &amp; Role-Based Governance Portal
            </p>
          </div>
        </div>

        <div className="text-xs text-slate-300 bg-slate-900/80 border border-slate-700/60 px-3.5 sm:px-4 py-1.5 rounded-full backdrop-blur-md flex flex-wrap items-center justify-center gap-1.5 sm:gap-2.5 shadow-inner text-center">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0"></span>
          <span className="font-medium text-slate-200">Academic Term: Even Semester 2026</span>
          <span className="text-slate-600 hidden xs:inline sm:inline">&bull;</span>
          <span className="text-[11px] font-mono text-blue-400">Secure SSO</span>
        </div>
      </header>

      {/* Main Two-Column Balanced Grid */}
      <main className="max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* ==================================================================== */}
        {/* LEFT COLUMN: ENTERPRISE PORTAL OVERVIEW & QUICK DEMO CREDENTIALS */}
        {/* ==================================================================== */}
        <section aria-label="Portal Overview and Quick Credentials" className="lg:col-span-5 space-y-5">
          
          {/* Institutional Highlights Card */}
          <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 text-white shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 -mt-6 -mr-6 w-36 h-36 bg-blue-600/10 rounded-full blur-2xl pointer-events-none"></div>

            <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-blue-400 mb-2">
              <Layers className="w-4 h-4 text-blue-400" />
              <span>Institutional Management Ecosystem</span>
            </div>
            
            <h2 className="text-lg font-bold text-white tracking-tight leading-snug">
              Unified Academic Governance &amp; Intelligent Operations
            </h2>
            
            <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
              Designed for modern universities to orchestrate daily academic schedules, attendance mandates, internal assessments, and AI-assisted learning.
            </p>

            {/* Core Feature Matrix */}
            <div className="mt-5 space-y-3 pt-4 border-t border-slate-800">
              <div className="flex items-start space-x-3 text-xs">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5">
                  <BarChart3 className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-200">Smart Attendance &amp; Parent SMTP Alerts</h3>
                  <p className="text-[11px] text-slate-400 leading-normal">
                    Automated 75% regulatory compliance tracking with real-time parent email notifications.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3 text-xs">
                <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center shrink-0 mt-0.5">
                  <Award className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-200">Continuous Assessment &amp; Grading Ledger</h3>
                  <p className="text-[11px] text-slate-400 leading-normal">
                    CIA internal marks calculation, online quizzes, and digital assignment submission rosters.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3 text-xs">
                <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-200">AI Lecture Notes Summarizer &amp; Advisor</h3>
                  <p className="text-[11px] text-slate-400 leading-normal">
                    Automated syllabus breakdowns, Tanglish concept explanations, and exam revision guides.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Demo Access Switcher Card */}
          <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-3xl p-5 text-white shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-blue-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Quick Demo Access
                </span>
              </div>
              <span className="text-[10px] font-mono text-slate-400 bg-slate-800/80 px-2.5 py-0.5 rounded-full border border-slate-700">
                1-Click Populate
              </span>
            </div>

            {/* Role Switcher Tabs */}
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-950/80 rounded-xl border border-slate-800/80 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setDemoRole('student')}
                className={`py-1.5 rounded-lg transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
                  demoRole === 'student'
                    ? 'bg-blue-600 text-white shadow-xs font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <BookOpen className="w-3 h-3" />
                <span>Student</span>
              </button>
              <button
                type="button"
                onClick={() => setDemoRole('faculty')}
                className={`py-1.5 rounded-lg transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
                  demoRole === 'faculty'
                    ? 'bg-blue-600 text-white shadow-xs font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <UserCheck className="w-3 h-3" />
                <span>Faculty</span>
              </button>
              <button
                type="button"
                onClick={() => setDemoRole('admin')}
                className={`py-1.5 rounded-lg transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
                  demoRole === 'admin'
                    ? 'bg-blue-600 text-white shadow-xs font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <ShieldCheck className="w-3 h-3" />
                <span>Admin</span>
              </button>
            </div>

            {/* Demo Accounts List for Selected Role */}
            <div className="space-y-2">
              {demoAccounts[demoRole].map((acc, idx) => {
                const isSelected = email === acc.email && activeTab === 'login';
                return (
                  <div
                    key={idx}
                    className={`p-3 rounded-2xl border transition-all duration-200 ${
                      isSelected
                        ? 'bg-blue-900/30 border-blue-500/50 shadow-md shadow-blue-900/30'
                        : 'bg-slate-950/50 hover:bg-slate-800/40 border-slate-800/80 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-bold text-white truncate">{acc.name}</span>
                          <span className="text-[10px] text-slate-400 font-mono">({acc.reg_no})</span>
                        </div>
                        <p className="text-[11px] text-slate-400 truncate mt-0.5">{acc.dept}</p>
                      </div>

                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border shrink-0 ${acc.badgeClass}`}>
                        {acc.badge}
                      </span>
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                      <span className="text-slate-400 truncate max-w-[200px]">{acc.note}</span>
                      
                      <button
                        type="button"
                        onClick={() => selectDemoAccount(acc.email, acc.password)}
                        className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white border border-blue-500/30 text-xs font-semibold transition-all shrink-0 cursor-pointer"
                      >
                        <span>Autofill</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ==================================================================== */}
        {/* RIGHT COLUMN: ENTERPRISE AUTHENTICATION CARD */}
        {/* ==================================================================== */}
        <section aria-label="Account Authentication Portal" className="lg:col-span-7 bg-white rounded-3xl border border-slate-200/90 shadow-2xl p-4 sm:p-6 md:p-8">
          
          {/* Modern Navigation Tabs */}
          <div className="flex rounded-2xl bg-slate-100/90 p-1 mb-6 text-xs font-semibold gap-1">
            <button
              type="button"
              onClick={() => { setActiveTab('login'); setError(''); setSuccessMsg(''); }}
              className={`flex-1 py-2 sm:py-2.5 px-1.5 sm:px-2 rounded-xl flex items-center justify-center space-x-1.5 sm:space-x-2 transition-all cursor-pointer text-[11px] sm:text-xs ${
                activeTab === 'login' ? 'bg-white text-blue-700 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LogIn className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              <span>Sign In</span>
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab('signup'); setError(''); setSuccessMsg(''); }}
              className={`flex-1 py-2 sm:py-2.5 px-1.5 sm:px-2 rounded-xl flex items-center justify-center space-x-1.5 sm:space-x-2 transition-all cursor-pointer text-[11px] sm:text-xs ${
                activeTab === 'signup' ? 'bg-white text-blue-700 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              <span><span className="hidden sm:inline">Student </span>Registration</span>
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab('forgot'); setError(''); setSuccessMsg(''); }}
              className={`flex-1 py-2 sm:py-2.5 px-1.5 sm:px-2 rounded-xl flex items-center justify-center space-x-1.5 sm:space-x-2 transition-all cursor-pointer text-[11px] sm:text-xs ${
                activeTab === 'forgot' ? 'bg-white text-blue-700 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              <span>Recovery</span>
            </button>
          </div>

          {/* Feedback & Error Messages */}
          {error && (
            <div className="mb-5 rounded-2xl bg-rose-50 border border-rose-200 p-4 text-xs text-rose-800 flex items-start space-x-3">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
              <span className="leading-relaxed font-medium">{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-5 rounded-2xl bg-emerald-50 border border-emerald-200 p-4 text-xs text-emerald-800 flex items-start space-x-3">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
              <span className="leading-relaxed font-medium">{successMsg}</span>
            </div>
          )}

          {/* 1. SIGN IN FORM */}
          {activeTab === 'login' && (
            <form className="space-y-4" onSubmit={handleLogin}>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Institutional Email Address *
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. yourname@college.edu"
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 focus:outline-none transition-all font-medium"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    Account Password *
                  </label>
                  <button
                    type="button"
                    onClick={() => { setActiveTab('forgot'); setRecoveryEmail(email); }}
                    className="text-xs text-blue-600 hover:text-blue-800 hover:underline font-semibold cursor-pointer"
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
                    placeholder="Enter your security password"
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 pr-11 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 focus:outline-none transition-all font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center space-x-2 rounded-xl bg-gradient-to-r from-blue-700 to-blue-700 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-700/20 hover:from-blue-800 hover:to-blue-800 transition-all duration-200 disabled:opacity-50 cursor-pointer active:scale-[0.99]"
                >
                  <LogIn className="w-4 h-4" />
                  <span>{loading ? 'Authenticating Your Credentials...' : 'Sign In to Portal'}</span>
                </button>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-center space-x-2 text-[11px] text-slate-400">
                <Lock className="w-3.5 h-3.5 text-slate-400" />
                <span>Protected by 256-Bit SSL Encryption &bull; Role-Based Access Control</span>
              </div>
            </form>
          )}

          {/* 2. STUDENT REGISTRATION FORM */}
          {activeTab === 'signup' && (
            <form className="space-y-3.5" onSubmit={handleSignup}>
              <div className="rounded-xl bg-blue-50 border border-blue-200 p-3 text-xs text-blue-900 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <BookOpen className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>Public registration registers you under <strong>Student</strong> privileges.</span>
                </div>
                <span className="text-[10px] font-bold bg-blue-600 text-white px-2 py-0.5 rounded-full">
                  Student Portal
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Full Legal Name *</label>
                  <input
                    type="text"
                    required
                    value={signupData.name}
                    onChange={(e) => setSignupData({ ...signupData, name: e.target.value })}
                    placeholder="e.g. Kavin Raj"
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs text-slate-900 focus:border-blue-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Student Register Number *</label>
                  <input
                    type="text"
                    required
                    value={signupData.reg_no}
                    onChange={(e) => setSignupData({ ...signupData, reg_no: e.target.value })}
                    placeholder="e.g. 21CS145"
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs text-slate-900 focus:border-blue-600 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">College Email Address *</label>
                  <input
                    type="email"
                    required
                    value={signupData.email}
                    onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                    placeholder="name@college.edu"
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs text-slate-900 focus:border-blue-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Department *</label>
                  <select
                    value={signupData.department_id}
                    onChange={(e) => setSignupData({ ...signupData, department_id: parseInt(e.target.value) })}
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs text-slate-900 focus:border-blue-600 focus:outline-none bg-white"
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
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs text-slate-900 focus:border-blue-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Parent Email (For SMTP Alerts) *</label>
                  <input
                    type="email"
                    required
                    value={signupData.parent_email}
                    onChange={(e) => setSignupData({ ...signupData, parent_email: e.target.value })}
                    placeholder="parent@gmail.com"
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs text-slate-900 focus:border-blue-600 focus:outline-none"
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
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 pr-10 text-xs text-slate-900 focus:border-blue-600 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSignupPassword(!showSignupPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showSignupPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-3 flex items-center justify-center space-x-2 rounded-xl bg-blue-700 px-5 py-3 text-xs font-bold text-white shadow-md hover:bg-blue-800 transition-colors disabled:opacity-50 cursor-pointer"
              >
                {loading ? 'Creating Student Profile...' : 'Complete Student Registration'}
              </button>
            </form>
          )}

          {/* 3. PASSWORD RECOVERY FORM */}
          {activeTab === 'forgot' && (
            <div className="space-y-4">
              {recoveryStep === 1 ? (
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Enter your registered college email address to receive password reset instructions.
                  </p>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                      Account College Email
                    </label>
                    <input
                      type="email"
                      required
                      value={recoveryEmail}
                      onChange={(e) => setRecoveryEmail(e.target.value)}
                      placeholder="user@college.edu"
                      className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 focus:border-blue-600 focus:outline-none"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center space-x-2 rounded-xl bg-blue-700 px-4 py-3 text-xs font-bold text-white hover:bg-blue-800 disabled:opacity-50 shadow-md cursor-pointer"
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
                      className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs text-slate-900 font-mono focus:border-blue-600 focus:outline-none"
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
                        className="w-full rounded-xl border border-slate-300 px-3.5 py-2 pr-10 text-xs text-slate-900 focus:border-blue-600 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="flex space-x-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setRecoveryStep(1)}
                      className="flex-1 rounded-xl border border-slate-300 px-3 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 rounded-xl bg-blue-700 px-3 py-2.5 text-xs font-bold text-white hover:bg-blue-800 disabled:opacity-50 shadow-md cursor-pointer"
                    >
                      {loading ? 'Updating...' : 'Set New Password'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

        </section>
      </main>
    </div>
  );
}
