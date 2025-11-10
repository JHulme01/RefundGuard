// Get creator's saved policy
import { getPolicy } from '../server/src/db-wrapper.js';

export default async function handler(req, res) {
  console.log('[policy-get] Request received');
  
  try {
    const { creatorId } = req.query;
    
    if (!creatorId) {
      return res.status(400).json({ error: 'Missing creatorId' });
    }
    
    console.log('[policy-get] Getting policy for:', creatorId);
    
    const policy = getPolicy(creatorId);
    
    console.log('[policy-get] Policy retrieved:', policy);
    return res.status(200).json({ policy: policy || null });
  } catch (error) {
    console.error('[policy-get] Error:', error);
    return res.status(500).json({ error: 'internal_error', message: error.message });
  }
}

