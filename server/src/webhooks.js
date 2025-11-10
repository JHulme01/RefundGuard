import { Router } from 'express';
import crypto from 'crypto';
import { logRefund } from './db-wrapper.js';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

function verifySignature(secret, payload, signature) {
  if (!secret || !signature) return false;
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(payload);
  const expected = hmac.digest('hex');
  const expectedBuffer = Buffer.from(expected);
  const signatureBuffer = Buffer.from(signature);
  if (expectedBuffer.length !== signatureBuffer.length) {
    return false;
  }
  return crypto.timingSafeEqual(expectedBuffer, signatureBuffer);
}

router.post('/', (req, res) => {
  const secret = process.env.WHOP_WEBHOOK_SECRET;
  const providedSignature = req.headers['whop-signature'];
  const rawBody = req.rawBody;

  if (secret) {
    if (!rawBody || !verifySignature(secret, rawBody, providedSignature)) {
      return res.status(401).json({ error: 'invalid_signature' });
    }
  }

  const event = req.body;
  if (!event?.type) {
    return res.status(400).json({ error: 'invalid_event' });
  }

  if (event.type === 'refund.updated' || event.type === 'refund.created') {
    const payload = event.data ?? {};
    logRefund({
      id: payload.id || uuidv4(),
      creatorId: payload.creator_id || 'unknown',
      whopRequestId: payload.id || null,
      purchaseId: payload.purchase_id || null,
      purchaseDate: payload.purchase?.created_at || payload.created_at || new Date().toISOString(),
      daysSincePurchase: payload.days_since_purchase ?? null,
      productName: payload.purchase?.product_name || payload.product?.name || null,
      memberName: payload.member?.name || payload.member?.email || 'Member',
      memberEmail: payload.member?.email || null,
      amount: payload.amount ? Number(payload.amount) / 100 : null,
      currency: payload.currency || 'USD',
      decision: payload.decision || payload.status || 'pending',
      status: payload.status || 'pending',
      rawPayload: event
    });
  }

  res.json({ received: true });
});

export default router;

