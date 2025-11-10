// Process a refund via Whop API
import { createRefund, revokeAccess } from '../server/src/whop-api-client.js';
import { logRefund, getTokens } from '../server/src/db-wrapper.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  console.log('[process-refund] Request received');
  
  try {
    const { 
      creatorId, 
      requestId, 
      amount, 
      purchaseId, 
      memberId,
      memberName,
      memberEmail,
      productName,
      purchaseDate,
      daysSincePurchase,
      note 
    } = req.body;
    
    if (!creatorId || !requestId || !purchaseId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Check if creator has tokens (is authenticated)
    const tokens = getTokens(creatorId);
    if (!tokens) {
      console.log('[process-refund] No tokens found, simulating refund');
      return res.status(200).json({ 
        status: 'success',
        message: 'Refund simulated (demo mode)',
        requestId,
        note: 'Connect to Whop to process real refunds'
      });
    }
    
    console.log('[process-refund] Processing refund via Whop API:', { creatorId, purchaseId, amount });
    
    try {
      // Create refund via Whop API
      // amount is in dollars, Whop expects cents (or null for full refund)
      const refundAmount = amount ? Math.round(amount * 100) : null;
      
      const refundResult = await createRefund(creatorId, purchaseId, refundAmount);
      
      console.log('[process-refund] Refund created:', refundResult.id);
      
      // Log the refund to database
      logRefund({
        id: refundResult.id || `refund_${Date.now()}`,
        creatorId,
        whopRequestId: refundResult.id,
        purchaseId,
        purchaseDate: purchaseDate || new Date().toISOString(),
        daysSincePurchase: daysSincePurchase || null,
        productName: productName || 'Product',
        memberName: memberName || 'Member',
        memberEmail: memberEmail || null,
        amount: amount || null,
        currency: 'USD',
        decision: 'approved',
        status: refundResult.status || 'processing',
        rawPayload: JSON.stringify(refundResult)
      });
      
      console.log('[process-refund] Refund logged to database');
      
      return res.status(200).json({ 
        status: 'success',
        message: 'Refund processed successfully',
        requestId,
        refundId: refundResult.id,
        refundStatus: refundResult.status,
        data: refundResult
      });
    } catch (apiError) {
      console.error('[process-refund] Whop API error:', apiError);
      
      // Log failed refund attempt
      logRefund({
        id: `refund_failed_${Date.now()}`,
        creatorId,
        whopRequestId: null,
        purchaseId,
        purchaseDate: purchaseDate || new Date().toISOString(),
        daysSincePurchase: daysSincePurchase || null,
        productName: productName || 'Product',
        memberName: memberName || 'Member',
        memberEmail: memberEmail || null,
        amount: amount || null,
        currency: 'USD',
        decision: 'error',
        status: 'failed',
        rawPayload: JSON.stringify({ error: apiError.message })
      });
      
      return res.status(500).json({ 
        error: 'refund_failed',
        message: 'Failed to process refund via Whop API',
        details: apiError.message
      });
    }
  } catch (error) {
    console.error('[process-refund] Error:', error);
    return res.status(500).json({ error: 'internal_error', message: error.message });
  }
}

