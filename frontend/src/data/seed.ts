/**
 * Demo seed data generator. All people, records and figures here are FICTIONAL sample data
 * used to demonstrate the platform. Dates are generated relative to "today" so the demo always looks current.
 * The same generator is exported to backend/data/seed.json via `npm run export-seed`.
 */
import type {
  AttendanceRecord, Announcement, Assignment, Bus, BusRoute, Circular, ClassRoom, CollectionMap, Driver, Enquiry,
  Exam, ExamResult, FeeStructure, GalleryItem, Homework, LeaveRequest, AppNotification, Payment, SchoolEvent,
  Student, StudentFee, StudyMaterial, Subject, Submission, Teacher, TimetableEntry, User, Weekday,
} from '@/types';
import { avatar, demoVideos, img, thumb } from './images';

// ---------- helpers ----------
function rng(seed: number) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const pad = (n: number) => String(n).padStart(2, '0');
export const iso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const dayOffset = (base: Date, n: number) => { const d = new Date(base); d.setDate(d.getDate() + n); return d; };
/** next school day (skip Sunday) */
const schoolDay = (base: Date, n: number) => { let d = dayOffset(base, n); if (d.getDay() === 0) d = dayOffset(d, 1); return iso(d); };

const gradeFor = (pct: number) => (pct >= 91 ? 'A1' : pct >= 81 ? 'A2' : pct >= 71 ? 'B1' : pct >= 61 ? 'B2' : pct >= 51 ? 'C1' : pct >= 41 ? 'C2' : pct >= 33 ? 'D' : 'E');
export { gradeFor };

// ---------- static masters ----------
export const CLASSES: ClassRoom[] = [
  { id: 'nur', name: 'Nursery', order: 0, stage: 'Pre-Primary', sections: ['A'] },
  { id: 'lkg', name: 'LKG', order: 1, stage: 'Pre-Primary', sections: ['A'] },
  { id: 'ukg', name: 'UKG', order: 2, stage: 'Pre-Primary', sections: ['A'] },
  ...Array.from({ length: 10 }, (_, i): ClassRoom => ({
    id: `c${i + 1}`,
    name: `Class ${i + 1}`,
    order: i + 3,
    stage: i < 5 ? 'Primary' : i < 8 ? 'Middle' : 'Secondary',
    sections: i + 1 === 8 || i + 1 === 4 ? ['A', 'B'] : ['A'],
  })),
];

const SUBJECT_SETS: Record<string, string[]> = {
  pre: ['English', 'Hindi', 'Numbers', 'Environment Awareness', 'Art & Craft', 'Rhymes & Music'],
  primary: ['English', 'Hindi', 'Mathematics', 'EVS', 'Computer', 'General Knowledge', 'Art'],
  middle: ['English', 'Hindi', 'Mathematics', 'Science', 'Social Science', 'Sanskrit', 'Computer'],
  secondary: ['English', 'Hindi', 'Mathematics', 'Science', 'Social Science', 'Information Technology'],
};
export const subjectsForClass = (classId: string) => {
  const c = CLASSES.find((x) => x.id === classId);
  if (!c) return SUBJECT_SETS.middle;
  return c.stage === 'Pre-Primary' ? SUBJECT_SETS.pre : c.stage === 'Primary' ? SUBJECT_SETS.primary : c.stage === 'Middle' ? SUBJECT_SETS.middle : SUBJECT_SETS.secondary;
};

function buildSubjects(): Subject[] {
  const all = new Map<string, Subject>();
  CLASSES.forEach((c) => {
    subjectsForClass(c.id).forEach((name) => {
      const key = name.toLowerCase().replace(/[^a-z]+/g, '-');
      const s = all.get(key) ?? { id: `sub-${key}`, name, code: name.slice(0, 3).toUpperCase() + (all.size + 101), classIds: [] };
      s.classIds.push(c.id);
      all.set(key, s);
    });
  });
  return [...all.values()];
}

