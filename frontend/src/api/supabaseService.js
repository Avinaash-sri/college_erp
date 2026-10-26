import { supabase, isSupabaseConfigured } from '../lib/supabase';
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

/**
 * Grade points scale (Anna University / UGC standard)
 */
export const GRADE_POINTS_SCALE = {
  'O': 10.0,
  'A+': 9.0,
  'A': 8.0,
  'B+': 7.0,
  'B': 6.0,
  'C': 5.0,
  'F': 0.0,
  'U': 0.0
};

export function getGradePoint(grade, marks) {
  if (grade && GRADE_POINTS_SCALE[String(grade).toUpperCase()] !== undefined) {
    return GRADE_POINTS_SCALE[String(grade).toUpperCase()];
  }
  const m = parseFloat(marks) || 0;
  if (m >= 91) return 10.0;
  if (m >= 81) return 9.0;
  if (m >= 71) return 8.0;
  if (m >= 61) return 7.0;
  if (m >= 50) return 6.0;
  if (m >= 40) return 5.0;
  return 0.0;
}

export function computeGradeFromScore(score) {
  const m = parseFloat(score) || 0;
  if (m >= 91) return { grade: 'O', grade_point: 10.0 };
  if (m >= 81) return { grade: 'A+', grade_point: 9.0 };
  if (m >= 71) return { grade: 'A', grade_point: 8.0 };
  if (m >= 61) return { grade: 'B+', grade_point: 7.0 };
  if (m >= 50) return { grade: 'B', grade_point: 6.0 };
  if (m >= 40) return { grade: 'C', grade_point: 5.0 };
  return { grade: 'F', grade_point: 0.0 };
}

/**
 * Recalculate CGPA for a student given their marks and subjects
 */
export function calculateStudentCGPAFromMarks(studentId, marksList, subjectsList) {
  const stMarks = (marksList || []).filter((m) => m.student_id === studentId);
  if (!stMarks || stMarks.length === 0) return 0.0;

  let totalWeighted = 0;
  let totalCredits = 0;

  stMarks.forEach((m) => {
    const sub = (subjectsList || []).find((s) => s.id === m.subject_id);
    const credits = m.credits || sub?.credits || 3;
    let score = m.marks_obtained !== undefined && m.marks_obtained !== null
      ? parseFloat(m.marks_obtained)
      : (m.total !== undefined && m.total !== null ? parseFloat(m.total) : null);

    let gp = m.grade_point;
    if (gp === undefined || gp === null) {
      gp = getGradePoint(m.grade, score);
    }

    if (gp !== undefined && gp !== null && !isNaN(gp)) {
      totalWeighted += gp * credits;
      totalCredits += credits;
    }
  });

  return totalCredits > 0 ? Number((totalWeighted / totalCredits).toFixed(2)) : 0.0;
}

/**
 * Fetch all attendance records from Supabase with pagination to bypass PostgREST 1000 row cap
 */
export async function fetchAllAttendanceFromSupabase() {
  if (!isSupabaseConfigured) return [];
  let allRecords = [];
  let page = 0;
  const pageSize = 1000;
  let hasMore = true;

  while (hasMore) {
    const from = page * pageSize;
    const to = from + pageSize - 1;
    try {
      const { data, error } = await supabase
        .from('attendance')
        .select('*')
        .order('id', { ascending: false })
        .range(from, to);

      if (error || !data || data.length === 0) {
        break;
      }
      allRecords = allRecords.concat(data);
      if (data.length < pageSize) {
        hasMore = false;
      } else {
        page++;
      }
      if (page >= 10) break; // Safety limit
    } catch (e) {
      console.warn('Pagination notice fetching attendance from Supabase:', e);
      break;
    }
  }
  return allRecords;
}

/**
 * Fetch all authoritative application tables from Supabase Cloud
 */
