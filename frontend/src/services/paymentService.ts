import type { Payment, PaymentMethod } from '@/types';
import { DATA_MODE } from './config';
import { http } from './http';
import { repo } from './dataService';
import { todayISO, uid } from '@/utils/format';

/**
 * Payment gateway abstraction.
 *
 * Production flow (e.g. Razorpay / PayU / CCAvenue):
 *   1. POST /api/fees/orders           → backend creates a gateway order with the secret key, returns orderId
 *   2. Frontend opens the gateway checkout with the public key + orderId
 *   3. Gateway redirects / calls back   → POST /api/fees/verify with signature
 *   4. Backend verifies the signature, records the payment, issues receipt number
 *   5. Gateway webhook                  → /api/fees/webhook (source of truth for reconciliation)
 *
 * DEMO: no real money moves. `simulate` lets the presenter choose success or failure.
 */
export interface CheckoutRequest {
  studentId: string;
  amount: number;
  installment: string;
  method: PaymentMethod;
  simulate: 'success' | 'failure';
}

export interface CheckoutResult { ok: boolean; payment: Payment; message: string }

export const paymentService = {
  async checkout(req: CheckoutRequest): Promise<CheckoutResult> {
    if (DATA_MODE === 'api') {
      const order = await http<{ orderId: string }>('/fees/orders', { method: 'POST', body: JSON.stringify(req) });
      return http<CheckoutResult>('/fees/verify', { method: 'POST', body: JSON.stringify({ ...req, orderId: order.orderId }) });
    }
    await new Promise((r) => setTimeout(r, 1800)); // simulate gateway round-trip
    const ok = req.simulate === 'success';
    const payments = await repo('payments').list();
    const year = '2026-27';
    const next = payments.filter((p) => p.status === 'Success').length + 1;
    const payment = await repo('payments').create({
      studentId: req.studentId, amount: req.amount, installment: req.installment, method: req.method,
      date: todayISO(), status: ok ? 'Success' : 'Failed',
      receiptNo: ok ? `SPS/${year}/${String(next).padStart(4, '0')}` : '—',
      txnId: `TXN${uid('').slice(1, 11).toUpperCase().replace(/[^A-Z0-9]/g, '')}`,
    });
    return {
      ok, payment,
      message: ok ? 'Payment successful. Your receipt is ready.' : 'Payment failed: the bank declined the transaction (simulated). No amount was deducted.',
    };
  },
};
