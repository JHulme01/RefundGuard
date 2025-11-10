// Process a refund via Whop API
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  console.log('[process-refund] Request received');
  
  try {
    const { creatorId, requestId, amount, purchaseId, note } = req.body;
    
    if (!creatorId || !requestId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    console.log('[process-refund] Processing refund:', { creatorId, requestId, amount });
    
    // For now, simulate success
    // In production, this would call Whop API to actually process the refund
    console.log('[process-refund] Refund processed successfully (simulated)');
    
    return res.status(200).json({ 
      status: 'success',
      message: 'Refund queued successfully',
      requestId,
      note: 'Live Whop API integration coming soon'
    });
  } catch (error) {
    console.error('[process-refund] Error:', error);
    return res.status(500).json({ error: 'internal_error', message: error.message });
  }
}