export async function fetchAuthoritativeCloudState() {
  if (!isSupabaseConfigured) {
    return null;
  }

  try {
    const [
      usersRes,
      studentsRes,
      facultyRes,
      departmentsRes,
      subjectsRes,
      attendanceRes,
      marksRes,
      assignmentsRes,
      submissionsRes,
      quizzesRes,
      questionsRes,
      attemptsRes,
      quizAssignmentsRes,
      announcementsRes,
      notificationsRes,
      complaintsRes,
      leaveRes,
      feesRes,
      calendarRes,
      timetableRes,
      settingsRes,
      parentContactsRes,
      alertsRes
    ] = await Promise.allSettled([
      supabase.from('users').select('*'),
      supabase.from('students').select('*').order('id', { ascending: true }),
      supabase.from('faculty').select('*').order('id', { ascending: true }),
      supabase.from('departments').select('*').order('id', { ascending: true }),
      supabase.from('subjects').select('*').order('id', { ascending: true }),
      fetchAllAttendanceFromSupabase(),
      supabase.from('marks').select('*').order('id', { ascending: true }),
      supabase.from('assignments').select('*').order('created_at', { ascending: false }),
      supabase.from('assignment_submissions').select('*').order('submitted_at', { ascending: false }),
      supabase.from('quizzes').select('*').order('created_at', { ascending: false }),
      supabase.from('quiz_questions').select('*').order('order', { ascending: true }),
      supabase.from('quiz_attempts').select('*').order('submitted_at', { ascending: false }),
      supabase.from('quiz_assignments').select('*'),
      supabase.from('announcements').select('*').order('created_at', { ascending: false }),
      supabase.from('notifications').select('*').order('created_at', { ascending: false }),
      supabase.from('complaints').select('*').order('created_at', { ascending: false }),
      supabase.from('leave_requests').select('*').order('created_at', { ascending: false }),
      supabase.from('fees').select('*').order('id', { ascending: true }),
      supabase.from('calendar_events').select('*').order('date', { ascending: true }),
      supabase.from('timetable').select('*').order('id', { ascending: true }),
      supabase.from('system_settings').select('*'),
      supabase.from('parent_contacts').select('*'),
      supabase.from('attendance_alerts').select('*').order('sent_at', { ascending: false })
    ]);

    const departments = departmentsRes.status === 'fulfilled' && departmentsRes.value.data?.length
      ? departmentsRes.value.data
      : DEPARTMENTS;

    const subjects = subjectsRes.status === 'fulfilled' && subjectsRes.value.data?.length
      ? subjectsRes.value.data
      : SUBJECTS;

    const rawStudents = studentsRes.status === 'fulfilled' && Array.isArray(studentsRes.value.data)
      ? studentsRes.value.data
      : (studentsRes.status === 'fulfilled' && studentsRes.value.data ? [studentsRes.value.data] : STUDENTS);

    const rawUsers = usersRes.status === 'fulfilled' && Array.isArray(usersRes.value.data)
      ? usersRes.value.data
      : (usersRes.status === 'fulfilled' && usersRes.value.data ? [usersRes.value.data] : USERS);

    const rawFaculty = facultyRes.status === 'fulfilled' && Array.isArray(facultyRes.value.data)
      ? facultyRes.value.data
      : (facultyRes.status === 'fulfilled' && facultyRes.value.data ? [facultyRes.value.data] : FACULTY_MEMBERS);

    const rawAttendance = attendanceRes.status === 'fulfilled'
      ? (Array.isArray(attendanceRes.value) ? attendanceRes.value : (Array.isArray(attendanceRes.value?.data) ? attendanceRes.value.data : []))
      : [];

    const rawMarks = marksRes.status === 'fulfilled' && marksRes.value.data
      ? marksRes.value.data
      : MARKS;

    const rawParentContacts = parentContactsRes.status === 'fulfilled' && parentContactsRes.value.data
      ? parentContactsRes.value.data
      : [];

    // Build enriched students with dynamic attendance & CGPA calculations from real DB records
    const enrichedStudents = rawStudents.map((st) => {
      const dept = departments.find((d) => d.id === st.department_id) || { name: 'Computer Science and Engineering', code: 'CSE' };
      
      // Attendance records for this student
      const stAttRecords = rawAttendance.filter((a) => a.student_id === st.id);
      let totalConducted = stAttRecords.length;
      let totalAttended = stAttRecords.filter((a) => a.status === 'Present' || a.status === 'Late').length;

      // Real attendance percentage from authoritative attendance records
      let overallAttendance = 0.0;
      if (totalConducted > 0) {
        overallAttendance = Number(((totalAttended / totalConducted) * 100).toFixed(1));
      } else if (st.overall_attendance !== undefined && st.overall_attendance !== null) {
        overallAttendance = parseFloat(st.overall_attendance);
      }

      // If student has 0 conducted classes, evaluate to 0.0% (High Risk) so they appear in Attendance Alerts
      const riskStatus = overallAttendance >= 75.0 ? 'Safe' : (overallAttendance >= 65.0 ? 'Warning' : 'High Risk');
      const recoveryClasses = (overallAttendance < 75.0)
        ? (totalConducted > 0 ? Math.max(1, Math.ceil(3 * totalConducted - 4 * totalAttended)) : 4)
        : 0;

      // Resolve parent details: prioritize authoritative student table parent_email/parent_name, then parent_contacts, then reg_no fallback
      const pContact = rawParentContacts.find((c) => c.student_id === st.id);
      const parentName = (st.parent_name && String(st.parent_name).trim()) || pContact?.name || 'Parent / Guardian';
      const parentEmail = (st.parent_email && String(st.parent_email).trim()) || pContact?.email || (st.reg_no ? `parent.${st.reg_no.toLowerCase()}@gmail.com` : 'parent@college.edu');
      const studentEmail = (st.email && String(st.email).trim()) || (st.reg_no ? `${st.reg_no.toLowerCase()}@college.edu` : 'student@college.edu');

      // Calculate CGPA from marks
      const cgpa = calculateStudentCGPAFromMarks(st.id, rawMarks, subjects) || parseFloat(st.cgpa) || 8.0;

      return {
        ...st,
        email: studentEmail,
        parent_name: parentName,
        parent_email: parentEmail,
        department: dept.name,
        department_name: dept.name,
        department_code: dept.code,
        overall_attendance: overallAttendance,
        total_conducted: totalConducted,
        total_attended: totalAttended,
        risk_status: riskStatus,
        recovery_classes: recoveryClasses,
        cgpa,
        total_credits: 16.0
      };
    });

    // Build enriched faculty
    const enrichedFaculty = rawFaculty.map((fac) => {
      const dept = departments.find((d) => d.id === fac.department_id) || { name: 'Computer Science and Engineering' };
      const handled = subjects.filter((s) => s.faculty_id === fac.id).length;
      return {
        ...fac,
        department_name: dept.name,
        subjects_handled: handled || fac.subjects_handled || 2,
        is_active: fac.is_active !== false
      };
    });

    // Enriched assignments
    const rawAssignments = assignmentsRes.status === 'fulfilled' && assignmentsRes.value.data?.length
      ? assignmentsRes.value.data
      : ASSIGNMENTS;

    const enrichedAssignments = rawAssignments.map((asgn) => {
      const sub = subjects.find((s) => s.id === asgn.subject_id);
      const fac = enrichedFaculty.find((f) => f.id === asgn.faculty_id);
      return {
        ...asgn,
        subject_name: sub?.name || asgn.subject_name || 'Academic Subject',
        subject_code: sub?.code || asgn.subject_code || 'SUB101',
        faculty_name: fac?.name || asgn.faculty_name || 'Faculty Member'
      };
    });

    // Enrich marks with student name, reg_no, department, and subject metadata
    const enrichedMarks = (rawMarks || []).map((m) => {
      const st = rawStudents.find((s) => s.id === m.student_id);
      const sub = subjects.find((s) => s.id === m.subject_id);
      return {
        ...m,
        name: st?.name || m.name || (st?.reg_no ? `Student ${st.reg_no}` : `Student #${m.student_id}`),
        reg_no: st?.reg_no || m.reg_no || '',
        department_id: st?.department_id || sub?.department_id || 3,
        department: st?.department || st?.department_name || '',
        subject_code: sub?.code || m.subject_code || '',
        subject_name: sub?.name || m.subject_name || '',
        credits: sub?.credits || m.credits || 4
      };
    });

    // Enrich leave requests with student profile details
    const enrichedLeaveRequests = (leaveRes.status === 'fulfilled' && Array.isArray(leaveRes.value.data))
      ? leaveRes.value.data.map((l) => {
          const st = rawStudents.find((s) => s.id === l.student_id);
          const dept = departments.find((d) => d.id === st?.department_id);
          return {
            ...l,
            student_name: st?.name || l.student_name || 'Student',
            reg_no: st?.reg_no || l.reg_no || '',
            department_name: dept?.name || st?.department_name || 'Computer Science and Engineering',
            from_date: l.from_date || l.start_date || '',
            to_date: l.to_date || l.end_date || '',
            created_at: l.created_at || new Date().toISOString()
          };
        })
      : [];

    // Enrich complaints with student profile details
    const enrichedComplaints = (complaintsRes.status === 'fulfilled' && Array.isArray(complaintsRes.value.data))
      ? complaintsRes.value.data.map((c) => {
          const st = rawStudents.find((s) => s.id === c.student_id);
          const dept = departments.find((d) => d.id === st?.department_id);
          return {
            ...c,
            student_name: st?.name || c.student_name || 'Student',
            student_reg_no: st?.reg_no || c.student_reg_no || '',
            department: dept?.name || st?.department_name || 'Computer Science and Engineering',
            created_at: c.created_at || new Date().toISOString()
          };
        })
      : [];

    // Enrich fees with student profile details and computed pending amounts
    const enrichedFees = (feesRes.status === 'fulfilled' && Array.isArray(feesRes.value.data))
      ? feesRes.value.data.map((f) => {
          const st = rawStudents.find((s) => s.id === f.student_id);
          const totalAmt = parseFloat(f.total_amount) || 0;
          const paidAmt = parseFloat(f.paid_amount) || 0;
          const pendingAmt = Math.max(0, totalAmt - paidAmt);
          return {
            ...f,
            student_name: st?.name || f.student_name || (st?.reg_no ? `Student ${st.reg_no}` : `Student #${f.student_id}`),
            name: st?.name || f.name || '',
            reg_no: st?.reg_no || f.reg_no || '',
            student_reg_no: st?.reg_no || f.reg_no || '',
            department: st?.department || st?.department_name || '',
            total_amount: totalAmt,
            paid_amount: paidAmt,
            pending_amount: pendingAmt,
            status: f.status || (pendingAmt === 0 ? 'Paid' : (paidAmt > 0 ? 'Partially Paid' : 'Pending'))
          };
        })
      : [];

    const cloudAlertLogs = alertsRes.status === 'fulfilled' && alertsRes.value.data
      ? alertsRes.value.data
      : [];

    const rawQuizzes = (quizzesRes.status === 'fulfilled' && Array.isArray(quizzesRes.value.data) && quizzesRes.value.data.length > 0)
      ? quizzesRes.value.data
      : QUIZZES;

    const rawQuizQuestions = (questionsRes.status === 'fulfilled' && Array.isArray(questionsRes.value.data))
      ? questionsRes.value.data
      : [];

    const rawQuizAssignments = (quizAssignmentsRes.status === 'fulfilled' && Array.isArray(quizAssignmentsRes.value.data))
      ? quizAssignmentsRes.value.data
      : [];

    const rawQuizAttempts = (attemptsRes.status === 'fulfilled' && Array.isArray(attemptsRes.value.data))
      ? attemptsRes.value.data
      : [];

    // Enrich quizzes with their nested questions, excluded students, and subject/faculty metadata
    const enrichedQuizzes = rawQuizzes.map((q) => {
      const sub = subjects.find((s) => s.id === q.subject_id);
      const fac = enrichedFaculty.find((f) => f.id === q.faculty_id);

      const matchedQuestions = rawQuizQuestions
        .filter((qst) => qst.quiz_id === q.id)
        .sort((a, b) => (a.order || 0) - (b.order || 0))
        .map((qst) => {
          let parsedOptions = [];
          if (typeof qst.options === 'string') {
            try {
              parsedOptions = JSON.parse(qst.options);
            } catch (e) {
              parsedOptions = [];
            }
          } else if (Array.isArray(qst.options)) {
            parsedOptions = qst.options;
          }

          return {
            ...qst,
            marks: parseFloat(qst.marks) || 2.5,
            options: parsedOptions
          };
        });

      const excludedIds = rawQuizAssignments
        .filter((asgn) => asgn.quiz_id === q.id && asgn.is_excluded)
        .map((asgn) => asgn.student_id);

      const finalQuestions = matchedQuestions.length > 0 ? matchedQuestions : (q.questions || []);
      const totalMarks = (finalQuestions && finalQuestions.length > 0)
        ? finalQuestions.reduce((acc, qst) => acc + (parseFloat(qst.marks) || 0), 0)
        : (parseFloat(q.total_marks) || 10.0);

      return {
        ...q,
        subject_name: sub?.name || q.subject_name || 'Academic Subject',
        subject_code: sub?.code || q.subject_code || 'SUB101',
        faculty_name: fac?.name || q.faculty_name || 'Faculty Member',
        total_marks: totalMarks,
        duration_minutes: parseInt(q.duration_minutes) || 30,
        results_published: Boolean(q.results_published),
        status: q.status || 'published',
        questions: finalQuestions,
        excluded_student_ids: excludedIds.length > 0 ? excludedIds : (q.excluded_student_ids || [])
      };
    });

    const enrichedAttempts = rawQuizAttempts.map((att) => ({
      ...att,
      score: parseFloat(att.score) || 0.0,
      total_marks: parseFloat(att.total_marks) || 10.0,
      status: att.status ? (att.status.charAt(0).toUpperCase() + att.status.slice(1).toLowerCase()) : 'Submitted'
    }));

    return {
      users: rawUsers,
      students: enrichedStudents,
      faculty: enrichedFaculty,
      departments,
      subjects,
      attendance: rawAttendance,
      marks: enrichedMarks,
      assignments: enrichedAssignments,
      submissions: submissionsRes.status === 'fulfilled' ? (submissionsRes.value.data || []) : [],
      quizzes: enrichedQuizzes,
      quiz_questions: rawQuizQuestions,
      quiz_attempts: enrichedAttempts,
      announcements: announcementsRes.status === 'fulfilled' && announcementsRes.value.data?.length ? announcementsRes.value.data : ANNOUNCEMENTS,
      notifications: notificationsRes.status === 'fulfilled' && notificationsRes.value.data?.length ? notificationsRes.value.data : NOTIFICATIONS,
      complaints: enrichedComplaints,
      leave_requests: enrichedLeaveRequests,
      fees: enrichedFees,
      calendar_events: calendarRes.status === 'fulfilled' && calendarRes.value.data?.length ? calendarRes.value.data : [],
      timetable: timetableRes.status === 'fulfilled' && timetableRes.value.data?.length ? timetableRes.value.data : [],
      settings: settingsRes.status === 'fulfilled' && settingsRes.value.data?.length ? settingsRes.value.data[0] : null,
      parent_contacts: rawParentContacts,
      attendance_alerts: cloudAlertLogs
    };
  } catch (error) {
    console.warn('Authoritative Supabase sync encountered an exception:', error);
    return null;
  }
}

