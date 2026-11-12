import { useState } from 'react';
import { CalendarDays, CheckCircle2, RotateCcw, Trophy, XCircle } from 'lucide-react';
import clsx from 'clsx';
import { useCollection } from '@/hooks/useCollection';
import { useStudentContext } from '@/hooks/useStudentContext';
import { Badge, Button, EmptyState, PageHeader, Panel, ProgressBar, Spinner, Tabs } from '@/components/ui';
import { useToast } from '@/context/ToastContext';
import { daysBetween, fmtDay, todayISO } from '@/utils/format';
import { MaterialCard, SampleTag } from './_shared';

interface Q { q: string; options: string[]; answer: number; explain: string }
const QUIZ: Record<'Science' | 'Mathematics', Q[]> = {
  Science: [
    { q: 'Which organelle is known as the "powerhouse of the cell"?', options: ['Nucleus', 'Mitochondria', 'Ribosome', 'Golgi body'], answer: 1, explain: 'Mitochondria release energy through cellular respiration.' },
    { q: 'Which of these is present in a plant cell but NOT in an animal cell?', options: ['Cell membrane', 'Cytoplasm', 'Cell wall', 'Nucleus'], answer: 2, explain: 'Plant cells have a rigid cell wall made of cellulose.' },
    { q: 'Curd is formed from milk by the action of —', options: ['Yeast', 'Lactobacillus', 'Rhizobium', 'Virus'], answer: 1, explain: 'Lactobacillus bacteria convert milk into curd.' },
    { q: 'The process of loosening and turning the soil is called —', options: ['Sowing', 'Tilling', 'Irrigation', 'Harvesting'], answer: 1, explain: 'Tilling or ploughing loosens the soil for roots.' },
    { q: 'Which gas is released during photosynthesis?', options: ['Carbon dioxide', 'Nitrogen', 'Oxygen', 'Hydrogen'], answer: 2, explain: 'Plants release oxygen as a by-product of photosynthesis.' },
  ],
  Mathematics: [
    { q: 'What is the cube of 12?', options: ['144', '1728', '1331', '2197'], answer: 1, explain: '12 × 12 × 12 = 1728.' },
    { q: 'The cube root of 3375 is —', options: ['15', '25', '35', '13'], answer: 0, explain: '15 × 15 × 15 = 3375.' },
    { q: 'Which of these is a perfect cube?', options: ['200', '243', '216', '250'], answer: 2, explain: '216 = 6³.' },
    { q: 'The additive inverse of −7/9 is —', options: ['7/9', '−9/7', '9/7', '0'], answer: 0, explain: '−7/9 + 7/9 = 0.' },
    { q: 'What is the smallest number by which 392 must be multiplied to make it a perfect cube?', options: ['2', '7', '4', '3'], answer: 1, explain: '392 = 2³ × 7², so multiply by 7 to get 2³ × 7³.' },
  ],
};

function Quiz() {
  const toast = useToast();
  const [subject, setSubject] = useState<'Science' | 'Mathematics'>('Science');
  const [answers, setAnswers] = useState<(number | null)[]>(Array(5).fill(null));
  const [submitted, setSubmitted] = useState(false);
  const qs = QUIZ[subject];
  const score = answers.filter((a, i) => a === qs[i].answer).length;
  const reset = (s = subject) => { setSubject(s); setAnswers(Array(5).fill(null)); setSubmitted(false); };
  const submit = () => {
    if (answers.some((a) => a === null)) { toast.error('Answer all questions', 'Please choose an option for every question.'); return; }
    setSubmitted(true);
    const s = answers.filter((a, i) => a === qs[i].answer).length;
    toast.success(`You scored ${s}/5`, s >= 4 ? 'Excellent preparation!' : 'Review the explanations below.');
  };

  return (
    <Panel title={<span className="flex items-center gap-2">Practice quiz <SampleTag /></span>} subtitle="Five quick questions – scored instantly"
      action={<Tabs value={subject} onChange={(s) => reset(s)} tabs={[{ value: 'Science', label: 'Science' }, { value: 'Mathematics', label: 'Maths' }]} />}>
      {submitted && (
        <div className="mb-5 flex items-center gap-4 rounded-xl bg-navy-950 p-4 text-white">
          <Trophy className="h-8 w-8 text-gold-400" />
          <div className="flex-1">
            <p className="font-semibold">Score: {score} / 5</p>
            <ProgressBar value={score * 20} tone="gold" className="mt-2 bg-white/10" />
          </div>
          <Button variant="gold" size="sm" icon={<RotateCcw className="h-3.5 w-3.5" />} onClick={() => reset()}>Try again</Button>
        </div>
      )}
      <ol className="space-y-5">
        {qs.map((q, qi) => (
          <li key={qi}>
            <p className="text-sm font-semibold text-navy-900">{qi + 1}. {q.q}</p>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {q.options.map((o, oi) => {
                const chosen = answers[qi] === oi;
                const correct = submitted && oi === q.answer;
                const wrong = submitted && chosen && oi !== q.answer;
                return (
                  <button key={oi} disabled={submitted} onClick={() => setAnswers((a) => a.map((x, i) => (i === qi ? oi : x)))}
                    className={clsx('flex items-center justify-between rounded-lg border px-3 py-2 text-left text-sm transition',
                      correct ? 'border-emerald-300 bg-emerald-50 text-emerald-800' : wrong ? 'border-red-300 bg-red-50 text-red-700' : chosen ? 'border-navy-700 bg-navy-50 text-navy-900' : 'border-navy-100 hover:border-navy-300')}>
                    {o}
                    {correct && <CheckCircle2 className="h-4 w-4" />}
                    {wrong && <XCircle className="h-4 w-4" />}
                  </button>
                );
              })}
            </div>
            {submitted && <p className="mt-1.5 text-xs text-navy-500">{q.explain}</p>}
          </li>
        ))}
      </ol>
      {!submitted && <div className="mt-6 flex justify-end"><Button onClick={submit}>Submit answers</Button></div>}
    </Panel>
  );
}

