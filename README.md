# 💎 USDCx Content Marketplace

> **Monetize APIs, Datasets & AI Models with HTTP 402 + USDCx on Stacks**

A decentralized marketplace that enables creators to monetize digital content using programmable USDCx payments on the Stacks blockchain, featuring the industry-standard **HTTP 402 Payment Required** protocol.

![Stacks](https://img.shields.io/badge/Stacks-5546FF?style=for-the-badge&logo=stacks&logoColor=white)
![Clarity](https://img.shields.io/badge/Clarity-Smart%20Contract-orange?style=for-the-badge)
![USDCx](https://img.shields.io/badge/USDCx-USDC%20on%20Stacks-2775CA?style=for-the-badge)
![HTTP 402](https://img.shields.io/badge/HTTP%20402-Payment%20Required-green?style=for-the-badge)

## 🎯 Problem Statement

APIs and digital content are the backbone of the modern internet, but monetizing them is broken:

- ❌ Complex subscription models
- ❌ Credit card processing fees (3-5%)
- ❌ Chargebacks and fraud
- ❌ Geographic restrictions
- ❌ No micropayment support

## ✨ Solution: HTTP 402 + USDCx

We bring back **HTTP 402 Payment Required** - a status code reserved since 1999 for web payments - and combine it with **USDCx stablecoins** on Stacks:

- ✅ **Instant payments** - No subscriptions, pay-per-access
- ✅ **Near-zero fees** - Stacks transactions cost fractions of a cent
- ✅ **No chargebacks** - Blockchain-verified payments
- ✅ **Global access** - Anyone with USDCx can pay
- ✅ **Programmable** - Time-based access, revenue sharing, etc.

## 🏗️ Architecture

```
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│   React Frontend │────▶│  Express Backend │────▶│ Stacks Blockchain│
│   + Leather      │     │  + HTTP 402      │     │  + USDCx Token   │
└──────────────────┘     └──────────────────┘     └──────────────────┘
         │                        │                        │
         │                        │                        │
    ┌────▼────┐              ┌────▼────┐              ┌────▼────┐
    │ Connect │              │ Verify  │              │ Content │
    │ Wallet  │              │ Access  │              │Marketplace│
    │         │              │ On-chain│              │ Contract │
    └─────────┘              └─────────┘              └──────────┘
```

### Components

1. **Smart Contract** (`contracts/content-marketplace.clar`)
   - Content listing with USDCx pricing
   - Time-based access control
   - Automatic creator payments
   - Revenue tracking

2. **Backend API** (`backend/`)
   - HTTP 402 middleware for protected content
   - On-chain access verification
   - RESTful content endpoints

3. **Frontend** (`frontend/`)
   - Modern React + TypeScript
   - Leather wallet integration
   - USDCx bridge guide
   - Creator dashboard

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Clarinet CLI
- Leather Wallet (browser extension)

### Installation

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/content-marketplace.git
cd content-marketplace

# Install root dependencies
npm install

# Install backend dependencies
cd backend && npm install && cd ..

# Install frontend dependencies
cd frontend && npm install && cd ..
```

### Run Locally

```bash
# Terminal 1: Start backend
cd backend
npm run dev

# Terminal 2: Start frontend
cd frontend
npm run dev
```

Open http://localhost:5173 in your browser.

## 📝 Smart Contract

**Deployed on Stacks Testnet:**
```
ST13T9VVWP9XHRHFMTSYPNDWN986AEK4WQ2DYQ0Q2.content-marketplace-v2
```

### Key Functions

| Function | Description |
|----------|-------------|
| `list-content` | Create a new content listing with USDCx price |
| `purchase-access` | Pay USDCx to get time-limited access |
| `has-valid-access` | Check if user has valid access |
| `get-content-stats` | Get revenue and access statistics |

### USDCx Integration

```clarity
;; Transfer USDCx from buyer to creator
(try! (contract-call? 
    'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.usdcx-v1 
    transfer 
    payment-amount 
    tx-sender 
    creator 
    none))
```

## 🌉 Getting USDCx (Testnet)

1. Get Sepolia ETH: https://cloud.google.com/application/web3/faucet/ethereum/sepolia
2. Get Test USDC: https://faucet.circle.com/
3. Bridge to Stacks: Use xReserve bridge (~15 min)

## 📡 HTTP 402 Flow

```http
GET /api/content/1/access HTTP/1.1
Host: api.example.com
X-User-Principal: ST1ABC...

HTTP/1.1 402 Payment Required
Content-Type: application/json

{
  "error": "Payment Required",
  "paymentDetails": {
    "amount": 100,
    "currency": "USDCx",
    "contractAddress": "ST13T9...content-marketplace-v2",
    "functionName": "purchase-access",
    "contentId": 1
  }
}
```

## 🧪 Testing

```bash
# Run smart contract tests (14 tests)
npm test

# Run with watch mode
npm run test:watch
```

## 📁 Project Structure

```
content-marketplace/
├── contracts/              # Clarity smart contracts
│   └── content-marketplace.clar
├── backend/                # Express.js API server
│   ├── src/
│   │   ├── middleware/     # HTTP 402 middleware
│   │   ├── routes/         # API routes
│   │   └── services/       # Blockchain integration
│   └── package.json
├── frontend/               # React application
│   ├── src/
│   │   ├── components/     # UI components
│   │   ├── context/        # Wallet context
│   │   └── services/       # API & contract services
│   └── package.json
├── tests/                  # Clarinet tests
└── README.md
```

## 🎥 Demo Video

[Watch the demo video](https://www.youtube.com/watch?v=YOUR_VIDEO_ID)

## 🏆 Hackathon Submission

**Programming USDCx on Stacks - Builder Challenge**
- Event: January 19-25, 2026
- Prize: $3,000 USD (Winner takes all)

### Why This Project Wins

1. **Technical Innovation**: First HTTP 402 implementation with blockchain
2. **USDCx Integration**: Native stablecoin payments for content access
3. **Real-World Use Case**: Solves API monetization for millions of developers
4. **Production Ready**: Complete full-stack implementation

## 👨‍💻 Team

- **Developer**: [Your Name]
- **GitHub**: [Your GitHub]
- **Email**: [Your Email]

## 📄 License

MIT License - See [LICENSE](LICENSE) for details.

---

<p align="center">
  <strong>Built with ❤️ for the Stacks ecosystem</strong>
  <br>
  Powered by USDCx & HTTP 402
</p>