const TEACHERS: Teacher[] = [
  { id: 't1', empId: 'SPS-T-014', name: 'Neha Mathur', email: 'teacher@schooldemo.com', phone: '+91 90000 10001', designation: 'TGT – Science', qualification: 'M.Sc. (Chemistry), B.Ed.', subjects: ['Science'], classes: ['c8-A', 'c8-B', 'c7-A', 'c6-A'], joinDate: '2016-07-01', status: 'Active' },
  { id: 't2', empId: 'SPS-T-007', name: 'Rakesh Choudhary', email: 'rakesh.c@schooldemo.com', phone: '+91 90000 10002', designation: 'TGT – Mathematics', qualification: 'M.Sc. (Mathematics), B.Ed.', subjects: ['Mathematics'], classes: ['c8-A', 'c8-B', 'c9-A', 'c10-A'], joinDate: '2012-04-10', status: 'Active' },
  { id: 't3', empId: 'SPS-T-021', name: 'Priya Vyas', email: 'priya.v@schooldemo.com', phone: '+91 90000 10003', designation: 'TGT – English', qualification: 'M.A. (English), B.Ed.', subjects: ['English'], classes: ['c8-A', 'c8-B', 'c7-A', 'c10-A'], joinDate: '2018-07-02', status: 'Active' },
  { id: 't4', empId: 'SPS-T-009', name: 'Suresh Kumawat', email: 'suresh.k@schooldemo.com', phone: '+91 90000 10004', designation: 'TGT – Social Science', qualification: 'M.A. (History), B.Ed.', subjects: ['Social Science'], classes: ['c8-A', 'c8-B', 'c9-A'], joinDate: '2014-07-01', status: 'Active' },
  { id: 't5', empId: 'SPS-T-011', name: 'Kavita Joshi', email: 'kavita.j@schooldemo.com', phone: '+91 90000 10005', designation: 'TGT – Hindi & Sanskrit', qualification: 'M.A. (Hindi), B.Ed.', subjects: ['Hindi', 'Sanskrit'], classes: ['c8-A', 'c8-B', 'c6-A'], joinDate: '2015-07-01', status: 'Active' },
  { id: 't6', empId: 'SPS-T-025', name: 'Amit Agarwal', email: 'amit.a@schooldemo.com', phone: '+91 90000 10006', designation: 'Computer Instructor', qualification: 'MCA', subjects: ['Computer', 'Information Technology'], classes: ['c8-A', 'c8-B', 'c4-A', 'c10-A'], joinDate: '2019-07-01', status: 'Active' },
  { id: 't7', empId: 'SPS-T-003', name: 'Meenakshi Sharma', email: 'meenakshi.s@schooldemo.com', phone: '+91 90000 10007', designation: 'PRT – Class Teacher 4-A', qualification: 'B.A., B.Ed.', subjects: ['English', 'EVS', 'General Knowledge'], classes: ['c4-A', 'c4-B', 'c3-A'], joinDate: '2011-04-05', status: 'Active' },
  { id: 't8', empId: 'SPS-T-018', name: 'Dinesh Prajapat', email: 'dinesh.p@schooldemo.com', phone: '+91 90000 10008', designation: 'PRT – Mathematics', qualification: 'B.Sc., B.Ed.', subjects: ['Mathematics', 'Hindi'], classes: ['c4-A', 'c4-B', 'c5-A'], joinDate: '2017-07-01', status: 'Active' },
  { id: 't9', empId: 'SPS-T-030', name: 'Pooja Rathore', email: 'pooja.r@schooldemo.com', phone: '+91 90000 10009', designation: 'Pre-Primary Coordinator', qualification: 'B.A., NTT', subjects: ['English', 'Rhymes & Music', 'Art & Craft'], classes: ['nur-A', 'lkg-A', 'ukg-A'], joinDate: '2020-07-01', status: 'Active' },
  { id: 't10', empId: 'SPS-T-012', name: 'Harish Gehlot', email: 'harish.g@schooldemo.com', phone: '+91 90000 10010', designation: 'Physical Education Teacher', qualification: 'B.P.Ed.', subjects: ['Physical Education'], classes: ['c6-A', 'c7-A', 'c8-A', 'c8-B'], joinDate: '2013-07-01', status: 'On Leave' },
  { id: 't11', empId: 'SPS-T-016', name: 'Sunita Bhati', email: 'sunita.b@schooldemo.com', phone: '+91 90000 10011', designation: 'PRT – Art', qualification: 'B.F.A.', subjects: ['Art', 'Art & Craft'], classes: ['c4-A', 'c4-B', 'c5-A'], joinDate: '2018-04-02', status: 'Active' },
].map((t) => ({ ...t, photo: avatar(t.name, 'E8EDF5', '172E56') })) as Teacher[];

const teacherFor = (classId: string, section: string, subject: string) =>
  TEACHERS.find((t) => t.subjects.includes(subject) && t.classes.includes(`${classId}-${section}`))?.name ??
  TEACHERS.find((t) => t.subjects.includes(subject))?.name ?? 'To be assigned';

// ---------- transport (SIMULATED coordinates around Beawar town) ----------
const SCHOOL_PT: [number, number] = [26.1052, 74.3268];
function densify(points: [number, number][], steps = 8): [number, number][] {
  const out: [number, number][] = [];
  for (let i = 0; i < points.length - 1; i++) {
    const [a, b] = [points[i], points[i + 1]];
    for (let s = 0; s < steps; s++) out.push([a[0] + ((b[0] - a[0]) * s) / steps, a[1] + ((b[1] - a[1]) * s) / steps]);
  }
  out.push(points[points.length - 1]);
  return out;
}
function makeRoute(id: string, code: string, name: string, stops: [string, number, number, string][]): BusRoute {
  const all: [string, number, number, string][] = [...stops, ['School Campus', SCHOOL_PT[0], SCHOOL_PT[1], stops.length ? addMin(stops[stops.length - 1][3], 10) : '07:40']];
  return {
    id, code, name,
    stops: all.map(([n, lat, lng, time], i) => ({ id: `${id}-s${i + 1}`, name: n, lat, lng, time })),
    path: densify(all.map(([, lat, lng]) => [lat, lng] as [number, number]), 10),
  };
}
function addMin(t: string, m: number) { const [h, mm] = t.split(':').map(Number); const tot = h * 60 + mm + m; return `${pad(Math.floor(tot / 60))}:${pad(tot % 60)}`; }

const ROUTES: BusRoute[] = [
  makeRoute('r1', 'R-01', 'Ajmeri Gate – Sendra Road', [
    ['Ajmeri Gate', 26.0958, 74.3142, '07:05'], ['Chang Gate', 26.0991, 74.3178, '07:12'], ['Mewari Gate', 26.1006, 74.3221, '07:18'],
    ['Nehru Gate', 26.1027, 74.3236, '07:24'], ['Sendra Road Crossing', 26.1041, 74.3252, '07:30'],
  ]),
  makeRoute('r2', 'R-02', 'Bijaynagar Road – Surajpole', [
    ['Bijaynagar Road', 26.1171, 74.3301, '07:00'], ['Krishna Colony', 26.1139, 74.3287, '07:08'], ['Surajpole Gate', 26.1096, 74.3262, '07:16'],
    ['Pali Bazar', 26.1072, 74.3249, '07:23'],
  ]),
  makeRoute('r3', 'R-03', 'Udaipur Road – Railway Station', [
    ['Udaipur Road', 26.0872, 74.3189, '06:55'], ['Railway Station', 26.0934, 74.3236, '07:05'], ['Collectorate Circle', 26.0989, 74.3281, '07:14'],
    ['Housing Board', 26.1021, 74.3302, '07:22'],
  ]),
];