/**
 * -----------------------------------------------------------------------------
 * MUTATION OPERATIONS DIRECTLY PERSISTING TO SUPABASE
 * -----------------------------------------------------------------------------
 */

export async function createStudentInSupabase(studentData) {
  if (!isSupabaseConfigured) return null;

  // 1. Normalize identifiers
  const cleanRegNo = String(studentData.reg_no || '').trim().toUpperCase();
  const cleanEmail = String(studentData.email || '').trim().toLowerCase();

  if (!cleanRegNo) {
    throw new Error('Registration number is required and cannot be empty.');
  }
  if (!cleanEmail) {
    throw new Error('Email address is required and cannot be empty.');
  }

  // 2. Pre-check in authoritative Supabase database for duplicate registration number
  const { data: existingStudent } = await supabase
    .from('students')
    .select('id, reg_no')
    .ilike('reg_no', cleanRegNo)
    .maybeSingle();

  if (existingStudent) {
    throw new Error('This registration number is already registered. Please log in or contact the administrator.');
  }

  // 3. Pre-check for duplicate user email
  const { data: existingUser } = await supabase
    .from('users')
    .select('id, email')
    .ilike('email', cleanEmail)
    .maybeSingle();

  if (existingUser) {
    throw new Error('An account with this email address already exists.');
  }

  // 4. Create user account in users table (atomic insert, no upsert)
  let createdUserId = null;
  const userPayload = {
    email: cleanEmail,
    hashed_password: studentData.password || '$2b$12$K1G29Kx2Gz6rO0k4bM6hOuQ7T9uJz8sV0iU5w3bN2xM9lO1pQ3rSe',
    role: 'student',
    is_active: true
  };

  const { data: userData, error: userError } = await supabase
    .from('users')
    .insert([userPayload])
    .select()
    .single();

  if (userError) {
    if (userError.code === '23505' || userError.message?.includes('users_email_key')) {
      throw new Error('An account with this email address already exists.');
    }
    throw userError;
  }
  createdUserId = userData.id;

  // 5. Create student profile in students table (atomic insert, no upsert)
  const studentPayload = {
    user_id: createdUserId,
    reg_no: cleanRegNo,
    name: studentData.name ? studentData.name.trim() : 'Student',
    email: cleanEmail,
    phone: studentData.phone ? studentData.phone.trim() : '9840111222',
    department_id: parseInt(studentData.department_id) || 3,
    semester: parseInt(studentData.semester) || 1,
    section: (studentData.section || 'A').trim().toUpperCase(),
    parent_name: studentData.parent_name ? studentData.parent_name.trim() : 'Parent / Guardian',
    parent_email: studentData.parent_email ? studentData.parent_email.trim().toLowerCase() : `parent.${cleanRegNo.toLowerCase()}@gmail.com`,
    address: studentData.address ? studentData.address.trim() : 'Chennai, Tamil Nadu'
  };

  const { data: stData, error: stError } = await supabase
    .from('students')
    .insert([studentPayload])
    .select()
    .single();

  if (stError) {
    // ATOMIC ROLLBACK: clean up the newly created user record so no orphaned user is left
    if (createdUserId) {
      try {
        await supabase.from('users').delete().eq('id', createdUserId);
      } catch (cleanupErr) {
        console.warn('Rollback user cleanup error:', cleanupErr);
      }
    }
    if (stError.code === '23505' || stError.message?.includes('reg_no')) {
      throw new Error('This registration number is already registered. Please log in or contact the administrator.');
    }
    throw stError;
  }

  // 3. Create parent contact
  try {
    await supabase.from('parent_contacts').insert([{
      student_id: stData.id,
      name: studentPayload.parent_name,
      email: studentPayload.parent_email,
      phone: studentPayload.phone || '9840111222',
      is_primary: true
    }]);
  } catch (e) {
    console.warn('Parent contact insert notice:', e.message);
  }

  // 4. Initialize Fee Record in fees table
  try {
    await supabase.from('fees').insert([{
      student_id: stData.id,
      title: 'Semester 1 Composite Academic & Institutional Fee',
      total_amount: 85000.0,
      paid_amount: 0.0,
      status: 'Pending',
      due_date: '2026-11-30',
      academic_year: '2025-2026',
      receipt_no: `REC-${Date.now().toString().slice(-6)}`
    }]);
  } catch (e) {
    console.warn('Initial fee insert notice:', e.message);
  }

  const deptMap = {
    1: 'Electronics and Communication Engineering',
    2: 'Information Technology',
    3: 'Computer Science and Engineering'
  };
  const deptName = studentData.department || studentData.department_name || deptMap[studentPayload.department_id] || 'Computer Science and Engineering';

  return {
    ...stData,
    parent_name: studentPayload.parent_name,
    parent_email: studentPayload.parent_email,
    department: deptName,
    department_name: deptName,
    overall_attendance: 0.0,
    total_conducted: 0,
    total_attended: 0,
    risk_status: 'High Risk',
    recovery_classes: 4,
    cgpa: 0.0,
    total_credits: 0.0
  };
}

