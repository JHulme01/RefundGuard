# 🛡️ RefundGuard

**Automated refund policy enforcement for Whop creators**

RefundGuard is a production-ready Whop app that automates refund decisions based on customizable policies, saving creators time and protecting revenue.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/YOUR_USERNAME/RefundGuard)

## ✨ Features

### 🎯 Core Features
- **Smart Policy Engine**: Choose from preset policies (7-day, 14-day, 30-day, strict, flexible) or create custom rules
- **Automated Refund Processing**: Automatically approve/deny refunds based on your policy
- **Real-time Whop Integration**: Syncs purchases, processes refunds, and receives webhook updates
- **Secure OAuth Flow**: Connect your Whop account with industry-standard OAuth 2.0
- **Policy Persistence**: Your settings are saved and applied automatically
- **Live Refund Queue**: See all refundable purchases with smart decision recommendations

### 🔐 Security & Reliability
- **Webhook Signature Verification**: HMAC-SHA256 verification for all incoming webhooks
- **Automatic Token Refresh**: Seamless token management with no manual intervention
- **Retry Logic**: Exponential backoff for failed API calls
- **Rate Limit Handling**: Respects Whop API rate limits automatically
- **Error Tracking**: Comprehensive logging for debugging and monitoring

### 🎨 User Experience
- **Modern UI**: Beautiful, responsive interface built with React + Tailwind CSS
- **Demo Mode**: Try the app without connecting to Whop
- **Real-time Feedback**: Toast notifications for all actions
- **Mobile Responsive**: Works perfectly on all devices

## 🚀 Quick Start

### Prerequisites
- Node.js 20.x or higher
- Vercel account
- Whop developer account

### 1. Clone Repository
```bash
git clone https://github.com/YOUR_USERNAME/RefundGuard.git
cd RefundGuard
npm install
```

### 2. Set Up Environment Variables
Copy `.env.example` to `.env` and fill in your credentials:
```bash
cp env.example .env
```

Required variables:
```env
WHOP_CLIENT_ID=your_whop_client_id
WHOP_CLIENT_SECRET=your_whop_client_secret
WHOP_REDIRECT_URI=http://localhost:5173/api/auth-callback
WHOP_WEBHOOK_SECRET=your_webhook_secret
SESSION_SECRET=generate_random_string
```

### 3. Run Locally
```bash
npm run dev
```

Visit `http://localhost:5173` to see the app in action!

### 4. Deploy to Vercel
```bash
npm i -g vercel
vercel
```

See [DEPLOYMENT.md](docs/DEPLOYMENT.md) for detailed deployment instructions.

## 📖 Documentation

- **[Deployment Guide](docs/DEPLOYMENT.md)**: Step-by-step deployment instructions
- **[API Documentation](docs/API.md)**: Complete API reference
- **[Roadmap](roadmap.md)**: Feature roadmap and progress

## 🏗️ Architecture

```
RefundGuard/
├── client/                 # React frontend
│   ├── src/
│   │   ├── App.jsx        # Main application component
│   │   ├── components/    # UI components
│   │   └── demoData.js    # Demo data for testing
│   └── dist/              # Build output
├── server/                # Backend logic
│   └── src/
│       ├── db-mock.js     # In-memory database (MVP)
│       ├── db-wrapper.js  # Database abstraction
│       └── whop-api-client.js  # Whop API client
├── api/                   # Vercel serverless functions
│   ├── auth-callback.js   # OAuth callback handler
│   ├── policy-save.js     # Save policy endpoint
│   ├── policy-get.js      # Get policy endpoint
│   ├── refund-requests.js # Fetch refunds endpoint
│   ├── process-refund.js  # Process refund endpoint
│   └── webhooks-whop.js   # Webhook handler
├── docs/                  # Documentation
└── app.json              # Whop app manifest
```

## 🔧 Tech Stack

### Frontend
- **React 18**: UI framework
- **Vite**: Build tool and dev server
- **Tailwind CSS**: Styling
- **Axios**: HTTP client
- **React Hot Toast**: Notifications

### Backend
- **Node.js 20**: Runtime
- **Vercel Serverless Functions**: Hosting
- **Whop API v2**: External integration
- **In-memory Mock DB**: Data persistence (MVP)

### Infrastructure
- **Vercel**: Deployment and hosting
- **GitHub**: Version control
- **Whop OAuth 2.0**: Authentication

## 🎯 Policy Templates

### 7-Day Standard
- **Window**: 7 days
- **Condition**: Valid reason required
- **Use Case**: Balanced protection for most creators

### 14-Day Flexible
- **Window**: 14 days
- **Condition**: Minimal friction
- **Use Case**: Customer-first approach

### 30-Day Premium
- **Window**: 30 days
- **Condition**: Screenshots or proof
- **Use Case**: High-value products with support

### Strict No-Refund
- **Window**: 0 days
- **Condition**: Exceptional cases only
- **Use Case**: Digital downloads, one-time access

### Custom Policy
- **Window**: Your choice
- **Condition**: Your rules
- **Use Case**: Unique business needs

## 🔄 How It Works

1. **Connect**: Creator connects their Whop account via OAuth
2. **Configure**: Choose or customize a refund policy
3. **Automate**: RefundGuard monitors all purchases
4. **Decide**: Policy engine evaluates refund requests automatically
5. **Process**: Approved refunds are processed via Whop API
6. **Track**: All decisions are logged for review

## 🛠️ Development

### Install Dependencies
```bash
npm install
```

### Run Development Server
```bash
npm run dev
```

### Build for Production
```bash
npm run build
```

### Preview Production Build
```bash
npm run preview
```

### Lint Code
```bash
npm run lint
```

## 🧪 Testing

### Test OAuth Flow
1. Start dev server: `npm run dev`
2. Click "Connect Whop"
3. Authorize with test Whop account
4. Verify connection and policy loading

### Test Refund Processing
1. Connect to Whop
2. View refund requests
3. Click "Approve" or "Deny"
4. Check Whop dashboard for refund status

### Test Webhooks
Use Whop's webhook testing tool or send test events:
```bash
curl -X POST http://localhost:3000/api/webhooks-whop \
  -H "Content-Type: application/json" \
  -H "X-Whop-Signature: sha256=..." \
  -d '{"type":"refund.created","data":{...}}'
```

## 🚧 Roadmap

See [roadmap.md](roadmap.md) for detailed feature roadmap.

### ✅ Completed
- [x] MVP with demo mode
- [x] Whop OAuth integration
- [x] Policy persistence
- [x] Real Whop API integration
- [x] Webhook handling
- [x] Token refresh logic
- [x] Retry and error handling

### 🔜 Coming Soon
- [ ] Analytics dashboard
- [ ] Email notifications
- [ ] Bulk refund processing
- [ ] Multi-product policies
- [ ] Production database migration

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built for the [Whop](https://whop.com) platform
- Deployed on [Vercel](https://vercel.com)
- UI inspired by modern SaaS design patterns

## 📞 Support

- **Documentation**: [docs/](docs/)
- **Issues**: [GitHub Issues](https://github.com/YOUR_USERNAME/RefundGuard/issues)
- **Email**: support@refundguard.app
- **Whop Discord**: [whop.com/discord](https://whop.com/discord)

## 🎉 Get Started

Ready to automate your refund policy?

1. **[Deploy to Vercel](https://vercel.com/new/clone?repository-url=https://github.com/YOUR_USERNAME/RefundGuard)**
2. **[Create Whop App](https://whop.com/apps)**
3. **[Read Deployment Guide](docs/DEPLOYMENT.md)**

---

Made with ❤️ for Whop creators

