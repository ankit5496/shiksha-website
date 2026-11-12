import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { useCollection } from '@/hooks/useCollection';
import { useStudentContext } from '@/hooks/useStudentContext';
import { EmptyState, PageHeader, Select, Spinner, Tabs } from '@/components/ui';
import { subjectsForClass } from '@/data/seed';
import { MaterialCard } from './_shared';

export default function StudentMaterials() {
  const { student, className, loading: sLoading } = useStudentContext();
  const { items, loading } = useCollection('materials');
  const [subject, setSubject] = useState('all');
  const [type, setType] = useState<'all' | 'notes' | 'resource'>('all');
  const [q, setQ] = useState('');

  const subjects = student ? subjectsForClass(student.classId) : [];
  const base = useMemo(() => items.filter((m) => m.classId === student?.classId && (m.category === 'notes' || m.category === 'resource')), [items, student]);
  const shown = base
    .filter((m) => subject === 'all' || m.subject === subject)
    .filter((m) => type === 'all' || m.category === type)
    .filter((m) => `${m.title} ${m.description} ${m.subject}`.toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => b.date.localeCompare(a.date));

  if (sLoading || loading) return <Spinner />;

  return (
    <div>
      <PageHeader eyebrow="Learning" title="Learning materials" subtitle={`Notes and resources shared by your teachers for ${className} – ${student?.section ?? ''}`} />
      <Tabs className="mb-4" value={subject} onChange={setSubject}
        tabs={[{ value: 'all', label: 'All subjects', count: base.length }, ...subjects.map((s) => ({ value: s, label: s, count: base.filter((m) => m.subject === s).length }))]} />
      <div className="mb-6 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-300" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search notes, topics…" className="input pl-9" aria-label="Search materials" />
        </div>
        <Select className="sm:w-48" value={type} onChange={(e) => setType(e.target.value as typeof type)}
          options={[{ value: 'all', label: 'All types' }, { value: 'notes', label: 'Notes' }, { value: 'resource', label: 'Resources & links' }]} />
      </div>
      {shown.length === 0 ? (
        <div className="card"><EmptyState title="No materials found" message={q || subject !== 'all' ? 'Try another subject or search term.' : 'Your teachers have not shared any materials yet.'} /></div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{shown.map((m) => <MaterialCard key={m.id} m={m} />)}</div>
      )}
    </div>
  );
}
