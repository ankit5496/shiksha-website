import { useState } from 'react';
import { PlayCircle } from 'lucide-react';
import type { StudyMaterial } from '@/types';
import { useCollection } from '@/hooks/useCollection';
import { useStudentContext } from '@/hooks/useStudentContext';
import { EmptyState, PageHeader, Spinner, Tabs } from '@/components/ui';
import { VideoModal, VideoThumb } from './_shared';

const KEY = 'sps-watched-videos';
const readWatched = (): string[] => { try { return JSON.parse(localStorage.getItem(KEY) ?? '[]'); } catch { return []; } };

export default function StudentVideos() {
  const { student, loading: sLoading } = useStudentContext();
  const { items, loading } = useCollection('materials');
  const [subject, setSubject] = useState('all');
  const [playing, setPlaying] = useState<StudyMaterial | null>(null);
  const [watched, setWatched] = useState<string[]>(readWatched);

  const videos = items.filter((m) => m.classId === student?.classId && m.category === 'video').sort((a, b) => b.date.localeCompare(a.date));
  const subjects = [...new Set(videos.map((v) => v.subject))];
  const shown = videos.filter((v) => subject === 'all' || v.subject === subject);

  const play = (v: StudyMaterial) => {
    setPlaying(v);
    if (!watched.includes(v.id)) {
      const next = [...watched, v.id];
      setWatched(next);
      try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* ignore */ }
    }
  };

  if (sLoading || loading) return <Spinner />;
  return (
    <div>
      <PageHeader eyebrow="Learning" title="Video lectures" subtitle={`${watched.filter((id) => videos.some((v) => v.id === id)).length} of ${videos.length} lectures watched`} />
      {subjects.length > 0 && (
        <Tabs className="mb-6" value={subject} onChange={setSubject}
          tabs={[{ value: 'all', label: 'All', count: videos.length }, ...subjects.map((s) => ({ value: s, label: s, count: videos.filter((v) => v.subject === s).length }))]} />
      )}
      {shown.length === 0 ? (
        <div className="card"><EmptyState icon={<PlayCircle className="h-6 w-6" />} title="No video lectures yet" message="Your teachers' recorded lessons will appear here." /></div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {shown.map((v) => <VideoThumb key={v.id} m={v} watched={watched.includes(v.id)} onPlay={() => play(v)} />)}
        </div>
      )}
      <VideoModal video={playing} onClose={() => setPlaying(null)} />
    </div>
  );
}
