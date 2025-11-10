# RefundGuard Quick Start Guide

Get RefundGuard up and running in 15 minutes!

## 🚀 Overview

RefundGuard automates refund decisions for your Whop products. This guide will walk you through the fastest path to deployment.

## ⏱️ Time Required

- **Setup**: 5 minutes
- **Deployment**: 5 minutes
- **Testing**: 5 minutes
- **Total**: ~15 minutes

## 📋 Prerequisites

Before you start, make sure you have:
- [ ] A Whop account with at least one product
- [ ] A GitHub account
- [ ] A Vercel account (free tier is fine)

## Step 1: Create Whop App (3 minutes)

1. **Go to Whop Developer Portal**
   - Visit: [whop.com/apps](https://whop.com/apps)
   - Click "Create App"

2. **Fill in Basic Info**
   ```
   Name: RefundGuard
   Description: Automated refund policy enforcement
   Icon: (optional for now)
   ```

3. **Configure OAuth**
   - Scopes: Select these 4 scopes:
     - ✅ `purchases.read`
     - ✅ `purchases.write`
     - ✅ `members.read`
     - ✅ `members.write`
   - Redirect URI: `https://placeholder.com/callback` (we'll update this later)

4. **Configure Webhooks**
   - Events: Select these 2 events:
     - ✅ `refund.created`
     - ✅ `refund.updated`
   - URL: `https://placeholder.com/webhook` (we'll update this later)
   - Secret: Click "Generate" or create a random string

5. **Save Your Credentials**
   Copy these somewhere safe (you'll need them in Step 3):
   ```
   Client ID: app_xxxxxxxxxxxxx
   Client Secret: apik_xxxxxxxxxxxxx
   Webhook Secret: (your generated secret)
   ```

## Step 2: Deploy to Vercel (5 minutes)

### Option A: One-Click Deploy (Easiest)

1. **Click the Deploy Button**
   
   [![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/JHulme01/RefundGuard)

2. **Connect GitHub**
   - Authorize Vercel to access your GitHub
   - Choose a repository name (e.g., `refundguard`)

3. **Skip Environment Variables for Now**
   - Click "Deploy" without adding variables
   - We'll add them in the next step

4. **Wait for Deployment**
   - Takes ~2 minutes
   - Copy your deployment URL (e.g., `https://refundguard-xyz.vercel.app`)

### Option B: Manual Deploy (More Control)

1. **Clone the Repository**
   ```bash
   git clone https://github.com/JHulme01/RefundGuard.git
   cd RefundGuard
   ```

2. **Push to Your GitHub**
   ```bash
   # Create a new repo on GitHub first, then:
   git remote set-url origin https://github.com/YOUR_USERNAME/RefundGuard.git
   git push -u origin main
   ```

3. **Import to Vercel**
   - Go to [vercel.com/new](https://vercel.com/new)
   - Import your GitHub repository
   - Click "Deploy"

## Step 3: Configure Environment Variables (3 minutes)

1. **Go to Vercel Project Settings**
   - Click on your project
   - Go to "Settings" → "Environment Variables"

2. **Add These 5 Variables**
   
   | Variable | Value | Where to Get It |
   |----------|-------|-----------------|
   | `WHOP_CLIENT_ID` | `app_xxxxx` | From Step 1 |
   | `WHOP_CLIENT_SECRET` | `apik_xxxxx` | From Step 1 |
   | `WHOP_REDIRECT_URI` | `https://your-domain.vercel.app/api/auth-callback` | Your Vercel URL |
   | `WHOP_WEBHOOK_SECRET` | Your webhook secret | From Step 1 |
   | `SESSION_SECRET` | Random 32+ char string | Generate: `openssl rand -hex 32` |

   **Important**: Replace `your-domain.vercel.app` with your actual Vercel URL!

3. **Set Environment for All**
   - Check: ✅ Production
   - Check: ✅ Preview
   - Check: ✅ Development

4. **Redeploy**
   - Go to "Deployments" tab
   - Click "..." on latest deployment
   - Click "Redeploy"

## Step 4: Update Whop App Settings (2 minutes)

Now that you have your Vercel URL, update your Whop app:

1. **Go Back to Whop Developer Portal**
   - Visit: [whop.com/apps](https://whop.com/apps)
   - Click on your RefundGuard app

2. **Update OAuth Redirect URI**
   - Remove the placeholder
   - Add: `https://your-actual-vercel-url.vercel.app/api/auth-callback`
   - **Important**: Use your EXACT Vercel URL, no trailing slash!

3. **Update Webhook URL**
   - Change to: `https://your-actual-vercel-url.vercel.app/api/webhooks-whop`

4. **Save Changes**

## Step 5: Test It Out! (2 minutes)

1. **Visit Your App**
   - Go to: `https://your-vercel-url.vercel.app`
   - You should see the RefundGuard dashboard

2. **Connect to Whop**
   - Click "Connect Whop" button
   - A popup should open
   - Authorize the app
   - Popup should close automatically
   - You should see "Connected" status ✅

3. **Select a Policy**
   - Choose "7-Day Standard" or any policy
   - It should save automatically
   - Refresh the page - policy should persist

4. **View Refund Requests**
   - You should see your Whop purchases (if you have any)
   - Or demo data if you don't have purchases yet

## 🎉 You're Done!

RefundGuard is now live and ready to automate your refund policies!

## 🔧 Next Steps

### Customize Your Policy
1. Click on different policy templates
2. Try "Custom Policy" to set your own rules
3. Adjust days and conditions as needed

### Test Refund Processing
1. If you have test purchases, try approving/denying them
2. Check your Whop dashboard to see the refunds

### Set Up Webhooks (Optional)
1. Go to Whop app settings
2. Test webhook delivery
3. Check Vercel logs to see webhook events

### Add Custom Domain (Optional)
1. Go to Vercel → Settings → Domains
2. Add your custom domain
3. Update Whop app settings with new domain

## 🆘 Troubleshooting

### "Connect Whop" Button Doesn't Work
- Check browser console for errors
- Verify `WHOP_CLIENT_ID` is set in Vercel
- Make sure you redeployed after adding environment variables

### OAuth Popup Shows "Invalid redirect_uri"
- Verify redirect URI in Whop matches EXACTLY:
  - Whop: `https://your-url.vercel.app/api/auth-callback`
  - Vercel: `WHOP_REDIRECT_URI=https://your-url.vercel.app/api/auth-callback`
- No trailing slashes!
- No extra spaces!

### Policy Doesn't Save
- Check Vercel function logs for errors
- Verify `SESSION_SECRET` is set
- Try disconnecting and reconnecting to Whop

### No Refund Requests Showing
- This is normal if you don't have any purchases yet
- The app will show demo data
- Once you have real purchases, they'll appear automatically

## 📚 Learn More

- **[Full Deployment Guide](DEPLOYMENT.md)**: Detailed deployment instructions
- **[API Documentation](API.md)**: Complete API reference
- **[Setup Checklist](SETUP_CHECKLIST.md)**: Production readiness checklist

## 💡 Pro Tips

1. **Use Demo Mode**: Test the app without connecting to Whop first
2. **Start with 7-Day Policy**: It's a good balance for most creators
3. **Monitor Logs**: Check Vercel logs regularly for any issues
4. **Test with Small Amounts**: Process test refunds before going live
5. **Read the Docs**: The full documentation has lots of helpful info

## 📞 Need Help?

- **Issues**: [GitHub Issues](https://github.com/JHulme01/RefundGuard/issues)
- **Email**: support@refundguard.app
- **Discord**: [Whop Discord](https://whop.com/discord)

---

**Congratulations!** 🎊 You've successfully deployed RefundGuard. Now sit back and let it automate your refund policies!

