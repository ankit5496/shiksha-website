import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Download, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import type { StudyMaterial } from '@/types';
import { useCollection } from '@/hooks/useCollection';
import { useToast } from '@/context/ToastContext';
import { Button, ConfirmDialog, EmptyState, PageHeader, Select, Spinner, Tabs } from '@/components/ui';
import { MaterialCard, openMaterial, useTeacher } from './_shared';
import { MaterialFormModal } from './_materialForm';

type Cat = 'all' | 'notes' | 'exam-prep' | 'resource';

export default function TeacherMaterials() {
  const { teacher, loading: tLoading } = useTeacher();
  const { items, loading, remove } = useCollection('materials');
  const { items: classes } = useCollection('classes');
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const [cat, setCat] = useState<Cat>('all');
  const [cls, setCls] = useState('');
  const [q, setQ] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<StudyMaterial | null>(null);
  const [deleting, setDeleting] = useState<StudyMaterial | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (params.get('new')) { setEditing(null); setFormOpen(true); params.delete('new'); setParams(params, { replace: true }); }
  }, [params, setParams]);

  if (tLoading || loading) return <Spinner />;
  if (!teacher) return <EmptyState title="Teacher profile not found" />;

  const mine = items.filter((m) => m.uploadedBy === teacher.name && m.category !== 'video');
  const shown = mine
    .filter((m) => cat === 'all' || m.category === cat)
    .filter((m) => !cls || m.classId === cls)
    .filter((m) => `${m.title} ${m.description} ${m.subject}`.toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => b.date.localeCompare(a.date));
  const classIds = [...new Set(mine.map((m) => m.classId))];

  const confirmDelete = async () => {
    if (!deleting) return;
    setBusy(true);
    try { await remove(deleting.id); toast.success('Material deleted', deleting.title); setDeleting(null); }
    catch (e) { toast.error('Delete failed', (e as Error).message); }
    finally { setBusy(false); }
  };

  return (
    <div>
      <PageHeader eyebrow="LMS" title="Study materials" subtitle="Share notes, exam preparation and learning resources with your classes"
        actions={<Button icon={<Plus className="h-4 w-4" />} onClick={() => { setEditing(null); setFormOpen(true); }}>Upload material</Button>} />
      <Tabs className="mb-4" value={cat} onChange={setCat} tabs={[
        { value: 'all', label: 'All', count: mine.length },
        { value: 'notes', label: 'Notes', count: mine.filter((m) => m.category === 'notes').length },
        { value: 'exam-prep', label: 'Exam prep', count: mine.filter((m) => m.category === 'exam-prep').length },
        { value: 'resource', label: 'Resources', count: mine.filter((m) => m.category === 'resource').length },
      ]} />
      <div className="mb-6 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-300" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search your materials…" className="input pl-9" aria-label="Search" />
        </div>
        <Select className="sm:w-48" value={cls} onChange={(e) => setCls(e.target.value)} placeholder="All classes" options={classIds.map((id) => ({ value: id, label: classes.find((c) => c.id === id)?.name ?? id }))} />
      </div>
      {shown.length === 0 ? (
        <div className="card"><EmptyState title={mine.length ? 'No matching materials' : 'No materials uploaded yet'} message={mine.length ? 'Try a different filter.' : 'Upload your first set of notes for your students.'}
          action={!mine.length ? <Button size="sm" icon={<Plus className="h-4 w-4" />} onClick={() => setFormOpen(true)}>Upload material</Button> : undefined} /></div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {shown.map((m) => (
            <MaterialCard key={m.id} m={m} actions={<>
              <button className="btn-ghost btn-sm" aria-label="Download" title="Download / open" onClick={() => openMaterial(m)}><Download className="h-4 w-4" /></button>
              <button className="btn-ghost btn-sm" aria-label="Edit" title="Edit" onClick={() => { setEditing(m); setFormOpen(true); }}><Pencil className="h-4 w-4" /></button>
              <button className="btn-ghost btn-sm text-red-600 hover:bg-red-50" aria-label="Delete" title="Delete" onClick={() => setDeleting(m)}><Trash2 className="h-4 w-4" /></button>
            </>} />
          ))}
        </div>
      )}
      <MaterialFormModal open={formOpen} onClose={() => setFormOpen(false)} teacher={teacher} editing={editing} />
      <ConfirmDialog open={!!deleting} onClose={() => setDeleting(null)} onConfirm={confirmDelete} loading={busy}
        title="Delete material?" message={`"${deleting?.title}" will be removed for all students. This cannot be undone.`} />
    </div>
  );
}
