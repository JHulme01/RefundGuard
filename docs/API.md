# RefundGuard API Documentation

## Overview

RefundGuard provides a serverless API for managing refund policies and processing refunds through the Whop platform.

**Base URL**: `https://your-domain.vercel.app/api`

## Authentication

### OAuth Flow

RefundGuard uses Whop OAuth 2.0 for authentication.

#### 1. Initiate OAuth

```http
GET /api/test-auth
```

**Response**:
```json
{
  "url": "https://whop.com/oauth?client_id=...",
  "state": "uuid-v4-state"
}
```

**Usage**:
```javascript
const { data } = await axios.get('/api/test-auth');
window.open(data.url, 'whop-oauth', 'width=600,height=700');
```

#### 2. OAuth Callback

```http
GET /api/auth-callback?code=xxx&state=xxx
```

This endpoint is called by Whop after user authorization. It:
1. Exchanges authorization code for access token
2. Fetches user profile
3. Saves creator and tokens to database
4. Posts success message to opener window

**Success Message**:
```javascript
{
  type: 'REFUND_GUARD_AUTH_SUCCESS',
  creatorId: 'creator_id',
  policy: { policyId: 'seven-day', ... }
}
```

## Policy Management

### Save Policy

```http
POST /api/policy-save
Content-Type: application/json
```

**Request Body**:
```json
{
  "creatorId": "creator_id",
  "policyId": "seven-day",
  "customDays": 14,
  "customCondition": "Screenshots required"
}
```

**Response**:
```json
{
  "status": "saved"
}
```

### Get Policy

```http
GET /api/policy-get?creatorId=creator_id
```

**Response**:
```json
{
  "policy": {
    "policyId": "seven-day",
    "customDays": 14,
    "customCondition": "Screenshots required",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

## Refund Management

### Get Refund Requests

Fetches purchases from Whop API that can be refunded.

```http
GET /api/refund-requests?creatorId=creator_id
```

**Response**:
```json
{
  "data": [
    {
      "id": "purchase_id",
      "purchaseId": "purchase_id",
      "memberName": "John Doe",
      "memberEmail": "john@example.com",
      "memberId": "member_id",
      "productName": "Premium Course",
      "productId": "product_id",
      "purchaseDate": "2024-01-01T00:00:00.000Z",
      "daysSincePurchase": 5,
      "amount": 99.00,
      "currency": "USD",
      "status": "pending",
      "refundable": true,
      "metadata": {
        "plan": "Monthly",
        "quantity": 1
      }
    }
  ],
  "source": "whop",
  "total": 1
}
```

**Data Sources**:
- `whop`: Real data from Whop API
- `demo`: Demo data (when not authenticated)

### Process Refund

Creates a refund via Whop API.

```http
POST /api/process-refund
Content-Type: application/json
```

**Request Body**:
```json
{
  "creatorId": "creator_id",
  "requestId": "request_id",
  "purchaseId": "purchase_id",
  "amount": 99.00,
  "memberId": "member_id",
  "memberName": "John Doe",
  "memberEmail": "john@example.com",
  "productName": "Premium Course",
  "purchaseDate": "2024-01-01T00:00:00.000Z",
  "daysSincePurchase": 5,
  "note": "Automated via RefundGuard policy"
}
```

**Response (Success)**:
```json
{
  "status": "success",
  "message": "Refund processed successfully",
  "requestId": "request_id",
  "refundId": "refund_id",
  "refundStatus": "processing",
  "data": {
    "id": "refund_id",
    "amount": 9900,
    "currency": "USD",
    "status": "processing",
    "created_at": 1234567890
  }
}
```

**Response (Error)**:
```json
{
  "error": "refund_failed",
  "message": "Failed to process refund via Whop API",
  "details": "Insufficient balance"
}
```

## Webhooks

### Whop Webhook Handler

Receives and processes webhook events from Whop.

```http
POST /api/webhooks-whop
Content-Type: application/json
X-Whop-Signature: sha256=...
```

**Supported Events**:
- `refund.created`: New refund created
- `refund.updated`: Refund status updated

**Request Body**:
```json
{
  "type": "refund.created",
  "data": {
    "id": "refund_id",
    "purchase_id": "purchase_id",
    "amount": 9900,
    "currency": "USD",
    "status": "processing",
    "created_at": 1234567890,
    "user": {
      "id": "user_id",
      "email": "user@example.com",
      "username": "johndoe"
    },
    "product": {
      "id": "product_id",
      "title": "Premium Course"
    }
  }
}
```

**Response**:
```json
{
  "received": true
}
```

**Signature Verification**:
Webhooks are verified using HMAC-SHA256:
```javascript
const signature = `sha256=${crypto
  .createHmac('sha256', WEBHOOK_SECRET)
  .update(rawBody)
  .digest('hex')}`;
