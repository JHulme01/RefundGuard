# RefundGuard Setup Checklist

Use this checklist to ensure your RefundGuard deployment is complete and production-ready.

## ✅ Pre-Deployment

### 1. Whop App Configuration
- [ ] Created Whop app at [whop.com/apps](https://whop.com/apps)
- [ ] Saved Client ID and Client Secret
- [ ] Configured OAuth scopes: `purchases.read`, `purchases.write`, `members.read`, `members.write`
- [ ] Added placeholder redirect URI (will update after deployment)
- [ ] Generated webhook secret (32+ characters)
- [ ] Configured webhook events: `refund.created`, `refund.updated`

### 2. GitHub Repository
- [ ] Created GitHub repository
- [ ] Pushed code to `main` branch
- [ ] Repository is public or Vercel has access

### 3. Environment Variables Prepared
- [ ] `WHOP_CLIENT_ID` - from Whop app settings
- [ ] `WHOP_CLIENT_SECRET` - from Whop app settings
- [ ] `WHOP_WEBHOOK_SECRET` - generated random string
- [ ] `SESSION_SECRET` - generated random string (use `openssl rand -hex 32`)
- [ ] `NODE_VERSION` - set to `20`

## ✅ Deployment

### 4. Vercel Setup
- [ ] Connected GitHub repository to Vercel
- [ ] Set Framework Preset to "Other"
- [ ] Set Build Command to `npm run build`
- [ ] Set Output Directory to `client/dist`
- [ ] Set Install Command to `npm install --include=optional`
- [ ] Set Root Directory to blank (empty)
- [ ] Set Node.js Version to `20.x`

### 5. Environment Variables in Vercel
- [ ] Added `WHOP_CLIENT_ID`
- [ ] Added `WHOP_CLIENT_SECRET`
- [ ] Added `WHOP_REDIRECT_URI` (with actual Vercel URL)
- [ ] Added `WHOP_WEBHOOK_SECRET`
- [ ] Added `SESSION_SECRET`
- [ ] Added `NODE_VERSION=20`
- [ ] All variables set for Production, Preview, and Development

### 6. Initial Deployment
- [ ] Triggered deployment
- [ ] Build completed successfully
- [ ] No errors in build logs
- [ ] Deployment URL is accessible
- [ ] Frontend loads correctly

## ✅ Post-Deployment

### 7. Update Whop App Settings
- [ ] Updated Redirect URI to `https://your-actual-domain.vercel.app/api/auth-callback`
- [ ] Updated Webhook URL to `https://your-actual-domain.vercel.app/api/webhooks-whop`
- [ ] Verified webhook secret matches Vercel environment variable
- [ ] Saved changes in Whop app settings

### 8. Test OAuth Flow
- [ ] Visited deployed app URL
- [ ] Clicked "Connect Whop" button
- [ ] OAuth popup opened correctly
- [ ] Authorized app with Whop account
- [ ] Popup closed automatically
- [ ] App shows "Connected" status
- [ ] No errors in browser console

### 9. Test Policy Management
- [ ] Selected a policy template
- [ ] Policy saved successfully
- [ ] Refreshed page - policy persisted
- [ ] Changed policy - new policy saved
- [ ] Custom policy works with custom days/conditions

### 10. Test Refund Requests
- [ ] Refund requests loaded (real data or demo)
- [ ] Purchase details displayed correctly
- [ ] Days since purchase calculated correctly
- [ ] Decision badges show correct recommendations

### 11. Test Refund Processing
- [ ] Clicked "Approve" on a refund request
- [ ] Success toast notification appeared
- [ ] Request status updated to "Refunded"
- [ ] Checked Whop dashboard - refund created
- [ ] No errors in Vercel function logs

### 12. Test Webhooks
- [ ] Triggered test webhook from Whop
- [ ] Webhook received successfully
- [ ] Signature verification passed
- [ ] Event logged to database
- [ ] No errors in webhook handler logs

## ✅ Security & Production Readiness

### 13. Security Checks
- [ ] All environment variables are secure (no defaults)
- [ ] `SESSION_SECRET` is strong random string (32+ chars)
- [ ] `WHOP_WEBHOOK_SECRET` is configured and verified
- [ ] Webhook signature verification is enabled
- [ ] No credentials committed to Git
- [ ] `.env` file is in `.gitignore`

### 14. Monitoring & Logging
- [ ] Enabled Vercel Analytics (optional)
- [ ] Set up error tracking (Sentry, LogRocket, etc.) (optional)
- [ ] Configured log retention in Vercel
- [ ] Set up uptime monitoring (optional)
- [ ] Created alerts for critical errors (optional)

### 15. Performance
- [ ] Frontend loads in < 3 seconds
- [ ] API endpoints respond in < 2 seconds
- [ ] No console errors or warnings
- [ ] Images and assets optimized
- [ ] Lighthouse score > 90 (optional)

### 16. Documentation
- [ ] README.md is up to date
- [ ] API documentation is complete
- [ ] Deployment guide is accurate
- [ ] Environment variables documented
- [ ] Support contact info is correct

## ✅ Optional Enhancements

### 17. Custom Domain (Optional)
- [ ] Added custom domain in Vercel
- [ ] Configured DNS records
- [ ] SSL certificate issued
- [ ] Updated Whop app settings with custom domain
- [ ] Updated `WHOP_REDIRECT_URI` with custom domain

### 18. Database Migration (Recommended for Production)
- [ ] Chose production database (PostgreSQL, Supabase, Turso)
- [ ] Created database and tables
- [ ] Updated `db-wrapper.js` to use production DB
- [ ] Tested all CRUD operations
- [ ] Migrated existing data (if any)
- [ ] Updated environment variables with DB credentials

### 19. Email Notifications (Optional)
- [ ] Set up email service (SendGrid, Mailgun, etc.)
- [ ] Created email templates
- [ ] Added email sending logic
- [ ] Tested email delivery
- [ ] Added unsubscribe functionality

### 20. Analytics & Metrics (Optional)
- [ ] Implemented analytics dashboard
- [ ] Added refund metrics tracking
- [ ] Created revenue saved calculations
- [ ] Added export functionality
- [ ] Set up automated reports

## 🎉 Launch Checklist

### Final Steps Before Public Launch
- [ ] All tests passing
- [ ] No critical bugs
- [ ] Documentation complete
- [ ] Support channels ready
- [ ] Backup/restore procedures documented
- [ ] Rollback plan prepared
- [ ] Team trained on support procedures
- [ ] Marketing materials ready
- [ ] Pricing finalized
- [ ] Terms of Service and Privacy Policy published

## 📊 Success Metrics

Track these metrics after launch:
- [ ] OAuth connection success rate > 95%
- [ ] Refund processing success rate > 99%
- [ ] API response time < 2s
- [ ] Webhook delivery success rate > 99%
- [ ] User satisfaction score > 4.5/5
- [ ] Support ticket volume < 5% of users

## 🆘 Troubleshooting

If something doesn't work:

1. **Check Vercel Logs**: Go to Vercel Dashboard → Functions → View Logs
2. **Check Browser Console**: Look for JavaScript errors
3. **Verify Environment Variables**: Ensure all variables are set correctly
4. **Test Webhook Signature**: Use Whop's webhook testing tool
5. **Review Documentation**: [docs/DEPLOYMENT.md](DEPLOYMENT.md) and [docs/API.md](API.md)
6. **Check Whop API Status**: [status.whop.com](https://status.whop.com)

## 📞 Support

Need help? Contact:
- **GitHub Issues**: [github.com/YOUR_USERNAME/RefundGuard/issues](https://github.com/YOUR_USERNAME/RefundGuard/issues)
- **Email**: support@refundguard.app
- **Whop Discord**: [whop.com/discord](https://whop.com/discord)

---

**Note**: This checklist is comprehensive. Not all items are required for MVP, but completing them ensures a production-ready deployment.

