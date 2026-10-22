"""
Generates frontend/src/lib/dataStore.js with the full dataset of 60 Chennai students
across ECE, IT, CSE, plus admin, faculty, quizzes, assignments, announcements, timetable, exams, fees, placements, and complaints.
"""
import os
import json

ECE_STUDENTS = [
    ("Harish Prabhu", "harish@college.edu", "Prabhu Ramanathan", "prabhu.r@gmail.com", 82.5, "Safe"),
    ("Dharani V", "dharani@college.edu", "Vijay Anand", "vijay.anand@gmail.com", 78.0, "Safe"),
    ("Manoj Kumar", "manoj@college.edu", "Kumaraswamy M", "kumar.m@gmail.com", 68.5, "Warning"),
    ("Keerthana R", "keerthana@college.edu", "Ramesh Kumar", "ramesh.k@gmail.com", 91.0, "Safe"),
    ("Sathish Kumar", "sathish@college.edu", "Murugan K", "murugan.k@gmail.com", 56.0, "High Risk"),
    ("Divya Bharathi", "divya.b@college.edu", "Sundaram P", "sundaram.p@gmail.com", 88.0, "Safe"),
    ("Praveen Chandran", "praveen@college.edu", "Chandran S", "chandran.s@gmail.com", 72.0, "Warning"),
    ("Subhashini M", "subhashini@college.edu", "Mani V", "mani.v@gmail.com", 85.0, "Safe"),
    ("Vigneshwaran K", "vignesh@college.edu", "Krishnan G", "krishnan.g@gmail.com", 61.0, "High Risk"),
    ("Lavanya S", "lavanya@college.edu", "Selvaraj T", "selvaraj.t@gmail.com", 79.5, "Safe"),
    ("Aravind Swamy", "aravind@college.edu", "Swaminathan R", "swami.r@gmail.com", 83.0, "Safe"),
    ("Deepika N", "deepika@college.edu", "Natarajan S", "natarajan.s@gmail.com", 69.0, "Warning"),
    ("Karthikeyan P", "karthik.p@college.edu", "Perumal K", "perumal.k@gmail.com", 76.5, "Safe"),
    ("Sandhya V", "sandhya@college.edu", "Venkatesan R", "venkat.r@gmail.com", 93.0, "Safe"),
    ("Saravanan B", "saravanan@college.edu", "Baskaran K", "baskaran.k@gmail.com", 59.0, "High Risk"),
    ("Monisha T", "monisha@college.edu", "Thangaraj M", "thangaraj.m@gmail.com", 84.0, "Safe"),
    ("Ganesh Moorthy", "ganesh@college.edu", "Moorthy S", "moorthy.s@gmail.com", 71.5, "Warning"),
    ("Shalini P", "shalini@college.edu", "Palani M", "palani.m@gmail.com", 89.0, "Safe"),
    ("Naveen Prasad", "naveen@college.edu", "Prasad K", "prasad.k@gmail.com", 77.0, "Safe"),
    ("Janani K", "janani@college.edu", "Kothandaraman V", "kothanda.v@gmail.com", 86.5, "Safe")
]

