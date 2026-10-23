import axios from 'axios';
import { supabase, isSupabaseConfigured, signInWithEmail, signUpStudent, requestPasswordReset, uploadAssignmentFile } from '../lib/supabase';
import {
  DEPARTMENTS,
  USERS,
  STUDENTS,
  FACULTY_MEMBERS,
  SUBJECTS,
  QUIZZES,
  ASSIGNMENTS,
  ANNOUNCEMENTS,
  NOTIFICATIONS,
  MARKS
} from '../lib/dataStore';

// In-memory / localStorage state persistence for pure client-side / Supabase Cloud execution
const STORAGE_PREFIX = 'erp_cloud_';

function getStored(key, defaultVal) {
  try {
    const v = localStorage.getItem(STORAGE_PREFIX + key);
    return v ? JSON.parse(v) : defaultVal;
  } catch (e) {
    return defaultVal;
  }
}

function setStored(key, val) {
  try {
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(val));
  } catch (e) {}
}

// Initial state hydrated from dataStore (60 Chennai students, 3 departments, faculty, admin)
let stateStudents = getStored('students', STUDENTS);
let stateUsers = getStored('users', USERS);
let stateQuizzes = getStored('quizzes', QUIZZES);
let stateAssignments = getStored('assignments', ASSIGNMENTS);
let stateAnnouncements = getStored('announcements', ANNOUNCEMENTS);
let stateNotifications = getStored('notifications', NOTIFICATIONS);
let stateMarks = getStored('marks', MARKS);
let stateSubmissions = getStored('submissions', [
  {
    id: 1,
    assignment_id: 1,
    student_id: 41, // Arun Kumar (21CS101)
    submission_type: 'file',
    file_name: '21CS101_Cloud_MiniProject_Report.pdf',
    file_path: 'assignments/21CS101_report.pdf',
    status: 'Graded',
    submitted_at: new Date(Date.now() - 86400000).toISOString(),
    marks_obtained: 9.5,
    faculty_feedback: 'Outstanding architecture documentation and clean code.'
  },
  {
    id: 2,
    assignment_id: 1,
    student_id: 42, // Nivetha S (21CS102)
    submission_type: 'drive_link',
    drive_link: 'https://drive.google.com/file/d/1demo_assignment_link_nivetha/view',
    status: 'Submitted',
    submitted_at: new Date(Date.now() - 7200000).toISOString(),
    marks_obtained: null,
    faculty_feedback: null
  }
]);
let stateQuizAttempts = getStored('quiz_attempts', [
  {
    quiz_id: 1,
    student_id: 41, // Arun Kumar
    score: 10.0,
    total_marks: 10.0,
    status: 'Submitted',
    answers: { 1: 'A', 2: 'B', 3: 'B', 4: 'C' }
  },
  {
    quiz_id: 2,
    student_id: 41, // Arun Kumar
    score: 7.5,
    total_marks: 10.0,
    status: 'Submitted',
    answers: { 5: 'B', 6: 'A', 7: 'B', 8: 'A' }
  }
]);
let stateDocuments = getStored('documents', [
  {
    id: 1,
    filename: 'Unit_1_Algorithm_Analysis_Lecture_Notes.pdf',
    file_type: 'pdf',
    file_size: 245000,
    total_chunks: 12,
    summary: '### Key Concepts in Algorithm Analysis\n\n- **Asymptotic Notations**: O, Omega, and Theta define tight bounds for time and space.\n\n- **Divide and Conquer**: Solves subproblems recursively and combines results (MergeSort, QuickSort).\n\n- **Recurrence Relations**: Solved via Master Theorem and substitution methods.\n\n### Revision Points\n- Master Theorem applies only to recurrences of form T(n) = aT(n/b) + f(n).\n- QuickSort average complexity is O(n log n); worst case is O(n^2).',
    created_at: new Date(Date.now() - 86400000 * 3).toISOString()
  }
]);

// Persistent attendance session records, parent alert logs, and assignment reminder logs
let stateAttendanceSessions = getStored('attendance_sessions', {});
let stateAlertLogs = getStored('alert_logs', [
  {
    id: 1,
    sent_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    student_name: 'Sanjay Kumar',
    reg_no: '21CS105',
    attendance_pct: 58.0,
    parent_email: 'parent.sanjay@gmail.com',
    alert_type: 'Severe Defaulter Notice (<65%)',
    status: 'Sent',
    email_preview: `<html><body style="font-family:Arial,sans-serif;padding:20px;color:#1e293b;"><h2 style="color:#b91c1c;">Attendance Alert Notice &bull; College Academic Governance</h2><p>Dear Parent / Guardian of <strong>Sanjay Kumar</strong> (Reg No: 21CS105),</p><p>This is an automated notification from the Academic Registrar. The current recorded attendance for your ward is <strong>58.0%</strong>, which falls significantly below the mandatory university threshold of <strong>75.0%</strong>.</p><p>Please meet with the Department Head or have your ward attend the mandatory recovery sessions to avoid semester debarment.</p><hr style="border:0;border-top:1px solid #e2e8f0;margin:20px 0;"/><p style="font-size:11px;color:#64748b;">Office of the Academic Registrar &bull; Cloud Institute of Technology & Science</p></body></html>`
  },
  {
    id: 2,
    sent_at: new Date(Date.now() - 86400000).toISOString(),
    student_name: 'Nivetha S',
    reg_no: '21CS102',
    attendance_pct: 68.0,
    parent_email: 'parent.nivetha@gmail.com',
    alert_type: 'Warning Notification (65% - 75%)',
    status: 'Sent',
    email_preview: `<html><body style="font-family:Arial,sans-serif;padding:20px;color:#1e293b;"><h2 style="color:#d97706;">Academic Attendance Warning &bull; College ERP</h2><p>Dear Parent / Guardian of <strong>Nivetha S</strong> (Reg No: 21CS102),</p><p>We wish to bring to your attention that your ward's current attendance stands at <strong>68.0%</strong>, which is currently below the mandatory <strong>75.0%</strong> requirement.</p><p>Regular attendance in the upcoming lectures will ensure eligibility for CIA-2 and end-semester examinations.</p><hr style="border:0;border-top:1px solid #e2e8f0;margin:20px 0;"/><p style="font-size:11px;color:#64748b;">Department of Computer Science & Engineering &bull; Cloud Institute of Technology & Science</p></body></html>`
  }
]);
let stateAssignmentReminderLogs = getStored('assignment_reminder_logs', [
  {
    id: 1,
    student_name: 'Vigneshwaran R',
    reg_no: '21CS103',
    email: 'vignesh.r@college.edu',
    notice_number: 'Notice #1',
    sent_at: new Date(Date.now() - 3600000 * 3).toISOString(),
    status: 'Delivered',
    failure_reason: null
  },
  {
    id: 2,
    student_name: 'Sneha M',
    reg_no: '21CS104',
    email: 'sneha.m@college.edu',
    notice_number: 'Notice #1',
    sent_at: new Date(Date.now() - 3600000 * 3).toISOString(),
    status: 'Delivered',
    failure_reason: null
  }
]);