export async function updateStudentInSupabase(studentId, data) {
  if (!isSupabaseConfigured) return null;

  const targetId = parseInt(studentId, 10) || studentId;
  const cleanStudentEmail = data.email ? String(data.email).trim().toLowerCase() : undefined;
  const cleanParentEmail = data.parent_email ? String(data.parent_email).trim().toLowerCase() : undefined;
  const cleanParentName = data.parent_name ? String(data.parent_name).trim() : undefined;

  const updateFields = {};
  if (data.name !== undefined) updateFields.name = String(data.name).trim();
  if (cleanStudentEmail !== undefined) updateFields.email = cleanStudentEmail;
  if (data.phone !== undefined) updateFields.phone = data.phone;
  if (cleanParentName !== undefined) updateFields.parent_name = cleanParentName;
  if (cleanParentEmail !== undefined) updateFields.parent_email = cleanParentEmail;
  if (data.address !== undefined) updateFields.address = data.address;
  if (data.semester !== undefined) updateFields.semester = parseInt(data.semester);
  if (data.section !== undefined) updateFields.section = data.section;
  if (data.department_id !== undefined) updateFields.department_id = parseInt(data.department_id);

  const { data: updated, error } = await supabase
    .from('students')
    .update(updateFields)
    .eq('id', targetId)
    .select()
    .single();

  if (error) throw error;

  // 1. Authoritatively update associated user account email in users table
  if (cleanStudentEmail && updated?.user_id) {
    try {
      await supabase
        .from('users')
        .update({ email: cleanStudentEmail, name: updateFields.name || updated.name })
        .eq('id', updated.user_id);
    } catch (uErr) {
      console.warn('Notice updating student user in Supabase:', uErr);
    }
  }

  // 2. Authoritatively sync parent_contacts table so parent alert dispatches resolve updated email
  if (cleanParentEmail !== undefined || cleanParentName !== undefined) {
    try {
      const { data: existingContact } = await supabase
        .from('parent_contacts')
        .select('id')
        .eq('student_id', targetId)
        .maybeSingle();

      if (existingContact) {
        const pcUpdate = {};
        if (cleanParentEmail !== undefined) pcUpdate.email = cleanParentEmail;
        if (cleanParentName !== undefined) pcUpdate.name = cleanParentName;
        await supabase.from('parent_contacts').update(pcUpdate).eq('student_id', targetId);
      } else if (cleanParentEmail) {
        await supabase.from('parent_contacts').insert([{
          student_id: targetId,
          name: cleanParentName || updated.parent_name || 'Parent / Guardian',
          email: cleanParentEmail,
          is_primary: true
        }]);
      }
    } catch (pcErr) {
      console.warn('Notice syncing parent_contacts in Supabase:', pcErr);
    }
  }

  return updated;
}

export async function deleteStudentInSupabase(studentId) {
  if (!isSupabaseConfigured) return null;

  const targetId = parseInt(studentId, 10) || studentId;

  // 1. Fetch student to obtain user_id for complete user cleanup
  let userId = null;
  try {
    const { data: st } = await supabase
      .from('students')
      .select('id, user_id, email, reg_no')
      .eq('id', targetId)
      .maybeSingle();
    if (st) {
      userId = st.user_id;
    }
  } catch (e) {
    console.warn('Error fetching student before delete:', e);
  }

  // 2. Clean dependent relations across tables to ensure foreign keys do not block deletion
  try { await supabase.from('parent_contacts').delete().eq('student_id', targetId); } catch (e) {}
  try { await supabase.from('attendance_alerts').delete().eq('student_id', targetId); } catch (e) {}
  try { await supabase.from('attendance').delete().eq('student_id', targetId); } catch (e) {}
  try { await supabase.from('marks').delete().eq('student_id', targetId); } catch (e) {}
  try { await supabase.from('fees').delete().eq('student_id', targetId); } catch (e) {}
  try { await supabase.from('enrollments').delete().eq('student_id', targetId); } catch (e) {}
  try { await supabase.from('complaints').delete().eq('student_id', targetId); } catch (e) {}
  try { await supabase.from('leave_requests').delete().eq('student_id', targetId); } catch (e) {}
  try { await supabase.from('assignment_submissions').delete().eq('student_id', targetId); } catch (e) {}
  try { await supabase.from('quiz_attempts').delete().eq('student_id', targetId); } catch (e) {}

  // 3. Delete student record from students table
  const { error } = await supabase
    .from('students')
    .delete()
    .eq('id', targetId);

  if (error) {
    console.error('Supabase delete student error:', error);
    throw error;
  }

  // 4. Delete associated user in users table
  if (userId) {
    try {
      await supabase.from('users').delete().eq('id', userId);
    } catch (uErr) {
      console.warn('Notice deleting associated student user:', uErr);
    }
  }

  return true;
}