const DRIVERS: Driver[] = [
  { id: 'd1', name: 'Ramesh Singh', phone: '+91 90000 20001', licenseNo: 'RJ36 2009 00XXXX1', experienceYears: 14 },
  { id: 'd2', name: 'Mohan Lal Jat', phone: '+91 90000 20002', licenseNo: 'RJ36 2012 00XXXX2', experienceYears: 11 },
  { id: 'd3', name: 'Bhanwar Singh', phone: '+91 90000 20003', licenseNo: 'RJ36 2015 00XXXX3', experienceYears: 8 },
].map((d) => ({ ...d, photo: avatar(d.name, 'F5EBCD', '5B3F21') }));

const BUSES: Bus[] = [
  { id: 'b1', number: 'Bus 01', registration: 'RJ-36-PA-XXX1 (demo)', capacity: 40, driverId: 'd1', routeId: 'r1', attendantName: 'Geeta Devi', status: 'Active' },
  { id: 'b2', number: 'Bus 02', registration: 'RJ-36-PA-XXX2 (demo)', capacity: 32, driverId: 'd2', routeId: 'r2', attendantName: 'Sarla Kanwar', status: 'Active' },
  { id: 'b3', number: 'Bus 03', registration: 'RJ-36-PA-XXX3 (demo)', capacity: 40, driverId: 'd3', routeId: 'r3', attendantName: 'Kamla Devi', status: 'Active' },
];

// ---------- students ----------
const BOYS = ['Aarav', 'Vihaan', 'Arjun', 'Kabir', 'Reyansh', 'Ishaan', 'Dhruv', 'Yash', 'Krishna', 'Lakshya', 'Aditya', 'Harsh', 'Parth', 'Tanmay', 'Rudra', 'Devansh', 'Shaurya', 'Mohit', 'Nikhil', 'Pranav'];
const GIRLS = ['Ananya', 'Diya', 'Saanvi', 'Aadhya', 'Myra', 'Kavya', 'Riya', 'Ishita', 'Khushi', 'Tanvi', 'Navya', 'Pari', 'Jhanvi', 'Siya', 'Muskan', 'Avni', 'Nandini', 'Prachi', 'Sneha', 'Bhavya'];
const SURNAMES = ['Sharma', 'Agarwal', 'Jain', 'Choudhary', 'Rathore', 'Mehta', 'Kumawat', 'Soni', 'Prajapat', 'Gehlot', 'Vyas', 'Maheshwari', 'Mathur', 'Bansal', 'Khandelwal', 'Purohit'];
const FATHERS = ['Rajesh', 'Mahesh', 'Sunil', 'Anil', 'Manoj', 'Vikas', 'Deepak', 'Sanjay', 'Ashok', 'Pankaj', 'Naresh', 'Kamal'];
const MOTHERS = ['Sunita', 'Rekha', 'Anita', 'Seema', 'Pooja', 'Kiran', 'Neelam', 'Manju', 'Sapna', 'Ritu', 'Shilpa', 'Lata'];
const BLOOD = ['A+', 'B+', 'O+', 'AB+', 'B-', 'O-'];

function buildStudents(r: () => number): Student[] {
  const pick = <T,>(a: T[]) => a[Math.floor(r() * a.length)];
  const out: Student[] = [
    { id: 's1', admissionNo: 'SPS/2019/0142', name: 'Aarav Sharma', gender: 'Male', dob: '2013-05-14', classId: 'c8', section: 'A', rollNo: 1, fatherName: 'Rajesh Sharma', motherName: 'Sunita Sharma', phone: '+91 90000 30001', email: 'parent@schooldemo.com', address: 'Near Mewari Gate, Beawar (demo address)', bloodGroup: 'B+', admissionDate: '2019-04-08', status: 'Active', busRouteId: 'r1', stopId: 'r1-s3' },
    { id: 's2', admissionNo: 'SPS/2023/0388', name: 'Ananya Sharma', gender: 'Female', dob: '2017-09-02', classId: 'c4', section: 'A', rollNo: 1, fatherName: 'Rajesh Sharma', motherName: 'Sunita Sharma', phone: '+91 90000 30001', email: 'parent@schooldemo.com', address: 'Near Mewari Gate, Beawar (demo address)', bloodGroup: 'O+', admissionDate: '2023-04-05', status: 'Active', busRouteId: 'r2', stopId: 'r2-s3' },
  ];
  const plan: [string, string, number][] = [['c8', 'A', 11], ['c8', 'B', 8], ['c4', 'A', 7], ['c4', 'B', 4], ['c7', 'A', 4], ['c10', 'A', 4], ['c6', 'A', 3], ['ukg', 'A', 3], ['c1', 'A', 3], ['c9', 'A', 3]];
  let n = 3;
  plan.forEach(([classId, section, count]) => {
    const startRoll = out.filter((s) => s.classId === classId && s.section === section).length + 1;
    for (let i = 0; i < count; i++) {
      const male = r() > 0.5;
      const first = pick(male ? BOYS : GIRLS);
      const last = pick(SURNAMES);
      const order = CLASSES.find((c) => c.id === classId)!.order;
      const year = 2026 - (order + 3) - 1;
      const route = r() > 0.35 ? ROUTES[Math.floor(r() * ROUTES.length)] : undefined;
      out.push({
        id: `s${n}`, admissionNo: `SPS/${2019 + Math.floor(r() * 7)}/${String(100 + n * 7).padStart(4, '0')}`,
        name: `${first} ${last}`, gender: male ? 'Male' : 'Female',
        dob: `${year}-${pad(1 + Math.floor(r() * 12))}-${pad(1 + Math.floor(r() * 27))}`,
        classId, section, rollNo: startRoll + i, fatherName: `${pick(FATHERS)} ${last}`, motherName: `${pick(MOTHERS)} ${last}`,
        phone: `+91 90000 3${String(1000 + n).slice(-4)}`, address: 'Beawar, Rajasthan (demo address)',
        bloodGroup: pick(BLOOD), admissionDate: '2022-04-04', status: 'Active',
        busRouteId: route?.id, stopId: route ? route.stops[Math.floor(r() * (route.stops.length - 1))].id : undefined,
      });
      n++;
    }
  });
  return out.map((s) => ({ ...s, photo: s.photo ?? avatar(s.name, s.gender === 'Male' ? 'D9E1EE' : 'F5EBCD', s.gender === 'Male' ? '172E56' : '6D4B23') }));
}

