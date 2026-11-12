import { useEffect, useState } from 'react';
import { CloudUpload, Link2, Upload } from 'lucide-react';
import clsx from 'clsx';
import type { StudyMaterial, Teacher } from '@/types';
import { useForm, v } from '@/hooks/useForm';
import { useToast } from '@/context/ToastContext';
import { useCollection } from '@/hooks/useCollection';
import { Button, Field, Input, Modal, Select, Textarea } from '@/components/ui';
import { demoVideos } from '@/data/images';
import { todayISO } from '@/utils/format';
import { splitCS } from './_shared';

type Values = {
  classId: string; subject: string; title: string; description: string; category: StudyMaterial['category'];
  source: 'file' | 'link'; fileName: string; url: string; duration: string;
};

/** Upload / edit modal shared by Teacher Materials and Teacher Videos. */
export function MaterialFormModal({ open, onClose, teacher, editing, video }: { open: boolean; onClose: () => void; teacher: Teacher; editing: StudyMaterial | null; video?: boolean }) {
  const toast = useToast();
  const { items: classes } = useCollection('classes');
  const { create, update } = useCollection('materials');
  const classIds = [...new Set(teacher.classes.map((cs) => splitCS(cs).classId))];
  const [preview, setPreview] = useState<string | null>(null);

  const blank: Values = {
    classId: classIds[0] ?? '', subject: teacher.subjects[0] ?? '', title: '', description: '', category: video ? 'video' : 'notes',
    source: video ? 'link' : 'file', fileName: '', url: '', duration: '',
  };
  const form = useForm<Values>(blank, {
    classId: [v.required('Select a class')],
    subject: [v.required('Select a subject')],
    title: [v.required('Title is required'), v.minLength(4)],
    description: [v.required('Add a short description')],
    fileName: [(val, all) => (all.source === 'file' && !val ? 'Choose a file to upload' : undefined)],
    url: [(val, all) => (all.source === 'link' && !/^https?:\/\/\S+/.test(String(val)) ? 'Enter a valid URL starting with http(s)://' : undefined)],
    duration: [(val, all) => (all.category === 'video' && val && !/^\d{1,2}:\d{2}(:\d{2})?$/.test(String(val)) ? 'Use mm:ss format, e.g. 12:30' : undefined)],
  });

  useEffect(() => {
    if (!open) { if (preview) URL.revokeObjectURL(preview); setPreview(null); return; }
    form.reset(editing ? {
      classId: editing.classId, subject: editing.subject, title: editing.title, description: editing.description, category: editing.category,
      source: editing.fileName ? 'file' : 'link',
      fileName: editing.fileName ?? '', url: editing.url ?? '', duration: editing.duration ?? '',
    } : blank);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editing]);

  const submit = form.handleSubmit(async (val) => {
    const data: Omit<StudyMaterial, 'id'> = {
      classId: val.classId, subject: val.subject, title: val.title.trim(), description: val.description.trim(), category: val.category,
      fileName: val.source === 'file' ? val.fileName : undefined,
      url: val.source === 'link' ? val.url.trim() : val.category === 'video' ? demoVideos.flower : undefined,
      duration: val.category === 'video' ? val.duration || undefined : undefined,
      uploadedBy: teacher.name, date: editing?.date ?? todayISO(),
    };
    try {
      if (editing) { await update(editing.id, data); toast.success('Changes saved', data.title); }
      else { await create(data); toast.success(video ? 'Video published' : 'Material uploaded', `Now visible to students of ${classes.find((c) => c.id === data.classId)?.name ?? data.classId}.`); }
      onClose();
    } catch (e) { toast.error('Upload failed', (e as Error).message); }
  });

  const f = form.values;
  return (
    <Modal open={open} onClose={onClose} size="lg" title={editing ? 'Edit item' : video ? 'Upload video lecture' : 'Upload study material'} subtitle="Students of the selected class will see this immediately"
      footer={<><Button variant="outline" onClick={onClose}>Cancel</Button><Button loading={form.submitting} icon={<Upload className="h-4 w-4" />} onClick={() => submit()}>{editing ? 'Save changes' : 'Publish'}</Button></>}>
      <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
        <Field label="Class" required error={form.errors.classId}>
          <Select {...form.bind('classId')} placeholder="Select class" options={classIds.map((id) => ({ value: id, label: classes.find((c) => c.id === id)?.name ?? id }))} />
        </Field>
        <Field label="Subject" required error={form.errors.subject}>
          <Select {...form.bind('subject')} placeholder="Select subject" options={teacher.subjects.map((s) => ({ value: s, label: s }))} />
        </Field>
        <Field label="Title" required error={form.errors.title} className="sm:col-span-2">
          <Input {...form.bind('title')} placeholder={video ? 'e.g. Photosynthesis explained' : 'e.g. Chapter 8 – Cell notes'} />
        </Field>
        <Field label="Description" required error={form.errors.description} className="sm:col-span-2">
          <Textarea rows={3} {...form.bind('description')} placeholder="What will students learn from this?" />
        </Field>
        {!video && (
          <Field label="Category" required>
            <Select {...form.bind('category')} options={[{ value: 'notes', label: 'Notes' }, { value: 'exam-prep', label: 'Exam preparation' }, { value: 'resource', label: 'Learning resource' }]} />
          </Field>
        )}
        {video && (
          <Field label="Duration" error={form.errors.duration} hint="mm:ss">
            <Input {...form.bind('duration')} placeholder="12:30" />
          </Field>
        )}
        <div className={clsx(!video && 'sm:col-span-1', video && 'sm:col-span-1')}>
          <p className="label">Source</p>
          <div className="grid grid-cols-2 gap-1 rounded-lg bg-mist p-1">
            {(['file', 'link'] as const).map((s) => (
              <button type="button" key={s} onClick={() => form.set('source', s)}
                className={clsx('flex items-center justify-center gap-1.5 rounded-md py-2 text-sm font-medium', f.source === s ? 'bg-white text-navy-900 shadow-sm' : 'text-navy-500')}>
                {s === 'file' ? <CloudUpload className="h-4 w-4" /> : <Link2 className="h-4 w-4" />}{s === 'file' ? 'Upload file' : video ? 'Video URL' : 'Web link'}
              </button>
            ))}
          </div>
        </div>
        {f.source === 'file' ? (
          <Field label={video ? 'Video file' : 'File'} required error={form.errors.fileName} className="sm:col-span-2"
            hint="Demo mode: the file stays in your browser. In production it is uploaded to Cloudinary.">
            <label className={clsx('flex cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed px-4 py-6 text-center text-sm transition hover:border-navy-400', form.errors.fileName ? 'border-red-300' : 'border-navy-200')}>
              <CloudUpload className="h-6 w-6 text-navy-400" />
              <span className="font-medium text-navy-800">{f.fileName || 'Click to choose a file'}</span>
              <span className="text-xs text-navy-400">{video ? 'MP4 / WebM' : 'PDF, DOCX, PPT, images'}</span>
              <input type="file" accept={video ? 'video/*' : undefined} className="hidden" onChange={(e) => {
                const file = e.target.files?.[0];
                form.set('fileName', file?.name ?? '');
                if (video && file) { if (preview) URL.revokeObjectURL(preview); setPreview(URL.createObjectURL(file)); }
              }} />
            </label>
            {video && preview && <video src={preview} controls className="mt-3 aspect-video w-full rounded-lg bg-navy-950" />}
          </Field>
        ) : (
          <Field label={video ? 'Video URL' : 'Link URL'} required error={form.errors.url} className="sm:col-span-2" hint={video ? 'Direct MP4 link (YouTube embeds supported in production)' : undefined}>
            <Input {...form.bind('url')} placeholder="https://" />
          </Field>
        )}
      </form>
    </Modal>
  );
}
