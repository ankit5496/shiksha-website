export type Role = 'admin' | 'office' | 'parent' | 'teacher' | 'student';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar?: string;
  phone?: string;
  /** parent → linked children */
  studentIds?: string[];
  /** student login → own record */
  studentId?: string;
  /** teacher login → teacher record */
  teacherId?: string;
}

export interface Session { user: User; token: string }

export type Gender = 'Male' | 'Female';

export interface Student {
  id: string;
  admissionNo: string;
  name: string;
  gender: Gender;
  dob: string;
  classId: string;
  section: string;
  rollNo: number;
  fatherName: string;
  motherName: string;
  phone: string;
  email?: string;
  address: string;
  photo?: string;
  bloodGroup?: string;
  admissionDate: string;
  status: 'Active' | 'Inactive';
  busRouteId?: string;
  stopId?: string;
}

export interface Teacher {
  id: string;
  empId: string;
  name: string;
  email: string;
  phone: string;
  designation: string;
  qualification: string;
  subjects: string[];
  /** e.g. ["c8-A", "c8-B"] */
  classes: string[];
  joinDate: string;
  photo?: string;
  status: 'Active' | 'On Leave' | 'Inactive';
}

export interface ClassRoom {
  id: string;
  name: string;
  order: number;
  stage: 'Pre-Primary' | 'Primary' | 'Middle' | 'Secondary';
  sections: string[];
  classTeacherId?: string;
}

export interface Subject { id: string; name: string; code: string; classIds: string[] }

export type Weekday = 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat';
export interface TimetableEntry {
  id: string;
  classId: string;
  section: string;
  day: Weekday;
  period: number;
  time: string;
  subject: string;
  teacherName: string;
}

export type AttendanceStatus = 'P' | 'A' | 'L' | 'H';
export interface AttendanceRecord { id: string; studentId: string; date: string; status: AttendanceStatus; markedBy?: string }

export interface Homework {
  id: string; classId: string; section: string; subject: string; title: string;
  description: string; assignedDate: string; dueDate: string; teacherName: string;
}

export interface Exam {
  id: string; name: string; classId: string; subject: string; date: string; time: string; maxMarks: number; room?: string;
}

export interface ExamResult {
  id: string; studentId: string; examName: string; subject: string; marks: number; maxMarks: number; grade: string;
}

export type Audience = 'all' | 'parents' | 'teachers' | 'students' | 'staff';
export interface Announcement {
  id: string; title: string; body: string; date: string; audience: Audience; author: string;
  priority: 'normal' | 'high'; pinned?: boolean;
}

export interface Circular { id: string; title: string; refNo: string; date: string; description: string; fileName: string; audience: Audience }

export interface SchoolEvent {
  id: string; title: string; date: string; time: string; venue: string; description: string;
  category: 'Academic' | 'Sports' | 'Cultural' | 'Meeting' | 'Holiday';
}

export interface LeaveRequest {
  id: string; studentId: string; type: 'Sick' | 'Family' | 'Other'; fromDate: string; toDate: string;
  reason: string; status: 'Pending' | 'Approved' | 'Rejected'; appliedOn: string;
}

export interface AppNotification {
  id: string;
  /** a role ("parent") or a specific user id */
  target: string;
  title: string; message: string; date: string; read: boolean;
  type: 'info' | 'fee' | 'exam' | 'transport' | 'homework' | 'event';
  link?: string;
}

export interface FeeItem { category: string; amount: number }
export interface Installment { label: string; dueDate: string; percent: number }
export interface FeeStructure {
  id: string; classId: string; academicYear: string; items: FeeItem[]; installments: Installment[]; lateFeePerDay: number;
}

export interface StudentFee {
  id: string; studentId: string; structureId: string; academicYear: string;
  discount: number; discountReason?: string; lateFee: number;
  /** annual transport fee applied for bus users */
  transportFee: number;
}

export type PaymentMethod = 'UPI' | 'Card' | 'Net Banking' | 'Cash' | 'Cheque';
export interface Payment {
  id: string; receiptNo: string; studentId: string; amount: number; date: string; method: PaymentMethod;
  installment: string; status: 'Success' | 'Failed'; txnId: string; collectedBy?: string;
}

export interface Driver { id: string; name: string; phone: string; licenseNo: string; experienceYears: number; photo?: string }

export interface BusStop { id: string; name: string; lat: number; lng: number; time: string }
export interface BusRoute { id: string; code: string; name: string; stops: BusStop[]; path: [number, number][] }

export interface Bus {
  id: string; number: string; registration: string; capacity: number; driverId: string; routeId: string;
  attendantName: string; status: 'Active' | 'Maintenance';
}

export interface StudyMaterial {
  id: string; classId: string; subject: string; title: string; description: string;
  category: 'notes' | 'exam-prep' | 'resource' | 'video';
  fileName?: string; url?: string; duration?: string; uploadedBy: string; date: string;
}

export interface Assignment {
  id: string; classId: string; section: string; subject: string; title: string; instructions: string;
  dueDate: string; maxMarks: number; createdBy: string; createdAt: string;
}

export interface Submission {
  id: string; assignmentId: string; studentId: string; submittedAt: string; text: string; fileName?: string;
  status: 'Submitted' | 'Late' | 'Graded'; marks?: number; feedback?: string;
}

export interface GalleryItem {
  id: string; type: 'image' | 'video'; category: string; title: string; src: string; thumb: string; date: string;
}

export interface Enquiry {
  id: string; kind: 'admission' | 'contact'; name: string; phone: string; email: string;
  classApplying?: string; subject?: string; message: string; date: string; status: 'New' | 'Contacted' | 'Closed';
}

export interface CollectionMap {
  users: User;
  students: Student;
  teachers: Teacher;
  classes: ClassRoom;
  subjects: Subject;
  timetable: TimetableEntry;
  attendance: AttendanceRecord;
  homework: Homework;
  exams: Exam;
  results: ExamResult;
  announcements: Announcement;
  circulars: Circular;
  events: SchoolEvent;
  leaves: LeaveRequest;
  notifications: AppNotification;
  feeStructures: FeeStructure;
  studentFees: StudentFee;
  payments: Payment;
  drivers: Driver;
  routes: BusRoute;
  buses: Bus;
  materials: StudyMaterial;
  assignments: Assignment;
  submissions: Submission;
  gallery: GalleryItem;
  enquiries: Enquiry;
}
export type CollectionName = keyof CollectionMap;
export type Entity = { id: string };
