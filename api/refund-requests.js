// Fetch refund requests from Whop API
import { fetchPurchases } from '../server/src/whop-api-client.js';
import { getTokens } from '../server/src/db-wrapper.js';

export default async function handler(req, res) {
  console.log('[refund-requests] Request received');
  
  try {
    const { creatorId } = req.query;
    
    if (!creatorId) {
      return res.status(400).json({ error: 'Missing creatorId' });
    }
    
    // Check if creator has tokens (is authenticated)
    const tokens = getTokens(creatorId);
    if (!tokens) {
      console.log('[refund-requests] No tokens found, returning demo data');
      return res.status(200).json({ 
        data: getDemoRequests(),
        source: 'demo',
        message: 'Connect to Whop to see real refund requests'
      });
    }
    
    console.log('[refund-requests] Fetching purchases from Whop API for:', creatorId);
    
    try {
      // Fetch recent purchases from Whop
      const purchasesData = await fetchPurchases(creatorId, {
        perPage: 100,
        filters: {
          // You can add filters here based on Whop API documentation
          // e.g., status: 'active', created_after: '2024-01-01'
        }
      });
      
      console.log('[refund-requests] Fetched purchases:', purchasesData.data?.length || 0);
      
      // Transform Whop purchases into refund request format
      const requests = (purchasesData.data || []).map(purchase => {
        const purchaseDate = new Date(purchase.created_at * 1000); // Whop uses Unix timestamps
        const now = new Date();
        const daysSincePurchase = Math.floor((now - purchaseDate) / (1000 * 60 * 60 * 24));
        
        return {
          id: purchase.id,
          purchaseId: purchase.id,
          memberName: purchase.user?.username || purchase.user?.email || 'Member',
          memberEmail: purchase.user?.email || null,
          memberId: purchase.user?.id || null,
          productName: purchase.product?.title || 'Product',
          productId: purchase.product?.id || null,
          purchaseDate: purchaseDate.toISOString(),
          daysSincePurchase,
          amount: purchase.final_amount ? purchase.final_amount / 100 : 0, // Convert cents to dollars
          currency: purchase.currency || 'USD',
          status: purchase.status === 'completed' ? 'pending' : purchase.status,
          refundable: purchase.refundable !== false, // Whop may provide this
          metadata: {
            plan: purchase.plan?.title || null,
            quantity: purchase.quantity || 1
          }
        };
      });
      
      // Filter to only show refundable purchases
      const refundableRequests = requests.filter(req => req.refundable && req.status !== 'refunded');
      
      console.log('[refund-requests] Returning', refundableRequests.length, 'refundable requests');
      
      return res.status(200).json({ 
        data: refundableRequests,
        source: 'whop',
        total: refundableRequests.length
      });
    } catch (apiError) {
      console.error('[refund-requests] Whop API error:', apiError);
      
      // Fall back to demo data if API fails
      return res.status(200).json({ 
        data: getDemoRequests(),
        source: 'demo',
        message: 'Could not fetch from Whop API, showing demo data',
        error: apiError.message
      });
    }
  } catch (error) {
    console.error('[refund-requests] Error:', error);
    return res.status(500).json({ error: 'internal_error', message: error.message });
  }
}

function getDemoRequests() {
  return [
    {
      id: 'req_1',
      memberName: 'Alex Johnson',
      memberEmail: 'alex@example.com',
      productName: 'Premium Course',
      purchaseDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      daysSincePurchase: 5,
      amount: 99,
      currency: 'USD',
      status: 'pending'
    },
    {
      id: 'req_2',
      memberName: 'Sarah Smith',
      memberEmail: 'sarah@example.com',
      productName: 'Monthly Membership',
      purchaseDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
      daysSincePurchase: 15,
      amount: 49,
      currency: 'USD',
      status: 'pending'
    }
  ];
}

