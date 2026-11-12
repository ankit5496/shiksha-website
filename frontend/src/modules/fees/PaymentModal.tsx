import { useEffect, useState } from 'react';
import clsx from 'clsx';
import { motion } from 'framer-motion';
import { Building2, CheckCircle2, CreditCard, Download, Loader2, Lock, RefreshCw, ShieldCheck, Smartphone, XCircle } from 'lucide-react';
import type { Payment, PaymentMethod, Student } from '@/types';
import { Button, Field, Input, Modal, Select } from '@/components/ui';
import { paymentService } from '@/services/paymentService';
import { useToast } from '@/context/ToastContext';
import { downloadReceipt } from '@/utils/pdf';
import { inr } from '@/utils/format';
import type { InstallmentStatus } from '@/utils/fees';

type Step = 'form' | 'processing' | 'success' | 'failed';
const METHODS: { id: Exclude<PaymentMethod, 'Cash' | 'Cheque'>; label: string; icon: typeof CreditCard; sub: string }[] = [
  { id: 'UPI', label: 'UPI', icon: Smartphone, sub: 'GPay, PhonePe, Paytm, BHIM' },
  { id: 'Card', label: 'Debit / Credit Card', icon: CreditCard, sub: 'Visa, Mastercard, RuPay' },
  { id: 'Net Banking', label: 'Net Banking', icon: Building2, sub: 'All major Indian banks' },
];
const BANKS = ['State Bank of India', 'HDFC Bank', 'ICICI Bank', 'Punjab National Bank', 'Bank of Baroda', 'Axis Bank'];

interface Props {
  open: boolean;
  onClose: () => void;
  student: Student;
  className: string;
  installment: InstallmentStatus | null;
}

