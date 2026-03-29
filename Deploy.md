# 🚀 MindGuard Money — Full Deployment Guide

## Step 1: Push to GitHub

```bash
# If you haven't already:
git init
git add .
git commit -m "feat: MindGuard Money v2 - behavior-based finance tracker"

# Create a new repo on github.com (call it: mindguard-money)
# Then:
git remote add origin https://github.com/YOUR_USERNAME/mindguard-money.git
git branch -M main
git push -u origin main
```

---

## Step 2: Deploy Frontend on Vercel (Free)

1. Go to → **https://vercel.com** → Sign up with GitHub
2. Click **"Add New Project"**
3. Import your `mindguard-money` repo
4. Set these **Environment Variables** before deploying:
   - `VITE_SUPABASE_URL` → your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY` → your Supabase anon key
5. Click **Deploy** → takes ~2 minutes
6. You'll get a URL like: `https://mindguard-money.vercel.app` ✅

---

## Step 3: Add Your Vercel URL to Supabase

1. Go to **Supabase Dashboard** → your project → **Authentication → URL Configuration**
2. Add your Vercel URL to **Redirect URLs**:
   ```
   https://mindguard-money.vercel.app/**
   ```
3. Also add it to **Site URL**

---

## Step 4: Run the SQL Migration (if not done yet)

In Supabase → **SQL Editor**, paste and run:

```sql
-- Wallet table
create table if not exists wallet (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users,
  main_balance numeric default 0,
  savings_balance numeric default 0
);

-- Transactions table
create table if not exists transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users,
  amount numeric not null,
  type text not null,
  category text not null,
  note text,
  date timestamptz default now()
);

-- Settings table
create table if not exists settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users,
  spending_limit numeric default 10000,
  savings_goal numeric default 50000,
  category_limits jsonb default '[]'
);

-- RLS Policies
alter table wallet enable row level security;
alter table transactions enable row level security;
alter table settings enable row level security;

create policy "Users own their wallet" on wallet for all using (auth.uid() = user_id);
create policy "Users own their transactions" on transactions for all using (auth.uid() = user_id);
create policy "Users own their settings" on settings for all using (auth.uid() = user_id);
```

---

## Step 5: Install as Mobile App (PWA)

### Android (Chrome):
1. Open your Vercel URL in Chrome
2. Tap the **⋮ menu** → **"Add to Home Screen"**
3. Tap **Add** → app icon appears on your home screen ✅

### iPhone (Safari):
1. Open your Vercel URL in Safari
2. Tap the **Share button** (□↑)
3. Scroll down → **"Add to Home Screen"**
4. Tap **Add** → app icon appears ✅

---

## ✅ What You Now Have

| Feature | Status |
|---|---|
| Main Balance (separate card) | ✅ |
| Savings Balance (separate card) | ✅ |
| Per-category monthly limits | ✅ |
| Edit any transaction | ✅ |
| Student income categories | ✅ |
| Custom "Other" expense input | ✅ |
| Multi-step savings withdrawal | ✅ |
| Overspending alerts | ✅ |
| AI Coach | ✅ |
| Installable as mobile app (PWA) | ✅ |
| Free hosting on Vercel | ✅ |