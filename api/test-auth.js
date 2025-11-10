// Ultra-simple test to see if OAuth URL generation works
export default function handler(req, res) {
  console.log('[test-auth] Request received');
  
  const clientId = process.env.WHOP_CLIENT_ID;
  const redirectUri = process.env.WHOP_REDIRECT_URI;
  
  console.log('[test-auth] Env vars:', {
    hasClientId: !!clientId,
    hasRedirectUri: !!redirectUri
  });
  
  if (!clientId || !redirectUri) {
    return res.status(500).json({ 
      error: 'missing_credentials',
      hasClientId: !!clientId,
      hasRedirectUri: !!redirectUri
    });
  }
  
  const url = `https://whop.com/oauth?client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=purchases.read purchases.write members.read members.write apps.read`;
  
  console.log('[test-auth] Returning URL');
  return res.status(200).json({ url, success: true });
}

