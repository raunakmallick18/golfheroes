# ⚡ GolfHeroes
 
> A subscription-driven golf performance tracking platform combining monthly prize draws and charity fundraising — built as a full-stack trainee assignment for Digital Heroes.
 
---
 
## 🌐 Live Demo
 
🔗 [golfheroes.vercel.app](https://golfheroes-omega.vercel.app/) 
 
---
 
## 📌 Project Overview
 
GolfHeroes is a modern web application where golfers subscribe, enter their Stableford scores, participate in monthly draws, and direct a portion of their subscription to a charity of their choice. The design is intentionally emotion-driven and modern — deliberately avoiding the aesthetics of a traditional golf website.
 
---
 
## ✨ Features
 
### 👤 User Side
- Subscription flow with **Monthly (₹1,699/mo)** and **Yearly (₹1,299/mo)** plans
- 3-step onboarding — plan selection, charity selection, account creation
- Stableford score entry (1–45), rolling 5-score history, one score per date
- Monthly draw participation with matched numbers visualised
- Charity selection with adjustable contribution percentage (min 10%)
- One-off independent donation option
- Full user dashboard — scores, draw history, winnings, settings
### 🛡 Admin Side
- User management — view, edit, suspend, delete
- Draw engine — random or algorithm-weighted (frequency-based) draw modes
- Simulation mode before publishing official results
- Prize pool auto-calculation by tier (5-match / 4-match / 3-match)
- Jackpot rollover if no 5-match winner
- Charity management — add, edit, remove listings
- Winner verification — approve/reject, mark as paid
- Reports & analytics — revenue, prize pool, charity totals, draw stats
---
 
## 🧪 Test Credentials
 
| Role | Email | Password |
|------|-------|----------|
| User | `raunak.m@test.com` | `test123` |
| Admin | `admin@golfheroes.com` | `admin123` |
 
---
 
## 🛠 Tech Stack
 
| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite |
| Styling | Pure CSS (CSS Variables, no UI library) |
| Fonts | Playfair Display + DM Sans (Google Fonts) |
| Deployment | Vercel |
| Database *(planned)* | Supabase |
| Payments *(planned)* | Stripe |
 
---
 
## 🚀 Getting Started
 
### Prerequisites
- Node.js v18+
- npm
### Installation
 
```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/golfheroes.git
cd golfheroes
 
# Install dependencies
npm install
 
# Start development server
npm run dev
```
 
Open [http://localhost:5173](http://localhost:5173) in your browser.
 
### Build for Production
 
```bash
npm run build
```
 
---
 
## 📁 Project Structure
 
```
golfheroes/
├── public/
├── src/
│   ├── App.jsx          # Main application — all components
│   ├── main.jsx         # React entry point
│   ├── index.css        # Base reset
│   └── App.css          # (unused — styles are in App.jsx)
├── index.html
├── vite.config.js
└── README.md
```
 
---
 
## 🏗 Deployment (Vercel)
 
1. Push the project to a GitHub repository
2. Go to [vercel.com](https://vercel.com) and import the repo
3. Vercel auto-detects Vite — leave settings as default
4. Click **Deploy**
Every subsequent `git push` to `main` triggers an automatic redeployment.
 
---
 
## 💰 Prize Pool Logic
 
| Match | Pool Share | Rollover |
|-------|-----------|----------|
| 5-Number Match | 40% | ✅ Yes (Jackpot) |
| 4-Number Match | 35% | ❌ No |
| 3-Number Match | 25% | ❌ No |
 
50% of each active subscription contributes to the prize pool. Prizes are split equally among multiple winners in the same tier.
 
---
 
## 🔮 Roadmap
 
- [ ] Supabase integration for persistent data storage
- [ ] Stripe payment gateway
- [ ] Email notifications (draw results, winner alerts)
- [ ] Mobile app version
- [ ] Multi-country / multi-currency support
- [ ] Team / corporate accounts
---
 
## 📄 License
 
This project was built as part of a selection process assignment issued by [Digital Heroes](https://digitalheroes.co.in). Not for commercial redistribution.
 
---
 
*Built with purpose by Raunak*