IT_STUDENTS = [
    ("Kavin Raj", "kavin@college.edu", "Rajendran S", "rajendran.s@gmail.com", 79.0, "Safe"),
    ("Anitha Ramasamy", "anitha@college.edu", "Ramasamy K", "ramasamy.k@gmail.com", 85.5, "Safe"),
    ("Balaji Venkatesh", "balaji@college.edu", "Venkatesh Babu", "venkatesh.b@gmail.com", 58.5, "High Risk"),
    ("Gayathri Natarajan", "gayathri@college.edu", "Natarajan P", "natarajan.p@gmail.com", 92.0, "Safe"),
    ("Dinesh Karthik", "dinesh@college.edu", "Karthikeyan S", "karthik.s@gmail.com", 71.0, "Warning"),
    ("Poornima Devi", "poornima@college.edu", "Devendran M", "devendran.m@gmail.com", 80.0, "Safe"),
    ("Sridhar Ganesan", "sridhar@college.edu", "Ganesan T", "ganesan.t@gmail.com", 63.5, "High Risk"),
    ("Meenakshi S", "meenakshi@college.edu", "Shanmugam K", "shanmugam.k@gmail.com", 87.0, "Safe"),
    ("Pradeep Kumar", "pradeep@college.edu", "Vijayakumar R", "vijay.r@gmail.com", 74.0, "Warning"),
    ("Revathi Murugan", "revathi@college.edu", "Murugesan P", "murugesan.p@gmail.com", 81.5, "Safe"),
    ("Gokulnath R", "gokul@college.edu", "Ravichandran M", "ravi.m@gmail.com", 84.5, "Safe"),
    ("Hemalatha C", "hema@college.edu", "Chandrasekaran V", "chandra.v@gmail.com", 67.0, "Warning"),
    ("Rajesh Kannan", "rajesh.k@college.edu", "Kannan S", "kannan.s@gmail.com", 76.0, "Safe"),
    ("Sowmya Lakshmi", "sowmya@college.edu", "Lakshmipathy K", "lakshmi.k@gmail.com", 94.0, "Safe"),
    ("Vasanth Kumar", "vasanth@college.edu", "Saravanan R", "saravanan.r@gmail.com", 60.5, "High Risk"),
    ("Pavithra M", "pavithra@college.edu", "Mahalingam S", "mahalingam.s@gmail.com", 86.0, "Safe"),
    ("Vijay Sethupathi", "vijay.s@college.edu", "Sethuraman P", "sethu.p@gmail.com", 73.5, "Warning"),
    ("Sneha Parthasarathy", "sneha@college.edu", "Parthasarathy K", "partha.k@gmail.com", 88.5, "Safe"),
    ("Ashwin Raghav", "ashwin@college.edu", "Raghavan N", "raghavan.n@gmail.com", 78.5, "Safe"),
    ("Tharani K", "tharani@college.edu", "Kailasam M", "kailasam.m@gmail.com", 83.0, "Safe")
]

CSE_STUDENTS = [
    # Demo 1: Good attendance
    ("Arun Kumar", "arun@college.edu", "Kumaravel S", "kumaravel.s@gmail.com", 84.0, "Safe"),
    # Demo 2: Medium attendance
    ("Nivetha S", "nivetha@college.edu", "Sundaramorthy K", "sundar.k@gmail.com", 68.0, "Warning"),
    ("Vigneshwaran R", "vignesh.r@college.edu", "Ramakrishnan S", "ramki.s@gmail.com", 91.5, "Safe"),
    ("Pooja Sundaram", "pooja@college.edu", "Sundaram V", "sundaram.v@gmail.com", 79.0, "Safe"),
    # Demo 3: Low attendance
    ("Sanjay Kumar", "sanjay@college.edu", "Mohan Kumar R", "mohan.r@gmail.com", 58.0, "High Risk"),
    ("Akshaya Raman", "akshaya@college.edu", "Ramanathan M", "raman.m@gmail.com", 88.0, "Safe"),
    ("Kishore Kumar", "kishore@college.edu", "Gopalakrishnan P", "gopal.p@gmail.com", 72.5, "Warning"),
    ("Swetha Varadharajan", "swetha@college.edu", "Varadharajan K", "varadhan.k@gmail.com", 95.0, "Safe"),
    ("Mukesh Kannan", "mukesh@college.edu", "Kannan D", "kannan.d@gmail.com", 62.0, "High Risk"),
    ("Bhavani Shankar", "bhavani@college.edu", "Shankaran T", "shankaran.t@gmail.com", 83.5, "Safe"),
    ("Surya Narayanan", "surya@college.edu", "Narayanan S", "narayanan.s@gmail.com", 77.0, "Safe"),
    ("Madhumitha K", "madhu@college.edu", "Kasiviswanathan R", "kasi.r@gmail.com", 70.0, "Warning"),
    ("Ajith Kumar", "ajith@college.edu", "Subramanian M", "subramanian.m@gmail.com", 85.0, "Safe"),
    ("Preethi S", "preethi@college.edu", "Srinivasan K", "srini.k@gmail.com", 90.0, "Safe"),
    ("Raghavendra Rao", "raghav@college.edu", "Ramamurthy R", "ramamurthy.r@gmail.com", 57.5, "High Risk"),
    ("Kavitha Selvam", "kavitha.s@college.edu", "Selvarajan N", "selvaraj.n@gmail.com", 82.0, "Safe"),
    ("Madhavan Govind", "madhavan@college.edu", "Govindaraj P", "govind.p@gmail.com", 74.0, "Warning"),
    ("Charulatha V", "charu@college.edu", "Veeramani S", "veeramani.s@gmail.com", 86.5, "Safe"),
    ("Karthik Raja", "karthik.r@college.edu", "Rajagopal M", "rajagopal.m@gmail.com", 81.0, "Safe"),
    ("Anand Subramanian", "anand@college.edu", "Subramaniam V", "subbu.v@gmail.com", 87.5, "Safe")
]

