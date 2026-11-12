import { useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useCollection } from './useCollection';

/**
 * Resolves the student the current user is looking at:
 * parent → the selected child; student → themselves.
 */
export function useStudentContext() {
  const { user, activeStudentId, setActiveStudentId } = useAuth();
  const { items: students, loading: sLoading } = useCollection('students');
  const { items: classes, loading: cLoading } = useCollection('classes');

  const children = useMemo(() => {
    if (!user) return [];
    if (user.role === 'parent') return students.filter((s) => user.studentIds?.includes(s.id));
    if (user.role === 'student') return students.filter((s) => s.id === user.studentId);
    return [];
  }, [user, students]);

  const student = children.find((s) => s.id === activeStudentId) ?? children[0];
  const classRoom = classes.find((c) => c.id === student?.classId);
  const className = classRoom?.name ?? '';

  return { student, children, classRoom, className, setActiveStudentId, loading: sLoading || cLoading };
}

export function useClassName() {
  const { items: classes } = useCollection('classes');
  return (id?: string) => classes.find((c) => c.id === id)?.name ?? id ?? '—';
}
