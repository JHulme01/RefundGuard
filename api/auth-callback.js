// Simplified OAuth callback handler with inline DB functions
const WHOP_TOKEN_URL = 'https://api.whop.com/v2/oauth/token';
const WHOP_PROFILE_URL = 'https://api.whop.com/v2/me';

// In-memory database (simple version for serverless)
const mockDb = {
  creators: {},
  tokens: {},
  policies: {}
};

function upsertCreator({ id, whopId, name, email }) {
  mockDb.creators[id] = { id, whopId, name, email, createdAt: new Date().toISOString() };
  console.log('[db] Creator upserted:', id);
}

function saveTokens({ creatorId, accessToken, refreshToken, expiresAt }) {
  mockDb.tokens[creatorId] = { creatorId, accessToken, refreshToken, expiresAt, updatedAt: new Date().toISOString() };
  console.log('[db] Tokens saved for:', creatorId);
}

function getPolicy(creatorId) {
  return mockDb.policies[creatorId] || null;
}

export default async function handler(req, res) {
  console.log('[auth-callback-v2] Callback received');
  console.log('[auth-callback-v2] Query params:', req.query);
  console.log('[auth-callback-v2] Env check:', {
    hasClientId: !!process.env.WHOP_CLIENT_ID,
    hasClientSecret: !!process.env.WHOP_CLIENT_SECRET,
    hasRedirectUri: !!process.env.WHOP_REDIRECT_URI,
    clientIdPrefix: process.env.WHOP_CLIENT_ID?.substring(0, 10),
    redirectUri: process.env.WHOP_REDIRECT_URI
  });
  
  const { code, state, error } = req.query;
  
  if (error) {
    console.error('[auth-callback-v2] OAuth error:', error);
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
    console.error('[auth-callback-v2] Missing authorization code');
    return res.status(400).send('Missing authorization code');
  }
  
  console.log('[auth-callback-v2] Code received:', code.substring(0, 10) + '...');
  
  try {
    // Validate environment variables
    if (!process.env.WHOP_CLIENT_ID || !process.env.WHOP_CLIENT_SECRET || !process.env.WHOP_REDIRECT_URI) {
      throw new Error('Missing required environment variables');
    }
    
    console.log('[auth-callback-v2] Exchanging code for access token...');
    
    // Exchange authorization code for access token
    const tokenPayload = {
      code,
      client_id: process.env.WHOP_CLIENT_ID,
      client_secret: process.env.WHOP_CLIENT_SECRET,
      redirect_uri: process.env.WHOP_REDIRECT_URI,
      grant_type: 'authorization_code'
    };
    
    console.log('[auth-callback-v2] Token request payload:', {
      code: code.substring(0, 10) + '...',
      client_id: tokenPayload.client_id,
      redirect_uri: tokenPayload.redirect_uri,
      grant_type: tokenPayload.grant_type
    });
    
    const tokenResponse = await fetch(WHOP_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(tokenPayload)
    });
    
    console.log('[auth-callback-v2] Token response status:', tokenResponse.status);
    
    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('[auth-callback-v2] Token exchange failed:', tokenResponse.status, errorText);
      throw new Error(`Token exchange failed: ${tokenResponse.status} - ${errorText}`);
    }
    
    const tokenData = await tokenResponse.json();
    console.log('[auth-callback-v2] Token data received:', {
      hasAccessToken: !!tokenData.access_token,
      hasRefreshToken: !!tokenData.refresh_token,
      expiresIn: tokenData.expires_in
    });
    
    const { access_token, refresh_token, expires_in } = tokenData;
    
    if (!access_token) {
      throw new Error('No access token in response');
    }
    
    console.log('[auth-callback-v2] Token received, fetching user profile...');
    
    // Fetch user profile using access token
    const profileResponse = await fetch(WHOP_PROFILE_URL, {
      headers: {
        'Authorization': `Bearer ${access_token}`
      }
    });
    
    console.log('[auth-callback-v2] Profile response status:', profileResponse.status);
    
    if (!profileResponse.ok) {
      const errorText = await profileResponse.text();
      console.error('[auth-callback-v2] Profile fetch failed:', profileResponse.status, errorText);
      throw new Error(`Profile fetch failed: ${profileResponse.status} - ${errorText}`);
    }
    
    const profile = await profileResponse.json();
    console.log('[auth-callback-v2] Profile fetched:', {
      id: profile.id,
      username: profile.username,
      email: profile.email
    });
    
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
    
    console.log('[auth-callback-v2] Creator and tokens saved');
    
    // Load saved policy
    const policy = getPolicy(creatorId);
    
    console.log('[auth-callback-v2] OAuth complete, sending success message');
    
    res.send(`
      <html>
        <body>
          <h1>Success!</h1>
          <p>Connected to Whop successfully!</p>
          <p style="font-size: 12px; color: #666;">Closing window...</p>
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
    console.error('[auth-callback-v2] Error during OAuth:', error);
    console.error('[auth-callback-v2] Error stack:', error.stack);
    
    // Ensure we always send a response
    try {
      res.send(`
        <html>
          <body>
            <h1>Authentication Failed</h1>
            <p>${error.message || 'Unknown error occurred'}</p>
            <p style="font-size: 12px; color: #666;">Error details logged to Vercel</p>
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
      console.error('[auth-callback-v2] Failed to send error response:', sendError);
      try {
        res.status(500).json({ error: 'authentication_failed', message: error.message });
      } catch (finalError) {
        console.error('[auth-callback-v2] Complete failure:', finalError);
      }
    }
  }
}

