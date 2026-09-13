# 🎬 Watch & Earn - Video Rewards Platform

A fully functional, high-performance web platform built with **Next.js 16 (App Router)**, **React 19**, and **Tailwind CSS**. Users can watch YouTube videos, earn coins per video, and withdraw funds once reaching **100 Coins** through **EasyPaisa**, **JazzCash**, **Bank Transfer**, or **Crypto (USDT)**.

---

## 🌟 Key Features

### 1. 📺 YouTube Watch & Earn Player (Anti-Cheat)
- Powered by official **YouTube IFrame API**.
- **Real-Time Countdown**: The timer only ticks down while the video is actively playing.
- **Anti-Cheat Mechanics**: Pauses countdown if video is paused, scrubbed/skipped ahead, or if the user switches browser tabs.
- **Confetti & Sound Effects**: Celebratory sound effects synthesized via the Web Audio API with confetti explosion upon claiming coins.

### 2. 💰 Coin Wallet & 100-Coin Payout System
- **Minimum Withdrawal Rule**: Enforced at **100 Coins** (100 Coins = 100 PKR).
- **Payment Methods**:
  - 🟢 **EasyPaisa**
  - 🟠 **JazzCash**
  - 🏦 **Bank Transfer** (Meezan, HBL, UBL, SadaPay, etc.)
  - 🪙 **Crypto / USDT (TRC20)**
- **Live Withdrawal Status Log**: `Pending Review 🟡`, `Approved & Paid 🟢`, `Rejected 🔴`.

### 3. 🛡️ Admin Control Panel (`/admin`)
- PIN-Protected (Default PIN: `admin123`).
- **Add YouTube Videos**: Paste any YouTube link (Shorts, youtu.be, standard URLs) — auto-extracts ID and thumbnail.
- **Set Rewards**: Customize coin reward and watch duration (e.g., 30s, 60s).
- **Process Payouts**: Review, approve, and reject user withdrawal requests with optional transaction reference numbers.

### 4. 🎁 Extra Retention Features
- **Daily Lucky Spin Wheel (`/spin`)**: HTML5 Canvas prize wheel with sound ticks and free coins every 24 hours.
- **Refer & Earn Program (`/refer`)**: Unique invite link with 1-click copy & WhatsApp direct share.
- **Weekly Leaderboard (`/leaderboard`)**: Hall of Fame podium for top coin earners.

---

## 🚀 Running Locally

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Or build & start production server
npm run build
npm run start
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## ☁️ Deploying to Vercel

1. Push this folder to your **GitHub** account.
2. Log in to [Vercel](https://vercel.com) and click **"New Project"**.
3. Select your repository — Vercel will automatically detect **Next.js**.
4. Click **"Deploy"**!
