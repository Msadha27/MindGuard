# 🛡️ MindGuard Money

> A behavior-based personal finance tracker built for students.

Unlike regular expense trackers that just log numbers, MindGuard Money actively warns you before you overspend, protects your savings, and helps you build better financial habits — one decision at a time.

**🌐 Live App:** https://mind-guard-alpha.vercel.app

---

## 🤔 What makes it different

Most finance apps are passive — they show you what happened after the fact. MindGuard Money is designed to intervene *before* bad decisions:

- Warns you when you're approaching your monthly spending limit
- Makes you confirm three times before withdrawing from savings
- Flags immediately when any spending category goes over budget
- Tracks a daily streak to make staying disciplined feel rewarding

---

## ✨ Features

### 💳 Wallet System
- **Separate Main Balance and Savings** — always know what's available to spend vs. what's protected
- Top up either balance directly from the dashboard
- Net worth view combines both

### 📊 Category Budgets
- Set monthly limits for Snacks, Food, Academics, Beauty, and Household
- Live progress bars per category — turn yellow then red as you approach the limit
- Instant alerts when any category exceeds its budget

### 🧾 Transaction Management
- Add income with student-relevant sources: Pocket Money, Scholarship, Freelance, Part-time Job, Family Transfer, and more
- Add expenses by category, with a custom "Other" input for anything that doesn't fit a preset
- Edit or delete any transaction — balance adjusts automatically

### 🔒 Savings Protection
- Monthly spending limit with a visual progress bar
- 3-step confirmation flow before withdrawing from savings
- Overspending alerts displayed on the dashboard

### 🔥 Streak Tracker
- Counts consecutive days you've stayed within your daily budget
- Resets if you overspend — keeps you accountable

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React, TypeScript, Tailwind CSS |
| Backend / Database | Supabase (PostgreSQL + Auth) |
| Build Tool | Vite |
| Deployment | Vercel (PWA) |

Deployed as a **Progressive Web App** — installable on Android and iPhone without an app store.

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) account (free)
- A [Vercel](https://vercel.com) account (free) — for deployment

### 1. Clone the repo

```bash
git clone https://github.com/Msadha27/MindGuard.git
cd MindGuard
npm install
```

### 2. Set up Supabase

Create a new project on Supabase, then run this in the SQL Editor:

```sql
-- Wallet
create table wallet (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users,
  main_balance numeric default 0,
  savings_balance numeric default 0
);

-- Transactions
create table transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users,
  amount numeric not null,
  type text not null,
  category text not null,
  note text,
  date timestamptz default now()
);

-- Settings
create table settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users,
  spending_limit numeric default 10000,
  savings_goal numeric default 50000,
  category_limits jsonb default '[]'
);

-- Row Level Security
alter table wallet enable row level security;
alter table transactions enable row level security;
alter table settings enable row level security;

create policy "Users own their wallet" on wallet for all using (auth.uid() = user_id);
create policy "Users own their transactions" on transactions for all using (auth.uid() = user_id);
create policy "Users own their settings" on settings for all using (auth.uid() = user_id);
```

### 3. Add environment variables

Create a `.env` file in the root:

```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Run locally

```bash
npm run dev
```

Open `http://localhost:5173`

---

## ☁️ Deploying to Vercel

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com) → Import your repo
3. Add both environment variables under Project Settings
4. Click **Deploy**
5. Add your Vercel URL to Supabase → Authentication → URL Configuration → Redirect URLs

---

## 📱 Installing as a Mobile App

**Android (Chrome):** Open the app → tap the menu (⋮) → Add to Home Screen

**iPhone (Safari):** Open the app → tap Share (↑) → Add to Home Screen

---

## 🗂️ Project Structure

```
src/
  components/
    Dashboard.tsx              # Main layout with sidebar navigation
    TransactionForm.tsx        # Add income / expense
    TransactionList.tsx        # View, edit, delete transactions
    EditTransactionModal.tsx   # Edit any transaction with balance correction
    SavingsManager.tsx         # Savings vault with withdrawal protection
    QuickTopUp.tsx             # Direct balance top-up
    Settings.tsx               # Spending limit + category budgets
    SpendingChart.tsx          # 7-day spending bar chart
    CategoryPieChart.tsx       # Category breakdown chart
  lib/
    supabase.ts
    categories.ts
    currency.ts
```

---

## 💡 About

This project started from a real problem — as a student, it's easy to lose track of spending across small daily purchases like snacks, stationery, or subscriptions, without realizing how quickly it adds up.

MindGuard Money was built to go beyond logging. The goal was to create something that actively shapes spending behavior through warnings, friction, and awareness — not just a record of what already happened.

---

## 📬 Feedback

Found a bug or have a suggestion? Feel free to open an [issue](https://github.com/Msadha27/MindGuard/issues) or reach out directly. Always open to improvements.
