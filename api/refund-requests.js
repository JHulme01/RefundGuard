// Fetch refund requests from Whop API
export default async function handler(req, res) {
  console.log('[refund-requests] Request received');
  
  try {
    const { creatorId } = req.query;
    
    if (!creatorId) {
      return res.status(400).json({ error: 'Missing creatorId' });
    }
    
    // For now, return demo data
    // In production, this would fetch from Whop API using stored access token
    console.log('[refund-requests] Returning demo data for:', creatorId);
    
    const demoRequests = [
      {
        id: 'req_1',
        memberName: 'Alex Johnson',
        memberEmail: 'alex@example.com',
        productName: 'Premium Course',
        purchaseDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
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
        purchaseDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(), // 15 days ago
        daysSincePurchase: 15,
        amount: 49,
        currency: 'USD',
        status: 'pending'
      }
    ];
    
    return res.status(200).json({ 
      data: demoRequests,
      source: 'demo',
      message: 'Live Whop API integration coming soon'
    });
  } catch (error) {
    console.error('[refund-requests] Error:', error);
    return res.status(500).json({ error: 'internal_error', message: error.message });
  }
}

