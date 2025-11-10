## RefundGuard Roadmap

### ✅ MVP (24h ship)
- [x] Create marketing-first React + Tailwind dashboard with demo mode and policy presets
- [x] Scaffold Express API with Whop integration stubs for refunds and access revocation
- [x] Wire fake data + live API toggles for onboarding and refund automation preview
- [x] Package Whop app manifest, deployment config, and launch assets

### 🔜 Short-Term Enhancements
- [x] Add persistent storage (local SQLite for MVP; migrate to Supabase/Postgres next)
- [x] Implement Whop OAuth exchange flow and secure token storage
- [x] Sync real refund logs + status updates back to Whop webhooks
- [ ] Add metrics drill-down (denial reasons, cohort churn, saved revenue timeline)

### 🚀 Later / Growth Ideas
- [ ] Automate upsell offers on denied refunds with personalized bundles
- [ ] Introduce multi-product policy rules and segmentation (VIP vs. new buyers)
- [ ] Launch compliance center with downloadable policy PDFs and audit logs
- [ ] Build Chrome extension for instant refund context while answering DMs

