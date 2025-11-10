// Save creator's policy selection
import { savePolicy } from '../server/src/db-wrapper.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  console.log('[policy-save] Request received');
  
  try {
    const { creatorId, policyId, customDays, customCondition } = req.body;
    
    if (!creatorId || !policyId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    console.log('[policy-save] Saving policy:', { creatorId, policyId });
    
    savePolicy({
      creatorId,
      policyId,
      customDays: customDays ?? null,
      customCondition: customCondition ?? null
    });
    
    console.log('[policy-save] Policy saved successfully');
    return res.status(200).json({ status: 'saved', policyId });
  } catch (error) {
    console.error('[policy-save] Error:', error);
    return res.status(500).json({ error: 'internal_error', message: error.message });
  }
}