// ---------- generator ----------
export function buildSeed(today = new Date()): { [K in keyof CollectionMap]: CollectionMap[K][] } {
  const r = rng(20262027);
  const t0 = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const students = buildStudents(r);
  const subjects = buildSubjects();
  const classes = CLASSES.map((c) => ({ ...c, classTeacherId: c.id === 'c8' ? 't1' : c.id === 'c4' ? 't7' : c.id === 'ukg' ? 't9' : undefined }));

  const users: User[] = [
    { id: 'u-admin', name: 'Administrator', email: 'admin@schooldemo.com', role: 'admin', phone: '+91 90000 00001' },
    { id: 'u-office', name: 'Office Desk', email: 'office@schooldemo.com', role: 'office', phone: '+91 90000 00002' },
    { id: 'u-parent', name: 'Rajesh Sharma', email: 'parent@schooldemo.com', role: 'parent', phone: '+91 90000 30001', studentIds: ['s1', 's2'] },
    { id: 'u-teacher', name: 'Neha Mathur', email: 'teacher@schooldemo.com', role: 'teacher', phone: '+91 90000 10001', teacherId: 't1' },
    { id: 'u-student', name: 'Aarav Sharma', email: 'student@schooldemo.com', role: 'student', studentId: 's1' },
  ].map((u) => ({ ...u, avatar: avatar(u.name) })) as User[];

  // timetable for class-sections that have students
  const DAYS: Weekday[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const TIMES = ['08:00 – 08:40', '08:40 – 09:20', '09:20 – 10:00', '10:20 – 11:00', '11:00 – 11:40', '11:40 – 12:20', '12:20 – 01:00'];
  const sections = [...new Set(students.map((s) => `${s.classId}|${s.section}`))].map((k) => k.split('|'));
  const timetable: TimetableEntry[] = [];
  sections.forEach(([classId, section]) => {
    const subs = [...subjectsForClass(classId)];
    DAYS.forEach((day, di) => {
      TIMES.forEach((time, pi) => {
        const subject = pi === 6 && (di === 2 || di === 5) ? (classId.startsWith('c') ? 'Physical Education' : 'Play Time') : subs[(pi + di * 2) % subs.length];
        timetable.push({ id: `tt-${classId}-${section}-${day}-${pi + 1}`, classId, section, day, period: pi + 1, time, subject, teacherName: teacherFor(classId, section, subject) });
      });
    });
  });

  // attendance: last ~110 days (Mon–Sat), with a couple of holidays
  const attendance: AttendanceRecord[] = [];
  const holidays = new Set([iso(dayOffset(t0, -26)), iso(dayOffset(t0, -45)), iso(dayOffset(t0, -73))]);
  for (let back = 110; back >= 1; back--) {
    const d = dayOffset(t0, -back);
    if (d.getDay() === 0) continue;
    const ds = iso(d);
    students.forEach((s) => {
      const x = r();
      const status = holidays.has(ds) ? 'H' : x < 0.045 ? 'A' : x < 0.07 ? 'L' : 'P';
      attendance.push({ id: `at-${s.id}-${ds}`, studentId: s.id, date: ds, status });
    });
  }

  const homework: Homework[] = [
    { id: 'hw1', classId: 'c8', section: 'A', subject: 'Science', title: 'Cell structure diagram', description: 'Draw and label a plant cell and an animal cell in your notebook. Write 5 differences between them.', assignedDate: schoolDay(t0, -1), dueDate: schoolDay(t0, 2), teacherName: 'Neha Mathur' },
    { id: 'hw2', classId: 'c8', section: 'A', subject: 'Mathematics', title: 'Exercise 7.2 – Cubes and cube roots', description: 'Solve questions 1 to 12 of Exercise 7.2. Show prime factorisation for each.', assignedDate: iso(t0), dueDate: schoolDay(t0, 1), teacherName: 'Rakesh Choudhary' },
    { id: 'hw3', classId: 'c8', section: 'A', subject: 'English', title: 'Letter to the editor', description: 'Write a letter to the editor of a local newspaper about the need for more trees in your locality (120–150 words).', assignedDate: schoolDay(t0, -3), dueDate: schoolDay(t0, -1), teacherName: 'Priya Vyas' },
    { id: 'hw4', classId: 'c8', section: 'A', subject: 'Social Science', title: 'Map work – Indian states', description: 'Mark the major rivers of India on the outline map provided in class.', assignedDate: schoolDay(t0, -2), dueDate: schoolDay(t0, 3), teacherName: 'Suresh Kumawat' },
    { id: 'hw5', classId: 'c4', section: 'A', subject: 'EVS', title: 'My family tree', description: 'Make a family tree with photographs or drawings of three generations.', assignedDate: schoolDay(t0, -1), dueDate: schoolDay(t0, 4), teacherName: 'Meenakshi Sharma' },
    { id: 'hw6', classId: 'c4', section: 'A', subject: 'Mathematics', title: 'Multiplication tables 12–15', description: 'Learn and write tables 12 to 15 neatly in the maths notebook.', assignedDate: iso(t0), dueDate: schoolDay(t0, 2), teacherName: 'Dinesh Prajapat' },
    { id: 'hw7', classId: 'c8', section: 'B', subject: 'Science', title: 'Cell structure diagram', description: 'Draw and label a plant cell and an animal cell in your notebook.', assignedDate: schoolDay(t0, -1), dueDate: schoolDay(t0, 2), teacherName: 'Neha Mathur' },
  ];

  // exams: half-yearly schedule (upcoming) for each class with students
  const exams: Exam[] = [];
  [...new Set(students.map((s) => s.classId))].forEach((classId) => {
    subjectsForClass(classId).slice(0, 6).forEach((subject, i) => {
      exams.push({ id: `ex-${classId}-${i}`, name: 'Half-Yearly Examination', classId, subject, date: schoolDay(t0, 18 + i * 2), time: '09:00 AM – 12:00 PM', maxMarks: classId.startsWith('c') ? 80 : 50, room: `Exam Hall ${1 + (i % 3)}` });
    });
  });

  // results: Unit Test 1 & 2 + Periodic Test
  const results: ExamResult[] = [];
  students.forEach((s) => {
    const ability = 0.55 + r() * 0.4;
    ['Unit Test 1', 'Unit Test 2', 'Periodic Test 1'].forEach((examName, ei) => {
      subjectsForClass(s.classId).slice(0, 6).forEach((subject) => {
        const max = examName === 'Periodic Test 1' ? 40 : 20;
        const pct = Math.min(1, Math.max(0.3, ability + (r() - 0.5) * 0.2 + ei * 0.03));
        const marks = Math.round(pct * max);
        results.push({ id: `rs-${s.id}-${ei}-${subject}`, studentId: s.id, examName, subject, marks, maxMarks: max, grade: gradeFor((marks / max) * 100) });
      });
    });
  });

  const announcements: Announcement[] = [
    { id: 'an1', title: 'Half-Yearly Examination schedule released', body: 'The Half-Yearly Examination date sheet for Classes 1 to 10 is now available in the portal under Examinations. Parents are requested to ensure regular revision at home.', date: iso(dayOffset(t0, -1)), audience: 'all', author: 'Examination Cell', priority: 'high', pinned: true },
    { id: 'an2', title: 'Parent–Teacher Meeting on Saturday', body: 'A Parent–Teacher Meeting for Classes 6 to 10 will be held this Saturday from 9:00 AM to 12:00 PM. Kindly collect the progress report from the class teacher.', date: iso(dayOffset(t0, -2)), audience: 'parents', author: 'Principal Office', priority: 'normal' },
    { id: 'an3', title: 'Winter uniform from 1st December', body: 'Students are required to wear the complete winter uniform (navy blazer / pullover) from 1st December onwards.', date: iso(dayOffset(t0, -4)), audience: 'all', author: 'Administration', priority: 'normal' },
    { id: 'an4', title: 'Inter-house Science Exhibition', body: 'Students of Classes 6–10 can register their models with their Science teachers. Best projects will be displayed during the Annual Day.', date: iso(dayOffset(t0, -6)), audience: 'students', author: 'Science Department', priority: 'normal' },
    { id: 'an5', title: 'Staff meeting – academic review', body: 'All teaching staff to assemble in the conference room after school hours on Friday for the mid-term academic review.', date: iso(dayOffset(t0, -3)), audience: 'teachers', author: 'Principal Office', priority: 'normal' },
    { id: 'an6', title: 'Third instalment of fees due', body: 'The third quarterly instalment of the 2026-27 session is due by 20 November. Pay online through the Fees Portal to avoid a late fee.', date: iso(dayOffset(t0, -5)), audience: 'parents', author: 'Accounts Office', priority: 'high' },
  ];

  const circulars: Circular[] = [
    { id: 'ci1', title: 'Half-Yearly Examination Date Sheet 2026-27', refNo: 'SPS/CIR/2026/041', date: iso(dayOffset(t0, -1)), description: 'Date sheet and syllabus guidelines for the Half-Yearly Examination.', fileName: 'half-yearly-datesheet.pdf', audience: 'all' },
    { id: 'ci2', title: 'Winter Timings for School', refNo: 'SPS/CIR/2026/039', date: iso(dayOffset(t0, -8)), description: 'Revised school and bus timings effective from 1 December.', fileName: 'winter-timings.pdf', audience: 'parents' },
    { id: 'ci3', title: 'Educational Excursion – Consent Form', refNo: 'SPS/CIR/2026/036', date: iso(dayOffset(t0, -15)), description: 'Consent form for the educational excursion of Classes 8–10.', fileName: 'excursion-consent.pdf', audience: 'parents' },
    { id: 'ci4', title: 'Diwali Vacation Notice', refNo: 'SPS/CIR/2026/033', date: iso(dayOffset(t0, -30)), description: 'School will remain closed for Diwali vacation as per the academic calendar.', fileName: 'diwali-vacation.pdf', audience: 'all' },
  ];

  const events: SchoolEvent[] = [
    { id: 'ev1', title: 'Parent–Teacher Meeting', date: schoolDay(t0, 2), time: '09:00 AM – 12:00 PM', venue: 'Respective classrooms', description: 'Discussion of mid-term progress with class teachers.', category: 'Meeting' },
    { id: 'ev2', title: "Children's Day Celebration", date: iso(dayOffset(t0, 2)), time: '10:00 AM', venue: 'School Auditorium', description: 'Special assembly and cultural programme presented by teachers.', category: 'Cultural' },
    { id: 'ev3', title: 'Inter-house Football Tournament', date: schoolDay(t0, 8), time: '08:00 AM onwards', venue: 'School Playground', description: 'Finals of the inter-house football tournament.', category: 'Sports' },
    { id: 'ev4', title: 'Science Exhibition', date: schoolDay(t0, 13), time: '10:00 AM – 1:00 PM', venue: 'Activity Hall', description: 'Students showcase working models and experiments.', category: 'Academic' },
    { id: 'ev5', title: 'Half-Yearly Examinations begin', date: schoolDay(t0, 18), time: '09:00 AM', venue: 'Examination Halls', description: 'Refer to the date sheet for subject-wise schedule.', category: 'Academic' },
    { id: 'ev6', title: 'Annual Day Function', date: schoolDay(t0, 45), time: '05:00 PM', venue: 'School Campus', description: 'Annual cultural evening and prize distribution.', category: 'Cultural' },
  ];

  const leaves: LeaveRequest[] = [
    { id: 'lv1', studentId: 's1', type: 'Sick', fromDate: iso(dayOffset(t0, -20)), toDate: iso(dayOffset(t0, -19)), reason: 'Viral fever – doctor advised rest.', status: 'Approved', appliedOn: iso(dayOffset(t0, -21)) },
    { id: 'lv2', studentId: 's2', type: 'Family', fromDate: schoolDay(t0, 6), toDate: schoolDay(t0, 6), reason: 'Attending a family wedding in Ajmer.', status: 'Pending', appliedOn: iso(dayOffset(t0, -1)) },
    { id: 'lv3', studentId: 's5', type: 'Sick', fromDate: iso(t0), toDate: schoolDay(t0, 1), reason: 'Stomach infection.', status: 'Pending', appliedOn: iso(t0) },
  ];

  const notifications: AppNotification[] = [
    { id: 'nt1', target: 'parent', title: 'Fee instalment due', message: 'Quarter 3 fees are due on 20 Nov. Pay online to avoid a late fee.', date: iso(dayOffset(t0, -1)), read: false, type: 'fee', link: '/fees' },
    { id: 'nt2', target: 'parent', title: 'New homework – Mathematics', message: 'Exercise 7.2 assigned to Aarav (Class 8-A).', date: iso(t0), read: false, type: 'homework', link: '/parent/homework' },
    { id: 'nt3', target: 'parent', title: 'Bus 01 is running on time', message: 'Morning trip departed Ajmeri Gate at 07:05.', date: iso(t0), read: true, type: 'transport', link: '/parent/transport' },
    { id: 'nt4', target: 'parent', title: 'Half-Yearly date sheet published', message: 'Check the Examinations section for the schedule.', date: iso(dayOffset(t0, -1)), read: false, type: 'exam', link: '/parent/exams' },
    { id: 'nt5', target: 'student', title: 'Assignment due tomorrow', message: 'Science – "Food chains & webs worksheet" is due tomorrow.', date: iso(t0), read: false, type: 'homework', link: '/student/assignments' },
    { id: 'nt6', target: 'student', title: 'New video lecture', message: 'Mathematics – Cubes & cube roots video has been uploaded.', date: iso(dayOffset(t0, -1)), read: false, type: 'info', link: '/student/videos' },
    { id: 'nt7', target: 'teacher', title: '3 new submissions', message: 'Students have submitted "Food chains & webs worksheet".', date: iso(t0), read: false, type: 'homework', link: '/teacher/submissions' },
    { id: 'nt8', target: 'teacher', title: 'Staff meeting on Friday', message: 'Mid-term academic review in the conference room.', date: iso(dayOffset(t0, -3)), read: true, type: 'event' },
    { id: 'nt9', target: 'admin', title: '2 new admission enquiries', message: 'New enquiries received through the website.', date: iso(t0), read: false, type: 'info', link: '/admin/enquiries' },
    { id: 'nt10', target: 'admin', title: 'Pending leave requests', message: 'Leave applications are awaiting approval.', date: iso(t0), read: false, type: 'info', link: '/admin/attendance' },
    { id: 'nt11', target: 'office', title: 'Fee collection reminder', message: 'Quarter 3 instalment due on 20 Nov – send reminders.', date: iso(dayOffset(t0, -1)), read: false, type: 'fee', link: '/office/fees' },
  ];

  // fees (DEMO amounts)
  const YEAR = '2026-27';
  const installments = [
    { label: 'Quarter 1 (Apr–Jun)', dueDate: '2026-04-15', percent: 25 },
    { label: 'Quarter 2 (Jul–Sep)', dueDate: '2026-07-15', percent: 25 },
    { label: 'Quarter 3 (Oct–Dec)', dueDate: '2026-11-20', percent: 25 },
    { label: 'Quarter 4 (Jan–Mar)', dueDate: '2027-01-15', percent: 25 },
  ];
  const feeStructures: FeeStructure[] = CLASSES.map((c) => {
    const base = 14000 + c.order * 1500;
    return {
      id: `fs-${c.id}`, classId: c.id, academicYear: YEAR, lateFeePerDay: 20, installments,
      items: [
        { category: 'Tuition Fee', amount: base },
        { category: 'Annual Charges', amount: 3500 },
        { category: 'Examination Fee', amount: 1200 },
        { category: c.stage === 'Pre-Primary' ? 'Activity Kit' : 'Computer & Lab Fee', amount: c.stage === 'Pre-Primary' ? 1500 : 2400 },
        { category: 'Sports & Co-curricular', amount: 1600 },
      ],
    };
  });
  const studentFees: StudentFee[] = students.map((s, i) => ({
    id: `sf-${s.id}`, studentId: s.id, structureId: `fs-${s.classId}`, academicYear: YEAR,
    discount: s.id === 's2' ? 10 : i % 9 === 0 ? 5 : 0, discountReason: s.id === 's2' ? 'Sibling concession' : i % 9 === 0 ? 'Merit scholarship' : undefined,
    lateFee: 0, transportFee: s.busRouteId ? 9600 : 0,
  }));

  const payments: Payment[] = [];
  let receipt = 1;
  const totalFor = (s: Student) => {
    const fs = feeStructures.find((f) => f.classId === s.classId)!;
    const sf = studentFees.find((x) => x.studentId === s.id)!;
    const gross = fs.items.reduce((a, b) => a + b.amount, 0);
    return Math.round(gross * (1 - sf.discount / 100)) + sf.transportFee;
  };
  students.forEach((s, i) => {
    const total = totalFor(s);
    const paidQuarters = s.id === 's1' || s.id === 's2' ? 2 : i % 5 === 0 ? 1 : i % 7 === 0 ? 3 : 2;
    for (let q = 0; q < paidQuarters; q++) {
      const due = new Date(installments[q].dueDate);
      const paidOn = dayOffset(due, -Math.floor(r() * 8));
      const methods: Payment['method'][] = ['UPI', 'Card', 'Net Banking', 'Cash'];
      payments.push({
        id: `py-${s.id}-${q}`, receiptNo: `SPS/${YEAR}/${String(receipt++).padStart(4, '0')}`, studentId: s.id,
        amount: Math.round(total / 4), date: iso(paidOn), method: methods[Math.floor(r() * methods.length)],
        installment: installments[q].label, status: 'Success', txnId: `TXN${(8800000 + receipt * 37).toString(36).toUpperCase()}`,
      });
    }
  });
  payments.push({ id: 'py-s1-fail', receiptNo: '—', studentId: 's1', amount: Math.round(totalFor(students[0]) / 4), date: iso(dayOffset(t0, -3)), method: 'Card', installment: installments[2].label, status: 'Failed', txnId: 'TXNFAILDEMO1' });

  // LMS
  const materials: StudyMaterial[] = [
    { id: 'm1', classId: 'c8', subject: 'Science', title: 'Cell – Structure and Functions (Notes)', description: 'Chapter summary with labelled diagrams and key terms.', category: 'notes', fileName: 'cell-structure-notes.pdf', uploadedBy: 'Neha Mathur', date: iso(dayOffset(t0, -6)) },
    { id: 'm2', classId: 'c8', subject: 'Science', title: 'Microorganisms – Question Bank', description: '50 practice questions with answers for the half-yearly exam.', category: 'exam-prep', fileName: 'microorganisms-qb.pdf', uploadedBy: 'Neha Mathur', date: iso(dayOffset(t0, -3)) },
    { id: 'm3', classId: 'c8', subject: 'Science', title: 'How plants make food – video lesson', description: 'Animated explanation of photosynthesis (demo clip).', category: 'video', url: demoVideos.flower, duration: '00:05', uploadedBy: 'Neha Mathur', date: iso(dayOffset(t0, -2)) },
    { id: 'm4', classId: 'c8', subject: 'Mathematics', title: 'Cubes and Cube Roots – Notes', description: 'Prime factorisation method, solved examples and shortcuts.', category: 'notes', fileName: 'cubes-cube-roots.pdf', uploadedBy: 'Rakesh Choudhary', date: iso(dayOffset(t0, -5)) },
    { id: 'm5', classId: 'c8', subject: 'Mathematics', title: 'Cubes & cube roots – video lecture', description: 'Step-by-step walkthrough of Exercise 7.1 (demo clip).', category: 'video', url: demoVideos.friday, duration: '00:08', uploadedBy: 'Rakesh Choudhary', date: iso(dayOffset(t0, -1)) },
    { id: 'm6', classId: 'c8', subject: 'Mathematics', title: 'Half-Yearly Sample Paper', description: 'Sample paper following the half-yearly blueprint.', category: 'exam-prep', fileName: 'maths-sample-paper.pdf', uploadedBy: 'Rakesh Choudhary', date: iso(dayOffset(t0, -2)) },
    { id: 'm7', classId: 'c8', subject: 'English', title: 'Formal Letter Writing – Format Guide', description: 'Formats for letters to the editor and official letters.', category: 'notes', fileName: 'letter-format.pdf', uploadedBy: 'Priya Vyas', date: iso(dayOffset(t0, -9)) },
    { id: 'm8', classId: 'c8', subject: 'Social Science', title: 'Resources and Development – Mind Map', description: 'One-page mind map for quick revision.', category: 'exam-prep', fileName: 'resources-mindmap.pdf', uploadedBy: 'Suresh Kumawat', date: iso(dayOffset(t0, -4)) },
    { id: 'm9', classId: 'c8', subject: 'Computer', title: 'Introduction to HTML – Practice Sheet', description: 'Lab exercises for building a basic web page.', category: 'resource', fileName: 'html-practice.pdf', uploadedBy: 'Amit Agarwal', date: iso(dayOffset(t0, -7)) },
    { id: 'm10', classId: 'c8', subject: 'Hindi', title: 'व्याकरण – संधि (Notes)', description: 'Sandhi ke prakar aur udaharan.', category: 'notes', fileName: 'hindi-sandhi.pdf', uploadedBy: 'Kavita Joshi', date: iso(dayOffset(t0, -10)) },
    { id: 'm11', classId: 'c8', subject: 'Science', title: 'NCERT Exemplar – Reference link', description: 'Official NCERT textbooks and exemplar resources.', category: 'resource', url: 'https://ncert.nic.in/textbook.php', uploadedBy: 'Neha Mathur', date: iso(dayOffset(t0, -12)) },
    { id: 'm12', classId: 'c4', subject: 'EVS', title: 'Our Family – Worksheet', description: 'Activity worksheet on family and relationships.', category: 'notes', fileName: 'family-worksheet.pdf', uploadedBy: 'Meenakshi Sharma', date: iso(dayOffset(t0, -3)) },
  ];

  const assignments: Assignment[] = [
    { id: 'as1', classId: 'c8', section: 'A', subject: 'Science', title: 'Food chains & webs worksheet', instructions: 'Complete the worksheet and explain one food web from your surroundings in 100 words.', dueDate: schoolDay(t0, 1), maxMarks: 20, createdBy: 't1', createdAt: iso(dayOffset(t0, -4)) },
    { id: 'as2', classId: 'c8', section: 'A', subject: 'Science', title: 'Microorganisms – project report', instructions: 'Prepare a 2-page report on useful and harmful microorganisms with examples.', dueDate: schoolDay(t0, 6), maxMarks: 25, createdBy: 't1', createdAt: iso(dayOffset(t0, -2)) },
    { id: 'as3', classId: 'c8', section: 'A', subject: 'Science', title: 'Crop production – short answers', instructions: 'Answer the 10 short questions shared in class.', dueDate: iso(dayOffset(t0, -5)), maxMarks: 10, createdBy: 't1', createdAt: iso(dayOffset(t0, -12)) },
    { id: 'as4', classId: 'c8', section: 'A', subject: 'Mathematics', title: 'Rational numbers practice set', instructions: 'Solve the practice set of 15 questions.', dueDate: schoolDay(t0, 3), maxMarks: 15, createdBy: 't2', createdAt: iso(dayOffset(t0, -1)) },
    { id: 'as5', classId: 'c8', section: 'B', subject: 'Science', title: 'Food chains & webs worksheet', instructions: 'Complete the worksheet and explain one food web from your surroundings.', dueDate: schoolDay(t0, 1), maxMarks: 20, createdBy: 't1', createdAt: iso(dayOffset(t0, -4)) },
  ];
  const c8a = students.filter((s) => s.classId === 'c8' && s.section === 'A');
  const submissions: Submission[] = [];
  c8a.slice(1, 4).forEach((s, i) => submissions.push({ id: `sb-as1-${s.id}`, assignmentId: 'as1', studentId: s.id, submittedAt: iso(dayOffset(t0, -i)), text: 'Worksheet completed. Food web: grass → grasshopper → frog → snake → eagle.', fileName: 'food-chain-worksheet.pdf', status: 'Submitted' }));
  c8a.slice(0, 8).forEach((s, i) => submissions.push({ id: `sb-as3-${s.id}`, assignmentId: 'as3', studentId: s.id, submittedAt: iso(dayOffset(t0, -6)), text: 'Answers attached.', fileName: 'crop-production-answers.pdf', status: 'Graded', marks: 6 + (i % 5), feedback: i % 2 ? 'Good work, improve presentation.' : 'Excellent – well explained.' }));

  const g = (id: string, category: string, title: string, src: string, back: number): GalleryItem => ({ id, type: 'image', category, title, src, thumb: thumb(src), date: iso(dayOffset(t0, -back)) });
  const gallery: GalleryItem[] = [
    g('g1', 'Campus', 'Classrooms ready for a new session', img.classroom, 200),
    g('g2', 'Campus', 'School library', img.library, 180),
    g('g3', 'Campus', 'Reading corner', img.libraryGlass, 175),
    g('g4', 'Classroom Activities', 'Interactive learning in class', img.handsUp, 40),
    g('g5', 'Classroom Activities', 'Art & craft in the pre-primary wing', img.prePrimary, 35),
    g('g6', 'Classroom Activities', 'Science practical session', img.scienceLab, 28),
    g('g7', 'Classroom Activities', 'Computer lab session', img.computerLab, 22),
    g('g8', 'Sports', 'Athletics practice', img.track, 60),
    g('g9', 'Sports', 'Inter-house football', img.football, 55),
    g('g10', 'Sports', 'Yoga Day', img.yoga, 140),
    g('g11', 'Annual Function', 'Annual Day rehearsals', img.auditorium, 300),
    g('g12', 'Annual Function', 'Prize distribution ceremony', img.hall, 298),
    g('g13', 'Cultural Celebrations', 'Holi celebrations', img.colours, 240),
    g('g14', 'Cultural Celebrations', 'Joy of togetherness', img.happyKids, 90),
    g('g15', 'Student Achievements', 'Celebrating our achievers', img.graduation, 120),
    g('g16', 'Events', 'First day of school', img.backpacks, 220),
    g('g17', 'Events', 'Story-telling week', img.boyWriting, 70),
    { id: 'v1', type: 'video', category: 'Videos', title: 'Nature walk – EVS activity (demo clip)', src: demoVideos.flower, thumb: thumb(img.prePrimary), date: iso(dayOffset(t0, -30)) },
    { id: 'v2', type: 'video', category: 'Videos', title: 'Campus life highlights (demo clip)', src: demoVideos.friday, thumb: thumb(img.handsUp), date: iso(dayOffset(t0, -50)) },
  ];

  const enquiries: Enquiry[] = [
    { id: 'eq1', kind: 'admission', name: 'Vikram Mehta', phone: '+91 90000 40001', email: 'vikram.demo@example.com', classApplying: 'UKG', message: 'Looking for admission for my daughter for the next session.', date: iso(t0), status: 'New' },
    { id: 'eq2', kind: 'admission', name: 'Shalini Jain', phone: '+91 90000 40002', email: 'shalini.demo@example.com', classApplying: 'Class 6', message: 'Is transport available from Bijaynagar Road?', date: iso(dayOffset(t0, -1)), status: 'New' },
    { id: 'eq3', kind: 'contact', name: 'Prakash Soni', phone: '+91 90000 40003', email: 'prakash.demo@example.com', subject: 'Fee structure', message: 'Please share the fee structure for Class 9.', date: iso(dayOffset(t0, -3)), status: 'Contacted' },
  ];

  return {
    users, students, teachers: TEACHERS, classes, subjects, timetable, attendance, homework, exams, results,
    announcements, circulars, events, leaves, notifications, feeStructures, studentFees, payments,
    drivers: DRIVERS, routes: ROUTES, buses: BUSES, materials, assignments, submissions, gallery, enquiries,
  };
}