students_data = []
users_data = []

# Admin user
users_data.append({
    "id": 1,
    "email": "admin@college.edu",
    "role": "admin",
    "name": "System Administrator",
    "is_active": True
})

# Faculty user
users_data.append({
    "id": 2,
    "email": "kavitha@college.edu",
    "role": "faculty",
    "name": "Dr. Kavitha Raman",
    "emp_id": "EMP_CSE_01",
    "department_id": 3,
    "department": "Computer Science and Engineering",
    "designation": "Professor & HOD",
    "phone": "9840123456",
    "is_active": True
})

user_id_seq = 3
student_id_seq = 1

def build_students(dept_code, dept_id, dept_name, list_data):
    global user_id_seq, student_id_seq
    for idx, (name, email, p_name, p_email, att_pct, risk) in enumerate(list_data, start=1):
        reg_no = f"21{dept_code[:2]}{100 + idx}"
        u_id = user_id_seq
        user_id_seq += 1
        s_id = student_id_seq
        student_id_seq += 1

        users_data.append({
            "id": u_id,
            "email": email,
            "role": "student",
            "name": name,
            "is_active": True
        })

        # Calculate attended vs conducted
        total_conducted = 48
        total_attended = int(round((att_pct / 100.0) * total_conducted))
        recovery_classes = max(0, int(round((75.0 * total_conducted - 100 * total_attended) / 25.0))) if att_pct < 75.0 else 0

        students_data.append({
            "id": s_id,
            "user_id": u_id,
            "reg_no": reg_no,
            "name": name,
            "email": email,
            "phone": f"9841{idx:02d}00{idx:02d}",
            "department_id": dept_id,
            "department": dept_name,
            "department_name": dept_name,
            "semester": 6,
            "section": "A",
            "parent_name": p_name,
            "parent_email": p_email,
            "address": "Chennai, Tamil Nadu",
            "overall_attendance": att_pct,
            "risk_status": risk,
            "total_attended": total_attended,
            "total_conducted": total_conducted,
            "recovery_classes": recovery_classes,
            "required_percentage": 75.0
        })

build_students("ECE", 1, "Electronics and Communication Engineering", ECE_STUDENTS)
build_students("IT", 2, "Information Technology", IT_STUDENTS)
build_students("CSE", 3, "Computer Science and Engineering", CSE_STUDENTS)

