import {
  Award, BookOpen, Bus, CalendarCheck, CalendarDays, ClipboardCheck, ClipboardList, Clock, FileText, FolderOpen,
  GraduationCap, Inbox, LayoutDashboard, Library, Megaphone, MessageSquare, PlayCircle, Settings, UserCircle, Users, Wallet,
  type LucideIcon,
} from 'lucide-react';
import type { Role } from '@/types';

export interface NavItem { to: string; label: string; icon: LucideIcon; group?: string }

export const PORTAL_NAME: Record<Role, string> = {
  admin: 'Admin Console',
  office: 'Office Portal',
  parent: 'Parent Portal',
  teacher: 'Teacher LMS',
  student: 'Student LMS',
};

export const NAV: Record<Role, NavItem[]> = {
  parent: [
    { to: '/parent', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/parent/profile', label: 'Student Profile', icon: UserCircle, group: 'My Child' },
    { to: '/parent/attendance', label: 'Attendance', icon: CalendarCheck, group: 'My Child' },
    { to: '/parent/timetable', label: 'Timetable', icon: Clock, group: 'My Child' },
    { to: '/parent/homework', label: 'Homework', icon: BookOpen, group: 'My Child' },
    { to: '/parent/exams', label: 'Exams & Results', icon: GraduationCap, group: 'My Child' },
    { to: '/parent/fees', label: 'Fees & Receipts', icon: Wallet, group: 'Services' },
    { to: '/parent/transport', label: 'Bus Tracking', icon: Bus, group: 'Services' },
    { to: '/parent/leave', label: 'Leave Application', icon: FileText, group: 'Services' },
    { to: '/parent/notices', label: 'Notices & Circulars', icon: Megaphone, group: 'Communication' },
    { to: '/parent/messages', label: 'Notifications', icon: MessageSquare, group: 'Communication' },
  ],
  student: [
    { to: '/student', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/student/subjects', label: 'Learning Materials', icon: Library, group: 'Learn' },
    { to: '/student/videos', label: 'Video Lectures', icon: PlayCircle, group: 'Learn' },
    { to: '/student/exam-prep', label: 'Exam Preparation', icon: Award, group: 'Learn' },
    { to: '/student/assignments', label: 'Assignments', icon: ClipboardList, group: 'Learn' },
    { to: '/student/timetable', label: 'Timetable', icon: Clock, group: 'School' },
    { to: '/student/results', label: 'Exams & Results', icon: GraduationCap, group: 'School' },
    { to: '/student/notices', label: 'Notices', icon: Megaphone, group: 'School' },
  ],
  teacher: [
    { to: '/teacher', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/teacher/materials', label: 'Study Materials', icon: FolderOpen, group: 'LMS' },
    { to: '/teacher/videos', label: 'Video Lectures', icon: PlayCircle, group: 'LMS' },
    { to: '/teacher/assignments', label: 'Assignments', icon: ClipboardList, group: 'LMS' },
    { to: '/teacher/submissions', label: 'Review Submissions', icon: ClipboardCheck, group: 'LMS' },
    { to: '/teacher/attendance', label: 'Mark Attendance', icon: CalendarCheck, group: 'Classroom' },
    { to: '/teacher/timetable', label: 'My Timetable', icon: Clock, group: 'Classroom' },
    { to: '/teacher/notices', label: 'Notices', icon: Megaphone, group: 'Classroom' },
  ],
  admin: [
    { to: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/admin/students', label: 'Students', icon: Users, group: 'People' },
    { to: '/admin/teachers', label: 'Teachers', icon: UserCircle, group: 'People' },
    { to: '/admin/enquiries', label: 'Enquiries', icon: Inbox, group: 'People' },
    { to: '/admin/attendance', label: 'Attendance', icon: CalendarCheck, group: 'Operations' },
    { to: '/admin/fees', label: 'Fee Management', icon: Wallet, group: 'Operations' },
    { to: '/admin/academics', label: 'Academics', icon: CalendarDays, group: 'Operations' },
    { to: '/admin/communication', label: 'Communication', icon: Megaphone, group: 'Operations' },
    { to: '/admin/transport', label: 'Transport', icon: Bus, group: 'Operations' },
    { to: '/admin/settings', label: 'Settings', icon: Settings, group: 'System' },
  ],
  office: [
    { to: '/office', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/office/students', label: 'Students', icon: Users, group: 'People' },
    { to: '/office/enquiries', label: 'Enquiries', icon: Inbox, group: 'People' },
    { to: '/office/attendance', label: 'Attendance', icon: CalendarCheck, group: 'Operations' },
    { to: '/office/fees', label: 'Fee Management', icon: Wallet, group: 'Operations' },
    { to: '/office/communication', label: 'Communication', icon: Megaphone, group: 'Operations' },
    { to: '/office/transport', label: 'Transport', icon: Bus, group: 'Operations' },
  ],
};

/** Base path of the admin-style modules for the current staff role (admin or office). */
export const staffBase = (role: Role) => (role === 'office' ? '/office' : '/admin');
