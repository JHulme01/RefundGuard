// Handle Whop webhook events for refund status updates
import { logRefund } from '../server/src/db-wrapper.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  console.log('[webhooks-whop] Webhook received');
  
  try {
    const event = req.body;
    console.log('[webhooks-whop] Event type:', event.type);
    
    // Verify webhook signature if secret is set
    const secret = process.env.WHOP_WEBHOOK_SECRET;
    if (secret) {
      // TODO: Implement signature verification
      console.log('[webhooks-whop] Signature verification skipped for now');
    }
    
    // Handle refund events
    if (event.type === 'refund.created' || event.type === 'refund.updated') {
      const payload = event.data || {};
      console.log('[webhooks-whop] Refund event:', payload);
      
      // Log the refund to database
      logRefund({
        id: payload.id || `refund_${Date.now()}`,
        creatorId: payload.creator_id || 'unknown',
        whopRequestId: payload.id || null,
        purchaseId: payload.purchase_id || null,
        purchaseDate: payload.purchase?.created_at || payload.created_at || new Date().toISOString(),
        daysSincePurchase: payload.days_since_purchase || null,
        productName: payload.purchase?.product_name || payload.product?.name || null,
        memberName: payload.member?.name || payload.member?.email || 'Member',
        memberEmail: payload.member?.email || null,
        amount: payload.amount ? Number(payload.amount) / 100 : null,
        currency: payload.currency || 'USD',
        decision: payload.decision || payload.status || 'pending',
        status: payload.status || 'pending',
        rawPayload: JSON.stringify(event)
      });
      
      console.log('[webhooks-whop] Refund logged successfully');
    }
    
    return res.status(200).json({ received: true });
  } catch (error) {
    console.error('[webhooks-whop] Error:', error);
    return res.status(500).json({ error: 'internal_error', message: error.message });
  }
}