export async function createFacultyInSupabase(facultyData) {
  if (!isSupabaseConfigured) return null;

  // 1. Normalize identifiers
  const cleanEmpId = String(facultyData.emp_id || '').trim().toUpperCase();
  const cleanEmail = String(facultyData.email || '').trim().toLowerCase();

  if (!cleanEmpId) {
    throw new Error('Employee ID is required and cannot be empty.');
  }
  if (!cleanEmail) {
    throw new Error('Email address is required and cannot be empty.');
  }

  // 2. Pre-check in authoritative Supabase database for duplicate employee ID
  const { data: existingFaculty } = await supabase
    .from('faculty')
    .select('id, emp_id')
    .ilike('emp_id', cleanEmpId)
    .maybeSingle();

  if (existingFaculty) {
    throw new Error('This employee ID is already registered. Please check or contact the administrator.');
  }

  // 3. Pre-check for duplicate user email
  const { data: existingUser } = await supabase
    .from('users')
    .select('id, email')
    .ilike('email', cleanEmail)
    .maybeSingle();

  if (existingUser) {
    throw new Error('User with this email already exists');
  }

  // 4. Create user account in users table (atomic insert, no upsert)
  let createdUserId = null;
  const userPayload = {
    email: cleanEmail,
    hashed_password: facultyData.password || '$2b$12$K1G29Kx2Gz6rO0k4bM6hOuQ7T9uJz8sV0iU5w3bN2xM9lO1pQ3rSe',
    role: 'faculty',
    is_active: true
  };

  const { data: userData, error: userError } = await supabase
    .from('users')
    .insert([userPayload])
    .select()
    .single();

  if (userError) {
    if (userError.code === '23505' || userError.message?.includes('users_email_key')) {
      throw new Error('User with this email already exists');
    }
    throw userError;
  }
  createdUserId = userData.id;

  // 5. Create faculty record in faculty table (atomic insert, no upsert)
  const facultyPayload = {
    user_id: createdUserId,
    emp_id: cleanEmpId,
    name: facultyData.name ? facultyData.name.trim() : 'Faculty Member',
    email: cleanEmail,
    phone: facultyData.phone ? facultyData.phone.trim() : '9840123456',
    department_id: parseInt(facultyData.department_id) || 3,
    designation: facultyData.designation ? facultyData.designation.trim() : 'Assistant Professor'
  };

  const { data: facData, error: facError } = await supabase
    .from('faculty')
    .insert([facultyPayload])
    .select()
    .single();

  if (facError) {
    // ATOMIC ROLLBACK: clean up the newly created user record so no orphaned user is left
    if (createdUserId) {
      try {
        await supabase.from('users').delete().eq('id', createdUserId);
      } catch (cleanupErr) {
        console.warn('Rollback faculty user cleanup error:', cleanupErr);
      }
    }
    if (facError.code === '23505' || facError.message?.includes('emp_id')) {
      throw new Error('This employee ID is already registered. Please check or contact the administrator.');
    }
    throw facError;
  }
  return facData;
}

export async function updateFacultyInSupabase(facultyId, data) {
  if (!isSupabaseConfigured) return null;

  const targetId = parseInt(facultyId, 10) || facultyId;
  const cleanEmail = data.email ? String(data.email).trim().toLowerCase() : undefined;

  const updateFields = {};
  if (data.name !== undefined) updateFields.name = String(data.name).trim();
  if (cleanEmail !== undefined) updateFields.email = cleanEmail;
  if (data.phone !== undefined) updateFields.phone = data.phone;
  if (data.designation !== undefined) updateFields.designation = data.designation;
  if (data.department_id !== undefined) updateFields.department_id = parseInt(data.department_id);

  const { data: updated, error } = await supabase
    .from('faculty')
    .update(updateFields)
    .eq('id', targetId)
    .select()
    .single();

  if (error) throw error;

  // Authoritatively update associated user account in users table
  if (cleanEmail && updated?.user_id) {
    try {
      await supabase
        .from('users')
        .update({ email: cleanEmail, name: updateFields.name || updated.name })
        .eq('id', updated.user_id);
    } catch (uErr) {
      console.warn('Notice updating faculty user in Supabase:', uErr);
    }
  }

  return updated;
}

export async function deleteFacultyInSupabase(facultyId) {
  if (!isSupabaseConfigured) return null;

  const targetId = parseInt(facultyId, 10) || facultyId;

  // 1. Fetch faculty to obtain user_id
  let userId = null;
  try {
    const { data: fac } = await supabase
      .from('faculty')
      .select('id, user_id, email, emp_id')
      .eq('id', targetId)
      .maybeSingle();
    if (fac) {
      userId = fac.user_id;
    }
  } catch (e) {
    console.warn('Error fetching faculty before delete:', e);
  }

  // 2. Unassign faculty from subjects and timetable so no foreign key blocks
  try { await supabase.from('subjects').update({ faculty_id: null }).eq('faculty_id', targetId); } catch (e) {}
  try { await supabase.from('timetable').update({ faculty_id: null }).eq('faculty_id', targetId); } catch (e) {}

  // 3. Delete faculty row from faculty table
  const { error } = await supabase
    .from('faculty')
    .delete()
    .eq('id', targetId);

  if (error) {
    console.error('Supabase delete faculty error:', error);
    throw error;
  }

  // 4. Delete corresponding user row in users table
  if (userId) {
    try {
      await supabase.from('users').delete().eq('id', userId);
    } catch (uErr) {
      console.warn('Notice deleting associated faculty user:', uErr);
    }
  }

  return true;
}

export async function saveAttendanceInSupabase(subjectId, date, sessionName, facultyId, studentRecords) {
  if (!isSupabaseConfigured) return { inserted: [], updatedStats: {} };

  const targetSubjectId = parseInt(subjectId) || 1;
  const targetDate = date || new Date().toISOString().split('T')[0];
  const numericFacultyId = facultyId && !isNaN(parseInt(facultyId)) ? parseInt(facultyId) : 2;

  // Clean existing attendance entries for this subject and date to prevent duplicate counts
  try {
    await supabase
      .from('attendance')
      .delete()
      .eq('subject_id', targetSubjectId)
      .eq('date', targetDate);
  } catch (cleanErr) {
    console.warn('Notice while updating previous attendance session records:', cleanErr?.message);
  }

  const insertRows = (studentRecords || []).map((rec) => ({
    student_id: parseInt(rec.student_id),
    subject_id: targetSubjectId,
    date: targetDate,
    status: rec.status || 'Present',
    session_name: sessionName || 'Lecture',
    marked_by: numericFacultyId
  }));

  const { data, error } = await supabase
    .from('attendance')
    .insert(insertRows)
    .select();

  if (error) {
    console.warn('Attendance save notice in Supabase:', error.message);
    throw error;
  }

  // Calculate authoritative updated attendance percentages directly from Supabase for all affected students
  const updatedStats = {};
  try {
    const studentIds = (studentRecords || []).map((r) => parseInt(r.student_id)).filter(Boolean);
    if (studentIds.length > 0) {
      const { data: attHistory, error: histErr } = await supabase
        .from('attendance')
        .select('student_id, status')
        .in('student_id', studentIds);

      if (!histErr && Array.isArray(attHistory)) {
        studentIds.forEach((sId) => {
          const sRecords = attHistory.filter((a) => a.student_id === sId);
          const conducted = sRecords.length;
          const attended = sRecords.filter((a) => a.status === 'Present' || a.status === 'Late').length;
          const pct = conducted > 0 ? Number(((attended / conducted) * 100).toFixed(1)) : 0.0;
          const riskStatus = pct >= 75.0 ? 'Safe' : (pct >= 65.0 ? 'Warning' : 'High Risk');
          const recoveryClasses = pct < 75.0 ? Math.max(1, Math.ceil(3 * conducted - 4 * attended)) : 0;

          updatedStats[sId] = {
            overall_attendance: pct,
            total_conducted: conducted,
            total_attended: attended,
            risk_status: riskStatus,
            recovery_classes: recoveryClasses
          };
        });
      }
    }
  } catch (statErr) {
    console.warn('Notice computing authoritative attendance stats from Supabase:', statErr?.message);
  }

  return { inserted: data, updatedStats };
}

