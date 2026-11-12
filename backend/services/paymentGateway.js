import crypto from 'node:crypto';
import { env } from '../config/env.js';
import { uid } from '../utils/httpError.js';

/**
 * Payment gateway adapter.
 *   createOrder({ amount, receipt, notes }) → { orderId, amount, currency, gateway, publicKey? }
 *   verifyPayment({ orderId, paymentId, signature, simulate }) → { ok, txnId, reason? }
 *
 * The demo uses SimulatedGateway – NO real money moves. Switch PAYMENT_GATEWAY=razorpay only after
 * completing the TODOs below with real merchant credentials and a verified webhook.
 */
class SimulatedGateway {
  name = 'simulated';
  async createOrder({ amount }) {
    return { orderId: uid('order_sim'), amount, currency: 'INR', gateway: this.name };
  }
  async verifyPayment({ simulate }) {
    await new Promise((r) => setTimeout(r, 600));
    const ok = simulate !== 'failure';
    return {
      ok,
      txnId: `TXN${crypto.randomBytes(5).toString('hex').toUpperCase()}`,
      reason: ok ? undefined : 'Bank declined the transaction (simulated).',
    };
  }
}

class RazorpayGateway {
  name = 'razorpay';
  constructor() {
    if (!env.razorpay.keyId || !env.razorpay.keySecret) {
      throw new Error('Razorpay selected but RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET are not configured.');
    }
  }
  async createOrder() {
    // TODO: npm i razorpay
    //   const rzp = new Razorpay({ key_id: env.razorpay.keyId, key_secret: env.razorpay.keySecret });
    //   const order = await rzp.orders.create({ amount: amount * 100, currency: 'INR', receipt, notes });
    //   return { orderId: order.id, amount, currency: 'INR', gateway: 'razorpay', publicKey: env.razorpay.keyId };
    throw new Error('Razorpay integration not implemented in the demo build.');
  }
  async verifyPayment({ orderId, paymentId, signature }) {
    // Signature check per Razorpay docs: HMAC_SHA256(order_id + "|" + payment_id, key_secret) === signature
    const expected = crypto.createHmac('sha256', env.razorpay.keySecret).update(`${orderId}|${paymentId}`).digest('hex');
    const given = Buffer.from(String(signature || ''));
    const ok = given.length === expected.length && crypto.timingSafeEqual(Buffer.from(expected), given);
    // TODO: also fetch the payment from Razorpay and confirm status === 'captured' and amount matches.
    return { ok, txnId: paymentId, reason: ok ? undefined : 'Signature verification failed.' };
  }
}

let instance;
export function gateway() {
  if (!instance) instance = env.paymentGateway === 'razorpay' ? new RazorpayGateway() : new SimulatedGateway();
  return instance;
}
