import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieSession from 'cookie-session';
import { demoPurchases, demoRefundRequests } from './demoData.js';
import { fetchPurchases, createRefund, revokeAccess } from './whopClient.js';
import authRouter from './auth.js';
import policyRouter from './policy.js';
import webhookRouter from './webhooks.js';
import { getPolicy, listRefundLogs, logRefund, getTokens } from './db.js';
import { v4 as uuidv4 } from 'uuid';

dotenv.config();

const app = express();
app.use(cors({
  origin: process.env.APP_ORIGIN || true,
  credentials: true
}));

app.use(
  express.json({
    verify: (req, _res, buf) => {
      if (req.originalUrl.startsWith('/api/webhooks')) {
        req.rawBody = buf.toString();
      }
    }
  })
);

app.use(
  cookieSession({
    name: 'rg-session',
    keys: [process.env.SESSION_SECRET || 'refundguard-secret'],
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60 * 1000,
    secure: process.env.NODE_ENV === 'production'
  })
);

const emailTemplates = {
  approved: {
    subject: 'Refund processed – you are all set!',
    body: `Hey there!

We just processed your refund per our policy. The funds will hit your account within 3-5 business days. Access to the product has been turned off, so feel free to rejoin whenever you are ready.

Need anything else? Just hit reply and we will help.

- RefundGuard Bot`
  },
  denied: (windowLabel, supportEmail) => ({
    subject: 'Refund request update',
    body: `Hi creator friend,

Thanks for reaching out. Per our refund policy, requests after ${windowLabel} are not eligible because access is delivered instantly.

To get the most from what you already unlocked:
• Start with the onboarding module to implement the checklist fast.
• Join the weekly office hours to get live support.
• DM us inside the community with your current blocker.

If you still feel stuck, reply to this email and our team will personally take care of you${
      supportEmail ? ` at ${supportEmail}` : ''
    }.

Appreciate you,
- RefundGuard Bot`
  })
};

const PORT = process.env.PORT || 4000;
const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || '';

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/session', (req, res) => {
  if (!req.session?.creatorId) {
    return res.json({ connected: false });
  }
  const policy = getPolicy(req.session.creatorId);
  res.json({
    connected: true,
    creatorId: req.session.creatorId,
    policy
  });
});

app.use('/api/auth', authRouter);
app.use('/api/policy', policyRouter);
app.use('/api/webhooks/whop', webhookRouter);

app.get('/api/purchases', async (req, res) => {
  const includeDemo = req.query.demo === 'true';

  if (includeDemo || !req.session?.creatorId) {
    return res.json({
      source: includeDemo ? 'demo' : 'mock',
      data: demoPurchases
    });
  }

  try {
    const tokens = getTokens(req.session.creatorId);
    const purchases = await fetchPurchases(tokens?.accessToken);
    res.json({ source: 'whop', data: purchases });
  } catch (error) {
    console.error('Failed to fetch purchases from Whop', error.response?.data || error.message);
    res.status(502).json({
      error: 'whop_fetch_failed',
      message: 'Could not load purchases from Whop. Check API credentials.',
      details: error.response?.data ?? null
    });
  }
});

app.get('/api/refund-requests', (req, res) => {
  if (!req.session?.creatorId) {
    return res.json({
      source: 'demo',
      data: demoRefundRequests
    });
  }

  const logs = listRefundLogs(req.session.creatorId, Number(req.query.limit) || 50);
  res.json({
    source: 'persisted',
    data: logs
  });
});

app.post('/api/process-refund', async (req, res) => {
  const { purchaseId, amount, note, memberId, productId } = req.body;

  if (!purchaseId) {
    return res.status(400).json({ error: 'missing_purchase_id' });
  }

  try {
    const tokens = getTokens(req.session?.creatorId);
    const refundResponse = await createRefund({
      purchaseId,
      amount,
      note,
      accessToken: tokens?.accessToken
    });

    if (productId && memberId) {
      await revokeAccess({ productId, memberId, accessToken: tokens?.accessToken });
    }

    if (req.session?.creatorId) {
      logRefund({
        id: uuidv4(),
        creatorId: req.session.creatorId,
        whopRequestId: refundResponse?.id ?? null,
        purchaseId,
        purchaseDate: req.body.purchaseDate ?? new Date().toISOString(),
        daysSincePurchase: req.body.daysSincePurchase ?? null,
        productName: req.body.productName ?? null,
        memberName: req.body.memberName ?? null,
        memberEmail: req.body.memberEmail ?? null,
        amount,
        currency: 'USD',
        decision: 'approved',
        status: 'processed',
        rawPayload: refundResponse
      });
    }

    res.json({
      status: 'success',
      mode: tokens?.accessToken ? 'live' : 'demo',
      refund: refundResponse
    });
  } catch (error) {
    console.error('Failed to process refund', error.response?.data || error.message);
    res.status(502).json({
      error: 'whop_refund_failed',
      message: 'Whop refund could not be processed. Inspect response for details.',
      details: error.response?.data ?? null
    });
  }
});

app.post('/api/send-denial', (req, res) => {
  const { windowLabel = 'the guarantee window' } = req.body;
  if (req.session?.creatorId) {
    logRefund({
      id: uuidv4(),
      creatorId: req.session.creatorId,
      whopRequestId: null,
      purchaseId: req.body.purchaseId ?? null,
      purchaseDate: req.body.purchaseDate ?? null,
      daysSincePurchase: req.body.daysSincePurchase ?? null,
      productName: req.body.productName ?? null,
      memberName: req.body.memberName ?? null,
      memberEmail: req.body.memberEmail ?? null,
      amount: req.body.amount ?? null,
      currency: req.body.currency ?? 'USD',
      decision: 'denied',
      status: 'denied',
      rawPayload: { windowLabel }
    });
  }
  res.json({
    status: 'queued',
    template: emailTemplates.denied(windowLabel, SUPPORT_EMAIL)
  });
});

if (process.env.NODE_ENV !== 'test' && process.env.VERCEL !== '1') {
  app.listen(PORT, () => {
    console.log(`RefundGuard API running on port ${PORT}`);
  });
}

export default app;

