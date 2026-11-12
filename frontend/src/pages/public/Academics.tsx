import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, Brain, ClipboardCheck, FlaskConical, MessagesSquare, MonitorPlay, Users } from 'lucide-react';
import { img } from '@/data/images';
import { school } from '@/data/school';
import { DemoBadge } from '@/components/ui';
import { PageHero, Reveal, SectionHeading } from '@/components/site/SiteChrome';
import { PROGRAMS } from '@/components/site/content';
import { subjectsForClass } from '@/data/seed';

const STAGE_SUBJECTS: Record<string, string> = { 'Pre-Primary': 'nur', Primary: 'c3', Middle: 'c7', Secondary: 'c10' };

const METHODS = [
  { icon: Brain, title: 'Concept-based teaching', text: 'Clear understanding before practice, using examples from everyday life.' },
  { icon: FlaskConical, title: 'Experiential learning', text: 'Labs, models, field activities and projects that build curiosity.' },
  { icon: MonitorPlay, title: 'Digital resources', text: 'Smart-class content, video lessons and online study material via the LMS.' },
  { icon: MessagesSquare, title: 'Collaborative learning', text: 'Group work, discussions and presentations that build communication skills.' },
  { icon: Users, title: 'Individual attention', text: 'Remedial and enrichment support based on regular assessment.' },
  { icon: BookOpen, title: 'Reading culture', text: 'Library periods and reading programmes across all classes.' },
];

const CALENDAR = [
  { term: 'Session begins', period: 'April', note: 'New academic session, orientation' },
  { term: 'Unit Test 1', period: 'July', note: 'Classes 1 – 10' },
  { term: 'Unit Test 2', period: 'August', note: 'Classes 1 – 10' },
  { term: 'Half-Yearly Examination', period: 'December', note: 'Classes 1 – 10' },
  { term: 'Annual Day', period: 'December – January', note: 'Cultural programme and prize distribution' },
  { term: 'Pre-Board / Periodic Test', period: 'January', note: 'Class 10 and Classes 1 – 9' },
  { term: 'Annual Examination', period: 'February – March', note: 'Board exams for Class 10 as per board schedule' },
];

const GRADES = [
  ['91 – 100', 'A1'], ['81 – 90', 'A2'], ['71 – 80', 'B1'], ['61 – 70', 'B2'], ['51 – 60', 'C1'], ['41 – 50', 'C2'], ['33 – 40', 'D'], ['Below 33', 'E (Needs improvement)'],
];

export default function Academics() {
  return (
    <>
      <PageHero crumbs="Home / Academics" title="Academics" subtitle="A structured, stage-wise curriculum that builds strong foundations and prepares students for higher learning." image={img.handsUp} />

      <section className="section">
        <div className="container">
          <SectionHeading eyebrow="Stages of Learning" title="From first words to board examinations" />
          <div className="mt-12 space-y-8">
            {PROGRAMS.map((p, i) => (
              <Reveal key={p.stage}>
                <div className={`grid items-center gap-8 overflow-hidden rounded-3xl bg-white shadow-soft lg:grid-cols-2 ${i % 2 ? 'lg:[&>*:first-child]:order-2' : ''}`}>
                  <img src={p.image} alt={p.stage} loading="lazy" className="h-72 w-full object-cover lg:h-full lg:min-h-[340px]" />
                  <div className="p-8 lg:p-10">
                    <p className="eyebrow">{p.classes}</p>
                    <h3 className="mt-2 text-3xl font-semibold text-navy-900">{p.stage} Education</h3>
                    <p className="mt-4 text-[15px] leading-relaxed text-navy-600">{p.text}</p>
                    <p className="mt-6 text-xs font-semibold uppercase tracking-wider text-navy-400">Key subjects</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {subjectsForClass(STAGE_SUBJECTS[p.stage]).map((s) => <span key={s} className="rounded-full bg-mist px-3 py-1 text-xs font-medium text-navy-700">{s}</span>)}
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
          <p className="mt-8 rounded-xl border border-dashed border-navy-200 bg-white p-4 text-sm text-navy-500">
            <strong className="text-navy-700">Senior Secondary (Classes 11 – 12):</strong> details will be published only if confirmed by the school. Subject lists above are indicative for the demo.
          </p>
        </div>
      </section>

      <section className="section bg-white">
        <div className="container">
          <SectionHeading center eyebrow="Teaching Methodology" title="How our students learn" />
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {METHODS.map((m, i) => (
              <Reveal key={m.title} delay={(i % 3) * 0.05}>
                <div className="card h-full p-6">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gold-50 text-gold-700"><m.icon className="h-5 w-5" /></div>
                  <h3 className="mt-4 font-sans text-base font-semibold text-navy-900">{m.title}</h3>
                  <p className="mt-1.5 text-sm text-navy-500">{m.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container grid gap-10 lg:grid-cols-2">
          <Reveal>
            <div className="flex flex-wrap items-center gap-3">
              <SectionHeading eyebrow="Academic Calendar" title={`Session ${school.academicYear}`} />
            </div>
            <DemoBadge className="mt-4">Indicative calendar – final dates announced by the school</DemoBadge>
            <div className="card mt-6 overflow-hidden">
              <table className="table-base">
                <thead><tr><th>Milestone</th><th>Period</th><th className="hidden sm:table-cell">Notes</th></tr></thead>
                <tbody>
                  {CALENDAR.map((c) => (
                    <tr key={c.term}><td className="font-medium">{c.term}</td><td>{c.period}</td><td className="hidden text-navy-500 sm:table-cell">{c.note}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <SectionHeading eyebrow="Examinations" title="Assessment & grading" />
            <p className="mt-4 text-[15px] leading-relaxed text-navy-600">
              Students are assessed through unit tests, periodic tests, half-yearly and annual examinations, along with projects, practicals and
              class participation. Results and report cards are shared with parents through the Parent Portal.
            </p>
            <DemoBadge className="mt-4">Board affiliation & grading policy to be confirmed</DemoBadge>
            <div className="card mt-6 overflow-hidden">
              <table className="table-base">
                <thead><tr><th>Marks (%)</th><th>Grade</th></tr></thead>
                <tbody>{GRADES.map(([m, g]) => <tr key={m}><td>{m}</td><td className="font-semibold">{g}</td></tr>)}</tbody>
              </table>
            </div>
            <div className="mt-6 flex items-start gap-3 rounded-xl bg-navy-50 p-4 text-sm text-navy-700">
              <ClipboardCheck className="mt-0.5 h-5 w-5 shrink-0 text-navy-600" />
              Date sheets, syllabus and results for each examination are published in the Parent and Student portals.
            </div>
            <Link to="/login?role=parent&next=%2Fparent%2Fexams" className="btn-primary mt-6">View exam schedule <ArrowRight className="h-4 w-4" /></Link>
          </Reveal>
        </div>
      </section>
    </>
  );
}
