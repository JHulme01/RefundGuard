// Full OAuth callback handler with token exchange
import { upsertCreator, saveTokens, getPolicy } from '../server/src/db-wrapper.js';

const WHOP_TOKEN_URL = 'https://api.whop.com/v2/oauth/token';
const WHOP_PROFILE_URL = 'https://api.whop.com/v2/me';

export default async function handler(req, res) {
  console.log('[auth-callback] Callback received');
  console.log('[auth-callback] Query params:', req.query);
  console.log('[auth-callback] Env check:', {
    hasClientId: !!process.env.WHOP_CLIENT_ID,
    hasClientSecret: !!process.env.WHOP_CLIENT_SECRET,
    hasRedirectUri: !!process.env.WHOP_REDIRECT_URI
  });
  
  const { code, state, error } = req.query;
  
  if (error) {
    console.error('[auth-callback] OAuth error:', error);
    return res.send(`
      <html>
        <body>
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: 'REFUND_GUARD_AUTH_ERROR', error: '${error}' }, '*');
              window.close();
            } else {
              document.body.innerHTML = '<h1>Error: ${error}</h1><p>Please close this window and try again.</p>';
            }
          </script>
        </body>
      </html>
    `);
  }
  
  if (!code) {
    console.error('[auth-callback] Missing authorization code');
    return res.status(400).send('Missing authorization code');
  }
  
  console.log('[auth-callback] Code received, exchanging for access token...');
  
  try {
    // Exchange authorization code for access token
    const tokenResponse = await fetch(WHOP_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code,
        client_id: process.env.WHOP_CLIENT_ID,
        client_secret: process.env.WHOP_CLIENT_SECRET,
        redirect_uri: process.env.WHOP_REDIRECT_URI,
        grant_type: 'authorization_code'
      })
    });
    
    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('[auth-callback] Token exchange failed:', tokenResponse.status, errorText);
      throw new Error(`Token exchange failed: ${tokenResponse.status}`);
    }
    
    const tokenData = await tokenResponse.json();
    const { access_token, refresh_token, expires_in } = tokenData;
    
    console.log('[auth-callback] Token received, fetching user profile...');
    
    // Fetch user profile using access token
    const profileResponse = await fetch(WHOP_PROFILE_URL, {
      headers: {
        'Authorization': `Bearer ${access_token}`
      }
    });
    
    if (!profileResponse.ok) {
      const errorText = await profileResponse.text();
      console.error('[auth-callback] Profile fetch failed:', profileResponse.status, errorText);
      throw new Error(`Profile fetch failed: ${profileResponse.status}`);
    }
    
    const profile = await profileResponse.json();
    console.log('[auth-callback] Profile fetched:', profile.id);
    
    // Create or update creator in database
    const creatorId = profile.id;
    upsertCreator({
      id: creatorId,
      whopId: profile.id,
      name: profile.username || profile.email || 'Whop Creator',
      email: profile.email || null
    });
    
    // Save tokens to database
    const expiresAt = expires_in 
      ? new Date(Date.now() + expires_in * 1000).toISOString()
      : null;
    
    saveTokens({
      creatorId,
      accessToken: access_token,
      refreshToken: refresh_token,
      expiresAt
    });
    
    console.log('[auth-callback] Creator saved, loading policy...');
    
    // Load saved policy
    const policy = getPolicy(creatorId);
    
    console.log('[auth-callback] OAuth complete, sending success message');
    
    res.send(`
      <html>
        <body>
          <h1>Success!</h1>
          <p>Connected to Whop successfully!</p>
          <script>
            if (window.opener) {
              window.opener.postMessage({ 
                type: 'REFUND_GUARD_AUTH_SUCCESS', 
                creatorId: '${creatorId}',
                policy: ${JSON.stringify(policy || null)}
              }, '*');
              setTimeout(() => window.close(), 1000);
            } else {
              document.body.innerHTML = '<h1>Success!</h1><p>You can close this window and return to the app.</p>';
            }
          </script>
        </body>
      </html>
    `);
  } catch (error) {
    console.error('[auth-callback] Error during OAuth:', error);
    console.error('[auth-callback] Error stack:', error.stack);
    
    // Ensure we always send a response
    try {
      res.send(`
        <html>
          <body>
            <h1>Authentication Failed</h1>
            <p>${error.message || 'Unknown error occurred'}</p>
            <p style="font-size: 12px; color: #666;">Check Vercel logs for details</p>
            <script>
              if (window.opener) {
                window.opener.postMessage({ 
                  type: 'REFUND_GUARD_AUTH_ERROR', 
                  error: '${(error.message || 'Unknown error').replace(/'/g, "\\'")}'
                }, '*');
                setTimeout(() => window.close(), 3000);
              }
            </script>
          </body>
        </html>
      `);
    } catch (sendError) {
      console.error('[auth-callback] Failed to send error response:', sendError);
      // Last resort - try to send JSON
      try {
        res.status(500).json({ error: 'authentication_failed', message: error.message });
      } catch (finalError) {
        console.error('[auth-callback] Complete failure:', finalError);
      }
    }
  }
}

