import { lazy, Suspense, type ComponentType } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import PublicLayout from '@/layouts/PublicLayout';
import DashboardLayout from '@/layouts/DashboardLayout';
import { ProtectedRoute } from './ProtectedRoute';
import { Spinner } from '@/components/ui';

const L = (f: () => Promise<{ default: ComponentType }>) => lazy(f);

// Public website
const Home = L(() => import('@/pages/public/Home'));
const About = L(() => import('@/pages/public/About'));
const Academics = L(() => import('@/pages/public/Academics'));
const Admissions = L(() => import('@/pages/public/Admissions'));
const Gallery = L(() => import('@/pages/public/Gallery'));
const Contact = L(() => import('@/pages/public/Contact'));
const Login = L(() => import('@/pages/public/Login'));
const NotFound = L(() => import('@/pages/public/NotFound'));

// Parent portal
const ParentDashboard = L(() => import('@/modules/parent/ParentDashboard'));
const StudentProfile = L(() => import('@/modules/parent/StudentProfile'));
const Attendance = L(() => import('@/modules/parent/Attendance'));
const Timetable = L(() => import('@/modules/parent/Timetable'));
const Homework = L(() => import('@/modules/parent/Homework'));
const Exams = L(() => import('@/modules/parent/Exams'));
const Notices = L(() => import('@/modules/parent/Notices'));
const Leave = L(() => import('@/modules/parent/Leave'));
const Messages = L(() => import('@/modules/parent/Messages'));

// Fees & transport
const FeesOverview = L(() => import('@/modules/fees/FeesOverview'));
const FeesPortalPage = L(() => import('@/modules/fees/FeesPortalPage'));
const ParentBusTracking = L(() => import('@/modules/transport/ParentBusTracking'));

// Student LMS
const StudentDashboard = L(() => import('@/modules/student/StudentDashboard'));
const StudentMaterials = L(() => import('@/modules/lms/StudentMaterials'));
const StudentVideos = L(() => import('@/modules/lms/StudentVideos'));
const StudentExamPrep = L(() => import('@/modules/lms/StudentExamPrep'));
const StudentAssignments = L(() => import('@/modules/lms/StudentAssignments'));

// Teacher LMS
const TeacherDashboard = L(() => import('@/modules/teacher/TeacherDashboard'));
const TeacherMaterials = L(() => import('@/modules/lms/TeacherMaterials'));
const TeacherVideos = L(() => import('@/modules/lms/TeacherVideos'));
const TeacherAssignments = L(() => import('@/modules/lms/TeacherAssignments'));
const TeacherSubmissions = L(() => import('@/modules/lms/TeacherSubmissions'));
const TeacherAttendance = L(() => import('@/modules/teacher/TeacherAttendance'));
const TeacherTimetable = L(() => import('@/modules/teacher/TeacherTimetable'));

// Admin / Office
const AdminDashboard = L(() => import('@/modules/admin/AdminDashboard'));
const OfficeDashboard = L(() => import('@/modules/office/OfficeDashboard'));
const Students = L(() => import('@/modules/admin/Students'));
const Teachers = L(() => import('@/modules/admin/Teachers'));
const Enquiries = L(() => import('@/modules/admin/Enquiries'));
const AttendanceManagement = L(() => import('@/modules/admin/AttendanceManagement'));
const FeeManagement = L(() => import('@/modules/admin/FeeManagement'));
const AcademicManagement = L(() => import('@/modules/admin/AcademicManagement'));
const Communication = L(() => import('@/modules/admin/Communication'));
const TransportManagement = L(() => import('@/modules/admin/TransportManagement'));
const Settings = L(() => import('@/modules/admin/Settings'));

const Fallback = () => <div className="min-h-[50vh]"><Spinner /></div>;

export default function AppRoutes() {
  return (
    <Suspense fallback={<Fallback />}>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route index element={<Home />} />
          <Route path="about" element={<About />} />
          <Route path="academics" element={<Academics />} />
          <Route path="admissions" element={<Admissions />} />
          <Route path="gallery" element={<Gallery />} />
          <Route path="contact" element={<Contact />} />
        </Route>
        <Route path="login" element={<Login />} />

        {/* Standalone Online Fees Portal (parent login required) */}
        <Route path="fees" element={<ProtectedRoute roles={['parent']}><FeesPortalPage /></ProtectedRoute>} />

        <Route path="parent" element={<ProtectedRoute roles={['parent']}><DashboardLayout role="parent" /></ProtectedRoute>}>
          <Route index element={<ParentDashboard />} />
          <Route path="profile" element={<StudentProfile />} />
          <Route path="attendance" element={<Attendance />} />
          <Route path="timetable" element={<Timetable />} />
          <Route path="homework" element={<Homework />} />
          <Route path="exams" element={<Exams />} />
          <Route path="fees" element={<FeesOverview />} />
          <Route path="transport" element={<ParentBusTracking />} />
          <Route path="leave" element={<Leave />} />
          <Route path="notices" element={<Notices />} />
          <Route path="messages" element={<Messages />} />
        </Route>

        <Route path="student" element={<ProtectedRoute roles={['student']}><DashboardLayout role="student" /></ProtectedRoute>}>
          <Route index element={<StudentDashboard />} />
          <Route path="subjects" element={<StudentMaterials />} />
          <Route path="videos" element={<StudentVideos />} />
          <Route path="exam-prep" element={<StudentExamPrep />} />
          <Route path="assignments" element={<StudentAssignments />} />
          <Route path="timetable" element={<Timetable />} />
          <Route path="results" element={<Exams />} />
          <Route path="notices" element={<Notices />} />
        </Route>

        <Route path="teacher" element={<ProtectedRoute roles={['teacher']}><DashboardLayout role="teacher" /></ProtectedRoute>}>
          <Route index element={<TeacherDashboard />} />
          <Route path="materials" element={<TeacherMaterials />} />
          <Route path="videos" element={<TeacherVideos />} />
          <Route path="assignments" element={<TeacherAssignments />} />
          <Route path="submissions" element={<TeacherSubmissions />} />
          <Route path="attendance" element={<TeacherAttendance />} />
          <Route path="timetable" element={<TeacherTimetable />} />
          <Route path="notices" element={<Notices />} />
        </Route>

        <Route path="admin" element={<ProtectedRoute roles={['admin']}><DashboardLayout role="admin" /></ProtectedRoute>}>
          <Route index element={<AdminDashboard />} />
          <Route path="students" element={<Students />} />
          <Route path="teachers" element={<Teachers />} />
          <Route path="enquiries" element={<Enquiries />} />
          <Route path="attendance" element={<AttendanceManagement />} />
          <Route path="fees" element={<FeeManagement />} />
          <Route path="academics" element={<AcademicManagement />} />
          <Route path="communication" element={<Communication />} />
          <Route path="transport" element={<TransportManagement />} />
          <Route path="settings" element={<Settings />} />
        </Route>

        <Route path="office" element={<ProtectedRoute roles={['office']}><DashboardLayout role="office" /></ProtectedRoute>}>
          <Route index element={<OfficeDashboard />} />
          <Route path="students" element={<Students />} />
          <Route path="enquiries" element={<Enquiries />} />
          <Route path="attendance" element={<AttendanceManagement />} />
          <Route path="fees" element={<FeeManagement />} />
          <Route path="communication" element={<Communication />} />
          <Route path="transport" element={<TransportManagement />} />
        </Route>

        <Route path="home" element={<Navigate to="/" replace />} />
        <Route element={<PublicLayout />}><Route path="*" element={<NotFound />} /></Route>
      </Routes>
    </Suspense>
  );
}
