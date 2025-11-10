// Simple OAuth callback handler
export default async function handler(req, res) {
  console.log('[auth-callback] Callback received');
  
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
    return res.status(400).send('Missing authorization code');
  }
  
  console.log('[auth-callback] Got code, exchanging for token...');
  
  // For now, just close the popup and show success
  // We'll implement full token exchange in next step
  res.send(`
    <html>
      <body>
        <h1>Success!</h1>
        <p>Connecting to Whop...</p>
        <script>
          if (window.opener) {
            window.opener.postMessage({ 
              type: 'REFUND_GUARD_AUTH_SUCCESS', 
              creatorId: 'demo-user',
              policy: null
            }, '*');
            setTimeout(() => window.close(), 1000);
          } else {
            document.body.innerHTML = '<h1>Success!</h1><p>You can close this window now.</p>';
          }
        </script>
      </body>
    </html>
  `);
}

