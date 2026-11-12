import { CheckCircle2, Clock, Download, FileText, Mail, Phone } from 'lucide-react';
import { img } from '@/data/images';
import { school } from '@/data/school';
import { Button, DemoBadge } from '@/components/ui';
import { PageHero, Reveal, SectionHeading } from '@/components/site/SiteChrome';
import { EnquiryForm } from '@/components/site/EnquiryForm';
import { downloadAdmissionForm } from '@/utils/pdf';
import { useToast } from '@/context/ToastContext';

const STEPS = [
  { title: 'Enquiry', text: 'Submit the online enquiry form or visit the school office.' },
  { title: 'Campus visit', text: 'Meet our team, see the campus and clarify your questions.' },
  { title: 'Registration', text: 'Fill in the admission form and submit the required documents.' },
  { title: 'Interaction', text: 'A friendly interaction / assessment as applicable for the class.' },
  { title: 'Confirmation', text: 'Admission is confirmed on payment of fees and document verification.' },
];

const ELIGIBILITY = [
  ['Nursery', '3+ years'], ['LKG', '4+ years'], ['UKG', '5+ years'], ['Class 1', '6+ years'],
  ['Classes 2 – 9', 'Previous class passed, transfer certificate'],
];

const DOCS = [
  'Birth certificate of the student', 'Four recent passport-size photographs', 'Aadhaar card of the student and parents',
  'Transfer certificate from the previous school (Class 2 onwards)', 'Report card of the previous class', 'Address proof',
];

export default function Admissions() {
  const toast = useToast();
  return (
    <>
      <PageHero crumbs="Home / Admissions" title={`Admissions ${school.academicYear}`} subtitle="We welcome families who share our commitment to learning and values. Here is everything you need to know to get started." image={img.backpacks} />

      <section className="section">
        <div className="container">
          <SectionHeading eyebrow="Admission Process" title="Five simple steps" />
          <ol className="mt-12 grid gap-6 md:grid-cols-5">
            {STEPS.map((s, i) => (
              <Reveal key={s.title} delay={i * 0.05}>
                <li className="relative h-full">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-navy-900 font-serif text-lg font-semibold text-gold-300">{i + 1}</div>
                  {i < STEPS.length - 1 && <div className="absolute left-12 right-0 top-6 hidden h-px bg-navy-100 md:block" />}
                  <h3 className="mt-5 font-sans text-base font-semibold text-navy-900">{s.title}</h3>
                  <p className="mt-1.5 text-sm text-navy-500">{s.text}</p>
                </li>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      <section className="section bg-white">
        <div className="container grid gap-10 lg:grid-cols-2 [&>*]:min-w-0">
          <Reveal>
            <SectionHeading eyebrow="Eligibility" title="Age criteria" />
            <DemoBadge className="mt-4">Indicative – as per school / board policy</DemoBadge>
            <div className="card scrollbar-thin mt-6 overflow-x-auto">
              <table className="table-base">
                <thead><tr><th>Class</th><th>Minimum age / requirement (as on 31 March)</th></tr></thead>
                <tbody>{ELIGIBILITY.map(([c, a]) => <tr key={c}><td className="font-medium">{c}</td><td>{a}</td></tr>)}</tbody>
              </table>
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <SectionHeading eyebrow="Documents" title="Required documents" />
            <ul className="mt-6 space-y-3">
              {DOCS.map((d) => <li key={d} className="flex gap-3 text-[15px] text-navy-700"><CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-gold-600" />{d}</li>)}
            </ul>
            <div className="mt-8 flex flex-col gap-4 rounded-2xl bg-navy-950 p-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <FileText className="h-8 w-8 text-gold-400" />
                <div><p className="font-semibold text-white">Admission Form (PDF)</p><p className="text-sm text-navy-300">Print, fill and submit at the office</p></div>
              </div>
              <Button variant="gold" icon={<Download className="h-4 w-4" />} onClick={() => { downloadAdmissionForm(); toast.success('Download started', 'SPS-Admission-Form.pdf'); }}>Download Form</Button>
            </div>
          </Reveal>
        </div>
      </section>

      <section id="enquiry" className="section scroll-mt-20">
        <div className="container grid gap-10 lg:grid-cols-3">
          <Reveal className="lg:col-span-2">
            <div className="card p-6 sm:p-8">
              <SectionHeading eyebrow="Admission Enquiry" title="Request a call back" subtitle="Fill in the form and the admission office will contact you." />
              <div className="mt-8"><EnquiryForm /></div>
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="card h-full p-6 sm:p-8">
              <h3 className="text-xl font-semibold text-navy-900">Admission Office</h3>
              <p className="mt-2 text-sm text-navy-500">Our team is happy to help with admissions, fees and transport queries.</p>
              <ul className="mt-6 space-y-4 text-sm">
                <li className="flex gap-3"><Phone className="h-5 w-5 text-gold-600" /><a href={`tel:${school.phone}`} className="font-medium text-navy-800 hover:underline">{school.phoneDisplay}</a></li>
                <li className="flex gap-3"><Mail className="h-5 w-5 text-gold-600" /><a href={`mailto:${school.email}`} className="font-medium text-navy-800 hover:underline">{school.email}</a></li>
                {school.officeHours.map((h) => <li key={h.days} className="flex gap-3"><Clock className="h-5 w-5 shrink-0 text-gold-600" /><span><span className="block font-medium text-navy-800">{h.days}</span><span className="text-navy-500">{h.time}</span></span></li>)}
              </ul>
              <DemoBadge className="mt-6">Contact details to be confirmed</DemoBadge>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
