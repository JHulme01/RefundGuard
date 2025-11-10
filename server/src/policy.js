import { Router } from 'express';
import { savePolicy, getPolicy, listRefundLogs } from './db-wrapper.js';

const router = Router();

function requireAuth(req, res, next) {
  if (!req.session?.creatorId) {
    return res.status(401).json({ error: 'not_authenticated' });
  }
  next();
}

router.get('/', requireAuth, (req, res) => {
  const policy = getPolicy(req.session.creatorId);
  res.json({ policy });
});

router.post('/', requireAuth, (req, res) => {
  const { policyId, customDays, customCondition } = req.body ?? {};
  if (!policyId) {
    return res.status(400).json({ error: 'policy_id_required' });
  }

  savePolicy({
    creatorId: req.session.creatorId,
    policyId,
    customDays: customDays ?? null,
    customCondition: customCondition ?? null
  });

  res.json({ status: 'saved' });
});

router.get('/refunds', requireAuth, (req, res) => {
  const logs = listRefundLogs(req.session.creatorId, Number(req.query.limit) || 50);
  res.json({ data: logs });
});

export default router;