export default function PaymentModal({ open, onClose, student, className, installment }: Props) {
  const toast = useToast();
  const [step, setStep] = useState<Step>('form');
  const [method, setMethod] = useState<(typeof METHODS)[number]['id']>('UPI');
  const [outcome, setOutcome] = useState<'success' | 'failure'>('success');
  const [upi, setUpi] = useState('');
  const [card, setCard] = useState({ number: '', name: '', expiry: '', cvv: '' });
  const [bank, setBank] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [result, setResult] = useState<{ payment: Payment; message: string } | null>(null);

  useEffect(() => {
    if (open) { setStep('form'); setErrors({}); setResult(null); setUpi(''); setCard({ number: '', name: '', expiry: '', cvv: '' }); setBank(''); }
  }, [open]);

  if (!installment) return null;
  const amount = installment.amount + installment.lateFee;

  const validate = () => {
    const e: Record<string, string> = {};
    if (method === 'UPI' && !/^[\w.-]{2,}@[a-zA-Z]{2,}$/.test(upi.trim())) e.upi = 'Enter a valid UPI ID (e.g. name@okbank)';
    if (method === 'Card') {
      if (card.number.replace(/\s/g, '').length !== 16) e.number = 'Enter a 16-digit card number';
      if (card.name.trim().length < 3) e.name = 'Enter the name on card';
      const m = card.expiry.match(/^(\d{2})\/(\d{2})$/);
      if (!m || +m[1] < 1 || +m[1] > 12) e.expiry = 'Use MM/YY';
      if (!/^\d{3}$/.test(card.cvv)) e.cvv = '3 digits';
    }
    if (method === 'Net Banking' && !bank) e.bank = 'Select your bank';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const pay = async () => {
    if (!validate()) return;
    setStep('processing');
    try {
      const r = await paymentService.checkout({ studentId: student.id, amount, installment: installment.label, method, simulate: outcome });
      setResult(r);
      setStep(r.ok ? 'success' : 'failed');
      if (r.ok) toast.success('Payment successful', `${inr(amount)} received for ${installment.label}.`);
      else toast.error('Payment failed', 'The transaction was declined (simulated).');
    } catch (err) {
      setResult(null);
      setStep('failed');
      toast.error('Payment error', (err as Error).message);
    }
  };

  const fmtCard = (v: string) => v.replace(/\D/g, '').slice(0, 16).replace(/(\d{4})(?=\d)/g, '$1 ');
  const fmtExp = (v: string) => { const d = v.replace(/\D/g, '').slice(0, 4); return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d; };

  const footer = step === 'form' ? (
    <>
      <Button variant="outline" onClick={onClose}>Cancel</Button>
      <Button variant="gold" onClick={pay} icon={<Lock className="h-4 w-4" />}>Pay {inr(amount)}</Button>
    </>
  ) : step === 'success' ? (
    <>
      <Button variant="outline" onClick={() => result && downloadReceipt(result.payment, student, className)} icon={<Download className="h-4 w-4" />}>Download receipt</Button>
      <Button onClick={onClose}>Done</Button>
    </>
  ) : step === 'failed' ? (
    <>
      <Button variant="outline" onClick={onClose}>Close</Button>
      <Button onClick={() => setStep('form')} icon={<RefreshCw className="h-4 w-4" />}>Try again</Button>
    </>
  ) : undefined;

  return (
    <Modal open={open} onClose={step === 'processing' ? () => {} : onClose} title="Secure Fee Payment" subtitle={`${student.name} · ${className}-${student.section}`} size="lg" footer={footer}>
      {step === 'form' && (
        <div className="space-y-5">
          <div className="rounded-xl bg-navy-950 p-5 text-white">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-wider text-navy-300">Paying for</p>
                <p className="mt-1 font-semibold">{installment.label}</p>
                <p className="text-xs text-navy-300">Admission No. {student.admissionNo}</p>
              </div>
              <div className="text-right">
                <p className="text-xs uppercase tracking-wider text-navy-300">Amount</p>
                <p className="mt-1 font-serif text-2xl font-semibold text-gold-300">{inr(amount)}</p>
                {installment.lateFee > 0 && <p className="text-xs text-red-300">incl. late fee {inr(installment.lateFee)}</p>}
              </div>
            </div>
          </div>

          <div>
            <p className="label">Payment method</p>
            <div className="grid gap-2 sm:grid-cols-3">
              {METHODS.map((m) => (
                <button key={m.id} type="button" onClick={() => { setMethod(m.id); setErrors({}); }}
                  className={clsx('rounded-xl border p-3 text-left transition', method === m.id ? 'border-navy-800 bg-navy-50 ring-1 ring-navy-800' : 'border-navy-100 hover:border-navy-300')}>
                  <m.icon className={clsx('h-5 w-5', method === m.id ? 'text-navy-900' : 'text-navy-400')} />
                  <p className="mt-2 text-sm font-semibold text-navy-900">{m.label}</p>
                  <p className="text-[11px] text-navy-400">{m.sub}</p>
                </button>
              ))}
            </div>
          </div>

          {method === 'UPI' && (
            <Field label="UPI ID" error={errors.upi} required><Input value={upi} onChange={(e) => setUpi(e.target.value)} placeholder="yourname@okhdfcbank" invalid={!!errors.upi} /></Field>
          )}
          {method === 'Card' && (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Card number" error={errors.number} required className="sm:col-span-2"><Input inputMode="numeric" autoComplete="off" value={card.number} onChange={(e) => setCard({ ...card, number: fmtCard(e.target.value) })} placeholder="4111 1111 1111 1111" invalid={!!errors.number} /></Field>
              <Field label="Name on card" error={errors.name} required className="sm:col-span-2"><Input value={card.name} onChange={(e) => setCard({ ...card, name: e.target.value })} placeholder="As printed on card" invalid={!!errors.name} /></Field>
              <Field label="Expiry" error={errors.expiry} required><Input inputMode="numeric" value={card.expiry} onChange={(e) => setCard({ ...card, expiry: fmtExp(e.target.value) })} placeholder="MM/YY" invalid={!!errors.expiry} /></Field>
              <Field label="CVV" error={errors.cvv} required><Input type="password" inputMode="numeric" autoComplete="off" value={card.cvv} onChange={(e) => setCard({ ...card, cvv: e.target.value.replace(/\D/g, '').slice(0, 3) })} placeholder="•••" invalid={!!errors.cvv} /></Field>
            </div>
          )}
          {method === 'Net Banking' && (
            <Field label="Bank" error={errors.bank} required><Select value={bank} onChange={(e) => setBank(e.target.value)} placeholder="Select your bank" options={BANKS.map((b) => ({ value: b, label: b }))} invalid={!!errors.bank} /></Field>
          )}

          <div className="rounded-xl border border-dashed border-gold-400 bg-gold-50/70 p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-gold-800">Demo gateway – choose outcome</p>
            <div className="mt-2 flex gap-2">
              {(['success', 'failure'] as const).map((o) => (
                <button key={o} type="button" onClick={() => setOutcome(o)}
                  className={clsx('flex-1 rounded-lg border px-3 py-2 text-sm font-semibold capitalize transition', outcome === o ? (o === 'success' ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-red-600 bg-red-600 text-white') : 'border-navy-100 bg-white text-navy-600')}>
                  {o === 'success' ? 'Successful payment' : 'Failed payment'}
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs text-gold-900">Simulated payment – no real money is processed. Card details are never stored.</p>
          </div>
          <p className="flex items-center gap-1.5 text-xs text-navy-400"><ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />In production, payments are processed by a PCI-DSS compliant gateway and verified on the server.</p>
        </div>
      )}

      {step === 'processing' && (
        <div className="flex flex-col items-center py-14 text-center">
          <Loader2 className="h-10 w-10 animate-spin text-navy-700" />
          <p className="mt-4 font-semibold text-navy-900">Processing your payment…</p>
          <p className="mt-1 text-sm text-navy-400">Connecting to the payment gateway. Please do not close this window.</p>
        </div>
      )}

      {step === 'success' && result && (
        <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center py-6 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50"><CheckCircle2 className="h-9 w-9 text-emerald-600" /></div>
          <p className="mt-4 font-serif text-2xl font-semibold text-navy-900">{inr(result.payment.amount)} paid</p>
          <p className="mt-1 text-sm text-navy-500">{result.message}</p>
          <dl className="mt-6 grid w-full max-w-sm grid-cols-2 gap-3 rounded-xl bg-mist p-4 text-left text-sm">
            <dt className="text-navy-400">Receipt No.</dt><dd className="font-semibold text-navy-900">{result.payment.receiptNo}</dd>
            <dt className="text-navy-400">Transaction ID</dt><dd className="font-semibold text-navy-900">{result.payment.txnId}</dd>
            <dt className="text-navy-400">Method</dt><dd className="font-semibold text-navy-900">{result.payment.method}</dd>
            <dt className="text-navy-400">Instalment</dt><dd className="font-semibold text-navy-900">{result.payment.installment}</dd>
          </dl>
        </motion.div>
      )}

      {step === 'failed' && (
        <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center py-8 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-50"><XCircle className="h-9 w-9 text-red-600" /></div>
          <p className="mt-4 font-serif text-2xl font-semibold text-navy-900">Payment failed</p>
          <p className="mt-1 max-w-sm text-sm text-navy-500">{result?.message ?? 'Something went wrong while contacting the gateway.'}</p>
          {result && <p className="mt-3 text-xs text-navy-400">Reference: {result.payment.txnId}</p>}
        </motion.div>
      )}
    </Modal>
  );
}
