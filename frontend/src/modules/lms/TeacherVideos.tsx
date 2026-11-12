import { useState } from 'react';
import { Pencil, PlayCircle, Plus, Trash2 } from 'lucide-react';
import type { StudyMaterial } from '@/types';
import { useCollection } from '@/hooks/useCollection';
import { useToast } from '@/context/ToastContext';
import { Button, ConfirmDialog, EmptyState, PageHeader, Spinner, Tabs } from '@/components/ui';
import { useTeacher, VideoModal, VideoThumb } from './_shared';
import { MaterialFormModal } from './_materialForm';

export default function TeacherVideos() {
  const { teacher, loading: tLoading } = useTeacher();
  const { items, loading, remove } = useCollection('materials');
  const { items: classes } = useCollection('classes');
  const toast = useToast();
  const [cls, setCls] = useState('all');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<StudyMaterial | null>(null);
  const [deleting, setDeleting] = useState<StudyMaterial | null>(null);
  const [playing, setPlaying] = useState<StudyMaterial | null>(null);
  const [busy, setBusy] = useState(false);

  if (tLoading || loading) return <Spinner />;
  if (!teacher) return <EmptyState title="Teacher profile not found" />;

  const videos = items.filter((m) => m.uploadedBy === teacher.name && m.category === 'video').sort((a, b) => b.date.localeCompare(a.date));
  const classIds = [...new Set(videos.map((v) => v.classId))];
  const shown = videos.filter((v) => cls === 'all' || v.classId === cls);
  const className = (id: string) => classes.find((c) => c.id === id)?.name ?? id;

  const confirmDelete = async () => {
    if (!deleting) return;
    setBusy(true);
    try { await remove(deleting.id); toast.success('Video removed', deleting.title); setDeleting(null); }
    catch (e) { toast.error('Delete failed', (e as Error).message); }
    finally { setBusy(false); }
  };

  return (
    <div>
      <PageHeader eyebrow="LMS" title="Video lectures" subtitle="Record once, let students revisit any time"
        actions={<Button icon={<Plus className="h-4 w-4" />} onClick={() => { setEditing(null); setFormOpen(true); }}>Upload video</Button>} />
      {classIds.length > 1 && (
        <Tabs className="mb-6 w-fit" value={cls} onChange={setCls}
          tabs={[{ value: 'all', label: 'All classes', count: videos.length }, ...classIds.map((id) => ({ value: id, label: className(id), count: videos.filter((v) => v.classId === id).length }))]} />
      )}
      {shown.length === 0 ? (
        <div className="card"><EmptyState icon={<PlayCircle className="h-6 w-6" />} title="No video lectures yet" message="Upload a recorded lesson or paste a video link."
          action={<Button size="sm" icon={<Plus className="h-4 w-4" />} onClick={() => setFormOpen(true)}>Upload video</Button>} /></div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {shown.map((v) => (
            <VideoThumb key={v.id} m={{ ...v, subject: `${v.subject} · ${className(v.classId)}` }} onPlay={() => setPlaying(v)} actions={<>
              <button className="btn-ghost btn-sm" aria-label="Edit" onClick={() => { setEditing(v); setFormOpen(true); }}><Pencil className="h-4 w-4" /></button>
              <button className="btn-ghost btn-sm text-red-600 hover:bg-red-50" aria-label="Delete" onClick={() => setDeleting(v)}><Trash2 className="h-4 w-4" /></button>
            </>} />
          ))}
        </div>
      )}
      <MaterialFormModal video open={formOpen} onClose={() => setFormOpen(false)} teacher={teacher} editing={editing} />
      <VideoModal video={playing} onClose={() => setPlaying(null)} />
      <ConfirmDialog open={!!deleting} onClose={() => setDeleting(null)} onConfirm={confirmDelete} loading={busy}
        title="Delete video?" message={`"${deleting?.title}" will no longer be available to students.`} />
    </div>
  );
}
