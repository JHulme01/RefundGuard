import { Router } from 'express';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { upsertCreator, saveTokens, getPolicy } from './db.js';

const router = Router();

const WHOP_AUTHORIZE_URL = 'https://whop.com/oauth';
const WHOP_TOKEN_URL = 'https://api.whop.com/v2/oauth/token';
const WHOP_PROFILE_URL = 'https://api.whop.com/v2/me';

const scopeString = [
  'purchases.read',
  'purchases.write',
  'members.read',
  'members.write',
  'apps.read'
].join(' ');

function getRedirectUri() {
  return process.env.WHOP_REDIRECT_URI;
}

router.get('/login', (req, res) => {
  const clientId = process.env.WHOP_CLIENT_ID;
  const redirectUri = getRedirectUri();

  if (!clientId || !redirectUri) {
    return res.status(500).json({ error: 'missing_whop_credentials' });
  }

  const state = uuidv4();
  req.session.oauthState = state;

  const url = `${WHOP_AUTHORIZE_URL}?client_id=${encodeURIComponent(
    clientId
  )}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(
    scopeString
  )}&state=${encodeURIComponent(state)}`;

  res.json({ url });
});

router.get('/logout', (req, res) => {
  req.session = null;
  res.json({ status: 'ok' });
});

router.get('/callback', async (req, res) => {
  const { code, state, error } = req.query;

  if (error) {
    return res.status(400).send(`<h3>Authorization failed</h3><p>${error}</p>`);
  }

  if (!code || !state) {
    return res.status(400).send('<h3>Invalid callback payload</h3>');
  }

  if (!req.session || state !== req.session.oauthState) {
    return res.status(400).send('<h3>State mismatch. Please restart the install.</h3>');
  }

  const clientId = process.env.WHOP_CLIENT_ID;
  const clientSecret = process.env.WHOP_CLIENT_SECRET;
  const redirectUri = getRedirectUri();

  if (!clientId || !clientSecret || !redirectUri) {
    return res.status(500).send('<h3>Missing Whop credentials.</h3>');
  }

  try {
    const tokenResponse = await axios.post(
      WHOP_TOKEN_URL,
      new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
        client_id: clientId,
        client_secret: clientSecret
      }).toString(),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    const { access_token: accessToken, refresh_token: refreshToken, expires_in: expiresIn } =
      tokenResponse.data ?? {};

    if (!accessToken) {
      throw new Error('No access token returned from Whop');
    }

    const profileResponse = await axios.get(WHOP_PROFILE_URL, {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });

    const profile = profileResponse.data ?? {};
    const creatorId = profile?.id || uuidv4();

    upsertCreator({
      id: creatorId,
      whopId: profile?.id ?? null,
      name: profile?.name ?? profile?.email ?? 'Whop Creator',
      email: profile?.email ?? null
    });

    saveTokens({
      creatorId,
      accessToken,
      refreshToken,
      expiresAt: expiresIn ? new Date(Date.now() + expiresIn * 1000).toISOString() : null
    });

    req.session.creatorId = creatorId;
    req.session.oauthState = null;

    const policy = getPolicy(creatorId);

    res.send(`
      <html>
        <body style="font-family: sans-serif; background: #020617; color: #e2e8f0; text-align: center; padding: 40px;">
          <h2>RefundGuard connected to Whop</h2>
          <p>You can close this window and return to the app.</p>
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: 'REFUND_GUARD_AUTH_SUCCESS', creatorId: '${creatorId}', policy: ${JSON.stringify(
                policy ?? {}
              )} }, '*');
              window.close();
            } else {
              window.location.href = '/';
            }
          </script>
        </body>
      </html>
    `);
  } catch (err) {
    console.error('OAuth callback error', err.response?.data || err.message);
    res
      .status(500)
      .send('<h3>Could not finalize install. Check logs or verify Whop credentials.</h3>');
  }
});

export default router;

