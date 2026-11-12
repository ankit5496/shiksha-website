import { useState } from 'react';
import { CheckCircle2, Clock, Mail, MapPin, Phone, Send } from 'lucide-react';
import { img } from '@/data/images';
import { school } from '@/data/school';
import { Button, DemoBadge, Field, Input, Select, Textarea } from '@/components/ui';
import { PageHero, Reveal, SectionHeading } from '@/components/site/SiteChrome';
import { useForm, v } from '@/hooks/useForm';
import { useToast } from '@/context/ToastContext';
import { repo } from '@/services/dataService';
import { todayISO } from '@/utils/format';

const SUBJECTS = ['General enquiry', 'Admissions', 'Fees', 'Transport', 'Academics', 'Feedback'];

export default function Contact() {
  const toast = useToast();
  const [sent, setSent] = useState(false);
  const f = useForm({ name: '', phone: '', email: '', subject: '', message: '' }, {
    name: [v.required('Please enter your name'), v.minLength(3)],
    phone: [v.required('Please enter a mobile number'), v.phone()],
    email: [v.required('Please enter an email address'), v.email()],
    subject: [v.required('Please choose a subject')],
    message: [v.required('Please write a message'), v.minLength(10, 'Message should be at least 10 characters')],
  });

  const submit = f.handleSubmit(async (vals) => {
    await repo('enquiries').create({ kind: 'contact', name: vals.name.trim(), phone: vals.phone.trim(), email: vals.email.trim(), subject: vals.subject, message: vals.message.trim(), date: todayISO(), status: 'New' });
    toast.success('Message sent', 'Thank you! The school office will respond soon.');
    f.reset();
    setSent(true);
  });

  const info = [
    { icon: MapPin, title: 'Address', lines: [school.address, school.addressNote] },
    { icon: Phone, title: 'Phone', lines: [school.phoneDisplay], href: `tel:${school.phone}` },
    { icon: Mail, title: 'Email', lines: [school.email], href: `mailto:${school.email}` },
  ];

  return (
    <>
      <PageHero crumbs="Home / Contact" title="Contact us" subtitle="We'd love to hear from you. Reach out with questions about admissions, academics, fees or transport." image={img.libraryGlass} />
      <section className="section">
        <div className="container grid gap-10 lg:grid-cols-5">
          <Reveal className="space-y-5 lg:col-span-2">
            {info.map((i) => (
              <div key={i.title} className="card flex gap-4 p-5">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-navy-900 text-gold-300"><i.icon className="h-5 w-5" /></div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-navy-400">{i.title}</p>
                  {i.href ? <a href={i.href} className="mt-1 block font-semibold text-navy-900 hover:underline">{i.lines[0]}</a> : <p className="mt-1 font-semibold text-navy-900">{i.lines[0]}</p>}
                  {i.lines[1] && <p className="text-sm text-navy-400">{i.lines[1]}</p>}
                </div>
              </div>
            ))}
            <div className="card p-5">
              <div className="flex items-center gap-2"><Clock className="h-5 w-5 text-gold-600" /><p className="font-semibold text-navy-900">Office timings</p></div>
              <ul className="mt-3 divide-y divide-navy-50 text-sm">
                {school.officeHours.map((h) => <li key={h.days} className="flex justify-between gap-4 py-2.5"><span className="text-navy-600">{h.days}</span><span className="text-right font-medium text-navy-900">{h.time}</span></li>)}
              </ul>
            </div>
            <DemoBadge>Contact details shown are demo values pending confirmation</DemoBadge>
          </Reveal>

          <Reveal delay={0.1} className="lg:col-span-3">
            <div className="card p-6 sm:p-8">
              <SectionHeading eyebrow="Write to us" title="Send a message" />
              {sent ? (
                <div className="mt-8 flex flex-col items-center rounded-2xl bg-mist p-8 text-center">
                  <CheckCircle2 className="h-12 w-12 text-emerald-500" />
                  <p className="mt-4 font-serif text-xl font-semibold text-navy-900">Message received</p>
                  <p className="mt-2 text-sm text-navy-500">We usually respond within two working days.</p>
                  <Button variant="outline" className="mt-6" onClick={() => setSent(false)}>Send another message</Button>
                </div>
              ) : (
                <form onSubmit={submit} noValidate className="mt-8 grid gap-4 sm:grid-cols-2">
                  <Field label="Your name" required error={f.errors.name}><Input {...f.bind('name')} placeholder="Full name" autoComplete="name" /></Field>
                  <Field label="Mobile number" required error={f.errors.phone}><Input {...f.bind('phone')} placeholder="10-digit mobile" inputMode="tel" /></Field>
                  <Field label="Email" required error={f.errors.email}><Input {...f.bind('email')} type="email" placeholder="you@example.com" /></Field>
                  <Field label="Subject" required error={f.errors.subject}><Select {...f.bind('subject')} placeholder="Choose a subject" options={SUBJECTS.map((s) => ({ value: s, label: s }))} /></Field>
                  <Field label="Message" required error={f.errors.message} className="sm:col-span-2"><Textarea {...f.bind('message')} rows={5} placeholder="How can we help?" /></Field>
                  <div className="sm:col-span-2"><Button type="submit" size="lg" loading={f.submitting} icon={<Send className="h-4 w-4" />}>Send Message</Button></div>
                </form>
              )}
            </div>
          </Reveal>
        </div>
      </section>
      <section className="pb-20">
        <div className="container">
          <div className="h-[420px] overflow-hidden rounded-2xl border border-navy-100 shadow-soft">
            <iframe title="School location map" src={`https://www.google.com/maps?q=${encodeURIComponent(school.mapQuery)}&output=embed`} className="h-full w-full" loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
          </div>
        </div>
      </section>
    </>
  );
}
