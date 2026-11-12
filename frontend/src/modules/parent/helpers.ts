import { useCallback, useState } from 'react';
import type { Announcement, AttendanceRecord, Audience, Role } from '@/types';

/** Which audiences a role may see. */
export function audiencesFor(role?: Role): Audience[] {
  switch (role) {
    case 'parent': return ['all', 'parents'];
    case 'student': return ['all', 'students'];
    case 'teacher': return ['all', 'teachers', 'staff'];
    default: return ['all', 'parents', 'teachers', 'students', 'staff'];
  }
}
export const visibleTo = (role: Role | undefined) => (a: Pick<Announcement, 'audience'>) => audiencesFor(role).includes(a.audience);

export function attendanceStats(records: AttendanceRecord[]) {
  const working = records.filter((r) => r.status !== 'H');
  const present = working.filter((r) => r.status === 'P').length;
  const late = working.filter((r) => r.status === 'L').length;
  const absent = working.filter((r) => r.status === 'A').length;
  const pct = working.length ? Math.round(((present + late) / working.length) * 100) : 0;
  return { working: working.length, present, late, absent, holidays: records.length - working.length, pct };
}

/** Homework "done" ticks are a per-device convenience kept in localStorage. */
export function useHomeworkDone(studentId?: string) {
  const key = `sps-hw-done-${studentId ?? 'none'}`;
  const read = () => { try { return new Set<string>(JSON.parse(localStorage.getItem(key) ?? '[]')); } catch { return new Set<string>(); } };
  const [done, setDone] = useState<Set<string>>(read);
  const [loadedKey, setLoadedKey] = useState(key);
  if (loadedKey !== key) { setLoadedKey(key); setDone(read()); }
  const toggle = useCallback((id: string) => {
    setDone((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      try { localStorage.setItem(key, JSON.stringify([...next])); } catch { /* ignore */ }
      return next;
    });
  }, [key]);
  return { done, toggle };
}

export const ATTENDANCE_META = {
  P: { label: 'Present', cls: 'bg-emerald-500 text-white', soft: 'bg-emerald-50 text-emerald-700' },
  A: { label: 'Absent', cls: 'bg-red-500 text-white', soft: 'bg-red-50 text-red-700' },
  L: { label: 'Late', cls: 'bg-amber-400 text-navy-950', soft: 'bg-amber-50 text-amber-800' },
  H: { label: 'Holiday', cls: 'bg-navy-200 text-navy-800', soft: 'bg-navy-50 text-navy-600' },
} as const;