export async function saveMarksInSupabase(marksData) {
  if (!isSupabaseConfigured) return null;

  const { score, grade, grade_point } = computeGradeFromScore(marksData.marks_obtained || marksData.total || 0);

  const payload = {
    student_id: parseInt(marksData.student_id),
    subject_id: parseInt(marksData.subject_id),
    exam_type: marksData.exam_type || 'CIA Continuous Assessment',
    marks_obtained: parseFloat(marksData.marks_obtained !== undefined ? marksData.marks_obtained : score),
    max_marks: parseFloat(marksData.max_marks || 60.0),
    internal_1: parseFloat(marksData.internal_1 || 0.0),
    internal_2: parseFloat(marksData.internal_2 || 0.0),
    assignment: parseFloat(marksData.assignment || 0.0),
    total: parseFloat(marksData.total !== undefined ? marksData.total : score),
    grade: marksData.grade || grade,
    remarks: marksData.remarks || `Internal 1: ${marksData.internal_1 || 0}, Internal 2: ${marksData.internal_2 || 0}, Assignment: ${marksData.assignment || 0}`
  };

  // Check if a mark row already exists for (student_id, subject_id)
  const { data: existing } = await supabase
    .from('marks')
    .select('id')
    .eq('student_id', payload.student_id)
    .eq('subject_id', payload.subject_id)
    .limit(1);

  if (existing && existing.length > 0) {
    const { data: updated, error } = await supabase
      .from('marks')
      .update(payload)
      .eq('id', existing[0].id)
      .select()
      .single();
    if (error) throw error;
    return updated;
  } else {
    const { data: inserted, error } = await supabase
      .from('marks')
      .insert([payload])
      .select()
      .single();
    if (error) throw error;
    return inserted;
  }
}

