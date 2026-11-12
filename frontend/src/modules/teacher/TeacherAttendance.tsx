import { EmptyState, PageHeader, Spinner } from '@/components/ui';
import { MarkAttendancePanel } from '@/modules/admin/AttendanceManagement';
import { useTeacher } from '@/modules/lms/_shared';

export default function TeacherAttendance() {
  const { teacher, loading } = useTeacher();
  if (loading) return <Spinner />;
  if (!teacher) return <EmptyState title="Teacher profile not found" />;
  return (
    <div>
      <PageHeader eyebrow="Classroom" title="Mark attendance" subtitle="Record daily attendance for the classes you teach. Parents see updates instantly in the Parent Portal." />
      <MarkAttendancePanel allowedClassSections={teacher.classes} />
    </div>
  );
}
