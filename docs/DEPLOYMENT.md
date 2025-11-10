# RefundGuard Deployment Guide

## Overview

RefundGuard is deployed as a serverless application on Vercel with the following architecture:
- **Frontend**: React + Vite (static site)
- **Backend**: Serverless functions (Node.js)
- **Database**: In-memory mock (for MVP; migrate to PostgreSQL/Supabase for production)
- **External APIs**: Whop API v2

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **Whop Developer Account**: Create an app at [whop.com/apps](https://whop.com/apps)
3. **GitHub Account**: For repository hosting
4. **Node.js 20.x**: Required for local development

## Step 1: Create Whop App

1. Go to [Whop Developer Portal](https://whop.com/apps)
2. Click "Create App"
3. Fill in app details:
   - **Name**: RefundGuard
   - **Description**: Automated refund policy enforcement
   - **Icon**: Upload your logo (512x512 PNG)
4. Note your **Client ID** and **Client Secret**
5. Configure OAuth:
   - **Scopes**: `purchases.read`, `purchases.write`, `members.read`, `members.write`
   - **Redirect URIs**: Add `https://your-domain.vercel.app/api/auth-callback`
6. Configure Webhooks:
   - **URL**: `https://your-domain.vercel.app/api/webhooks-whop`
   - **Events**: `refund.created`, `refund.updated`
   - **Secret**: Generate a random string (save for later)

## Step 2: Deploy to Vercel

### Option A: Deploy via GitHub (Recommended)

1. **Push to GitHub**:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/RefundGuard.git
   git push -u origin main
   ```

2. **Connect to Vercel**:
   - Go to [vercel.com/new](https://vercel.com/new)
   - Import your GitHub repository
   - Configure project:
     - **Framework Preset**: Other
     - **Root Directory**: Leave blank
     - **Build Command**: `npm run build`
     - **Output Directory**: `client/dist`
     - **Install Command**: `npm install --include=optional`

3. **Add Environment Variables**:
   Go to Project Settings → Environment Variables and add:
   
   ```
   WHOP_CLIENT_ID=your_whop_client_id
   WHOP_CLIENT_SECRET=your_whop_client_secret
   WHOP_REDIRECT_URI=https://your-domain.vercel.app/api/auth-callback
   WHOP_WEBHOOK_SECRET=your_webhook_secret
   SESSION_SECRET=generate_random_32_char_string
   NODE_VERSION=20
   ```

4. **Deploy**:
   - Click "Deploy"
   - Wait for build to complete
   - Note your deployment URL

### Option B: Deploy via Vercel CLI

1. **Install Vercel CLI**:
   ```bash
   npm i -g vercel
   ```

2. **Login**:
   ```bash
   vercel login
   ```

3. **Deploy**:
   ```bash
   vercel
   ```

4. **Add Environment Variables**:
   ```bash
   vercel env add WHOP_CLIENT_ID
   vercel env add WHOP_CLIENT_SECRET
   vercel env add WHOP_REDIRECT_URI
   vercel env add WHOP_WEBHOOK_SECRET
   vercel env add SESSION_SECRET
   ```

5. **Deploy to Production**:
   ```bash
   vercel --prod
   ```

## Step 3: Update Whop App Settings

1. Go back to [Whop Developer Portal](https://whop.com/apps)
2. Edit your app
3. Update **Redirect URIs** with your actual Vercel URL:
   ```
   https://your-actual-domain.vercel.app/api/auth-callback
   ```
4. Update **Webhook URL**:
   ```
   https://your-actual-domain.vercel.app/api/webhooks-whop
   ```
5. Save changes

## Step 4: Test the Integration

1. **Visit your app**: `https://your-domain.vercel.app`
2. **Click "Connect Whop"**: Should open OAuth popup
3. **Authorize**: Grant permissions to your Whop account
4. **Verify connection**: Should see "Connected" status
5. **Test policy save**: Select a policy and verify it persists
6. **Check refund requests**: Should see your Whop purchases (if any)

## Step 5: Configure Custom Domain (Optional)

1. Go to Vercel Project Settings → Domains
2. Add your custom domain (e.g., `refundguard.app`)
3. Follow DNS configuration instructions
4. Update Whop app settings with new domain

## Environment Variables Reference

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `WHOP_CLIENT_ID` | Yes | OAuth client ID from Whop | `app_xxxxxxxxxxxxx` |
| `WHOP_CLIENT_SECRET` | Yes | OAuth client secret from Whop | `whop_xxxxxxxxxxxxx` |
| `WHOP_REDIRECT_URI` | Yes | OAuth callback URL | `https://app.com/api/auth-callback` |
| `WHOP_WEBHOOK_SECRET` | Yes | Webhook signing secret | Random 32+ char string |
| `SESSION_SECRET` | Yes | Session encryption key | Random 32+ char string |
| `NODE_VERSION` | Yes | Node.js version | `20` |
| `APP_ORIGIN` | No | CORS origin (optional) | `https://app.com` |

## Troubleshooting

### Build Fails with Rollup Error

**Error**: `Cannot find module @rollup/rollup-linux-x64-gnu`

**Solution**: 
- Ensure `vercel.json` has correct `installCommand`
- Verify Node.js version is set to `20.x`
- Check that `@rollup/rollup-linux-x64-gnu` is in `optionalDependencies`

### OAuth Popup Shows "Invalid redirect_uri"

**Solution**:
- Verify `WHOP_REDIRECT_URI` matches exactly in both Vercel and Whop settings
- Ensure no trailing slashes
- Check that the URL is added to "Allowed Redirect URIs" in Whop app settings

### API Calls Timeout (504)

**Solution**:
- Check Vercel function logs for errors
- Verify all environment variables are set
- Ensure serverless functions are under 10s execution time

### Webhook Signature Verification Fails

**Solution**:
- Verify `WHOP_WEBHOOK_SECRET` matches in both Vercel and Whop
- Check that webhook is sending `x-whop-signature` header
- Review webhook logs in Vercel

## Monitoring & Logs

### View Logs
```bash
vercel logs YOUR_DEPLOYMENT_URL
```

### Real-time Logs
```bash
vercel logs YOUR_DEPLOYMENT_URL --follow
```

### Function Logs
Go to Vercel Dashboard → Your Project → Functions → Select function → View logs

## Updating the App

### Automatic Deployments
Every push to `main` branch triggers a new deployment automatically.

### Manual Deployment
```bash
git push origin main
```

### Rollback
Go to Vercel Dashboard → Deployments → Select previous deployment → Promote to Production

## Security Checklist

- [ ] All environment variables are set and secure
- [ ] `SESSION_SECRET` is a strong random string (32+ characters)
- [ ] `WHOP_WEBHOOK_SECRET` is configured and verified
- [ ] OAuth redirect URI is exact match in Whop settings
- [ ] CORS is properly configured (if using custom domain)
- [ ] Webhook signature verification is enabled

## Production Readiness

### Before Going Live:
1. [ ] Test OAuth flow end-to-end
2. [ ] Test refund processing with test purchases
3. [ ] Verify webhook delivery and signature
4. [ ] Test policy persistence across sessions
5. [ ] Set up monitoring/alerting (e.g., Sentry)
6. [ ] Migrate from mock DB to production database
7. [ ] Add rate limiting for API endpoints
8. [ ] Set up error tracking and logging
9. [ ] Create backup/restore procedures
10. [ ] Document API endpoints and usage

## Support

For issues or questions:
- **GitHub Issues**: [github.com/YOUR_USERNAME/RefundGuard/issues](https://github.com/YOUR_USERNAME/RefundGuard/issues)
- **Email**: support@refundguard.app
- **Whop Discord**: [whop.com/discord](https://whop.com/discord)