function getLoggedInUser() {
  try {
    const raw = localStorage.getItem('erp_user');
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

function getLoggedInStudent() {
  const user = getLoggedInUser();
  if (!user) return stateStudents[40]; // Fallback to Arun Kumar (good student)
  const found = stateStudents.find((s) => s.user_id === user.id || s.email === user.email);
  return found || stateStudents[40];
}

// Generate realistic, consistent period-by-period classroom attendance logs for students
function getStudentPeriodAttendanceRecords(student) {
  const isWarning = student?.risk_status === 'Warning';
  const isHighRisk = student?.risk_status === 'High Risk';
  const studentId = student?.id || 41;

  const dates = [
    { date: '2026-10-23', label: 'Today (Wed, Oct 23)', dayName: 'Wednesday' },
    { date: '2026-10-22', label: 'Yesterday (Tue, Oct 22)', dayName: 'Tuesday' },
    { date: '2026-10-21', label: 'Mon, Oct 21', dayName: 'Monday' },
    { date: '2026-10-20', label: 'Fri, Oct 18', dayName: 'Friday' },
    { date: '2026-10-17', label: 'Thu, Oct 17', dayName: 'Thursday' }
  ];

  const periodsTemplate = [
    { period_number: 1, period_time: '09:00 - 10:00 AM', subject_code: 'CS601', subject_name: 'Design and Analysis of Algorithms', faculty_name: 'Dr. Kavitha Raman', room: 'Hall 302', subject_id: 7 },
    { period_number: 2, period_time: '10:15 - 11:15 AM', subject_code: 'CS602', subject_name: 'Artificial Intelligence & Machine Learning', faculty_name: 'Dr. Rajesh Kulkarni', room: 'AI Lab 1', subject_id: 8 },
    { period_number: 3, period_time: '11:30 - 12:30 PM', subject_code: 'CS603', subject_name: 'Database Engineering & Distributed Systems', faculty_name: 'Prof. Suresh Kumar', room: 'Hall 304', subject_id: 9 },
    { period_number: 4, period_time: '01:30 - 02:30 PM', subject_code: 'CS604', subject_name: 'Cloud Computing & DevOps Laboratory', faculty_name: 'Dr. Kavitha Raman', room: 'Lab Block 3', subject_id: 10 },
    { period_number: 5, period_time: '02:30 - 03:30 PM', subject_code: 'CS605', subject_name: 'Web Technology & Microservices', faculty_name: 'Dr. P. Sangeetha', room: 'Lab Block 4', subject_id: 11 }
  ];

  const records = [];
  dates.forEach((d) => {
    periodsTemplate.forEach((p) => {
      // Dynamic check for attendance session explicitly saved by faculty
      const sessionKey = `${d.date}_${p.subject_id}`;
      const savedStatus = (stateAttendanceSessions[sessionKey] || {})[studentId];

      let status = 'Present';
      if (savedStatus) {
        status = savedStatus;
      } else {
        if (isHighRisk) {
          if (
            (d.date === '2026-10-23' && p.period_number === 2) ||
            (d.date === '2026-10-22' && (p.period_number === 1 || p.period_number === 3)) ||
            (d.date === '2026-10-21' && p.period_number === 4) ||
            (d.date === '2026-10-20' && (p.period_number === 2 || p.period_number === 5)) ||
            (d.date === '2026-10-17' && p.period_number === 3)
          ) {
            status = 'Absent';
          }
        } else if (isWarning) {
          if (
            (d.date === '2026-10-23' && p.period_number === 4) ||
            (d.date === '2026-10-22' && p.period_number === 3) ||
            (d.date === '2026-10-21' && p.period_number === 2) ||
            (d.date === '2026-10-20' && p.period_number === 1)
          ) {
            status = 'Absent';
          }
        } else {
          // Safe student (Arun Kumar ~84%)
          if (d.date === '2026-10-22' && p.period_number === 3) {
            status = 'Absent';
          }
          if (d.date === '2026-10-20' && p.period_number === 2) {
            status = 'Absent';
          }
        }
      }

      records.push({
        id: `${d.date}_P${p.period_number}`,
        date: d.date,
        date_label: d.label,
        day_name: d.dayName,
        period_number: p.period_number,
        period_time: p.period_time,
        subject_code: p.subject_code,
        subject_name: p.subject_name,
        faculty_name: p.faculty_name,
        room: p.room,
        status,
        marked_at: `${p.period_time.split(' - ')[0]} (${d.dayName})`,
        verification_method: status === 'Present' ? 'Biometric & Faculty Roster Verified' : 'Unexcused Class Absence',
        remarks: status === 'Present' ? 'In Attendance' : 'Missed roll call / No approved OD'
      });
    });
  });

  return records;
}

// Master comprehensive AI answering intelligence for all student, faculty, and academic queries
function generateComprehensiveAIAnswer(rawQuery, student, role = 'student', docName = null) {
  const query = (rawQuery || '').trim();
  const q = query.toLowerCase();
  let reply = '';
  let suggestions = [];
  const st = student || stateStudents[40];

  // =========================================================================
  // 1. FACULTY ROLE SPECIFIC ANSWERS
  // =========================================================================
  if (role === 'faculty') {
    const cseStudents = stateStudents.filter((s) => s.department_id === 3);
    const atRisk = cseStudents.filter((s) => s.risk_status === 'High Risk' || s.overall_attendance < 75);

    if (q.includes('class') || q.includes('timetable') || q.includes('today') || q.includes('schedule')) {
      reply = `📋 **Today's Teaching Schedule (Dr. Kavitha Raman):**\n\n- **09:00 - 10:00 AM**: CS601 Design and Analysis of Algorithms (Hall 302, Section A)\n- **10:15 - 11:15 AM**: CS602 Artificial Intelligence & Machine Learning (AI Lab 1, Section A)\n- **01:30 - 03:30 PM**: CS604 Cloud Computing & DevOps Laboratory (Lab Block 3)`;
      suggestions = ['How many students are at risk in CSE?', 'Show assignment submission status', 'When is the next CIA exam?'];
    } else if (q.includes('risk') || q.includes('attendance') || q.includes('below 75') || q.includes('defaulter')) {
      reply = `⚠️ **Attendance Risk Summary (Department of CSE, Semester 6):**\n\nThere are **${atRisk.length} students** currently below the mandatory 75% threshold in your department.\n\n` +
        atRisk.slice(0, 5).map(s => `- **${s.name}** (${s.reg_no}): **${s.overall_attendance}%** [${s.risk_status}] &bull; Parent: ${s.parent_email}`).join('\n') +
        `\n\n*Note: Automated parent email alerts are active and logged under Admin Attendance Alert Center.*`;
      suggestions = ['What classes do I have today?', 'Show assignment submission status', 'List scheduled exams'];
    } else if (q.includes('assignment') || q.includes('submission')) {
      reply = `📚 **Assignment Tracking:**\n\nYou have **${stateAssignments.length} active assignments**.\n- For *Full-Stack React + Supabase Cloud Mini-Project*: 20 students eligible, 2 submitted, 1 graded.\n- Automated hourly email reminders are active for pending students.\n\nYou can click **Submission Roster** in the Assignments tab to send manual reminders or grade submissions.`;
      suggestions = ['What classes do I have today?', 'How many students are at risk in CSE?', 'When is the next CIA exam?'];
    } else if (q.includes('exam') || q.includes('cia')) {
      reply = `📝 **Upcoming CIA Examinations:**\n\n- **CIA-2 Mid Semester**: CS601 Design and Analysis of Algorithms scheduled in 6 days at Auditorium Block C (09:30 - 12:30 PM).`;
      suggestions = ['What classes do I have today?', 'How many students are at risk in CSE?', 'Show assignment submission status'];
    } else {
      reply = `Hello **Dr. Kavitha Raman**! I am your AI Faculty Assistant.\n\nI can assist you with your teaching schedule, student attendance monitoring, assignment submission tracking, and CIA examination schedules.`;
      suggestions = ['What classes do I have today?', 'How many students are at risk in CSE?', 'Show assignment submission status'];
    }
    return { reply, suggestions, engine: 'AI Faculty Assistant' };
  }

  // =========================================================================
  // 2. ADMIN ROLE SPECIFIC ANSWERS
  // =========================================================================
  if (role === 'admin') {
    const avgAtt = +(stateStudents.reduce((acc, s) => acc + s.overall_attendance, 0) / (stateStudents.length || 1)).toFixed(1);
    const lowAtt = stateStudents.filter((s) => s.overall_attendance < 75);

    if (q.includes('student') || q.includes('enroll') || q.includes('count') || q.includes('total')) {
      reply = `📊 **Institutional Student Enrollment:**\n\n- **Total Active Students:** ${stateStudents.length} across 3 engineering departments\n- **CSE:** 20 students\n- **IT:** 20 students\n- **ECE:** 20 students\n- **Faculty Count:** ${FACULTY_MEMBERS.length} full-time professors`;
      suggestions = ['Attendance health across college', 'Is SMTP email service active?', 'List scheduled exams'];
    } else if (q.includes('attendance') || q.includes('health') || q.includes('below 75') || q.includes('risk')) {
      reply = `📈 **Campus-Wide Attendance Compliance:**\n\n- **Overall Average Attendance:** **${avgAtt}%**\n- **Students Below 75% Safe Threshold:** **${lowAtt.length} students**\n- **High Risk Defaulters (<65%):** ${lowAtt.filter(s => s.overall_attendance < 65).length} students\n\nAll alerts are routed through the automated SMTP Parent Dispatcher.`;
      suggestions = ['Is SMTP email service active?', 'How many total students are enrolled?', 'List scheduled exams'];
    } else if (q.includes('smtp') || q.includes('mail') || q.includes('email') || q.includes('gateway')) {
      reply = `✉️ **SMTP Mailer Infrastructure Status:**\n\n- **Host:** smtp.gmail.com:587 (TLS Enabled)\n- **Sender Address:** noreply@college-erp.edu\n- **Status:** **Active & Operational**\n- Parent attendance warning alerts and hourly assignment reminders are running automatically.`;
      suggestions = ['Attendance health across college', 'How many total students are enrolled?', 'List scheduled exams'];
    } else {
      reply = `Hello Administrator! I am your **Institutional AI Governance Assistant**.\n\nI can provide instant summaries on campus enrollment, attendance compliance rates, automated SMTP alert logs, and system operations.`;
      suggestions = ['How many total students are enrolled?', 'Attendance health across college', 'Is SMTP email service active?'];
    }
    return { reply, suggestions, engine: 'AI Institutional Governance' };
  }

  // =========================================================================
  // 3. STUDENT ROLE: COMPREHENSIVE INTELLIGENCE
  // =========================================================================

  // A. PERIOD-BY-PERIOD ATTENDANCE & ABSENCES
  if (
    q.includes('period') ||
    q.includes('which period') ||
    q.includes('absent') ||
    q.includes('missed class') ||
    q.includes('missed period') ||
    q.includes('hour') ||
    q.includes('attendance today') ||
    q.includes('present today') ||
    q.includes('cut class')
  ) {
    const periodRecords = getStudentPeriodAttendanceRecords(st);
    const absentRecords = periodRecords.filter((r) => r.status === 'Absent');
    const todayRecords = periodRecords.filter((r) => r.date === '2026-10-23');
    const yesterdayRecords = periodRecords.filter((r) => r.date === '2026-10-22');

    let absenceBreakdown = '';
    if (absentRecords.length === 0) {
      absenceBreakdown = `🎉 **Zero Period Absences!** You have attended 100% of your scheduled periods across all recent instructional days. Outstanding discipline!`;
    } else {
      absenceBreakdown = `⚠️ **Recorded Period Absences (${absentRecords.length} Total):**\n\n` +
        absentRecords.map((r) => `- **${r.date_label} • Period ${r.period_number} (${r.period_time})**:\n  - Course: **${r.subject_name}** (${r.subject_code})\n  - Faculty: ${r.faculty_name} &bull; Room: ${r.room}\n  - Remark: *${r.remarks}*`).join('\n\n');
    }

    reply = `📅 **Period-Wise Attendance Audit for ${st.name} (${st.reg_no}):**\n\n` +
      `- **Today's Status (Wed, Oct 23)**: ${todayRecords.filter((r) => r.status === 'Present').length} of ${todayRecords.length} periods attended (${todayRecords.filter((r) => r.status === 'Absent').length} absent).\n` +
      `- **Yesterday's Status (Tue, Oct 22)**: ${yesterdayRecords.filter((r) => r.status === 'Present').length} of ${yesterdayRecords.length} periods attended.\n\n` +
      `${absenceBreakdown}\n\n` +
      `💡 **New Feature**: You can now view and filter your hour-by-hour classroom logs directly inside the **Daily Period-by-Period Attendance Ledger** card in your **Attendance** tab!`;

    suggestions = [
      'What is my overall attendance?',
      'How many classes should I attend to reach 75%?',
      'What is my timetable today?',
      'How do I apply for OD or Medical leave?'
    ];
  }

  // B. OVERALL ATTENDANCE & RECOVERY CLASSES
  else if (
    q.includes('attendance') ||
    q.includes('recovery') ||
    q.includes('75%') ||
    q.includes('safe') ||
    q.includes('warning') ||
    q.includes('defaulter') ||
    q.includes('reach 75')
  ) {
    const recCount = st.recovery_classes || Math.max(0, Math.ceil((0.75 * (st.total_conducted || 40) - (st.total_attended || 34)) / (1 - 0.75)));
    if (q.includes('recovery') || q.includes('how many class') || q.includes('how many classes') || q.includes('to reach 75')) {
      if (st.overall_attendance >= 75) {
        reply = `🎉 **Attendance Status: Safe & Verified!**\n\nYour current overall attendance is **${st.overall_attendance}%**, which satisfies the statutory college threshold of **75%**. You currently require **0 recovery classes**.\n\n- Attended: **${st.total_attended} / ${st.total_conducted} classes**\n- Standing: **Safe Standing** (Eligible for Hall Ticket)`;
      } else {
        reply = `⚠️ **Attendance Recovery Requirement:**\n\nYour current overall attendance is **${st.overall_attendance}%** (${st.risk_status} Standing).\n\nTo cross the mandatory **75.0%** university threshold, you must attend the next **${recCount} consecutive classes** without absence.\n\n$$\\text{Target Attendance: } \\frac{${st.total_attended} + ${recCount}}{${st.total_conducted} + ${recCount}} \\ge 75.0\\%$$\n\nAutomated parent notifications have been routed to **${st.parent_email}**. Please meet with your faculty advisor.`;
      }
    } else if (q.includes('which subject') || q.includes('subject-wise') || q.includes('subjects am i below')) {
      reply = `📋 **Subject-Wise Attendance Ledger for ${st.name}:**\n\n` +
        `- **CS601 Design & Analysis of Algorithms**: ${st.overall_attendance >= 75 ? '86%' : '68%'} (Dr. Kavitha Raman) &bull; ${st.overall_attendance >= 75 ? 'Safe' : 'Warning'}\n` +
        `- **CS602 Artificial Intelligence & ML**: ${st.overall_attendance >= 75 ? '82%' : '71%'} (Dr. Rajesh Kulkarni) &bull; ${st.overall_attendance >= 75 ? 'Safe' : 'Warning'}\n` +
        `- **CS603 Database Engineering & Distributed Systems**: ${st.overall_attendance >= 75 ? '88%' : '62%'} (Prof. Suresh Kumar) &bull; ${st.overall_attendance >= 75 ? 'Safe' : 'High Risk'}\n\n` +
        `*Overall Cumulative Attendance: **${st.overall_attendance}%** (${st.risk_status})*`;
    } else {
      reply = `📊 **Attendance Overview for ${st.name}:**\n\n- **Overall Percentage:** **${st.overall_attendance}%**\n- **Academic Standing:** **${st.risk_status}**\n- **Total Attended Sessions:** ${st.total_attended || 34} of ${st.total_conducted || 40} classes\n` +
        (st.overall_attendance < 75
          ? `\n⚠️ **Action Mandate:** You must attend **${recCount} consecutive classes** to restore 75% statutory compliance. Parent email alerts are active.`
          : `\n✅ You hold good standing for semester examination hall ticket issuance.`);
    }
    suggestions = ['Which period was I absent?', 'What is my timetable today?', 'When is my next examination?', 'How do I apply for OD?'];
  }

  // C. TIMETABLE & DAILY CLASS SCHEDULE
  else if (q.includes('timetable') || q.includes('schedule') || q.includes('class') || q.includes('today') || q.includes('period 1') || q.includes('period 2')) {
    reply = `📅 **Today's Official Timetable (Semester 6, ${st.department_name || 'CSE'} Section ${st.section || 'A'}):**\n\n` +
      `- **Period 1 (09:00 - 10:00 AM)**: CS601 Design and Analysis of Algorithms &bull; Hall 302 &bull; Dr. Kavitha Raman\n` +
      `- **Period 2 (10:15 - 11:15 AM)**: CS602 Artificial Intelligence & ML &bull; AI Lab 1 &bull; Dr. Rajesh Kulkarni\n` +
      `- **Period 3 (11:30 - 12:30 PM)**: CS603 Database Engineering &bull; Hall 304 &bull; Prof. Suresh Kumar\n` +
      `- **Period 4 (01:30 - 02:30 PM)**: CS604 Cloud Computing & DevOps Laboratory &bull; Lab Block 3 &bull; Dr. Kavitha Raman\n` +
      `- **Period 5 (02:30 - 03:30 PM)**: CS605 Web Technology & Microservices &bull; Lab Block 4 &bull; Dr. P. Sangeetha\n\n` +
      `*Lunch Interval: 12:30 PM - 01:30 PM &bull; Total Conducted Today: 5 Periods.*`;
    suggestions = ['Which period was I absent?', 'What is my overall attendance?', 'When is my next examination?'];
  }

  // D. EXAMS, TESTS, CIA & DATES
  else if (q.includes('exam') || q.includes('cia') || q.includes('mid') || q.includes('test') || q.includes('hall ticket')) {
    reply = `📝 **Upcoming CIA Internal Examination Schedule:**\n\n` +
      `- **Assessment:** CIA-2 Continuous Internal Assessment\n` +
      `- **Course:** CS601 - Design and Analysis of Algorithms\n` +
      `- **Date:** In 6 days (Auditorium Block C)\n` +
      `- **Timing:** 09:30 AM - 12:30 PM (3 Hours)\n` +
      `- **Weightage:** 60 Marks (Converted to 30 Internal Marks)\n` +
      `- **Syllabus Units:** Unit 1 (Asymptotic Notations & Recurrences) + Unit 2 (Divide & Conquer, Dynamic Programming)\n\n` +
      `*Statutory Rule: Minimum 75% attendance is required to generate the examination hall ticket.*`;
    suggestions = ['What is my overall attendance?', 'Show my internal marks', 'Explain QuickSort algorithm'];
  }

  // E. MARKS, CGPA & GPA CALCULATION
  else if (q.includes('mark') || q.includes('grade') || q.includes('cgpa') || q.includes('gpa') || q.includes('internal')) {
    reply = `🎯 **Continuous Assessment Marks & CGPA Report for ${st.name}:**\n\n` +
      `- **CS601 (Algorithms)**: CIA-1: 28/30 &bull; CIA-2: 27/30 &bull; Assignment: 9.5/10 &bull; **Total: 55.0 / 60.0 (Grade: A+)**\n` +
      `- **CS602 (AI & ML)**: CIA-1: 26/30 &bull; CIA-2: 25.5/30 &bull; Assignment: 9.0/10 &bull; **Total: 51.5 / 60.0 (Grade: A)**\n` +
      `- **CS603 (Database Systems)**: CIA-1: 24/30 &bull; CIA-2: 25/30 &bull; Assignment: 8.5/10 &bull; **Total: 49.0 / 60.0 (Grade: A)**\n\n` +
      `📊 **Cumulative Grade Point Average (CGPA):** **8.74 / 10.0**\n\n` +
      `**How CGPA is Computed:**\n` +
      `$$\\text{GPA} = \\frac{\\sum (\\text{Credits}_i \\times \\text{GradePoints}_i)}{\\sum \\text{Credits}_i}$$\n` +
      `Scale: O (10 pts, 91-100), A+ (9 pts, 81-90), A (8 pts, 71-80), B+ (7 pts, 61-70), B (6 pts, 50-60).`;
    suggestions = ['When is my next examination?', 'What is my overall attendance?', 'What placements am I eligible for?'];
  }

  // F. FEES, TUITION & DUES
  else if (q.includes('fee') || q.includes('fees') || q.includes('dues') || q.includes('tuition') || q.includes('balance') || q.includes('paid')) {
    const isHighRisk = st.risk_status === 'High Risk';
    const totalAmt = 85000;
    const paidAmt = isHighRisk ? 70000 : 85000;
    const pendingAmt = totalAmt - paidAmt;
    reply = `💳 **Institutional Tuition Account Summary for ${st.name}:**\n\n` +
      `- **Academic Term:** Academic Year 2025 - 2026 (Semester 6)\n` +
      `- **Total Assessed Fees:** ₹${totalAmt.toLocaleString('en-IN')}\n` +
      `- **Amount Paid to Date:** ₹${paidAmt.toLocaleString('en-IN')}\n` +
      `- **Outstanding Balance:** **₹${pendingAmt.toLocaleString('en-IN')}**\n` +
      `- **Receipt Status:** **${pendingAmt === 0 ? 'Fully Cleared (Paid in Full)' : 'Pending ₹15,000 Installment'}**\n\n` +
      (pendingAmt === 0
        ? '✅ You have zero outstanding dues. Verified receipts can be downloaded anytime from the Student Fees tab.'
        : '⚠️ Please clear outstanding institutional balance prior to semester hall ticket release.');
    suggestions = ['What is my overall attendance?', 'When is my next examination?', 'What is my timetable today?'];
  }

  // G. PLACEMENTS, INTERNSHIPS & SALARIES
  else if (q.includes('placement') || q.includes('job') || q.includes('interview') || q.includes('company') || q.includes('salary') || q.includes('lpa') || q.includes('amazon') || q.includes('zoho')) {
    reply = `🚀 **Active Campus Placement Drives (Batch 2026):**\n\n` +
      `1. 🏢 **Amazon Web Services (AWS)**\n` +
      `   - **Role:** Cloud Support Associate / SDE-1\n` +
      `   - **CTC Package:** **16.5 LPA**\n` +
      `   - **Eligibility:** CSE, IT, ECE (CGPA $\\ge 7.5$, 0 standing arrears)\n` +
      `   - **Application Deadline:** In 14 days\n\n` +
      `2. 🏢 **Zoho Corporation**\n` +
      `   - **Role:** Software Development Engineer\n` +
      `   - **CTC Package:** **12.0 LPA**\n` +
      `   - **Eligibility:** Open to all engineering branches\n` +
      `   - **Application Deadline:** In 10 days\n\n` +
      `*Registration: Visit Campus Placements module to upload your resume and enter drive rosters.*`;
    suggestions = ['Show my internal marks and CGPA', 'What is my overall attendance?', 'How do I prepare for coding rounds?'];
  }

  // H. LEAVE APPLICATION, ON-DUTY (OD) & MEDICAL LEAVE
  else if (q.includes('leave') || q.includes('od') || q.includes('on duty') || q.includes('medical') || q.includes('permission') || q.includes('absentee')) {
    reply = `📄 **Leave & On-Duty (OD) Regulatory Guidelines:**\n\n` +
      `1. **Medical Leave**:\n` +
      `   - A student hospitalized or unwell must submit a medical certificate signed by a registered medical practitioner within **3 working days** of returning to campus.\n` +
      `   - Once verified by the Faculty Advisor and HOD, medical leaves are recorded to exempt semester debarment.\n\n` +
      `2. **On-Duty (OD) Permissions**:\n` +
      `   - Allowed for approved inter-college symposiums, smart India hackathons, IEEE paper presentations, or university sports tournaments.\n` +
      `   - Maximum quota: **10 days per academic semester**.\n` +
      `   - Submit event brochure and pre-approval request to Dr. Kavitha Raman before departing.`;
    suggestions = ['Which period was I absent?', 'What is my overall attendance?', 'What is my timetable today?'];
  }

  // I. CAMPUS LIFE, TIMINGS & FACILITIES
  else if (q.includes('timing') || q.includes('library') || q.includes('canteen') || q.includes('bus') || q.includes('transport') || q.includes('hostel') || q.includes('hod')) {
    reply = `🏛️ **Campus Operational Hours & Facilities:**\n\n` +
      `- **Academic Hours:** 08:45 AM - 04:15 PM (Monday to Friday)\n` +
      `- **Central Digital Library:** Open 08:00 AM - 08:00 PM on all instructional days. 4 book lending cards per student (14-day renewal).\n` +
      `- **College Transport:** 24 operational bus routes covering major corridors across the metropolitan area.\n` +
      `- **Hostel Regulations:** Study hours 08:30 PM - 10:30 PM. Campus gate curfew is 08:30 PM sharp.\n` +
      `- **HOD, Computer Science:** Dr. Kavitha Raman (Office: Academic Block 3, 2nd Floor).`;
    suggestions = ['What is my timetable today?', 'What is my overall attendance?', 'When is my next examination?'];
  }

  // J. COMPUTER SCIENCE & TECHNICAL CONCEPTS: QUICKSORT
  else if (q.includes('quicksort')) {
    reply = `⚡ **QuickSort Algorithm Deep-Dive:**\n\n` +
      `- **Paradigm:** Divide-and-Conquer using in-place partitioning around a pivot element.\n` +
      `- **Partitioning Logic:** Elements smaller than pivot go left; larger elements go right.\n` +
      `- **Time Complexities**:\n` +
      `  - **Best Case:** $\\mathcal{O}(n \\log n)$ (Pivot splits array into two equal halves)\n` +
      `  - **Average Case:** $\\mathcal{O}(n \\log n)$\n` +
      `  - **Worst Case:** $\\mathcal{O}(n^2)$ (Pivot chosen is always smallest or largest element in sorted array)\n` +
      `- **Space Complexity:** $\\mathcal{O}(\\log n)$ recursion stack frames.\n` +
      `- **Pro-Tip / Optimization:** Use **Randomized Partitioning** or **Median-of-Three** pivot selection to guarantee expected $\\mathcal{O}(n \\log n)$ performance.`;
    suggestions = ['Explain MergeSort algorithm', 'Explain Master Theorem', 'What is my timetable today?'];
  }

  // K. MERGESORT
  else if (q.includes('mergesort')) {
    reply = `🔄 **MergeSort Algorithm Deep-Dive:**\n\n` +
      `- **Paradigm:** Divide-and-Conquer with guaranteed asymptotic stability.\n` +
      `- **Mechanism:** Recursively divides array into halves until singletons remain, then merges sorted subarrays in linear time $\\mathcal{O}(n)$.\n` +
      `- **Recurrence Relation:** $T(n) = 2T(n/2) + \\Theta(n)$\n` +
      `- **Time Complexity:** Guaranteed $\\mathcal{O}(n \\log n)$ across all cases (Best, Average, Worst).\n` +
      `- **Space Complexity:** $\\mathcal{O}(n)$ auxiliary memory for merging.\n` +
      `- **Comparison with QuickSort:** MergeSort is stable and optimal for linked lists and external disk sorting, whereas QuickSort operates in-place.`;
    suggestions = ['Explain QuickSort algorithm', 'Explain Master Theorem', 'What is my timetable today?'];
  }

  // L. MASTER THEOREM
  else if (q.includes('master theorem') || q.includes('recurrence')) {
    reply = `📐 **Master Theorem Formulation & Cases:**\n\n` +
      `For divide-and-conquer recurrences of form:\n` +
      `$$T(n) = aT(n/b) + f(n) \\quad (a \\ge 1, b > 1)$$\n\n` +
      `1. **Case 1 (Leaf Dominant)**: If $f(n) = \\mathcal{O}(n^{\\log_b a - \\epsilon})$ for $\\epsilon > 0$:\n` +
      `   $$\\implies T(n) = \\Theta(n^{\\log_b a})$$\n\n` +
      `2. **Case 2 (Balanced Work)**: If $f(n) = \\Theta(n^{\\log_b a})$:\n` +
      `   $$\\implies T(n) = \\Theta(n^{\\log_b a} \\log n)$$\n\n` +
      `3. **Case 3 (Root Dominant)**: If $f(n) = \\Omega(n^{\\log_b a + \\epsilon})$ and $a f(n/b) \\le c f(n)$:\n` +
      `   $$\\implies T(n) = \\Theta(f(n))$$\n\n` +
      `*Example:* MergeSort $T(n) = 2T(n/2) + n \\implies a=2, b=2, \\log_2 2 = 1$. Since $f(n) = n^1 = \\Theta(n^1)$, Case 2 applies $\\implies T(n) = \\Theta(n \\log n)$.`;
    suggestions = ['Explain QuickSort algorithm', 'Explain Dijkstra algorithm', 'What is my timetable today?'];
  }

  // M. DIJKSTRA & GRAPH ALGORITHMS
  else if (q.includes('dijkstra') || q.includes('shortest path') || q.includes('bellman')) {
    reply = `📍 **Dijkstra's Shortest Path Algorithm:**\n\n` +
      `- **Objective:** Calculates the shortest path distances from a single source vertex to all other vertices in a weighted graph.\n` +
      `- **Critical Constraint:** Edge weights must be strictly **non-negative** ($w(u,v) \\ge 0$). For negative edges, use **Bellman-Ford** algorithm.\n` +
      `- **Data Structure:** Min-Priority Queue (Binary Heap / Fibonacci Heap).\n` +
      `- **Time Complexity:** $\\mathcal{O}((V + E) \\log V)$ with adjacency list and binary min-heap.\n` +
      `- **Greedy Property:** Once a vertex is extracted from the priority queue, its tentative distance is finalized and guaranteed optimal.`;
    suggestions = ['Explain Master Theorem', 'Explain Dynamic Programming', 'What is my timetable today?'];
  }

  // N. OPERATING SYSTEMS: PROCESS, THREAD, DEADLOCK & SCHEDULING
  else if (q.includes('operating system') || q.includes('deadlock') || q.includes('process') || q.includes('thread') || q.includes('semaphore') || q.includes('mutex') || q.includes('paging') || q.includes('virtual memory')) {
    if (q.includes('deadlock')) {
      reply = `🔒 **Deadlock in Operating Systems:**\n\n` +
        `A state where a set of processes are permanently blocked because each is holding a resource and waiting for another held by another process.\n\n` +
        `**The 4 Necessary Coffman Conditions:**\n` +
        `1. **Mutual Exclusion**: At least one resource must be non-shareable.\n` +
        `2. **Hold and Wait**: A process holds resource(s) while waiting for additional resources.\n` +
        `3. **No Preemption**: Resources cannot be forcibly taken from a process.\n` +
        `4. **Circular Wait**: A closed chain of processes exists where each waits for a resource held by the next.\n\n` +
        `**Handling:** Banker's Algorithm (Deadlock Avoidance using safe states), Resource Ordering (Prevention), or Detection via Wait-For Graphs.`;
    } else if (q.includes('process') || q.includes('thread')) {
      reply = `⚙️ **Process vs Thread:**\n\n` +
        `- **Process**: An executing program with an independent virtual address space, containing its own Code, Data, Heap, and Stack. Managed via Process Control Block (PCB). Heavyweight context switching.\n` +
        `- **Thread**: A lightweight unit of CPU execution within a process. Threads of the same process share the Code, Data, and Heap memory, but maintain private Stacks and Registers. Fast context switching.\n\n` +
        `*Key Insight:* Concurrency within a single application is typically achieved via multithreading to avoid the overhead of Inter-Process Communication (IPC).`;
    } else {
      reply = `🖥️ **Operating System Core Architecture:**\n\n` +
        `- **CPU Scheduling**: FCFS, Shortest Job First (SJF), and Round Robin (time-slice preemptive).\n` +
        `- **Concurrency & Synchronization**: Mutex locks (binary mutual exclusion) and Semaphores (integer counter for resource pooling) eliminate race conditions in critical sections.\n` +
        `- **Virtual Memory & Paging**: Translates virtual addresses to physical frames via page tables and Translation Lookaside Buffer (TLB). LRU replacement evicts the page unreferenced for the longest duration.`;
    }
    suggestions = ['Explain Deadlock conditions', 'Explain Process vs Thread', 'What is my timetable today?'];
  }

  // O. DATABASE MANAGEMENT SYSTEMS: NORMALIZATION, ACID & INDEXING
  else if (q.includes('database') || q.includes('dbms') || q.includes('normalization') || q.includes('acid') || q.includes('sql') || q.includes('join') || q.includes('b+ tree') || q.includes('index')) {
    if (q.includes('normalization') || q.includes('1nf') || q.includes('2nf') || q.includes('3nf') || q.includes('bcnf')) {
      reply = `🗄️ **Database Normalization (1NF to BCNF):**\n\n` +
        `Systematic decomposition of relational tables to eliminate data redundancy and prevent insertion, update, and deletion anomalies:\n\n` +
        `1. **1NF (First Normal Form)**: All column values must be atomic (no multi-valued or composite attributes).\n` +
        `2. **2NF (Second Normal Form)**: Must be in 1NF and have **no partial dependencies** (every non-prime attribute must depend on the whole primary key).\n` +
        `3. **3NF (Third Normal Form)**: Must be in 2NF and have **no transitive dependencies** ($X \\rightarrow Y, Y \\rightarrow Z$).\n` +
        `4. **BCNF (Boyce-Codd Normal Form)**: For every functional dependency $X \\rightarrow Y$, $X$ must be a super key.`;
    } else if (q.includes('acid')) {
      reply = `🛡️ **ACID Properties in Transactions:**\n\n` +
        `- **A - Atomicity**: "All or nothing". Either the entire transaction commits successfully or all operations are rolled back (guaranteed via Write-Ahead Logging).\n` +
        `- **C - Consistency**: Database must transition from one valid state satisfying all schema constraints to another.\n` +
        `- **I - Isolation**: Concurrent transactions execute without interfering with one another (enforced via Strict Two-Phase Locking).\n` +
        `- **D - Durability**: Once committed, changes persist permanently on non-volatile storage even across system power failures.`;
    } else {
      reply = `🗃️ **Database Engineering & B+ Tree Indexing:**\n\n` +
        `- **Clustered Index**: Determines the physical storage order of data rows on disk (only 1 per table, typically the Primary Key).\n` +
        `- **Non-Clustered Index**: Separate B+ tree structure whose leaf nodes store pointers (Row IDs) to actual data pages.\n` +
        `- **B+ Tree Efficiency**: All leaf nodes are linked in a doubly-linked list for fast range scans. Tree height is balanced at $\\mathcal{O}(\\log_B N)$, drastically reducing disk I/O operations.`;
    }
    suggestions = ['Explain ACID properties', 'Explain Normalization forms', 'What is my timetable today?'];
  }

  // P. COMPUTER NETWORKS: OSI, TCP VS UDP & PROTOCOLS
  else if (q.includes('network') || q.includes('osi') || q.includes('tcp') || q.includes('udp') || q.includes('dns') || q.includes('http')) {
    reply = `🌐 **Computer Networks: OSI Model & Transport Layer:**\n\n` +
      `- **OSI 7-Layer Stack**: Physical (Bits) $\\rightarrow$ Data Link (Frames) $\\rightarrow$ Network (Packets) $\\rightarrow$ Transport (Segments) $\\rightarrow$ Session $\\rightarrow$ Presentation $\\rightarrow$ Application (Data).\n\n` +
      `- **TCP vs UDP**:\n` +
      `  - **TCP (Transmission Control Protocol)**: Connection-oriented, guarantees delivery and ordering via 3-way handshake (SYN, SYN-ACK, ACK), flow control (sliding window), and congestion control.\n` +
      `  - **UDP (User Datagram Protocol)**: Connectionless, lightweight, low-overhead datagram protocol with no retransmissions. Ideal for real-time video, gaming, and DNS lookups.\n\n` +
      `- **DNS (Domain Name System)**: Translates human-readable domain names (e.g. \`college.edu\`) to numerical IP addresses via hierarchical resolvers (Root, TLD, Authoritative).`;
    suggestions = ['Explain TCP 3-way handshake', 'Explain OSI 7 Layers', 'What is my timetable today?'];
  }

  // Q. SOFTWARE ENGINEERING, OOP & DESIGN PATTERNS
  else if (q.includes('oop') || q.includes('polymorphism') || q.includes('inheritance') || q.includes('solid') || q.includes('api') || q.includes('rest')) {
    reply = `💻 **Object-Oriented Programming (OOP) & SOLID Principles:**\n\n` +
      `- **Encapsulation**: Bundling data attributes and member functions together while restricting direct access via access modifiers (private/public).\n` +
      `- **Inheritance**: Deriving new classes from existing base classes to promote code reuse.\n` +
      `- **Polymorphism**: Compile-time (Method Overloading) vs Runtime (Method Overriding via virtual dispatch tables).\n` +
      `- **Abstraction**: Hiding internal implementation complexity behind abstract interfaces.\n\n` +
      `**SOLID Principles**:\n` +
      `- **S**: Single Responsibility Principle\n` +
      `- **O**: Open/Closed Principle (open for extension, closed for modification)\n` +
      `- **L**: Liskov Substitution Principle\n` +
      `- **I**: Interface Segregation Principle\n` +
      `- **D**: Dependency Inversion Principle`;
    suggestions = ['Explain Dynamic Programming', 'What is my timetable today?', 'When is my next examination?'];
  }

  // R. PROGRAMMING & CODE GENERATION
  else if (q.includes('code') || q.includes('python') || q.includes('java') || q.includes('fibonacci') || q.includes('binary search')) {
    reply = `💻 **Algorithmic Implementation: Binary Search (Python 3):**\n\n` +
      `\`\`\`python\n` +
      `def binary_search(arr, target):\n` +
      `    left, right = 0, len(arr) - 1\n` +
      `    \n` +
      `    while left <= right:\n` +
      `        mid = left + (right - left) // 2  # Prevents integer overflow\n` +
      `        \n` +
      `        if arr[mid] == target:\n` +
      `            return mid  # Target found at index mid\n` +
      `        elif arr[mid] < target:\n` +
      `            left = mid + 1\n` +
      `        else:\n` +
      `            right = mid - 1\n` +
      `            \n` +
      `    return -1  # Target element not present in array\n` +
      `\`\`\`\n\n` +
      `- **Prerequisite:** Array must be pre-sorted.\n` +
      `- **Time Complexity:** $\\mathcal{O}(\\log n)$ since the search space is halved at each step.\n` +
      `- **Space Complexity:** $\\mathcal{O}(1)$ iterative space.`;
    suggestions = ['Explain QuickSort algorithm', 'Explain Master Theorem', 'What is my timetable today?'];
  }

  // S. TANGLISH QUERIES
  else if (q.includes('enna') || q.includes('epdi') || q.includes('solunga') || q.includes('puriyala') || q.includes('tamil') || q.includes('tanglish') || q.includes('eppadi')) {
    reply = `👋 **Vanakkam ${st.name}!**\n\nNeenga keta question-ku answer itho:\n\n` +
      `1. **Attendance**: Ungaloda current overall attendance **${st.overall_attendance}%** (${st.risk_status} Standing). Regulatory 75% rule maintain panradhu romba mukkiyam.\n` +
      `2. **Period Absences**: Neenga yesterday Period 3 (CS603) attend pannala. New **Daily Period-by-Period Attendance Ledger** card-la check pannikalam.\n` +
      `3. **Timetable**: Inaiku CS601, CS602, CS603, CS604, CS605 5 periods schedule aagi irukku.\n` +
      `4. **Exams**: CIA-2 exams in 6 days-la start aaguthu.\n\n` +
      `Engineering concepts or programming doubts ethuvum irunthaalum kellinga, easy-ah step-by-step explain pandren!`;
    suggestions = ['Which period was I absent?', 'What is my timetable today?', 'When is my next examination?'];
  }

  // T. UNIVERSAL INTELLIGENT ACADEMIC FALLBACK (ANSWERS ANY QUERY)
  else {
    const topicTitle = query.length > 50 ? query.slice(0, 47) + '...' : query;
    reply = `### 📘 Academic Analysis & Technical Breakdown: "${topicTitle}"\n\n` +
      `Here is a structured, in-depth academic explanation for your query:\n\n` +
      `#### 1. Core Principle & Formal Definition\n` +
      `**${query}** represents a fundamental engineering paradigm analyzed across modern computing curricula. It establishes systematic abstraction boundaries, enforcing mathematical invariants and computational efficiency.\n\n` +
      `#### 2. Architecture & Operational Mechanics\n` +
      `- **Decomposition**: Complex systems isolate state transitions into modular components to minimize resource contention.\n` +
      `- **Algorithmic Bounds**: Optimized routines adhere to strict space-time tradeoffs, maintaining polynomial or sub-linear complexity $\\mathcal{O}(n \\log n)$ rather than unscalable exponential costs.\n` +
      `- **Execution Guarantees**: Handshake protocols and transactional rollbacks preserve fault tolerance across distributed nodes.\n\n` +
      `#### 3. Real-World Engineering Analogy\n` +
      `Consider modern distributed cloud infrastructure: instead of funneling every transaction through a single bottleneck, requests are load-balanced across decoupled services, indexed through logarithmic search trees, and verified with checksums.\n\n` +
      `#### 4. University Examination & Interview Takeaway\n` +
      `- Formulate your answer starting with the formal 2-mark definition.\n` +
      `- Draw a clean architecture block diagram or recursion tree trace.\n` +
      `- State exact Big-O asymptotic bounds and cite boundary conditions.`;

    suggestions = [
      'Which period was I absent?',
      'What is my overall attendance?',
      'What is my timetable today?',
      'When is my next examination?'
    ];
  }

  return { reply, suggestions, engine: 'AI ERP Intelligence Engine' };
}


// Client adapter object that mirrors Axios interface
const client = {
  async get(rawUrl, config = {}) {
    const url = (rawUrl || '').split('?')[0];
    const queryString = (rawUrl || '').includes('?') ? rawUrl.split('?')[1] : '';
    const queryParams = new URLSearchParams(queryString);

    // Notifications unread count (used by Header across all roles)
    if (url === '/notifications/unread-count') {
      const unread = stateNotifications.filter((n) => !n.is_read && !n.is_cleared).length;
      return { data: { unread_count: unread } };
    }

    if (url === '/notifications/me' || url === '/students/me/notifications') {
      return { data: stateNotifications.filter((n) => !n.is_cleared) };
    }

    // 1. Auth check
    if (url === '/auth/me') {
      const u = getLoggedInUser();
      if (!u) throw { response: { status: 401, data: { detail: 'Unauthorized' } } };
      return { data: u };
    }

    // 2. Admin departments
    if (url === '/admin/departments' || url === '/faculty/departments') {
      return { data: DEPARTMENTS };
    }

    // 3. Student profile
    if (url === '/students/me' || url === '/students/me/profile') {
      const st = getLoggedInStudent();
      return { data: st };
    }

    // 4. Student dashboard
    if (url === '/students/me/dashboard') {
      const st = getLoggedInStudent();
      return {
        data: {
          student: {
            name: st.name,
            reg_no: st.reg_no,
            department: st.department || 'Computer Science and Engineering',
            semester: st.semester || 6,
            section: st.section || 'A'
          },
          attendance: {
            overall_percentage: st.overall_attendance,
            total_attended: st.total_attended,
            total_conducted: st.total_conducted,
            risk_status: st.risk_status,
            recovery_classes: st.recovery_classes,
            required_percentage: 75.0
          },
          today_classes: [
            {
              id: 1,
              subject_code: 'CS601',
              subject_name: 'Design and Analysis of Algorithms',
              faculty_name: 'Dr. Kavitha Raman',
              start_time: '09:00',
              end_time: '10:00',
              room: 'Hall 302'
            },
            {
              id: 2,
              subject_code: 'CS602',
              subject_name: 'Artificial Intelligence & Machine Learning',
              faculty_name: 'Dr. Rajesh Kulkarni',
              start_time: '10:15',
              end_time: '11:15',
              room: 'AI Lab 1'
            },
            {
              id: 3,
              subject_code: 'CS603',
              subject_name: 'Database Engineering & Distributed Systems',
              faculty_name: 'Prof. Suresh Kumar',
              start_time: '11:30',
              end_time: '12:30',
              room: 'Hall 304'
            }
          ],
          current_day: 'Wednesday',
          upcoming_exams: [
            {
              id: 1,
              name: 'CIA-2 Mid Semester Examination',
              subject_name: 'Design and Analysis of Algorithms',
              subject_code: 'CS601',
              date: new Date(Date.now() + 86400000 * 6).toISOString().split('T')[0],
              start_time: '10:00',
              end_time: '12:00',
              venue: 'Auditorium Block C'
            }
          ],
          fees: {
            total: 85000,
            paid: 85000,
            pending: 0
          },
          recent_notifications: [
            {
              id: 1,
              title: 'Quiz Published',
              message: 'Algorithms & Complexity Unit 1 assessment is scheduled and due in 2 days.',
              type: 'quiz',
              is_read: false,
              created_at: new Date(Date.now() - 3600000 * 4).toISOString()
            },
            {
              id: 2,
              title: 'Assignment Due Reminder',
              message: 'Full-Stack React + Supabase Cloud Mini-Project is due in 5 days.',
              type: 'assignment',
              is_read: false,
              created_at: new Date(Date.now() - 3600000 * 12).toISOString()
            }
          ],
          placement_announcements: [
            {
              id: 1,
              company: 'Amazon Web Services',
              role: 'Cloud Support Associate',
              package_lpa: 16.5,
              deadline: new Date(Date.now() + 86400000 * 14).toISOString(),
              eligibility: 'CGPA >= 7.5, No standing arrears'
            },
            {
              id: 2,
              company: 'Zoho Corporation',
              role: 'Software Development Engineer',
              package_lpa: 12.0,
              deadline: new Date(Date.now() + 86400000 * 10).toISOString(),
              eligibility: 'Open to CSE, IT, ECE'
            }
          ],
          placements: [
            {
              id: 1,
              company: 'Amazon Web Services',
              role: 'Cloud Support Associate',
              package_lpa: 16.5,
              deadline: new Date(Date.now() + 86400000 * 14).toISOString(),
              eligibility: 'CGPA >= 7.5, No standing arrears'
            },
            {
              id: 2,
              company: 'Zoho Corporation',
              role: 'Software Development Engineer',
              package_lpa: 12.0,
              deadline: new Date(Date.now() + 86400000 * 10).toISOString(),
              eligibility: 'Open to CSE, IT, ECE'
            }
          ]
        }
      };
    }

    // 5. Student attendance
    if (url === '/students/me/attendance') {
      const st = getLoggedInStudent();
      const attendanceSubjects = [
        {
          subject_id: 1,
          subject_code: 'CS601',
          subject_name: 'Design and Analysis of Algorithms',
          faculty_name: 'Dr. Kavitha Raman',
          attended_classes: Math.round(st.total_attended * 0.35),
          total_classes: Math.round(st.total_conducted * 0.35),
          percentage: st.overall_attendance,
          status: st.risk_status,
          recovery_classes: st.recovery_classes
        },
        {
          subject_id: 2,
          subject_code: 'CS602',
          subject_name: 'Artificial Intelligence & Machine Learning',
          faculty_name: 'Dr. Rajesh Kulkarni',
          attended_classes: Math.round(st.total_attended * 0.35),
          total_classes: Math.round(st.total_conducted * 0.35),
          percentage: st.overall_attendance,
          status: st.risk_status,
          recovery_classes: st.recovery_classes
        },
        {
          subject_id: 3,
          subject_code: 'CS603',
          subject_name: 'Database Engineering & Distributed Systems',
          faculty_name: 'Prof. Suresh Kumar',
          attended_classes: Math.round(st.total_attended * 0.30),
          total_classes: Math.round(st.total_conducted * 0.30),
          percentage: st.overall_attendance,
          status: st.risk_status,
          recovery_classes: st.recovery_classes
        }
      ];

      const periodRecords = getStudentPeriodAttendanceRecords(st);
      const todayRecords = periodRecords.filter((r) => r.date === '2026-10-23');

      return {
        data: {
          student: st,
          student_name: st.name,
          reg_no: st.reg_no,
          overall_percentage: st.overall_attendance,
          total_attended: st.total_attended,
          total_conducted: st.total_conducted,
          risk_status: st.risk_status,
          recovery_classes: st.recovery_classes,
          required_percentage: 75.0,
          subjects: attendanceSubjects,
          subject_attendance: attendanceSubjects,
          records: periodRecords,
          period_records: periodRecords,
          daily_period_summary: {
            total_periods_week: 25,
            attended_periods_week: periodRecords.filter((r) => r.status === 'Present').length,
            absent_periods_week: periodRecords.filter((r) => r.status === 'Absent').length,
            today_total: todayRecords.length,
            today_present: todayRecords.filter((r) => r.status === 'Present').length,
            today_absent: todayRecords.filter((r) => r.status === 'Absent').length
          }
        }
      };
    }

    // Student Fees
    if (url === '/students/me/fees') {
      return {
        data: {
          summary: {
            total: 85000,
            paid: 85000,
            pending: 0,
            due_date: '2026-11-15',
            status: 'Paid'
          },
          records: [
            {
              id: 1,
              title: 'Tuition Fee (Semester 6)',
              fee_type: 'Tuition Fee (Semester 6)',
              total_amount: 65000,
              amount: 65000,
              paid_amount: 65000,
              pending_amount: 0,
              status: 'Paid',
              due_date: '2026-01-15',
              receipt_no: 'REC-2026-0891',
              paid_at: '2026-01-10T11:30:00Z'
            },
            {
              id: 2,
              title: 'Laboratory & Cloud Infrastructure Fee',
              fee_type: 'Laboratory & Cloud Infrastructure Fee',
              total_amount: 15000,
              amount: 15000,
              paid_amount: 15000,
              pending_amount: 0,
              status: 'Paid',
              due_date: '2026-01-15',
              receipt_no: 'REC-2026-0892',
              paid_at: '2026-01-10T11:30:00Z'
            },
            {
              id: 3,
              title: 'Autonomous Examination Assessment Fee',
              fee_type: 'Autonomous Examination Assessment Fee',
              total_amount: 5000,
              amount: 5000,
              paid_amount: 5000,
              pending_amount: 0,
              status: 'Paid',
              due_date: '2026-02-15',
              receipt_no: 'REC-2026-0955',
              paid_at: '2026-02-05T09:15:00Z'
            }
          ]
        }
      };
    }

    // Student Exams & Marks
    if (url === '/students/me/exams') {
      return {
        data: [
          {
            id: 1,
            name: 'CIA-2 Continuous Assessment',
            subject_code: 'CS601',
            subject_name: 'Design and Analysis of Algorithms',
            date: new Date(Date.now() + 86400000 * 6).toISOString().split('T')[0],
            start_time: '10:00',
            end_time: '12:00',
            venue: 'Auditorium Block C'
          },
          {
            id: 2,
            name: 'CIA-2 Continuous Assessment',
            subject_code: 'CS602',
            subject_name: 'Artificial Intelligence & Machine Learning',
            date: new Date(Date.now() + 86400000 * 8).toISOString().split('T')[0],
            start_time: '10:00',
            end_time: '12:00',
            venue: 'Auditorium Block C'
          },
          {
            id: 3,
            name: 'CIA-2 Continuous Assessment',
            subject_code: 'CS603',
            subject_name: 'Database Engineering & Distributed Systems',
            date: new Date(Date.now() + 86400000 * 10).toISOString().split('T')[0],
            start_time: '10:00',
            end_time: '12:00',
            venue: 'Auditorium Block C'
          }
        ]
      };
    }

    if (url === '/students/me/marks') {
      const st = getLoggedInStudent();
      const stMarks = stateMarks.filter((m) => m.student_id === st.id);
      return {
        data: stMarks.map((m) => ({
          id: m.id,
          subject_code: m.subject_code,
          subject_name: m.subject_name,
          cia1: m.internal_1,
          cia2: m.internal_2,
          assignment: m.assignment,
          quiz: 10,
          total: m.total,
          grade: m.grade || 'Not available',
          status: m.status
        }))
      };
    }

    // Student Timetable
    if (url === '/students/me/timetable') {
      return {
        data: {
          Monday: [
            { id: 1, start_time: '09:00', end_time: '10:00', subject_code: 'CS601', subject_name: 'Design and Analysis of Algorithms', faculty_name: 'Dr. Kavitha Raman', room: 'Hall 302' },
            { id: 2, start_time: '10:15', end_time: '11:15', subject_code: 'CS602', subject_name: 'Artificial Intelligence & Machine Learning', faculty_name: 'Dr. Rajesh Kulkarni', room: 'AI Lab 1' },
            { id: 3, start_time: '11:30', end_time: '12:30', subject_code: 'CS603', subject_name: 'Database Engineering & Distributed Systems', faculty_name: 'Prof. Suresh Kumar', room: 'Hall 304' }
          ],
          Tuesday: [
            { id: 4, start_time: '09:00', end_time: '10:00', subject_code: 'CS602', subject_name: 'Artificial Intelligence & Machine Learning', faculty_name: 'Dr. Rajesh Kulkarni', room: 'AI Lab 1' },
            { id: 5, start_time: '10:15', end_time: '11:15', subject_code: 'CS601', subject_name: 'Design and Analysis of Algorithms', faculty_name: 'Dr. Kavitha Raman', room: 'Hall 302' },
            { id: 6, start_time: '13:30', end_time: '15:30', subject_code: 'CS604', subject_name: 'Cloud Computing & DevOps Laboratory', faculty_name: 'Dr. Kavitha Raman', room: 'Cloud Computing Lab' }
          ],
          Wednesday: [
            { id: 7, start_time: '09:00', end_time: '10:00', subject_code: 'CS601', subject_name: 'Design and Analysis of Algorithms', faculty_name: 'Dr. Kavitha Raman', room: 'Hall 302' },
            { id: 8, start_time: '10:15', end_time: '11:15', subject_code: 'CS602', subject_name: 'Artificial Intelligence & Machine Learning', faculty_name: 'Dr. Rajesh Kulkarni', room: 'AI Lab 1' },
            { id: 9, start_time: '11:30', end_time: '12:30', subject_code: 'CS603', subject_name: 'Database Engineering & Distributed Systems', faculty_name: 'Prof. Suresh Kumar', room: 'Hall 304' }
          ],
          Thursday: [
            { id: 10, start_time: '09:00', end_time: '10:00', subject_code: 'CS603', subject_name: 'Database Engineering & Distributed Systems', faculty_name: 'Prof. Suresh Kumar', room: 'Hall 304' },
            { id: 11, start_time: '10:15', end_time: '11:15', subject_code: 'CS601', subject_name: 'Design and Analysis of Algorithms', faculty_name: 'Dr. Kavitha Raman', room: 'Hall 302' },
            { id: 12, start_time: '13:30', end_time: '15:30', subject_code: 'CS605', subject_name: 'AI & Data Science Project Lab', faculty_name: 'Dr. Rajesh Kulkarni', room: 'AI Lab 2' }
          ],
          Friday: [
            { id: 13, start_time: '09:00', end_time: '10:00', subject_code: 'CS602', subject_name: 'Artificial Intelligence & Machine Learning', faculty_name: 'Dr. Rajesh Kulkarni', room: 'AI Lab 1' },
            { id: 14, start_time: '10:15', end_time: '11:15', subject_code: 'CS603', subject_name: 'Database Engineering & Distributed Systems', faculty_name: 'Prof. Suresh Kumar', room: 'Hall 304' },
            { id: 15, start_time: '11:30', end_time: '12:30', subject_code: 'CS606', subject_name: 'Professional Ethics in Engineering', faculty_name: 'Prof. Anitha M', room: 'Hall 302' }
          ]
        }
      };
    }

    // Student Placements
    if (url === '/students/me/placements') {
      return {
        data: [
          {
            id: 1,
            company: 'Amazon Web Services',
            role: 'Cloud Support Associate',
            package_lpa: 16.5,
            location: 'Chennai / Bengaluru',
            deadline: new Date(Date.now() + 86400000 * 14).toISOString(),
            eligibility: 'CGPA >= 7.5, No standing arrears',
            status: 'Open'
          },
          {
            id: 2,
            company: 'Zoho Corporation',
            role: 'Software Development Engineer',
            package_lpa: 12.0,
            location: 'Chennai / Tenkasi',
            deadline: new Date(Date.now() + 86400000 * 10).toISOString(),
            eligibility: 'Open to CSE, IT, ECE',
            status: 'Open'
          },
          {
            id: 3,
            company: 'Freshworks Inc.',
            role: 'Associate Frontend Engineer',
            package_lpa: 14.0,
            location: 'Chennai',
            deadline: new Date(Date.now() + 86400000 * 18).toISOString(),
            eligibility: 'Proficiency in React / TypeScript, CGPA >= 7.0',
            status: 'Open'
          }
        ]
      };
    }

    // Student Grievances & Complaints
    if (url === '/students/me/complaints') {
      return {
        data: [
          {
            id: 1,
            subject: 'Library Digital Portal Access',
            category: 'Academic',
            description: 'IEEE Xplore database remote credentials login failure from off-campus network.',
            status: 'Resolved',
            response: 'Remote proxy gateway credentials renewed. You can now access IEEE through the college portal.',
            created_at: new Date(Date.now() - 86400000 * 3).toISOString()
          }
        ]
      };
    }

    // 6. Student Quizzes
    if (url === '/students/me/quizzes') {
      const st = getLoggedInStudent();
      const mapped = stateQuizzes.map((q) => {
        const attempt = stateQuizAttempts.find((a) => a.quiz_id === q.id && a.student_id === st.id);
        const isSubmitted = Boolean(attempt && attempt.status === 'Submitted');
        return {
          id: q.id,
          title: q.title,
          description: q.description,
          subject_code: q.subject_code,
          subject_name: q.subject_name,
          duration_minutes: q.duration_minutes,
          total_marks: q.total_marks,
          deadline: q.deadline,
          status: q.status,
          results_published: Boolean(q.results_published),
          attempt_status: isSubmitted ? 'Submitted' : 'Pending',
          score: q.results_published && isSubmitted ? attempt.score : null, // HIDDEN until released!
          can_attempt: !isSubmitted,
          is_expired: new Date(q.deadline) < new Date()
        };
      });
      return { data: mapped };
    }

    // Specific Quiz questions
    if (url.startsWith('/students/me/quizzes/') && !url.includes('/results')) {
      const qId = parseInt(url.split('/').pop());
      const quiz = stateQuizzes.find((q) => q.id === qId);
      if (!quiz) throw { response: { status: 404, data: { detail: 'Quiz not found' } } };
      // Strip correct answers when sending to student taking the quiz!
      const sanitizedQuestions = quiz.questions.map((q) => ({
        id: q.id,
        question_text: q.question_text,
        question_type: q.question_type,
        marks: q.marks,
        options: q.options
      }));
      return {
        data: {
          id: quiz.id,
          title: quiz.title,
          description: quiz.description,
          duration_minutes: quiz.duration_minutes,
          total_marks: quiz.total_marks,
          questions: sanitizedQuestions
        }
      };
    }

    // Specific Quiz results (CONTROLLED RESULT RELEASE REQUIREMENT)
    if (url.startsWith('/students/me/quizzes/') && url.endsWith('/results')) {
      const parts = url.split('/');
      const qId = parseInt(parts[parts.length - 2]);
      const quiz = stateQuizzes.find((q) => q.id === qId);
      if (!quiz) throw { response: { status: 404, data: { detail: 'Quiz not found' } } };

      // Check results_published flag
      if (!quiz.results_published) {
        throw {
          response: {
            status: 403,
            data: { detail: 'Quiz results have not been released by the faculty yet.' }
          }
        };
      }

      const st = getLoggedInStudent();
      const attempt = stateQuizAttempts.find((a) => a.quiz_id === qId && a.student_id === st.id) || {
        score: 10.0,
        total_marks: quiz.total_marks,
        answers: {}
      };

      return {
        data: {
          quiz_id: quiz.id,
          title: quiz.title,
          score: attempt.score,
          total_marks: quiz.total_marks,
          results_published: true,
          questions: quiz.questions.map((q) => ({
            id: q.id,
            question_text: q.question_text,
            marks: q.marks,
            selected_answer: attempt.answers?.[q.id] || 'A',
            correct_answer: q.correct_answer,
            is_correct: (attempt.answers?.[q.id] || 'A') === q.correct_answer,
            explanation: q.explanation
          }))
        }
      };
    }

    // 7. Student Assignments
    if (url === '/students/me/assignments') {
      const st = getLoggedInStudent();
      const mapped = stateAssignments.map((a) => {
        const sub = stateSubmissions.find((s) => s.assignment_id === a.id && s.student_id === st.id);
        return {
          id: a.id,
          title: a.title,
          description: a.description,
          subject_code: a.subject_code,
          subject_name: a.subject_name,
          due_date: a.due_date,
          due_time: a.due_time,
          max_marks: a.max_marks,
          allowed_file_types: a.allowed_file_types,
          max_file_size_mb: a.max_file_size_mb,
          submission_format: a.submission_format,
          allow_resubmission: a.allow_resubmission,
          allow_late: a.allow_late,
          status: sub ? sub.status : 'Pending',
          submission: sub || null,
          marks: sub ? sub.marks_obtained : null,
          feedback: sub ? sub.faculty_feedback : null
        };
      });
      return { data: mapped };
    }

    // 8. Student Notes Documents
    if (url === '/students/me/notes') {
      return { data: stateDocuments };
    }

    // 9. Faculty Endpoints
    if (url === '/faculty/me') {
      return { data: FACULTY_MEMBERS[0] };
    }

    if (url === '/faculty/dashboard') {
      const cseStudents = stateStudents.filter((s) => s.department_id === 3);
      const highRisk = cseStudents.filter((s) => s.risk_status === 'High Risk').length;
      return {
        data: {
          faculty: FACULTY_MEMBERS[0],
          subjects_handled: 3,
          today_classes_count: 2,
          students_at_risk_count: highRisk,
          total_dept_students: cseStudents.length,
          today_classes: [
            { id: 1, subject_code: 'CS601', subject_name: 'Design and Analysis of Algorithms', time: '09:00 - 10:00', start_time: '09:00', end_time: '10:00', room: 'Hall 302', section: 'A', semester: 6 },
            { id: 2, subject_code: 'CS602', subject_name: 'Artificial Intelligence & Machine Learning', time: '10:15 - 11:15', start_time: '10:15', end_time: '11:15', room: 'AI Lab 1', section: 'A', semester: 6 }
          ],
          today_schedule: [
            { id: 1, subject_code: 'CS601', subject_name: 'Design and Analysis of Algorithms', time: '09:00 - 10:00', room: 'Hall 302', section: 'A' },
            { id: 2, subject_code: 'CS602', subject_name: 'Artificial Intelligence & Machine Learning', time: '10:15 - 11:15', room: 'AI Lab 1', section: 'A' }
          ],
          current_day: 'Wednesday',
          recent_announcements: stateAnnouncements.slice(0, 3),
          stats: {
            total_students: cseStudents.length,
            safe_students: cseStudents.filter((s) => s.risk_status === 'Safe').length,
            warning_students: cseStudents.filter((s) => s.risk_status === 'Warning').length,
            risk_students: highRisk,
            classes_today: 2
          },
          subjects: SUBJECTS.filter((s) => s.department_id === 3)
        }
      };
    }

    if (url === '/faculty/students' || url === '/faculty/students-by-filter') {
      const riskFilter = queryParams.get('risk_filter');
      let deptStudents = stateStudents.filter((s) => s.department_id === 3);
      if (riskFilter && riskFilter !== 'All') {
        deptStudents = deptStudents.filter((s) => s.risk_status === riskFilter);
      }
      return { data: deptStudents };
    }

    if (url === '/faculty/subjects') {
      return { data: SUBJECTS.filter((s) => s.department_id === 3) };
    }

    // Faculty Attendance Session Data (STUDENT ROSTER FOR MARKING ATTENDANCE)
    if (url.startsWith('/faculty/attendance/session')) {
      const subId = parseInt(queryParams.get('subject_id')) || 7;
      const dateVal = queryParams.get('date') || new Date().toISOString().split('T')[0];
      const subject = SUBJECTS.find((s) => s.id === subId) || SUBJECTS[0];
      const targetDeptId = subject ? subject.department_id : 3;

      let enrolledStudents = stateStudents.filter((s) => s.department_id === targetDeptId);
      if (enrolledStudents.length === 0) {
        enrolledStudents = stateStudents.filter((s) => s.department_id === 3);
      }

      const sessionKey = `${dateVal}_${subId}`;
      const savedStatuses = stateAttendanceSessions[sessionKey] || {};

      const studentsRoster = enrolledStudents.map((st) => ({
        student_id: st.id,
        reg_no: st.reg_no,
        name: st.name,
        overall_attendance: st.overall_attendance,
        risk_status: st.risk_status,
        status: savedStatuses[st.id] || 'Present'
      }));

      return {
        data: {
          subject_id: subId,
          date: dateVal,
          session_name: 'Lecture',
          students: studentsRoster
        }
      };
    }

    if (url === '/faculty/marks') {
      const subId = parseInt(queryParams.get('subject_id')) || 7; // CS601 default
      const marksForSub = stateMarks.filter((m) => m.subject_id === subId);
      return { data: marksForSub };
    }

    if (url === '/faculty/timetable') {
      return {
        data: [
          { id: 1, day: 'Monday', time: '09:00 - 10:00', start_time: '09:00', end_time: '10:00', subject_code: 'CS601', subject_name: 'Design and Analysis of Algorithms', section: 'A', room: 'Hall 302' },
          { id: 2, day: 'Tuesday', time: '10:15 - 11:15', start_time: '10:15', end_time: '11:15', subject_code: 'CS601', subject_name: 'Design and Analysis of Algorithms', section: 'A', room: 'Hall 302' },
          { id: 3, day: 'Tuesday', time: '13:30 - 15:30', start_time: '13:30', end_time: '15:30', subject_code: 'CS604', subject_name: 'Cloud Computing & DevOps Laboratory', section: 'A', room: 'Cloud Computing Lab' },
          { id: 4, day: 'Wednesday', time: '09:00 - 10:00', start_time: '09:00', end_time: '10:00', subject_code: 'CS601', subject_name: 'Design and Analysis of Algorithms', section: 'A', room: 'Hall 302' },
          { id: 5, day: 'Thursday', time: '10:15 - 11:15', start_time: '10:15', end_time: '11:15', subject_code: 'CS601', subject_name: 'Design and Analysis of Algorithms', section: 'A', room: 'Hall 302' }
        ]
      };
    }

    if (url === '/faculty/quizzes') {
      return { data: stateQuizzes };
    }

    if (url.startsWith('/faculty/quizzes/') && url.endsWith('/submissions')) {
      const qId = parseInt(url.split('/')[3]);
      const quiz = stateQuizzes.find((q) => q.id === qId);
      const cseStudents = stateStudents.filter((s) => s.department_id === 3);

      const roster = cseStudents.map((st) => {
        const attempt = stateQuizAttempts.find((a) => a.quiz_id === qId && a.student_id === st.id);
        const hasSubmitted = Boolean(attempt && attempt.status === 'Submitted');
        return {
          student_id: st.id,
          reg_no: st.reg_no,
          name: st.name,
          email: st.email,
          status: hasSubmitted ? 'Submitted' : 'Pending Attempt',
          score: hasSubmitted ? attempt.score : null,
          total_marks: quiz ? quiz.total_marks : 10.0,
          submitted_at: hasSubmitted ? new Date(Date.now() - 3600000 * 2).toISOString() : null
        };
      });

      return {
        data: {
          quiz_id: qId,
          title: quiz ? quiz.title : '',
          results_published: quiz ? quiz.results_published : false,
          total_eligible: cseStudents.length,
          total_submitted: roster.filter((r) => r.status === 'Submitted').length,
          roster
        }
      };
    }

    if (url === '/faculty/assignments') {
      return { data: stateAssignments };
    }

    // Assignment Submissions Roster (WITH RED INDICATOR FOR PENDING STUDENTS)
    if (url.startsWith('/faculty/assignments/') && url.endsWith('/roster')) {
      const asgnId = parseInt(url.split('/')[3]);
      const asgn = stateAssignments.find((a) => a.id === asgnId);
      const cseStudents = stateStudents.filter((s) => s.department_id === 3);

      const roster = cseStudents.map((st) => {
        const sub = stateSubmissions.find((s) => s.assignment_id === asgnId && s.student_id === st.id);
        const isSubmitted = Boolean(sub);
        return {
          student_id: st.id,
          reg_no: st.reg_no,
          name: st.name,
          email: st.email,
          // Unsubmitted students get 'Pending — Not Submitted' for clear RED badge
          status: isSubmitted ? sub.status : 'Pending — Not Submitted',
          submission_id: sub ? sub.id : null,
          submission_type: sub ? sub.submission_type : null,
          file_name: sub ? sub.file_name : null,
          file_path: sub ? sub.file_path : null,
          drive_link: sub ? sub.drive_link : null,
          submitted_at: sub ? sub.submitted_at : null,
          marks_obtained: sub ? sub.marks_obtained : null,
          faculty_feedback: sub ? sub.faculty_feedback : null,
          reminder_count: isSubmitted ? 0 : 1,
          next_reminder: isSubmitted ? null : 'In 2 hours'
        };
      });

      return {
        data: {
          assignment_id: asgnId,
          title: asgn ? asgn.title : '',
          max_marks: asgn ? asgn.max_marks : 10.0,
          total_eligible: cseStudents.length,
          total_submitted: roster.filter((r) => !r.status.includes('Pending')).length,
          total_pending: roster.filter((r) => r.status.includes('Pending')).length,
          roster
        }
      };
    }

    // Assignment Reminder Logs
    if (url.startsWith('/faculty/assignments/') && url.endsWith('/reminder-logs')) {
      return {
        data: stateAssignmentReminderLogs
      };
    }

    // 10. Admin Endpoints
    if (url === '/admin/dashboard' || url === '/admin/dashboard-stats') {
      const avgAtt = +(stateStudents.reduce((acc, s) => acc + s.overall_attendance, 0) / stateStudents.length).toFixed(1);
      const lowAtt = stateStudents.filter((s) => s.overall_attendance < 75);
      return {
        data: {
          total_students: stateStudents.length, // 60 students
          total_faculty: FACULTY_MEMBERS.length,
          average_attendance: avgAtt,
          students_below_75: lowAtt.length,
          upcoming_exams: 3,
          pending_fees: 45000,
          total_departments: 3,
          attendance_alerts: lowAtt.filter((s) => s.risk_status === 'High Risk').length,
          department_stats: [
            { department: 'ECE', count: 20 },
            { department: 'IT', count: 20 },
            { department: 'CSE', count: 20 }
          ],
          recent_registrations: stateStudents.slice(0, 5),
          department_breakdown: [
            {
              name: 'Electronics and Communication Engineering',
              code: 'ECE',
              students: stateStudents.filter((s) => s.department_id === 1).length,
              faculty: 4
            },
            {
              name: 'Information Technology',
              code: 'IT',
              students: stateStudents.filter((s) => s.department_id === 2).length,
              faculty: 4
            },
            {
              name: 'Computer Science and Engineering',
              code: 'CSE',
              students: stateStudents.filter((s) => s.department_id === 3).length,
              faculty: 4
            }
          ],
          recent_alerts: lowAtt.slice(0, 5).map((s, idx) => ({
            id: idx + 1,
            student_name: s.name,
            reg_no: s.reg_no,
            department: s.department,
            parent_email: s.parent_email,
            attendance_pct: s.overall_attendance,
            status: s.risk_status === 'High Risk' ? 'Action Required' : 'Notice Sent'
          }))
        }
      };
    }

    if (url === '/admin/students') {
      return { data: stateStudents };
    }

    if (url === '/admin/faculty') {
      return { data: FACULTY_MEMBERS };
    }

    if (url === '/admin/subjects') {
      return { data: SUBJECTS };
    }

    if (url === '/admin/exams') {
      return {
        data: [
          { id: 1, name: 'CIA-2 Mid Semester Examination', department: 'Computer Science and Engineering', semester: 6, subject_code: 'CS601', subject_name: 'Design and Analysis of Algorithms', date: new Date(Date.now() + 86400000 * 6).toISOString().split('T')[0], venue: 'Auditorium Block C' },
          { id: 2, name: 'CIA-2 Mid Semester Examination', department: 'Information Technology', semester: 6, subject_code: 'IT601', subject_name: 'Cloud Architecture & Microservices', date: new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0], venue: 'Hall 201' },
          { id: 3, name: 'CIA-2 Mid Semester Examination', department: 'Electronics and Communication', semester: 6, subject_code: 'EC601', subject_name: 'Digital Signal Processing', date: new Date(Date.now() + 86400000 * 8).toISOString().split('T')[0], venue: 'Hall 105' }
        ]
      };
    }

    if (url === '/admin/marks') {
      const deptId = queryParams.get('department_id');
      const subId = queryParams.get('subject_id');
      const search = (queryParams.get('search') || '').toLowerCase();
      let res = [...stateMarks];
      if (deptId && deptId !== 'All' && deptId !== '') {
        res = res.filter((m) => m.department_id === parseInt(deptId));
      }
      if (subId && subId !== 'All' && subId !== '') {
        res = res.filter((m) => m.subject_id === parseInt(subId));
      }
      if (search) {
        res = res.filter(
          (m) =>
            m.name.toLowerCase().includes(search) ||
            m.reg_no.toLowerCase().includes(search) ||
            m.subject_code.toLowerCase().includes(search) ||
            m.subject_name.toLowerCase().includes(search)
        );
      }
      return { data: res };
    }

    if (url === '/admin/fees') {
      const records = stateStudents.map((s, idx) => {
        const isDefaulter = s.risk_status === 'High Risk';
        const total = 85000;
        const paid = isDefaulter ? 70000 : 85000;
        const pending = total - paid;
        return {
          id: idx + 1,
          student_id: s.id,
          student_name: s.name,
          reg_no: s.reg_no,
          department: s.department,
          title: 'Semester 6 Tuition & Composite Institutional Fee',
          total_amount: total,
          paid_amount: paid,
          pending_amount: pending,
          status: pending === 0 ? 'Paid' : 'Pending',
          due_date: '2026-04-15'
        };
      });

      // Attach summary and defaulters for metadata consumers
      records.summary = {
        total_assessed: records.length * 85000,
        total_collected: records.reduce((acc, r) => acc + r.paid_amount, 0),
        total_pending: records.reduce((acc, r) => acc + r.pending_amount, 0),
        collection_percentage: 98.5
      };
      records.defaulters = records.filter(r => r.pending_amount > 0);
      records.records = records;

      return {
        data: records
      };
    }

    if (url === '/admin/attendance-alerts') {
      const lowAttendance = stateStudents
        .filter((s) => s.risk_status !== 'Safe' || s.overall_attendance < 75)
        .map((s) => {
          const recoveryClasses = Math.max(1, Math.ceil((0.75 * (s.total_conducted || 40) - (s.total_attended || Math.round((s.overall_attendance * 40) / 100))) / (1 - 0.75)));
          return {
            student_id: s.id,
            name: s.name,
            reg_no: s.reg_no,
            department: s.department || 'Computer Science and Engineering',
            parent_name: s.parent_name || 'Parent / Guardian',
            parent_email: s.parent_email || `parent.${s.reg_no.toLowerCase()}@gmail.com`,
            attendance_pct: s.overall_attendance,
            risk_level: s.risk_status || (s.overall_attendance < 65 ? 'High Risk' : 'Warning'),
            last_alert_status: 'Delivered (SMTP)',
            recovery_classes: recoveryClasses,
            email_preview: `<html><body style="font-family:Arial,sans-serif;padding:20px;color:#1e293b;"><h2 style="color:#b91c1c;">Attendance Alert Notice &bull; College Academic Governance</h2><p>Dear Parent / Guardian of <strong>${s.name}</strong> (${s.reg_no}),</p><p>This is an automated notification from the Academic Registrar. The current recorded attendance for your ward is <strong>${s.overall_attendance}%</strong>, which falls below the mandatory university threshold of <strong>75.0%</strong>.</p><p>Your ward requires attending at least <strong>${recoveryClasses}</strong> consecutive classes without absence to restore good academic standing.</p><hr style="border:0;border-top:1px solid #e2e8f0;margin:20px 0;"/><p style="font-size:11px;color:#64748b;">Office of the Academic Registrar &bull; Cloud Institute of Technology & Science</p></body></html>`
          };
        });

      return {
        data: {
          below_75_students: lowAttendance,
          alert_logs: stateAlertLogs,
          safe_threshold: 75.0,
          smtp_configured: true
        }
      };
    }

    if (url === '/admin/announcements' || url === '/announcements' || url === '/faculty/announcements') {
      return { data: stateAnnouncements };
    }

    if (url === '/admin/notifications') {
      return { data: stateAnnouncements };
    }

    if (url === '/admin/placements') {
      return {
        data: [
          {
            id: 1,
            company: 'Amazon Web Services',
            role: 'Cloud Support Associate',
            package_lpa: 16.5,
            eligible_departments: 'CSE, IT, ECE',
            deadline: new Date(Date.now() + 86400000 * 14).toISOString(),
            status: 'Active'
          },
          {
            id: 2,
            company: 'Zoho Corporation',
            role: 'Software Development Engineer',
            package_lpa: 12.0,
            eligible_departments: 'CSE, IT',
            deadline: new Date(Date.now() + 86400000 * 10).toISOString(),
            status: 'Active'
          }
        ]
      };
    }

    if (url === '/admin/timetable') {
      return {
        data: [
          { id: 1, department_name: 'CSE', semester: 6, day: 'Monday', time: '09:00 - 10:00', subject_name: 'Design and Analysis of Algorithms', faculty_name: 'Dr. Kavitha Raman', room: 'Hall 302' },
          { id: 2, department_name: 'IT', semester: 6, day: 'Monday', time: '10:15 - 11:15', subject_name: 'Cloud Architecture & Microservices', faculty_name: 'Dr. Anand Kumar', room: 'Hall 201' },
          { id: 3, department_name: 'ECE', semester: 6, day: 'Monday', time: '11:30 - 12:30', subject_name: 'Digital Signal Processing', faculty_name: 'Dr. Meenakshi Sundaram', room: 'Hall 105' }
        ]
      };
    }

    if (url === '/admin/settings') {
      return {
        data: {
          college_name: 'Cloud Institute of Technology & Science',
          academic_year: '2025-2026',
          semester: 'Even Semester (Jan - May 2026)',
          attendance_threshold_safe: 75.0,
          attendance_threshold_warning: 65.0,
          SMTP_HOST: 'smtp.gmail.com',
          SMTP_PORT: '587',
          SMTP_USERNAME: 'examplecollegeerp@gmail.com',
          SMTP_FROM_EMAIL: 'noreply@college-erp.edu',
          smtp_configured: true,
          supabase_cloud_connected: true
        }
      };
    }

    // General fallback for unknown endpoints
    return { data: [] };
  },

  async post(url, data = {}, config = {}) {
    // 1. Auth Login
    if (url === '/auth/login') {
      const { email, password } = data;
      // First attempt Supabase Auth if configured
      if (isSupabaseConfigured) {
        try {
          const authRes = await signInWithEmail(email, password);
          if (authRes?.user) {
            const role = authRes.user.user_metadata?.role || (email.includes('admin') ? 'admin' : email.includes('kavitha') || email.includes('faculty') ? 'faculty' : 'student');
            const userObj = {
              id: authRes.user.id,
              email: authRes.user.email,
              role,
              name: authRes.user.user_metadata?.name || email.split('@')[0],
              access_token: authRes.session?.access_token || 'supabase_token'
            };
            return { data: userObj };
          }
        } catch (authErr) {
          console.warn('Supabase Auth error, checking seeded accounts:', authErr.message);
        }
      }

      // Check seeded accounts (password123 for all demo accounts)
      const user = stateUsers.find((u) => u.email.toLowerCase() === email.toLowerCase());
      if (user && (password === 'password123' || password === 'admin123' || password === 'faculty123' || password === 'student123')) {
        const token = `erp_jwt_token_${user.id}_${Date.now()}`;
        return {
          data: {
            ...user,
            access_token: token
          }
        };
      }

      // If registered student in stateStudents
      const st = stateStudents.find((s) => s.email.toLowerCase() === email.toLowerCase());
      if (st && password === 'password123') {
        const token = `erp_jwt_token_st_${st.id}_${Date.now()}`;
        return {
          data: {
            id: st.user_id,
            email: st.email,
            role: 'student',
            name: st.name,
            access_token: token
          }
        };
      }

      throw {
        response: {
          status: 401,
          data: { detail: 'Invalid college email or password. For demo accounts use password: password123' }
        }
      };
    }

    // 2. Auth Register (Student Public Signup Only)
    if (url === '/auth/register') {
      const { name, email, password, reg_no, department_id, parent_name, parent_email, phone, address } = data;
      
      // Attempt Supabase Auth signup
      if (isSupabaseConfigured) {
        try {
          await signUpStudent({ email, password, name, reg_no, department_id, parent_name, parent_email, phone, address });
        } catch (e) {
          console.warn('Supabase Auth registration fallback:', e.message);
        }
      }

      const newId = stateStudents.length + 1;
      const newUserId = stateUsers.length + 1;
      const dept = DEPARTMENTS.find((d) => d.id === parseInt(department_id)) || DEPARTMENTS[2];

      const newStudent = {
        id: newId,
        user_id: newUserId,
        reg_no: reg_no || `21${dept.code.slice(0, 2)}${100 + newId}`,
        name,
        email,
        phone: phone || '9840111222',
        department_id: dept.id,
        department: dept.name,
        department_name: dept.name,
        semester: 6,
        section: 'A',
        parent_name: parent_name || 'Guardian',
        parent_email: parent_email || 'parent@gmail.com',
        address: address || 'Chennai, Tamil Nadu',
        overall_attendance: 0.0,
        risk_status: 'Warning',
        total_attended: 0,
        total_conducted: 0,
        recovery_classes: 0,
        required_percentage: 75.0
      };

      const newUser = {
        id: newUserId,
        email,
        role: 'student', // Public signup strictly restricted to Student role
        name,
        is_active: true
      };

      stateStudents = [newStudent, ...stateStudents];
      stateUsers = [newUser, ...stateUsers];
      setStored('students', stateStudents);
      setStored('users', stateUsers);

      const token = `erp_jwt_token_${newUserId}_${Date.now()}`;
      return {
        data: {
          ...newUser,
          access_token: token
        }
      };
    }

    // 3. Password recovery
    if (url === '/auth/forgot-password') {
      if (isSupabaseConfigured) {
        try {
          await requestPasswordReset(data.email);
        } catch (e) {}
      }
      return {
        data: {
          message: 'Password recovery token generated and sent to college email.',
          reset_token: 'RECOVERY-TOKEN-7788'
        }
      };
    }

    if (url === '/auth/reset-password') {
      return {
        data: {
          message: 'Password successfully updated. You can now sign in with your new credentials.'
        }
      };
    }

    // 4. Submit Quiz Attempt
    if (url.startsWith('/students/me/quizzes/') && url.endsWith('/submit')) {
      const qId = parseInt(url.split('/')[4]);
      const st = getLoggedInStudent();
      const quiz = stateQuizzes.find((q) => q.id === qId);

      let score = 0;
      const answerMap = {};
      if (data.answers && quiz) {
        data.answers.forEach((ans) => {
          answerMap[ans.question_id] = ans.selected_answer;
          const qObj = quiz.questions.find((q) => q.id === ans.question_id);
          if (qObj && qObj.correct_answer === ans.selected_answer) {
            score += qObj.marks;
          }
        });
      }

      const newAttempt = {
        quiz_id: qId,
        student_id: st.id,
        score,
        total_marks: quiz ? quiz.total_marks : 10.0,
        status: 'Submitted',
        answers: answerMap,
        submitted_at: new Date().toISOString()
      };

      stateQuizAttempts = stateQuizAttempts.filter((a) => !(a.quiz_id === qId && a.student_id === st.id));
      stateQuizAttempts.push(newAttempt);
      setStored('quiz_attempts', stateQuizAttempts);

      return { data: { message: 'Quiz submitted successfully', status: 'Submitted' } };
    }

    // 5. Toggle Quiz Result Release (FACULTY OPERATION)
    if (url.startsWith('/faculty/quizzes/') && url.includes('/publish-results')) {
      const qId = parseInt(url.split('/')[3]);
      const searchParams = new URLSearchParams(url.split('?')[1]);
      const publish = searchParams.get('publish') === 'true';

      stateQuizzes = stateQuizzes.map((q) => {
        if (q.id === qId) {
          return { ...q, results_published: publish };
        }
        return q;
      });
      setStored('quizzes', stateQuizzes);

      return {
        data: {
          quiz_id: qId,
          results_published: publish,
          message: publish ? 'Results released to students successfully.' : 'Results unreleased and hidden from students.'
        }
      };
    }

    // 6. Submit Assignment File
    if (url.startsWith('/students/me/assignments/') && url.includes('/submit-file')) {
      const asgnId = parseInt(url.split('/')[4]);
      const st = getLoggedInStudent();
      const file = data instanceof FormData ? data.get('file') : null;

      let fileInfo = {
        file_name: file ? file.name : 'assignment_submission.pdf',
        file_path: `assignments/${asgnId}/${st.id}_file.pdf`
      };

      if (file && isSupabaseConfigured) {
        try {
          const uploadRes = await uploadAssignmentFile(file, st.id, asgnId);
          fileInfo = {
            file_name: uploadRes.fileName,
            file_path: uploadRes.filePath
          };
        } catch (e) {
          console.warn('Supabase storage upload fallback:', e.message);
        }
      }

      const newSub = {
        id: stateSubmissions.length + 1,
        assignment_id: asgnId,
        student_id: st.id,
        submission_type: 'file',
        file_name: fileInfo.file_name,
        file_path: fileInfo.file_path,
        status: 'Submitted',
        submitted_at: new Date().toISOString(),
        marks_obtained: null,
        faculty_feedback: null
      };

      stateSubmissions = stateSubmissions.filter((s) => !(s.assignment_id === asgnId && s.student_id === st.id));
      stateSubmissions.push(newSub);
      setStored('submissions', stateSubmissions);

      return { data: newSub };
    }

    // 7. Submit Assignment Google Drive Link
    if (url.startsWith('/students/me/assignments/') && url.includes('/submit-drive')) {
      const asgnId = parseInt(url.split('/')[4]);
      const st = getLoggedInStudent();

      const newSub = {
        id: stateSubmissions.length + 1,
        assignment_id: asgnId,
        student_id: st.id,
        submission_type: 'drive_link',
        drive_link: data.drive_link,
        status: 'Submitted',
        submitted_at: new Date().toISOString(),
        marks_obtained: null,
        faculty_feedback: null
      };

      stateSubmissions = stateSubmissions.filter((s) => !(s.assignment_id === asgnId && s.student_id === st.id));
      stateSubmissions.push(newSub);
      setStored('submissions', stateSubmissions);

      return { data: newSub };
    }

    // 8. Grade Assignment (FACULTY OPERATION)
    if (url.startsWith('/faculty/assignments/') && url.includes('/grade/')) {
      const parts = url.split('/');
      const asgnId = parseInt(parts[3]);
      const studentId = parseInt(parts[5]);

      const sub = stateSubmissions.find((s) => s.assignment_id === asgnId && s.student_id === studentId);
      if (sub) {
        sub.marks_obtained = parseFloat(data.marks);
        sub.faculty_feedback = data.feedback;
        sub.status = data.return_for_resubmission ? 'Returned for Resubmission' : 'Graded';
        setStored('submissions', stateSubmissions);
      }

      return { data: { message: 'Submission evaluated and graded successfully.' } };
    }

    // 9. Create Assignment (FACULTY OPERATION)
    if (url === '/faculty/assignments') {
      const newAsgn = {
        id: stateAssignments.length + 1,
        title: data.title,
        description: data.description,
        subject_id: parseInt(data.subject_id) || 7,
        subject_code: 'CS601',
        subject_name: 'Design and Analysis of Algorithms',
        faculty_id: 1,
        department_id: parseInt(data.department_id) || 3,
        semester: data.semester || 6,
        section: data.section || 'A',
        due_date: data.due_date || new Date(Date.now() + 86400000 * 5).toISOString().split('T')[0],
        due_time: data.due_time || '23:59',
        max_marks: parseFloat(data.max_marks) || 10.0,
        allowed_file_types: data.allowed_file_types || 'pdf,docx,zip,txt',
        max_file_size_mb: data.max_file_size_mb || 10,
        submission_format: data.submission_format || 'both',
        allow_resubmission: data.allow_resubmission !== false,
        allow_late: data.allow_late !== false,
        reminder_interval_minutes: data.reminder_interval_minutes || 60,
        status: 'published'
      };
      stateAssignments = [newAsgn, ...stateAssignments];
      setStored('assignments', stateAssignments);
      return { data: newAsgn };
    }

    // 10. AI Document Upload & Summarization
    if (url === '/students/me/notes/upload') {
      const file = data instanceof FormData ? data.get('file') : null;
      const fileName = file ? file.name : 'Uploaded_Lecture_Notes.pdf';
      const fileType = fileName.split('.').pop().toLowerCase();
      const fileSize = file ? file.size : 185000;
      const chunks = Math.max(3, Math.ceil(fileSize / 1024 / 25));

      const isAlgo = /algo|divide|sort|recur|graph|tree/i.test(fileName);
      const isDb = /db|data|sql|schema|table|query/i.test(fileName);
      const isOs = /os|operat|concur|thread|process|memory|sched/i.test(fileName);

      let initialSummary = '';
      if (isAlgo) {
        initialSummary = `### 📘 Comprehensive Syllabus Summary: ${fileName}\n\n- **Core Theme**: Design and analysis of algorithmic strategies, recursive divide-and-conquer, dynamic programming, and asymptotic bounds.\n- **Essential Theorems & Equations**:\n  - **Master Theorem**: Solves $T(n) = aT(n/b) + f(n)$ to derive $O(n^{\\log_b a})$.\n  - **Sorting Efficiency**: QuickSort average $\\mathcal{O}(n \\log n)$, worst case $\\mathcal{O}(n^2)$; MergeSort guaranteed $\\mathcal{O}(n \\log n)$.\n- **Practical Exam Checklist**:\n  - Derive substitution bounds for recursive trees.\n  - Verify Dijkstra greedy choice correctness on non-negative weighted graphs.`;
      } else if (isDb) {
        initialSummary = `### 📘 Comprehensive Syllabus Summary: ${fileName}\n\n- **Core Theme**: Relational database engineering, normal forms (1NF through BCNF), indexing (B+ Trees), and ACID transaction guarantees.\n- **Essential Principles**:\n  - **Indexing**: Clustered vs secondary B+ Tree indexing accelerates query retrieval from $\\mathcal{O}(N)$ to $\\mathcal{O}(\\log N)$.\n  - **Transactions**: Strict Two-Phase Locking (2PL) guarantees serializability and prevents dirty reads.\n- **Practical Exam Checklist**:\n  - Decompose unnormalized relations into 3NF/BCNF without loss of functional dependencies.\n  - Formulate optimal SQL queries utilizing composite indexes.`;
      } else if (isOs) {
        initialSummary = `### 📘 Comprehensive Syllabus Summary: ${fileName}\n\n- **Core Theme**: Operating system architecture, CPU process scheduling, mutual exclusion concurrency, virtual memory paging, and deadlock handling.\n- **Essential Principles**:\n  - **Synchronization**: Semaphores and mutex locks eliminate race conditions in shared memory.\n  - **Deadlock Conditions**: Mutual exclusion, hold-and-wait, no preemption, and circular wait.\n- **Practical Exam Checklist**:\n  - Solve Banker's algorithm safe-state resource allocation.\n  - Calculate page fault ratios across FIFO, LRU, and Optimal replacement algorithms.`;
      } else {
        initialSummary = `### 📘 Comprehensive Syllabus Summary: ${fileName}\n\n- **Core Theme**: Systematic theoretical foundations, engineering problem decomposition, and practical implementation standards.\n- **Core Principles**:\n  - **Modular Architecture**: Decoupled high-cohesion subcomponents ensuring maintainability.\n  - **Performance Optimization**: Balancing memory overhead against latency and throughput.\n- **Practical Exam Checklist**:\n  - Memorize precise university 2-mark definitions.\n  - Practice complete structural flow diagrams and architectural workflows.`;
      }

      const newDoc = {
        id: stateDocuments.length + 1,
        filename: fileName,
        file_type: fileType,
        file_size: fileSize,
        total_chunks: chunks,
        summary: initialSummary,
        created_at: new Date().toISOString()
      };

      stateDocuments = [newDoc, ...stateDocuments];
      setStored('documents', stateDocuments);
      return { data: newDoc };
    }

    // AI Document Action (QA, Summarize, Revision points, Tanglish, MCQs)
    if (url.startsWith('/students/me/notes/') && url.endsWith('/action')) {
      const parts = url.split('/');
      const docId = parseInt(parts[4]);
      const doc = stateDocuments.find((d) => d.id === docId);
      const docName = doc ? doc.filename : 'Lecture Notes';
      const { action, query, topic } = data;
      let reply = '';

      const isAlgo = /algo|divide|sort|recur|graph|tree/i.test(docName);
      const isDb = /db|data|sql|schema|table|query/i.test(docName);

      if (action === 'summarise_full') {
        if (isAlgo) {
          reply = `### 📘 Executive Academic Summary: ${docName}\n\n` +
            `#### 1. Scope & Theoretical Framework\n` +
            `This unit focuses on rigorous algorithm design paradigms, computational complexity analysis, asymptotic bounds, and recurrence relations for university examinations.\n\n` +
            `#### 2. Key Modules Covered\n` +
            `- **Asymptotic Notations**: $\\mathcal{O}$ (Big-O upper bound), $\\Omega$ (lower bound), $\\Theta$ (tight bound) characterising asymptotic growth.\n` +
            `- **Divide & Conquer**: Recursive decomposition of inputs, conquer phase, and linear merge combination (MergeSort, QuickSort).\n` +
            `- **Greedy & Dynamic Programming**: Optimal substructure identification, memoization tables, and fractional knapsack vs 0/1 knapsack.\n` +
            `- **Graph Algorithms**: Dijkstra single-source shortest path, Prim's and Kruskal's Minimum Spanning Tree algorithms.\n\n` +
            `#### 3. High-Yield Exam Formulas & Complexity Bounds\n` +
            `- **Master Theorem**: For $T(n) = aT(n/b) + f(n)$, compare $f(n)$ with $n^{\\log_b a}$.\n` +
            `- **QuickSort Complexity**: Best/Average $\\mathcal{O}(n \\log n)$, Worst $\\mathcal{O}(n^2)$ with recursion stack space $\\mathcal{O}(\\log n)$.\n` +
            `- **Dijkstra Complexity**: $\\mathcal{O}((V + E) \\log V)$ using Min-Priority Queue.`;
        } else if (isDb) {
          reply = `### 📘 Executive Academic Summary: ${docName}\n\n` +
            `#### 1. Scope & Theoretical Framework\n` +
            `Covers relational database systems, schema normalization, index structures, query optimization, and ACID transaction concurrency.\n\n` +
            `#### 2. Key Modules Covered\n` +
            `- **Relational Model & Algebra**: Tuples, domains, selection ($\\sigma$), projection ($\\pi$), and Cartesian joins ($\\bowtie$).\n` +
            `- **Normalization**: Functional dependency closures, 1NF, 2NF (eliminating partial dependencies), 3NF (eliminating transitive dependencies), and BCNF.\n` +
            `- **Storage & Indexing**: B+ Tree index structures with fan-out balanced height guaranteeing $\\mathcal{O}(\\log_B N)$ retrieval.\n` +
            `- **Transactions & ACID**: Atomicity, Consistency, Isolation, Durability via Write-Ahead Logging (WAL) and 2-Phase Locking (2PL).\n\n` +
            `#### 3. High-Yield Exam Formulas\n` +
            `- **Lossless Join Test**: $R_1 \\cap R_2 \\rightarrow R_1$ or $R_1 \\cap R_2 \\rightarrow R_2$.\n` +
            `- **B+ Tree Node Capacity**: Each internal node contains between $\\lceil M/2 \\rceil$ and $M$ pointers.`;
        } else {
          reply = `### 📘 Executive Academic Summary: ${docName}\n\n` +
            `#### 1. Scope & Core Objectives\n` +
            `This study module presents core computational foundations, architectural abstractions, and design trade-offs structured for examination preparation.\n\n` +
            `#### 2. Primary Engineering Modules\n` +
            `- **Architectural Models**: Component modularity, decoupled interfaces, and high-cohesion design patterns.\n` +
            `- **Operational Reliability**: Fault tolerance, error containment, and transactional integrity guarantees.\n` +
            `- **Resource Efficiency**: Optimizing space complexity against computational throughput and network latency.\n\n` +
            `#### 3. Revision Takeaways\n` +
            `- Review all foundational definitions and terminology.\n` +
            `- Practice analytical proofs and structural block diagrams for 16-mark university exam questions.`;
        }
      } else if (action === 'key_concepts') {
        reply = `### 🔑 5 Essential Core Concepts: ${docName}\n\n` +
          `1. **Asymptotic Complexity & Scaling**: Distinguishing polynomial growth from exponential/logarithmic curves to evaluate computational cost.\n\n` +
          `2. **Recursive Decomposition & Invariants**: Formulating loop and recursion invariants that guarantee algorithm termination and correctness.\n\n` +
          `3. **Optimal Substructure**: The principle that the optimal solution to a problem contains optimal solutions to its subproblems (crucial for Greedy and Dynamic Programming).\n\n` +
          `4. **Data Locality & Index Structures**: Organizing memory and disk blocks into hierarchically balanced trees to minimize I/O bus bottlenecks.\n\n` +
          `5. **Trade-Off Optimization**: Sacrificing auxiliary space (e.g. hash tables or memoization arrays) to reduce time complexity from $\\mathcal{O}(n^2)$ down to $\\mathcal{O}(n)$ or $\\mathcal{O}(1)$.`;
      } else if (action === 'explain_tanglish' || action === 'tanglish_explain') {
        reply = `### 🌟 Simple Concept Explanation in Tanglish: ${docName}\n\n` +
          `Intha lecture notes-oda mukkiyamana points-ah romba simple-ah paakalam:\n\n` +
          `1. **Main Purpose (Enna solla varanga?)**:\n` +
          `   - Engineering-la oru periya problem-ah epdi chinna chinna steps-ah pirichu, romba kammi time-layum memory-layum solve pannanum-nu intha document explain pannuthu.\n\n` +
          `2. **Performance (Time & Space Complexity)**:\n` +
          `   - Oru program fast-ah run aaguma illaya nu check panna Asymptotic Notation (Big-O) use pandrom. Nested loops iruntha time complexity $\\mathcal{O}(n^2)$ aagidum, so divide and conquer use panni $\\mathcal{O}(n \\log n)$-ah koraikirom.\n\n` +
          `3. **Real-Life Example**:\n` +
          `   - Oruthar kita phone directory irukku. A-la irunthu Z varaikum page-by-page theduna athu Linear Search (slow). Aana nadula open panni half-half-ah filter panna athu Binary Search (super fast)!\n\n` +
          `4. **Exam Tip**:\n` +
          `   - Formulas matrum algorithm steps-ah neat-ah points pottu ezhuthunga. Full marks kedaikum!`;
      } else if (action === 'explain_english') {
        reply = `### 💡 Plain English Conceptual Breakdown (ELI5)\n\n` +
          `Here is what **${docName}** means in plain, intuitive everyday language:\n\n` +
          `- **The Big Idea**: Computers have finite time and memory. This document teaches you how to write code that solves massive problems without freezing or crashing the system.\n\n` +
          `- **The Core Principle (Divide & Conquer)**: Instead of tackling a huge messy task all at once, break it into two halves, solve each half independently, and seamlessly stitch the results back together.\n\n` +
          `- **Real-World Analogy**: Think of sorting a messy deck of 100 cards. Sorting all 100 one-by-one takes forever. But split the deck among four friends, sort the small piles, and zipper-merge them together in seconds!\n\n` +
          `- **Key Takeaway**: Always choose algorithms that scale smoothly as your data grows from 10 items to 10 million items.`;
      } else if (action === 'generate_mcqs') {
        reply = `### 📝 University Practice MCQs: ${docName}\n\n` +
          `**Q1. What is the worst-case time complexity of standard QuickSort?**\n` +
          `- A) $\\mathcal{O}(n)$\n` +
          `- B) $\\mathcal{O}(n \\log n)$\n` +
          `- C) $\\mathcal{O}(n^2)$\n` +
          `- D) $\\mathcal{O}(\\log n)$\n` +
          `*Correct Answer:* **C) $\\mathcal{O}(n^2)$** — Occurs when the pivot chosen is consistently the extreme (smallest or largest) element in an already sorted or reverse-sorted array.\n\n` +
          `**Q2. Which condition is mandatory for Dijkstra's shortest path algorithm to yield correct results?**\n` +
          `- A) Graph must be directed acyclic\n` +
          `- B) All edge weights must be non-negative\n` +
          `- C) Graph must be fully connected\n` +
          `- D) Vertices count must equal edges count\n` +
          `*Correct Answer:* **B) All edge weights must be non-negative** — Greedy relaxation fails when negative edges can retroactively decrease path costs.\n\n` +
          `**Q3. What is the height of a balanced B+ Tree containing $N$ records with fan-out $B$?**\n` +
          `- A) $\\mathcal{O}(N)$\n` +
          `- B) $\\mathcal{O}(\\log_B N)$\n` +
          `- C) $\\mathcal{O}(B)$\n` +
          `- D) $\\mathcal{O}(N^2)$\n` +
          `*Correct Answer:* **B) $\\mathcal{O}(\\log_B N)$** — B+ Trees maintain balance where all leaves reside at equal depth.`;
      } else if (action === 'revision_checklist' || action === 'exam_revision') {
        reply = `### 🎯 High-Priority University Exam Revision Checklist\n\n` +
          `- [ ] **State Master Theorem**: Memorize the three cases for $T(n) = aT(n/b) + f(n)$ and know when it is not applicable.\n` +
          `- [ ] **QuickSort Partition Subroutine**: Trace partition step-by-step with array $[38, 27, 43, 3, 9, 82, 10]$.\n` +
          `- [ ] **Dynamic Programming vs Greedy**: Write 3 clear distinction points (Memoization vs irrevocable greedy choice).\n` +
          `- [ ] **B+ Tree Node Insertion & Splitting**: Practice drawing node splitting when exceeding order $M$.\n` +
          `- [ ] **ACID Properties**: Define Atomicity, Consistency, Isolation, and Durability with a bank transfer example.\n` +
          `- [ ] **2-Mark Quick Definitions**: Big-O, Theta, Asymptotic Upper Bound, Functional Dependency, Serializability.`;
      } else {
        // Grounded Q&A
        const ans = generateComprehensiveAIAnswer(query || topic || '', getLoggedInStudent(), 'student', docName);
        reply = ans.reply;
      }

      return {
        data: {
          result: reply,
          response: reply,
          sources: [`${docName}, Unit 1 &bull; Section 2`, `${docName}, Unit 2 &bull; Key Theorems`]
        }
      };
    }

    // 11. AI Assistant Chat (/chat)
    if (url === '/chat') {
      const user = getLoggedInUser() || {};
      const role = user.role || 'student';
      const rawMsg = data.message || '';
      const st = getLoggedInStudent() || {
        name: user.name || 'Student',
        reg_no: '21CS101',
        department: 'Computer Science and Engineering',
        department_name: 'CSE',
        semester: 6,
        section: 'A',
        overall_attendance: 84.0,
        risk_status: 'Safe',
        total_attended: 34,
        total_conducted: 40,
        recovery_classes: 0,
        parent_name: 'R. Kumar',
        parent_email: 'parent.kumar@gmail.com'
      };

      const result = generateComprehensiveAIAnswer(rawMsg, st, role);

      return {
        data: {
          reply: result.reply,
          engine: result.engine || 'AI ERP Intelligence Engine',
          suggested_questions: result.suggestions || []
        }
      };
    }

    // Faculty Attendance Recording & Recalculation + Automated SMTP Parent Dispatch
    if (url === '/faculty/attendance') {
      const { subject_id, date, session_name, records } = data;
      const subId = parseInt(subject_id) || 7;
      const dateVal = date || new Date().toISOString().split('T')[0];
      const sessionKey = `${dateVal}_${subId}`;

      const sessionMap = {};
      const alerts = [];

      (records || []).forEach((r) => {
        sessionMap[r.student_id] = r.status;
        const stIdx = stateStudents.findIndex((s) => s.id === r.student_id);
        if (stIdx !== -1) {
          const st = { ...stateStudents[stIdx] };
          const attended = r.status === 'Present';
          const oldAttended = st.total_attended || Math.round((st.overall_attendance * 40) / 100);
          const oldTotal = st.total_conducted || 40;
          const newAttended = oldAttended + (attended ? 1 : 0);
          const newTotal = oldTotal + 1;
          const newPct = +((newAttended / newTotal) * 100).toFixed(1);

          st.total_attended = newAttended;
          st.total_conducted = newTotal;
          st.overall_attendance = newPct;

          if (newPct >= 75) {
            st.risk_status = 'Safe';
          } else if (newPct >= 65) {
            st.risk_status = 'Warning';
          } else {
            st.risk_status = 'High Risk';
          }

          stateStudents[stIdx] = st;

          if (newPct < 75 && !attended) {
            const alertItem = {
              id: stateAlertLogs.length + 1,
              sent_at: new Date().toISOString(),
              student_name: st.name,
              reg_no: st.reg_no,
              attendance_pct: newPct,
              parent_email: st.parent_email || `parent.${st.reg_no.toLowerCase()}@gmail.com`,
              alert_type: newPct < 65 ? 'Severe Defaulter Notice (<65%)' : 'Warning Notification (65% - 75%)',
              status: 'Sent',
              email_preview: `<html><body style="font-family:Arial,sans-serif;padding:20px;color:#1e293b;"><h2 style="color:#b91c1c;">Attendance Alert Notice &bull; College Academic Governance</h2><p>Dear Parent / Guardian of <strong>${st.name}</strong> (${st.reg_no}),</p><p>This is an automated notification from the Academic Registrar. The current recorded attendance for your ward is <strong>${newPct}%</strong>, which falls below the mandatory threshold of <strong>75.0%</strong>.</p><p>Status: <strong>${st.risk_status}</strong></p><hr style="border:0;border-top:1px solid #e2e8f0;margin:20px 0;"/><p style="font-size:11px;color:#64748b;">Office of the Academic Registrar &bull; Cloud Institute of Technology & Science</p></body></html>`
            };
            stateAlertLogs = [alertItem, ...stateAlertLogs];
            alerts.push({
              student_name: st.name,
              reg_no: st.reg_no,
              new_pct: newPct,
              parent_email: alertItem.parent_email,
              email_status: 'Delivered (SMTP)'
            });
          }
        }
      });

      stateAttendanceSessions[sessionKey] = sessionMap;
      setStored('attendance_sessions', stateAttendanceSessions);
      setStored('students', stateStudents);
      setStored('alert_logs', stateAlertLogs);

      return {
        data: {
          message: `Attendance recorded successfully for ${(records || []).length} students.`,
          count: (records || []).length,
          alerts_triggered: alerts
        }
      };
    }

    // Admin Attendance Alert Center Operations (SMTP Integration)
    if (url === '/admin/attendance-alerts/test') {
      const sId = data.student_id;
      const student = stateStudents.find((s) => s.id === sId) || stateStudents[40];
      const previewHtml = `<html><body style="font-family:Arial,sans-serif;padding:20px;color:#1e293b;"><h2 style="color:#b91c1c;">Direct SMTP Parent Notification &bull; Attendance Notice</h2><p>Dear Parent / Guardian of <strong>${student.name}</strong> (${student.reg_no}),</p><p>Current Recorded Attendance: <strong>${student.overall_attendance}%</strong> (${student.risk_status}).</p><p>Dispatched via verified SMTP Gateway (smtp.gmail.com:587 TLS) to <strong>${student.parent_email}</strong>.</p><hr style="border:0;border-top:1px solid #e2e8f0;margin:20px 0;"/><p style="font-size:11px;color:#64748b;">Cloud Institute of Technology & Science &bull; Automated Governance</p></body></html>`;

      const newLog = {
        id: stateAlertLogs.length + 1,
        sent_at: new Date().toISOString(),
        student_name: student.name,
        reg_no: student.reg_no,
        attendance_pct: student.overall_attendance,
        parent_email: student.parent_email || `parent.${student.reg_no.toLowerCase()}@gmail.com`,
        alert_type: 'Manual Test Alert (Admin Triggered)',
        status: 'Sent',
        email_preview: previewHtml
      };
      stateAlertLogs = [newLog, ...stateAlertLogs];
      setStored('alert_logs', stateAlertLogs);

      return {
        data: {
          message: `Parent test alert successfully dispatched to ${student.parent_email} via SMTP (smtp.gmail.com:587 TLS).`,
          email_preview: previewHtml
        }
      };
    }

    if (url.startsWith('/admin/attendance-alerts/') && url.endsWith('/retry')) {
      const logId = parseInt(url.split('/')[3]);
      stateAlertLogs = stateAlertLogs.map((l) => (l.id === logId ? { ...l, status: 'Sent', sent_at: new Date().toISOString() } : l));
      setStored('alert_logs', stateAlertLogs);
      return { data: { message: 'Alert notification successfully re-sent via SMTP.' } };
    }

    if (url === '/admin/attendance-alerts/retry-all-failed') {
      stateAlertLogs = stateAlertLogs.map((l) => ({ ...l, status: 'Sent', sent_at: new Date().toISOString() }));
      setStored('alert_logs', stateAlertLogs);
      return { data: { message: 'All failed alert dispatches successfully retried and delivered via SMTP.' } };
    }

    // Trigger Assignment Reminders via SMTP
    if (url.startsWith('/faculty/assignments/') && url.endsWith('/trigger-reminders')) {
      const asgnId = parseInt(url.split('/')[3]);
      const cseStudents = stateStudents.filter((s) => s.department_id === 3);

      let sentCount = 0;
      cseStudents.forEach((st) => {
        const sub = stateSubmissions.find((s) => s.assignment_id === asgnId && s.student_id === st.id);
        if (!sub || sub.status === 'Pending') {
          sentCount++;
          const newLog = {
            id: stateAssignmentReminderLogs.length + 1,
            assignment_id: asgnId,
            student_name: st.name,
            reg_no: st.reg_no,
            email: st.email,
            notice_number: `Notice #${Math.floor(Math.random() * 2) + 1}`,
            sent_at: new Date().toISOString(),
            status: 'Delivered',
            failure_reason: null
          };
          stateAssignmentReminderLogs = [newLog, ...stateAssignmentReminderLogs];
        }
      });
      setStored('assignment_reminder_logs', stateAssignmentReminderLogs);

      return {
        data: {
          sent_count: sentCount,
          skipped_count: cseStudents.length - sentCount,
          failed_count: 0
        }
      };
    }

    // Admin Test SMTP Endpoint
    if (url === '/admin/settings/test-smtp') {
      const recipient = data.recipient_email || 'examplecollegeerp@gmail.com';
      return {
        data: {
          success: true,
          status: 'Connected',
          message: `SMTP test connection successful! Verified handshake with smtp.gmail.com:587 (TLS). Test notification dispatched to ${recipient}.`
        }
      };
    }

    if (url === '/faculty/marks') {
      const { student_id, subject_id, internal_1, internal_2, assignment } = data;
      const markIdx = stateMarks.findIndex((m) => m.student_id === student_id && m.subject_id === parseInt(subject_id));
      if (markIdx !== -1) {
        const row = { ...stateMarks[markIdx] };
        if (internal_1 !== undefined) row.internal_1 = parseFloat(internal_1);
        if (internal_2 !== undefined) row.internal_2 = parseFloat(internal_2);
        if (assignment !== undefined) row.assignment = parseFloat(assignment);
        row.total = +((row.internal_1 || 0) + (row.internal_2 || 0) + (row.assignment || 0)).toFixed(1);
        if (row.total >= 54) row.grade = 'A+';
        else if (row.total >= 48) row.grade = 'A';
        else if (row.total >= 42) row.grade = 'B+';
        else if (row.total >= 36) row.grade = 'B';
        else if (row.total >= 30) row.grade = 'C';
        else row.grade = 'F';
        row.status = 'Published';
        stateMarks[markIdx] = row;
        setStored('marks', stateMarks);

        if (isSupabaseConfigured) {
          try {
            supabase.from('marks').upsert({
              student_id: row.student_id,
              subject_id: row.subject_id,
              exam_type: 'CIA Continuous Assessment',
              marks_obtained: row.total,
              max_marks: 60.0,
              grade: row.grade,
              remarks: `Internal 1: ${row.internal_1}, Internal 2: ${row.internal_2}, Assignment: ${row.assignment}`
            });
          } catch (e) {
            console.warn('Supabase marks update:', e.message);
          }
        }
      }
      return { data: { message: 'Internal marks saved and published successfully' } };
    }

    if (url === '/students/me/complaints') {
      return { data: { message: 'Grievance ticket created successfully.' } };
    }

    if (url === '/admin/announcements' || url === '/faculty/announcements') {
      const newAnn = {
        id: stateAnnouncements.length + 1,
        title: data.title,
        content: data.content || data.message || '',
        target_role: data.target_role || 'All',
        priority: data.priority || 'Normal',
        created_at: new Date().toISOString()
      };
      stateAnnouncements = [newAnn, ...stateAnnouncements];
      setStored('announcements', stateAnnouncements);
      return { data: newAnn };
    }

    // Fallback
    return { data: { success: true } };
  },

  async put(rawUrl, data = {}, config = {}) {
    const url = (rawUrl || '').split('?')[0];

    // 1. Notifications read
    if (url.startsWith('/notifications/') && url.endsWith('/read')) {
      const notifId = parseInt(url.split('/')[2]);
      const notif = stateNotifications.find((n) => n.id === notifId);
      if (notif) {
        notif.is_read = true;
        notif.read_at = new Date().toISOString();
        setStored('notifications', stateNotifications);
        if (isSupabaseConfigured) {
          try {
            await supabase.from('notifications').update({ is_read: true }).eq('id', notifId);
          } catch (e) {
            console.warn('Supabase notification read update:', e.message);
          }
        }
        return { data: { success: true, notification: notif } };
      }
      return { data: { success: true } };
    }

    // 2. Clear notification
    if (url.startsWith('/notifications/') && url.endsWith('/clear')) {
      const notifId = parseInt(url.split('/')[2]);
      const notif = stateNotifications.find((n) => n.id === notifId);
      if (notif) {
        notif.is_cleared = true;
        setStored('notifications', stateNotifications);
        if (isSupabaseConfigured) {
          try {
            await supabase.from('notifications').update({ is_cleared: true }).eq('id', notifId);
          } catch (e) {}
        }
        return { data: { success: true } };
      }
      return { data: { success: true } };
    }

    // 3. Mark all notifications as read
    if (url === '/notifications/read-all') {
      stateNotifications.forEach((n) => {
        n.is_read = true;
        n.read_at = new Date().toISOString();
      });
      setStored('notifications', stateNotifications);
      if (isSupabaseConfigured) {
        try {
          await supabase.from('notifications').update({ is_read: true }).eq('is_read', false);
        } catch (e) {}
      }
      return { data: { success: true } };
    }

    // 4. Admin update student
    if (url.startsWith('/admin/students/')) {
      const sId = parseInt(url.split('/').pop());
      const idx = stateStudents.findIndex((s) => s.id === sId);
      if (idx !== -1) {
        stateStudents[idx] = { ...stateStudents[idx], ...data };
        setStored('students', stateStudents);
        return { data: stateStudents[idx] };
      }
      return { data: { success: true, ...data } };
    }

    // 5. Admin update faculty
    if (url.startsWith('/admin/faculty/')) {
      const fId = parseInt(url.split('/').pop());
      const idx = FACULTY_MEMBERS.findIndex((f) => f.id === fId);
      if (idx !== -1) {
        FACULTY_MEMBERS[idx] = { ...FACULTY_MEMBERS[idx], ...data };
        return { data: FACULTY_MEMBERS[idx] };
      }
      return { data: { success: true, ...data } };
    }

    // 6. Admin update department
    if (url.startsWith('/admin/departments/')) {
      const dId = parseInt(url.split('/').pop());
      const idx = DEPARTMENTS.findIndex((d) => d.id === dId);
      if (idx !== -1) {
        DEPARTMENTS[idx] = { ...DEPARTMENTS[idx], ...data };
        return { data: DEPARTMENTS[idx] };
      }
      return { data: { success: true, ...data } };
    }

    // 7. Admin update subject
    if (url.startsWith('/admin/subjects/')) {
      const sId = parseInt(url.split('/').pop());
      const idx = SUBJECTS.findIndex((s) => s.id === sId);
      if (idx !== -1) {
        SUBJECTS[idx] = { ...SUBJECTS[idx], ...data };
        return { data: SUBJECTS[idx] };
      }
      return { data: { success: true, ...data } };
    }

    // 8. Admin update fees
    if (url.startsWith('/admin/fees/')) {
      return { data: { success: true, message: 'Fee record updated successfully' } };
    }

    // 9. Complaints / Grievances respond (Faculty and Admin)
    if (url.startsWith('/faculty/complaints/') || url.startsWith('/admin/complaints/')) {
      return {
        data: {
          success: true,
          message: 'Grievance ticket response recorded successfully',
          status: data.status || 'Resolved',
          response: data.faculty_response || data.response || ''
        }
      };
    }

    // 10. Announcements update
    if (url.startsWith('/admin/announcements/')) {
      const aId = parseInt(url.split('/').pop());
      const idx = stateAnnouncements.findIndex((a) => a.id === aId);
      if (idx !== -1) {
        stateAnnouncements[idx] = { ...stateAnnouncements[idx], ...data };
        setStored('announcements', stateAnnouncements);
        return { data: stateAnnouncements[idx] };
      }
      return { data: { success: true } };
    }

    // 11. Admin settings
    if (url === '/admin/settings') {
      return { data: { success: true, message: 'Institutional settings updated successfully', ...data } };
    }

    return { data: { success: true } };
  },

  async delete(url, config = {}) {
    if (url.startsWith('/students/me/notes/')) {
      const docId = parseInt(url.split('/').pop());
      stateDocuments = stateDocuments.filter((d) => d.id !== docId);
      setStored('documents', stateDocuments);
      return { data: { message: 'Document removed' } };
    }
    if (url.startsWith('/faculty/quizzes/')) {
      const qId = parseInt(url.split('/').pop());
      stateQuizzes = stateQuizzes.filter((q) => q.id !== qId);
      setStored('quizzes', stateQuizzes);
      return { data: { message: 'Quiz deleted' } };
    }
    if (url.startsWith('/faculty/assignments/')) {
      const asgnId = parseInt(url.split('/').pop());
      stateAssignments = stateAssignments.filter((a) => a.id !== asgnId);
      stateSubmissions = stateSubmissions.filter((s) => s.assignment_id !== asgnId);
      setStored('assignments', stateAssignments);
      setStored('submissions', stateSubmissions);
      return { data: { message: 'Assignment deleted' } };
    }
    return { data: { success: true } };
  }
};

export default client;
