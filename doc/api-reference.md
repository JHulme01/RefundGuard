## RefundGuard API Reference (MVP)

### Auth
- `GET /api/auth/login` → Returns Whop OAuth authorize URL (requires `WHOP_CLIENT_ID`, `WHOP_REDIRECT_URI`). Sets temporary state cookie.
- `GET /api/auth/callback` → Exchanges auth code for tokens, stores creator + policy, sets cookie session, posts success message to opener.
- `GET /api/session` → Returns `{ connected, creatorId, policy }` based on session cookie.
- `GET /api/auth/logout` → Clears cookie session.

### Policy
- `GET /api/policy` → Fetch current policy for the authenticated creator.
- `POST /api/policy` → Body `{ policyId, customDays?, customCondition? }`. Persists selection + custom rules.

### Refund Automation
- `GET /api/purchases` → Lists recent Whop purchases (falls back to demo data if not authenticated).
- `GET /api/refund-requests` → Returns stored refund logs for the creator (demo queue if not connected).
- `POST /api/process-refund` → Body with purchase + member metadata; triggers Whop refund + access revoke, logs outcome.
- `POST /api/send-denial` → Body with policy window + member metadata; enqueues denial email template and logs decision.

### Webhooks
- `POST /api/webhooks/whop` → Validates `whop-signature` with `WHOP_WEBHOOK_SECRET`, logs `refund.created` + `refund.updated` events to SQLite.

### Data Storage
- SQLite database (`DATABASE_PATH`, default `refundguard.db`) with tables:
  - `creators`, `tokens`, `policies`, `refund_logs`.
- Sessions handled via signed cookies (`SESSION_SECRET`) to support browser fetches.

> Production Tip: Promote SQLite layer to Supabase/Postgres and swap cookie-session for JWT or Supabase Auth when scaling.

