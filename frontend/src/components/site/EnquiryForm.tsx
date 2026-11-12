import { useState } from 'react';
import { CheckCircle2, Send } from 'lucide-react';
import { Button, Field, Input, Select, Textarea } from '@/components/ui';
import { useForm, v } from '@/hooks/useForm';
import { useToast } from '@/context/ToastContext';
import { repo } from '@/services/dataService';
import { CLASSES } from '@/data/seed';
import { todayISO } from '@/utils/format';

const initial = { name: '', phone: '', email: '', classApplying: '', message: '' };

/** Admission enquiry form shared by the Home and Admissions pages. Creates an 'admission' enquiry record. */
export function EnquiryForm({ dark }: { dark?: boolean }) {
  const toast = useToast();
  const [done, setDone] = useState(false);
  const f = useForm(initial, {
    name: [v.required('Please enter the parent / guardian name'), v.minLength(3)],
    phone: [v.required('Please enter a mobile number'), v.phone()],
    email: [v.required('Please enter an email address'), v.email()],
    classApplying: [v.required('Please choose a class')],
  });

  const submit = f.handleSubmit(async (vals) => {
    await repo('enquiries').create({
      kind: 'admission', name: vals.name.trim(), phone: vals.phone.trim(), email: vals.email.trim(),
      classApplying: vals.classApplying, message: vals.message.trim() || 'Admission enquiry', date: todayISO(), status: 'New',
    });
    toast.success('Enquiry submitted', 'The admission office will contact you shortly.');
    f.reset();
    setDone(true);
  });

  if (done) {
    return (
      <div className={`flex flex-col items-center rounded-2xl p-8 text-center ${dark ? 'bg-white/5' : 'bg-mist'}`}>
        <CheckCircle2 className="h-12 w-12 text-emerald-500" />
        <p className={`mt-4 font-serif text-xl font-semibold ${dark ? 'text-white' : 'text-navy-900'}`}>Thank you for your enquiry</p>
        <p className={`mt-2 max-w-sm text-sm ${dark ? 'text-navy-200' : 'text-navy-500'}`}>Our admission office will get in touch with you within two working days.</p>
        <Button variant="outline" className="mt-6" onClick={() => setDone(false)}>Submit another enquiry</Button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="grid gap-4 sm:grid-cols-2">
      <Field label="Parent / Guardian name" required error={f.errors.name}><Input {...f.bind('name')} placeholder="Full name" autoComplete="name" /></Field>
      <Field label="Mobile number" required error={f.errors.phone}><Input {...f.bind('phone')} placeholder="10-digit mobile" inputMode="tel" autoComplete="tel" /></Field>
      <Field label="Email address" required error={f.errors.email}><Input {...f.bind('email')} type="email" placeholder="you@example.com" autoComplete="email" /></Field>
      <Field label="Class applying for" required error={f.errors.classApplying}>
        <Select {...f.bind('classApplying')} placeholder="Select class" options={CLASSES.map((c) => ({ value: c.name, label: c.name }))} />
      </Field>
      <Field label="Message (optional)" className="sm:col-span-2"><Textarea {...f.bind('message')} placeholder="Any questions about admissions, transport or fees…" /></Field>
      <div className="flex flex-col gap-3 sm:col-span-2 sm:flex-row sm:items-center sm:justify-between">
        <p className={`text-xs ${dark ? 'text-navy-300' : 'text-navy-400'}`}>By submitting, you agree to be contacted by the school regarding admissions.</p>
        <Button type="submit" variant="gold" size="lg" loading={f.submitting} icon={<Send className="h-4 w-4" />}>Submit Enquiry</Button>
      </div>
    </form>
  );
}
