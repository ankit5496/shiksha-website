import type { FeeStructure, Payment, StudentFee } from '@/types';
import { daysBetween, todayISO } from './format';

export interface InstallmentStatus {
  label: string;
  dueDate: string;
  amount: number;
  paid: boolean;
  payment?: Payment;
  overdue: boolean;
  daysOverdue: number;
  lateFee: number;
}

export interface FeeSummary {
  items: { category: string; amount: number }[];
  gross: number;
  discountPct: number;
  discountAmount: number;
  transportFee: number;
  net: number;
  paid: number;
  outstanding: number;
  installments: InstallmentStatus[];
  nextDue?: InstallmentStatus;
  lateFeeTotal: number;
}

/** Single source of truth for fee maths, shared by Parent, Fees Portal and Admin modules. */
export function computeFeeSummary(structure: FeeStructure | undefined, sf: StudentFee | undefined, payments: Payment[], today = todayISO()): FeeSummary {
  const items = structure?.items ?? [];
  const gross = items.reduce((a, b) => a + b.amount, 0);
  const discountPct = sf?.discount ?? 0;
  const discountAmount = Math.round((gross * discountPct) / 100);
  const transportFee = sf?.transportFee ?? 0;
  const net = gross - discountAmount + transportFee + (sf?.lateFee ?? 0);
  const ok = payments.filter((p) => p.status === 'Success');
  const paid = ok.reduce((a, b) => a + b.amount, 0);
  const base = gross - discountAmount + transportFee;
  const installments: InstallmentStatus[] = (structure?.installments ?? []).map((ins) => {
    const payment = ok.find((p) => p.installment === ins.label);
    const daysOverdue = Math.max(0, daysBetween(ins.dueDate, today));
    const overdue = !payment && daysOverdue > 0;
    return {
      label: ins.label, dueDate: ins.dueDate, amount: Math.round((base * ins.percent) / 100),
      paid: !!payment, payment, overdue, daysOverdue: overdue ? daysOverdue : 0,
      lateFee: overdue ? Math.min(daysOverdue * (structure?.lateFeePerDay ?? 0), 1000) : 0,
    };
  });
  const lateFeeTotal = installments.reduce((a, b) => a + b.lateFee, 0) + (sf?.lateFee ?? 0);
  return {
    items: items.map((i) => ({ category: i.category, amount: i.amount })),
    gross, discountPct, discountAmount, transportFee, net: net + installments.reduce((a, b) => a + b.lateFee, 0),
    paid, outstanding: Math.max(0, net + installments.reduce((a, b) => a + b.lateFee, 0) - paid),
    installments, nextDue: installments.find((i) => !i.paid), lateFeeTotal,
  };
}