output_content = f"""// Auto-generated full dataset of 60 Chennai students across ECE, IT, and CSE
// for role-based Supabase cloud application and local Vite development.

export const DEPARTMENTS = [
  {{ id: 1, code: 'ECE', name: 'Electronics and Communication Engineering' }},
  {{ id: 2, code: 'IT', name: 'Information Technology' }},
  {{ id: 3, code: 'CSE', name: 'Computer Science and Engineering' }}
];

export const USERS = {json.dumps(users_data, indent=2)};

export const STUDENTS = {json.dumps(students_data, indent=2)};

export const FACULTY_MEMBERS = [
  {{
    id: 1,
    user_id: 2,
    emp_id: 'EMP_CSE_01',
    name: 'Dr. Kavitha Raman',
    email: 'kavitha@college.edu',
    phone: '9840123456',
    department_id: 3,
    department: 'Computer Science and Engineering',
    designation: 'Professor & HOD'
  }}
];

export const SUBJECTS = [
  {{ id: 1, code: 'EC601', name: 'Digital Signal Processing', department_id: 1, semester: 6, credits: 4 }},
  {{ id: 2, code: 'EC602', name: 'VLSI Design & Embedded Systems', department_id: 1, semester: 6, credits: 4 }},
  {{ id: 3, code: 'EC603', name: 'Wireless Communication Networks', department_id: 1, semester: 6, credits: 3 }},
  {{ id: 4, code: 'IT601', name: 'Cloud Computing & Virtualization', department_id: 2, semester: 6, credits: 4 }},
  {{ id: 5, code: 'IT602', name: 'Full-Stack Web Development', department_id: 2, semester: 6, credits: 4 }},
  {{ id: 6, code: 'IT603', name: 'Information Security & Cryptography', department_id: 2, semester: 6, credits: 3 }},
  {{ id: 7, code: 'CS601', name: 'Design and Analysis of Algorithms', department_id: 3, semester: 6, credits: 4 }},
  {{ id: 8, code: 'CS602', name: 'Artificial Intelligence & Machine Learning', department_id: 3, semester: 6, credits: 4 }},
  {{ id: 9, code: 'CS603', name: 'Database Engineering & Distributed Systems', department_id: 3, semester: 6, credits: 3 }}
];

export const QUIZZES = [
  {{
    id: 1,
    title: 'Design & Analysis of Algorithms — Unit 1 Assessment',
    description: 'Fundamental complexity classes, divide & conquer, recurrence relations.',
    subject_id: 7,
    subject_code: 'CS601',
    subject_name: 'Design and Analysis of Algorithms',
    faculty_id: 1,
    department_id: 3,
    semester: 6,
    section: 'A',
    duration_minutes: 30,
    total_marks: 10.0,
    deadline: new Date(Date.now() + 86400000 * 2).toISOString(),
    status: 'published',
    results_published: true, // Released: students can view marks!
    questions: [
      {{
        id: 1,
        question_text: 'What is the time complexity of building a max heap of n elements?',
        question_type: 'mcq',
        marks: 2.5,
        options: [
          {{ id: 'A', text: 'O(n)' }},
          {{ id: 'B', text: 'O(n log n)' }},
          {{ id: 'C', text: 'O(n^2)' }},
          {{ id: 'D', text: 'O(log n)' }}
        ],
        correct_answer: 'A',
        explanation: 'Using Floyd algorithm, max-heap is built in linear O(n) time.'
      }},
      {{
        id: 2,
        question_text: 'Which algorithmic paradigm does Floyd-Warshall algorithm use?',
        question_type: 'mcq',
        marks: 2.5,
        options: [
          {{ id: 'A', text: 'Greedy' }},
          {{ id: 'B', text: 'Dynamic Programming' }},
          {{ id: 'C', text: 'Divide and Conquer' }},
          {{ id: 'D', text: 'Backtracking' }}
        ],
        correct_answer: 'B',
        explanation: 'Floyd-Warshall solves all-pairs shortest paths using Dynamic Programming.'
      }},
      {{
        id: 3,
        question_text: 'What is the worst-case time complexity of QuickSort?',
        question_type: 'mcq',
        marks: 2.5,
        options: [
          {{ id: 'A', text: 'O(n log n)' }},
          {{ id: 'B', text: 'O(n^2)' }},
          {{ id: 'C', text: 'O(n)' }},
          {{ id: 'D', text: 'O(log n)' }}
        ],
        correct_answer: 'B',
        explanation: 'When the pivot is the extreme element consistently, QuickSort degrades to O(n^2).'
      }},
      {{
        id: 4,
        question_text: 'Master theorem cannot be applied to which recurrence?',
        question_type: 'mcq',
        marks: 2.5,
        options: [
          {{ id: 'A', text: 'T(n) = 2T(n/2) + n' }},
          {{ id: 'B', text: 'T(n) = 4T(n/2) + n^2' }},
          {{ id: 'C', text: 'T(n) = 2T(n/2) + n/log n' }},
          {{ id: 'D', text: 'T(n) = T(n/3) + 1' }}
        ],
        correct_answer: 'C',
        explanation: 'Master theorem requires polynomial bounds, not logarithmic quotients.'
      }}
    ]
  }},
  {{
    id: 2,
    title: 'Distributed Systems & Cloud Architecture Test',
    description: 'Consensus protocols, CAP theorem, distributed transactions, and microservices.',
    subject_id: 9,
    subject_code: 'CS603',
    subject_name: 'Database Engineering & Distributed Systems',
    faculty_id: 1,
    department_id: 3,
    semester: 6,
    section: 'A',
    duration_minutes: 45,
    total_marks: 10.0,
    deadline: new Date(Date.now() + 86400000 * 4).toISOString(),
    status: 'published',
    results_published: false, // HIDDEN from students until faculty explicitly releases!
    questions: [
      {{
        id: 5,
        question_text: 'According to the CAP Theorem, which two properties can be guaranteed in the presence of a network partition?',
        question_type: 'mcq',
        marks: 2.5,
        options: [
          {{ id: 'A', text: 'Consistency and Availability' }},
          {{ id: 'B', text: 'Consistency or Availability with Partition Tolerance' }},
          {{ id: 'C', text: 'Neither' }},
          {{ id: 'D', text: 'Durability and Isolation' }}
        ],
        correct_answer: 'B',
        explanation: 'In a network partition, you must trade off Consistency vs Availability.'
      }},
      {{
        id: 6,
        question_text: 'What consensus protocol is primarily utilized by Apache Kafka for partition leader election?',
        question_type: 'mcq',
        marks: 2.5,
        options: [
          {{ id: 'A', text: 'Raft (KRaft)' }},
          {{ id: 'B', text: 'Paxos' }},
          {{ id: 'C', text: 'Two-Phase Commit' }},
          {{ id: 'D', text: 'Byzantine Fault Tolerance' }}
        ],
        correct_answer: 'A',
        explanation: 'Modern Kafka uses KRaft (an event-driven implementation of Raft).'
      }},
      {{
        id: 7,
        question_text: 'What is the primary role of a Circuit Breaker in microservices?',
        question_type: 'mcq',
        marks: 2.5,
        options: [
          {{ id: 'A', text: 'Data encryption' }},
          {{ id: 'B', text: 'Prevent cascading failures by failing fast' }},
          {{ id: 'C', text: 'Load balancing across clusters' }},
          {{ id: 'D', text: 'Automated testing' }}
        ],
        correct_answer: 'B',
        explanation: 'A circuit breaker protects upstream dependencies from cascade failures.'
      }},
      {{
        id: 8,
        question_text: 'Which ACID property is relaxed in BASE architecture of distributed NoSQL databases?',
        question_type: 'mcq',
        marks: 2.5,
        options: [
          {{ id: 'A', text: 'Atomicity' }},
          {{ id: 'B', text: 'Strict Consistency (in favor of Eventual Consistency)' }},
          {{ id: 'C', text: 'Durability' }},
          {{ id: 'D', text: 'Isolation' }}
        ],
        correct_answer: 'B',
        explanation: 'BASE stands for Basically Available, Soft state, Eventual consistency.'
      }}
    ]
  }}
];

export const ASSIGNMENTS = [
  {{
    id: 1,
    title: 'Full-Stack React + Supabase Cloud Mini-Project',
    description: 'Build a real-time reactive college portal with role-based auth, storage uploads, and database triggers.',
    subject_id: 8,
    subject_code: 'CS602',
    subject_name: 'Artificial Intelligence & Machine Learning',
    faculty_id: 1,
    department_id: 3,
    semester: 6,
    section: 'A',
    due_date: new Date(Date.now() + 86400000 * 5).toISOString().split('T')[0],
    due_time: '23:59',
    max_marks: 10.0,
    allowed_file_types: 'pdf,docx,zip,txt',
    max_file_size_mb: 10,
    submission_format: 'both',
    allow_resubmission: true,
    allow_late: true,
    reminder_interval_minutes: 60,
    status: 'published'
  }}
];

export const ANNOUNCEMENTS = [
  {{
    id: 1,
    title: 'Annual Tech Symposium & Hackathon Registrations Open',
    description: 'The Department of CSE is hosting "InnoHack 2026" featuring track prizes, cloud credits, and industry mentorship. Register your 4-member teams on the portal before Friday.',
    category: 'General Announcement',
    audience_type: 'all',
    status: 'published',
    created_at: new Date(Date.now() - 86400000 * 2).toISOString()
  }},
  {{
    id: 2,
    title: 'Continuous Internal Assessment (CIA-2) Timetable Released',
    description: 'The CIA-2 examination schedule for Semesters 4 and 6 is now published. Please review your subject-wise exam venues and hall ticket guidelines on the student portal.',
    category: 'Academic Notification',
    audience_type: 'department',
    target_department_id: 3,
    status: 'published',
    created_at: new Date(Date.now() - 86400000 * 1).toISOString()
  }},
  {{
    id: 3,
    title: 'Campus Placement Drive: Top Tier Cloud Solutions Visiting Next Month',
    description: 'Pre-placement talks and coding aptitude assessments for 2026 graduating batches will commence next Tuesday in the main auditorium. Eligible candidates must ensure updated resumes.',
    category: 'Placement Circular',
    audience_type: 'all',
    status: 'published',
    created_at: new Date(Date.now() - 86400000 * 3).toISOString()
  }}
];
"""

os.makedirs("c:/Users/Avinaash Sri/OneDrive/Documents/cloud_based_erp/frontend/src/lib", exist_ok=True)
with open("c:/Users/Avinaash Sri/OneDrive/Documents/cloud_based_erp/frontend/src/lib/dataStore.js", "w", encoding="utf-8") as f:
    f.write(output_content)

print(f"Generated frontend/src/lib/dataStore.js with {len(students_data)} students across 3 departments.")
