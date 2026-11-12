import { asyncHandler, badRequest, forbidden } from '../utils/httpError.js';
import { repo } from '../services/repository.js';
import { gateway } from '../services/paymentGateway.js';
import { allowedStudentIds } from '../middleware/scope.js';
import { logger } from '../utils/logger.js';

const METHODS = ['UPI', 'Card', 'Net Banking', 'Cash', 'Cheque'];
const YEAR = '2026-27';

/** Pending orders (in memory for the demo; persist in a `paymentOrders` collection in production). */
const orders = new Map();

function assertCanPay(user, studentId) {
  const ids = allowedStudentIds(user);
  if (ids && !ids.includes(studentId)) throw forbidden('You can only pay fees for your own child.');
}

async function nextReceiptNo() {
  const paid = await repo('payments').list({ status: 'Success' });
  const max = paid.reduce((m, p) => {
    const n = parseInt(String(p.receiptNo).split('/').pop(), 10);
    return Number.isFinite(n) && n > m ? n : m;
  }, 0);
  return `SPS/${YEAR}/${String(max + 1).padStart(4, '0')}`;
}

/** POST /api/fees/orders  { studentId, amount, installment, method } → { orderId, ... } */
export const createOrder = asyncHandler(async (req, res) => {
  const { studentId, amount, installment, method } = req.body || {};
  if (!studentId || !installment || !(Number(amount) > 0)) throw badRequest('studentId, installment and a positive amount are required.');
  if (method && !METHODS.includes(method)) throw badRequest('Unsupported payment method.');
  assertCanPay(req.user, studentId);
  const student = await repo('students').get(studentId);
  if (!student) throw badRequest('Unknown student.');

  // Prevent paying an instalment twice
  const already = await repo('payments').findOne({ studentId, installment, status: 'Success' });
  if (already) throw badRequest(`${installment} has already been paid (receipt ${already.receiptNo}).`);

  const order = await gateway().createOrder({ amount: Number(amount), receipt: `${studentId}-${Date.now()}`, notes: { studentId, installment } });
  orders.set(order.orderId, { ...order, studentId, installment, method: method || 'UPI', userId: req.user.id, createdAt: Date.now() });
  res.status(201).json(order);
});

/** POST /api/fees/verify  { orderId, studentId, amount, installment, method, simulate?, paymentId?, signature? } */
export const verifyPayment = asyncHandler(async (req, res) => {
  const { orderId, simulate, paymentId, signature } = req.body || {};
  const order = orders.get(orderId);
  if (!order) throw badRequest('Unknown or expired order.');
  if (order.userId !== req.user.id) throw forbidden();
  orders.delete(orderId);

  const result = await gateway().verifyPayment({ orderId, paymentId, signature, simulate });
  const payment = await repo('payments').create({
    studentId: order.studentId,
    amount: order.amount,
    installment: order.installment,
    method: order.method,
    date: new Date().toISOString().slice(0, 10),
    status: result.ok ? 'Success' : 'Failed',
    receiptNo: result.ok ? await nextReceiptNo() : '—',
    txnId: result.txnId,
  });

  if (result.ok) {
    await repo('notifications').create({
      target: req.user.id, title: 'Payment received', type: 'fee', read: false, link: '/parent/fees',
      message: `${order.installment} – receipt ${payment.receiptNo}`, date: payment.date,
    });
  }
  res.json({
    ok: result.ok,
    payment,
    message: result.ok ? 'Payment successful. Your receipt is ready.' : `Payment failed: ${result.reason} No amount was deducted.`,
  });
});

/** POST /api/fees/webhook – gateway → server notifications (source of truth for reconciliation). */
export const webhook = asyncHandler(async (req, res) => {
  // TODO (production): verify X-Razorpay-Signature with RAZORPAY_WEBHOOK_SECRET using the RAW body,
  // then upsert the payment by gateway payment id (idempotent) and mark the order captured/failed.
  logger.info('Payment webhook received (placeholder):', req.body?.event || 'unknown event');
  res.json({ received: true });
});