export async function submitAssignmentInSupabase(submissionPayload) {
  if (!isSupabaseConfigured) return null;

  const payload = {
    assignment_id: parseInt(submissionPayload.assignment_id),
    student_id: parseInt(submissionPayload.student_id),
    submission_type: submissionPayload.submission_type || 'file',
    file_name: submissionPayload.file_name || null,
    file_path: submissionPayload.file_path || null,
    file_size: submissionPayload.file_size || 0,
    drive_link: submissionPayload.drive_link || null,
    status: 'Submitted',
    submitted_at: new Date().toISOString()
  };

  const { data, error } = await supabase
    .from('assignment_submissions')
    .upsert(payload)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function gradeAssignmentSubmissionInSupabase(submissionId, marks, feedback, facultyId) {
  if (!isSupabaseConfigured) return null;

  const numericFacultyId = facultyId && !isNaN(parseInt(facultyId)) ? parseInt(facultyId) : null;
  const { data, error } = await supabase
    .from('assignment_submissions')
    .update({
      marks_obtained: parseFloat(marks),
      faculty_feedback: feedback || null,
      status: 'Graded',
      graded_by: numericFacultyId,
      graded_at: new Date().toISOString()
    })
    .eq('id', submissionId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * -----------------------------------------------------------------------------
 * QUIZ PERSISTENCE & MUTATION OPERATIONS
 * -----------------------------------------------------------------------------
 */

export async function createQuizInSupabase(quizData) {
  if (!isSupabaseConfigured) return null;

  const totalMarks = (quizData.questions || []).reduce((acc, q) => acc + (parseFloat(q.marks) || 2.5), 0) || parseFloat(quizData.total_marks) || 10.0;
  
  // 1. Insert into quizzes table
  const quizPayload = {
    title: quizData.title,
    description: quizData.description || '',
    subject_id: parseInt(quizData.subject_id) || 7,
    faculty_id: parseInt(quizData.faculty_id) || 2,
    department_id: parseInt(quizData.department_id) || 3,
    academic_year: quizData.academic_year || '2025-2026',
    semester: parseInt(quizData.semester) || 6,
    section: quizData.section || 'A',
    duration_minutes: parseInt(quizData.duration_minutes) || 30,
    total_marks: totalMarks,
    start_time: quizData.start_time || new Date().toISOString(),
    deadline: quizData.deadline || new Date(Date.now() + 86400000 * 3).toISOString(),
    status: quizData.status || 'published',
    results_published: Boolean(quizData.results_published),
    allow_multiple_attempts: Boolean(quizData.allow_multiple_attempts),
    max_attempts: parseInt(quizData.max_attempts) || 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  const { data: createdQuiz, error: quizError } = await supabase
    .from('quizzes')
    .insert([quizPayload])
    .select()
    .single();

  if (quizError) {
    console.error('Supabase createQuizInSupabase error:', quizError);
    throw quizError;
  }

  // 2. Insert questions into quiz_questions table
  const questionsToInsert = (quizData.questions || []).map((q, idx) => ({
    quiz_id: createdQuiz.id,
    question_text: q.question_text || `Question ${idx + 1}`,
    question_type: q.question_type || 'mcq',
    marks: parseFloat(q.marks) || 2.5,
    order: q.order !== undefined ? q.order : (idx + 1),
    options: typeof q.options === 'string' ? q.options : JSON.stringify(q.options || []),
    correct_answer: q.correct_answer || 'A',
    explanation: q.explanation || ''
  }));

  let insertedQuestions = [];
  if (questionsToInsert.length > 0) {
    const { data: qData, error: qError } = await supabase
      .from('quiz_questions')
      .insert(questionsToInsert)
      .select();

    if (qError) {
      console.warn('Supabase quiz_questions insert warning:', qError);
    } else {
      insertedQuestions = qData || [];
    }
  }

  // 3. Insert quiz assignments if student exclusions specified
  if (Array.isArray(quizData.excluded_student_ids) && quizData.excluded_student_ids.length > 0) {
    const assignmentsToInsert = quizData.excluded_student_ids.map((stId) => ({
      quiz_id: createdQuiz.id,
      student_id: parseInt(stId),
      is_excluded: true,
      created_at: new Date().toISOString()
    }));
    try {
      await supabase.from('quiz_assignments').insert(assignmentsToInsert);
    } catch (e) {
      console.warn('Supabase quiz_assignments exclusion insert notice:', e.message);
    }
  }

  // Format questions for UI consumption
  const formattedQuestions = insertedQuestions.map((q) => ({
    ...q,
    options: typeof q.options === 'string' ? (() => { try { return JSON.parse(q.options); } catch (e) { return []; } })() : (q.options || [])
  }));

  return {
    ...createdQuiz,
    questions: formattedQuestions.length > 0 ? formattedQuestions : (quizData.questions || []),
    excluded_student_ids: quizData.excluded_student_ids || []
  };
}

export async function updateQuizPublishStatusInSupabase(quizId, shouldPublish) {
  if (!isSupabaseConfigured) return null;
  const newStatus = shouldPublish ? 'published' : 'draft';
  const { data, error } = await supabase
    .from('quizzes')
    .update({ status: newStatus, updated_at: new Date().toISOString() })
    .eq('id', parseInt(quizId))
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function publishQuizResultsInSupabase(quizId, shouldPublish = true) {
  if (!isSupabaseConfigured) return null;
  const { data, error } = await supabase
    .from('quizzes')
    .update({ results_published: shouldPublish, updated_at: new Date().toISOString() })
    .eq('id', parseInt(quizId))
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteQuizInSupabase(quizId) {
  if (!isSupabaseConfigured) return null;
  const targetId = parseInt(quizId);
  try {
    const { data: attempts } = await supabase.from('quiz_attempts').select('id').eq('quiz_id', targetId);
    if (attempts && attempts.length > 0) {
      const attemptIds = attempts.map((a) => a.id);
      await supabase.from('quiz_answers').delete().in('attempt_id', attemptIds);
    }
  } catch (e) {}

  try { await supabase.from('quiz_attempts').delete().eq('quiz_id', targetId); } catch (e) {}
  try { await supabase.from('quiz_assignments').delete().eq('quiz_id', targetId); } catch (e) {}
  try { await supabase.from('quiz_questions').delete().eq('quiz_id', targetId); } catch (e) {}

  const { error } = await supabase.from('quizzes').delete().eq('id', targetId);
  if (error) throw error;
  return true;
}

export async function createQuizAttemptInSupabase(quizId, studentId, score, totalMarks, attemptNumber = 1, answers = null) {
  if (!isSupabaseConfigured) return null;

  let nextAttempt = attemptNumber || 1;
  try {
    const { data: existingAttempts } = await supabase
      .from('quiz_attempts')
      .select('attempt_number')
      .eq('quiz_id', parseInt(quizId))
      .eq('student_id', parseInt(studentId))
      .order('attempt_number', { ascending: false })
      .limit(1);

    if (existingAttempts && existingAttempts.length > 0 && existingAttempts[0].attempt_number) {
      nextAttempt = existingAttempts[0].attempt_number + 1;
    }
  } catch (err) {}

  const { data, error } = await supabase
    .from('quiz_attempts')
    .insert([{
      quiz_id: parseInt(quizId),
      student_id: parseInt(studentId),
      attempt_number: nextAttempt,
      score: parseFloat(score),
      total_marks: parseFloat(totalMarks || 10.0),
      status: 'submitted',
      submitted_at: new Date().toISOString()
    }])
    .select()
    .single();

  if (error) throw error;

  // If answer map provided, save to quiz_answers table
  if (answers && typeof answers === 'object' && data?.id) {
    try {
      const answerRows = Object.entries(answers).map(([qId, ansVal]) => ({
        attempt_id: data.id,
        question_id: parseInt(qId),
        selected_answer: String(ansVal),
        evaluated_at: new Date().toISOString()
      }));
      if (answerRows.length > 0) {
        await supabase.from('quiz_answers').insert(answerRows);
      }
    } catch (ansErr) {
      console.warn('Notice while recording quiz_answers:', ansErr.message);
    }
  }

  return data;
}

export async function createComplaintInSupabase(complaintData) {
  if (!isSupabaseConfigured) return null;

  const payload = {
    student_id: parseInt(complaintData.student_id),
    user_id: complaintData.user_id ? parseInt(complaintData.user_id) : null,
    category: complaintData.category || 'Academic',
    subject: complaintData.subject || complaintData.title || 'Student Inquiry',
    description: complaintData.description,
    status: 'Open' // Must be 'Open' per complaints_status_check
  };

  const { data, error } = await supabase
    .from('complaints')
    .insert([payload])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateComplaintInSupabase(complaintId, status, remarks) {
  if (!isSupabaseConfigured) return null;

  const validStatus = status === 'Pending' ? 'Open' : status;
  const updatePayload = {
    status: validStatus,
    updated_at: new Date().toISOString()
  };
  if (remarks !== undefined) {
    updatePayload.response = remarks;
    updatePayload.faculty_response = remarks;
  }

  const { data, error } = await supabase
    .from('complaints')
    .update(updatePayload)
    .eq('id', complaintId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteComplaintInSupabase(complaintId) {
  if (!isSupabaseConfigured) return null;

  const { error } = await supabase
    .from('complaints')
    .delete()
    .eq('id', complaintId);

  if (error) throw error;
  return true;
}

export async function createLeaveRequestInSupabase(leaveData) {
  if (!isSupabaseConfigured) return null;

  const payload = {
    student_id: parseInt(leaveData.student_id),
    leave_type: leaveData.leave_type || 'Leave of Absence',
    from_date: leaveData.from_date || leaveData.start_date || new Date().toISOString().split('T')[0],
    to_date: leaveData.to_date || leaveData.end_date || new Date().toISOString().split('T')[0],
    reason: leaveData.reason || 'Personal reasons',
    status: 'Pending'
  };

  const { data, error } = await supabase
    .from('leave_requests')
    .insert([payload])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateLeaveRequestInSupabase(leaveId, status, remarks, reviewer) {
  if (!isSupabaseConfigured) return null;

  const updateFields = {
    status,
    reviewed_by: reviewer || 'Faculty Advisor',
    updated_at: new Date().toISOString()
  };

  if (remarks !== undefined && remarks !== null) {
    if (reviewer === 'Faculty Advisor') {
      updateFields.faculty_remark = remarks;
    } else {
      updateFields.admin_remark = remarks;
      updateFields.faculty_remark = remarks;
    }
  }

  const { data, error } = await supabase
    .from('leave_requests')
    .update(updateFields)
    .eq('id', leaveId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteLeaveRequestInSupabase(leaveId) {
  if (!isSupabaseConfigured) return null;

  const { error } = await supabase
    .from('leave_requests')
    .delete()
    .eq('id', leaveId);

  if (error) throw error;
  return true;
}

export async function createAnnouncementInSupabase(announcementData) {
  if (!isSupabaseConfigured) return null;

  const payload = {
    title: announcementData.title,
    description: announcementData.description,
    category: announcementData.category || 'General',
    target_department_id: announcementData.target_department_id ? parseInt(announcementData.target_department_id) : null,
    target_semester: announcementData.target_semester ? parseInt(announcementData.target_semester) : 6,
    status: announcementData.status || 'Active',
    created_by: announcementData.created_by && !isNaN(parseInt(announcementData.created_by)) ? parseInt(announcementData.created_by) : 63,
    created_at: new Date().toISOString()
  };

  const { data, error } = await supabase
    .from('announcements')
    .insert([payload])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function createNotificationInSupabase(notifData) {
  if (!isSupabaseConfigured) return null;

  const validUserId = notifData.user_id !== undefined && notifData.user_id !== null && !isNaN(parseInt(notifData.user_id))
    ? parseInt(notifData.user_id)
    : null;

  const payload = {
    user_id: validUserId,
    title: notifData.title || 'Notification',
    message: notifData.message || '',
    type: notifData.type || 'info',
    is_read: notifData.is_read ?? false
  };

  const { data, error } = await supabase
    .from('notifications')
    .insert([payload])
    .select()
    .single();

  if (error) {
    console.warn('createNotificationInSupabase notice:', error.message || error);
    return null;
  }
  return data;
}

export async function markNotificationReadInSupabase(notifId) {
  if (!isSupabaseConfigured) return null;

  const { data, error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notifId)
    .select();

  if (error) throw error;
  return data;
}

export async function deleteNotificationInSupabase(notifId) {
  if (!isSupabaseConfigured) return null;

  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('id', notifId);

  if (error) throw error;
  return true;
}

export async function updateAnnouncementInSupabase(annId, updateData) {
  if (!isSupabaseConfigured) return null;

  const payload = {};
  if (updateData.title !== undefined) payload.title = updateData.title;
  if (updateData.description !== undefined) payload.description = updateData.description;
  if (updateData.content !== undefined) payload.description = updateData.content;
  if (updateData.category !== undefined) payload.category = updateData.category;
  if (updateData.status !== undefined) payload.status = updateData.status;

  const { data, error } = await supabase
    .from('announcements')
    .update(payload)
    .eq('id', annId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteAnnouncementInSupabase(annId) {
  if (!isSupabaseConfigured) return null;

  const { error } = await supabase
    .from('announcements')
    .delete()
    .eq('id', annId);

  if (error) throw error;
  return true;
}

export async function createAssignmentInSupabase(asgnData) {
  if (!isSupabaseConfigured) return null;

  const facultyId = asgnData.faculty_id && !isNaN(parseInt(asgnData.faculty_id)) ? parseInt(asgnData.faculty_id) : 2;
  const payload = {
    subject_id: parseInt(asgnData.subject_id) || 7,
    title: asgnData.title,
    description: asgnData.description || '',
    due_date: asgnData.due_date || new Date(Date.now() + 86400000 * 5).toISOString().split('T')[0],
    max_marks: parseFloat(asgnData.max_marks) || 10.0,
    faculty_id: facultyId,
    department_id: asgnData.department_id ? parseInt(asgnData.department_id) : 3,
    semester: asgnData.semester ? parseInt(asgnData.semester) : 6,
    section: asgnData.section || 'A',
    due_time: asgnData.due_time || '23:59',
    allowed_file_types: asgnData.allowed_file_types || 'pdf,docx,zip,txt',
    max_file_size_mb: asgnData.max_file_size_mb || 10,
    submission_format: asgnData.submission_format || 'both',
    allow_resubmission: asgnData.allow_resubmission !== false,
    allow_late: asgnData.allow_late !== false,
    status: asgnData.status || 'published'
  };

  const { data, error } = await supabase
    .from('assignments')
    .insert([payload])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteAssignmentInSupabase(asgnId) {
  if (!isSupabaseConfigured) return null;

  const { error } = await supabase
    .from('assignments')
    .delete()
    .eq('id', asgnId);

  if (error) throw error;
  return true;
}

export async function createFeeInSupabase(feeData) {
  if (!isSupabaseConfigured) return null;

  const total = parseFloat(feeData.total_amount) || 85000.0;
  const paid = parseFloat(feeData.paid_amount) || 0.0;
  let status = feeData.status || 'Pending';
  if (status === 'Partial') status = 'Partially Paid';
  if (paid >= total) status = 'Paid';
  else if (paid > 0 && status === 'Pending') status = 'Partially Paid';

  const payload = {
    student_id: parseInt(feeData.student_id),
    title: feeData.title || 'Semester Academic & Composite Fee',
    total_amount: total,
    paid_amount: paid,
    due_date: feeData.due_date || '2026-04-15',
    status,
    academic_year: feeData.academic_year || '2025-2026',
    receipt_no: feeData.receipt_no || null,
    payment_mode: feeData.payment_mode || null
  };

  const { data, error } = await supabase
    .from('fees')
    .insert([payload])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateFeeInSupabase(feeId, feeData) {
  if (!isSupabaseConfigured) return null;

  const updateFields = { updated_at: new Date().toISOString() };
  if (feeData.total_amount !== undefined) updateFields.total_amount = parseFloat(feeData.total_amount);
  if (feeData.paid_amount !== undefined) updateFields.paid_amount = parseFloat(feeData.paid_amount);
  if (feeData.status !== undefined) {
    let s = feeData.status;
    if (s === 'Partial') s = 'Partially Paid';
    updateFields.status = s;
  }
  if (feeData.payment_mode !== undefined) updateFields.payment_mode = feeData.payment_mode;
  if (feeData.receipt_no !== undefined) updateFields.receipt_no = feeData.receipt_no;

  const { data, error } = await supabase
    .from('fees')
    .update(updateFields)
    .eq('id', feeId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function saveTimetableEntryInSupabase(timetableData) {
  if (!isSupabaseConfigured) return null;

  let nextId = undefined;
  try {
    const { data: topRows } = await supabase.from('timetable').select('id').order('id', { ascending: false }).limit(1);
    if (topRows && topRows.length > 0 && topRows[0].id) {
      nextId = topRows[0].id + 1;
    }
  } catch (e) {}

  const payload = {
    day_of_week: timetableData.day_of_week || timetableData.day || 'Monday',
    start_time: timetableData.start_time || '09:00',
    end_time: timetableData.end_time || '10:00',
    subject_id: parseInt(timetableData.subject_id),
    faculty_id: timetableData.faculty_id ? parseInt(timetableData.faculty_id) : 2,
    room: timetableData.room || 'Lecture Hall',
    department_id: parseInt(timetableData.department_id) || 3,
    semester: parseInt(timetableData.semester) || 6,
    section: timetableData.section || 'A'
  };
  if (nextId) payload.id = nextId;

  const { data, error } = await supabase
    .from('timetable')
    .insert([payload])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteTimetableEntryInSupabase(slotId) {
  if (!isSupabaseConfigured) return null;

  const { error } = await supabase
    .from('timetable')
    .delete()
    .eq('id', slotId);

  if (error) throw error;
  return true;
}

export async function saveCalendarEventInSupabase(eventData) {
  if (!isSupabaseConfigured) return null;

  let nextId = undefined;
  try {
    const { data: topRows } = await supabase.from('calendar_events').select('id').order('id', { ascending: false }).limit(1);
    if (topRows && topRows.length > 0 && topRows[0].id) {
      nextId = topRows[0].id + 1;
    }
  } catch (e) {}

  const payload = {
    title: eventData.title,
    category: eventData.category || 'Academic',
    type: eventData.type || 'Institutional Event',
    date: eventData.date || eventData.start_date || new Date().toISOString().split('T')[0],
    description: eventData.description || '',
    audience: eventData.audience || 'All'
  };
  if (nextId) payload.id = nextId;

  const { data, error } = await supabase
    .from('calendar_events')
    .insert([payload])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteCalendarEventInSupabase(eventId) {
  if (!isSupabaseConfigured) return null;

  const { error } = await supabase
    .from('calendar_events')
    .delete()
    .eq('id', eventId);

  if (error) throw error;
  return true;
}

export async function updateSystemSettingsInSupabase(settingsData) {
  if (!isSupabaseConfigured) return null;

  const { data, error } = await supabase
    .from('system_settings')
    .upsert({
      id: settingsData.id || 1,
      college_name: settingsData.college_name || settingsData.COLLEGE_NAME,
      academic_year: settingsData.academic_year || settingsData.ACADEMIC_YEAR,
      current_term: settingsData.current_term || settingsData.CURRENT_TERM,
      attendance_threshold: parseFloat(settingsData.attendance_threshold || settingsData.SAFE_THRESHOLD) || 75.0,
      email_notifications_enabled: Boolean(settingsData.email_notifications_enabled !== false),
      updated_at: new Date().toISOString()
    })
    .select();

  if (error) throw error;
  return data;
}