export default function StudentExamPrep() {
  const { student, className, loading: sLoading } = useStudentContext();
  const { items: materials, loading } = useCollection('materials');
  const { items: exams } = useCollection('exams');
  const today = todayISO();
  if (sLoading || loading) return <Spinner />;

  const prep = materials.filter((m) => m.classId === student?.classId && m.category === 'exam-prep').sort((a, b) => b.date.localeCompare(a.date));
  const upcoming = exams.filter((e) => e.classId === student?.classId && e.date >= today).sort((a, b) => a.date.localeCompare(b.date));
  const first = upcoming[0];

  return (
    <div>
      <PageHeader eyebrow="Learning" title="Exam preparation" subtitle={`Revision material and upcoming exams for ${className}`} />
      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <div>
            <h2 className="mb-3 text-[15px] font-semibold text-navy-900">Question banks & sample papers</h2>
            {prep.length === 0 ? <div className="card"><EmptyState title="No exam material yet" /></div> : (
              <div className="grid gap-4 md:grid-cols-2">{prep.map((m) => <MaterialCard key={m.id} m={m} />)}</div>
            )}
          </div>
          <Quiz />
        </div>
        <div className="space-y-6">
          {first && (
            <div className="card overflow-hidden">
              <div className="bg-navy-950 p-5 text-white">
                <p className="eyebrow text-gold-300">Countdown</p>
                <p className="mt-2 font-serif text-4xl font-semibold">{daysBetween(today, first.date)} <span className="text-lg font-normal text-navy-200">days</span></p>
                <p className="mt-1 text-sm text-navy-200">until {first.name} begins ({first.subject}, {fmtDay(first.date)})</p>
              </div>
            </div>
          )}
          <Panel title="Exam schedule" subtitle={upcoming[0]?.name} bodyClassName="p-0">
            {upcoming.length === 0 ? <EmptyState icon={<CalendarDays className="h-6 w-6" />} title="No upcoming exams" /> : (
              <ul className="divide-y divide-navy-50">
                {upcoming.map((e) => {
                  const d = daysBetween(today, e.date);
                  return (
                    <li key={e.id} className="flex items-center gap-3 px-5 py-3">
                      <div className="w-12 shrink-0 rounded-lg bg-mist py-1 text-center">
                        <p className="text-[10px] font-semibold uppercase text-navy-400">{fmtDay(e.date).split(',')[0]}</p>
                        <p className="font-serif text-lg font-semibold leading-none text-navy-900">{e.date.slice(8)}</p>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-navy-900">{e.subject}</p>
                        <p className="text-xs text-navy-400">{e.time} · {e.maxMarks} marks</p>
                      </div>
                      <Badge tone={d <= 7 ? 'amber' : 'blue'}>{d === 0 ? 'Today' : `${d}d`}</Badge>
                    </li>
                  );
                })}
              </ul>
            )}
          </Panel>
        </div>
      </div>
    </div>
  );
}