```

## Error Handling

All API endpoints follow consistent error response format:

```json
{
  "error": "error_code",
  "message": "Human-readable error message",
  "details": "Additional context (optional)"
}
```

### Common Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `missing_creator_id` | 400 | Creator ID not provided |
| `missing_whop_credentials` | 500 | OAuth credentials not configured |
| `token_exchange_failed` | 500 | Failed to exchange OAuth code |
| `profile_fetch_failed` | 500 | Failed to fetch user profile |
| `refund_failed` | 500 | Failed to process refund |
| `invalid_signature` | 401 | Webhook signature verification failed |
| `internal_error` | 500 | Unexpected server error |

## Rate Limiting

The Whop API client implements automatic retry logic with exponential backoff:
- **Max Retries**: 3
- **Initial Delay**: 1 second
- **Backoff**: Exponential (2^attempt)
- **Rate Limit Handling**: Respects `Retry-After` header

## Token Management

### Automatic Token Refresh

Access tokens are automatically refreshed when:
- Token is expired
- Token expires within 5 minutes
- API returns 401 Unauthorized

**Refresh Flow**:
```javascript
POST https://api.whop.com/v2/oauth/token
{
  "grant_type": "refresh_token",
  "refresh_token": "...",
  "client_id": "...",
  "client_secret": "..."
}
```

## Whop API Integration

### Endpoints Used

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/v2/oauth/token` | POST | Exchange code / refresh token |
| `/v2/me` | GET | Fetch user profile |
| `/v2/me/company` | GET | Fetch company info |
| `/v2/products` | GET | Fetch products |
| `/v2/purchases` | GET | Fetch purchases |
| `/v2/purchases/:id/refund` | POST | Create refund |
| `/v2/memberships/:id` | DELETE | Revoke access |

### API Client Features

- ✅ Automatic token refresh
- ✅ Retry logic with exponential backoff
- ✅ Rate limit handling (429 responses)
- ✅ Error handling and logging
- ✅ Request/response logging

## Database Schema (Mock)

### Creators
```javascript
{
  id: string,           // Primary key
  whopId: string,       // Whop user ID
  name: string,         // Display name
  email: string,        // Email address
  createdAt: string     // ISO timestamp
}
```

### Tokens
```javascript
{
  creatorId: string,    // Foreign key
  accessToken: string,  // OAuth access token
  refreshToken: string, // OAuth refresh token
  expiresAt: string,    // ISO timestamp
  updatedAt: string     // ISO timestamp
}
```

### Policies
```javascript
{
  creatorId: string,    // Foreign key
  policyId: string,     // Policy template ID
  customDays: number,   // Custom refund window
  customCondition: string, // Custom condition text
  updatedAt: string     // ISO timestamp
}
```

### Refund Logs
```javascript
{
  id: string,           // Primary key
  creatorId: string,    // Foreign key
  whopRequestId: string, // Whop refund ID
  purchaseId: string,   // Purchase ID
  purchaseDate: string, // ISO timestamp
  daysSincePurchase: number,
  productName: string,
  memberName: string,
  memberEmail: string,
  amount: number,       // Dollar amount
  currency: string,
  decision: string,     // approved/denied/error
  status: string,       // processing/completed/failed
  rawPayload: string,   // JSON string
  recordedAt: string    // ISO timestamp
}
```

## Security Best Practices

1. **Environment Variables**: Never commit secrets to Git
2. **Webhook Verification**: Always verify webhook signatures
3. **Token Storage**: Tokens stored in secure database (encrypt in production)
4. **CORS**: Configure allowed origins in production
5. **Rate Limiting**: Implement rate limiting for public endpoints
6. **Input Validation**: Validate all user inputs
7. **Error Messages**: Don't expose sensitive info in errors

## Testing

### Local Development
```bash
npm run dev
```

### Test OAuth Flow
1. Start local server
2. Visit `http://localhost:5173`
3. Click "Connect Whop"
4. Use Whop test credentials

### Test Webhooks
Use Whop webhook testing tool or:
```bash
curl -X POST http://localhost:3000/api/webhooks-whop \
  -H "Content-Type: application/json" \
  -H "X-Whop-Signature: sha256=..." \
  -d '{"type":"refund.created","data":{...}}'
```

## Migration to Production Database

Current implementation uses in-memory mock database. For production:

1. **Choose Database**: PostgreSQL, Supabase, or Turso
2. **Update `db-wrapper.js`**: Import real DB client
3. **Create Tables**: Run migration scripts
4. **Update Environment**: Add database connection string
5. **Test**: Verify all CRUD operations work

Example migration to Supabase:
```javascript
// server/src/db-supabase.js
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

export async function upsertCreator(creator) {
  const { error } = await supabase
    .from('creators')
    .upsert(creator);
  if (error) throw error;
}
// ... etc
```

## Support

For API questions or issues:
- **Documentation**: [github.com/YOUR_USERNAME/RefundGuard/docs](https://github.com/YOUR_USERNAME/RefundGuard/docs)
- **Issues**: [github.com/YOUR_USERNAME/RefundGuard/issues](https://github.com/YOUR_USERNAME/RefundGuard/issues)
- **Email**: support@refundguard.app

