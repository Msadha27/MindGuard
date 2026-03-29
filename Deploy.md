# 🚀 MindGuard Money — Publish as an App

This guide covers everything: adding the edit feature, deploying live on Vercel, and making it installable like a real app on your phone.

---

## ✏️ Step 1 — Add the Edit Feature

Copy these two new files into your `src/components/` folder:

| File | What it does |
|---|---|
| `EditTransactionModal.tsx` | Full edit form — amount, category, note, date |
| `TransactionList.tsx` | Replace old one — adds ✏️ Edit button next to 🗑️ Delete |

**How editing works:**
- Hover any transaction → ✏️ pencil icon appears
- Change amount, category, note, or date
- Balance is automatically corrected (difference applied to wallet)
- Works for both income and expenses

---

## 🌐 Step 2 — Deploy on Vercel (Free, Takes 5 Minutes)

### Prerequisites
- Your project is on **GitHub** (or GitLab/Bitbucket)
- You have a **Supabase** project with your tables set up

### Deploy Steps

**1. Push your code to GitHub**
```bash
git init
git add .
git commit -m "MindGuard Money v1"
git remote add origin https://github.com/YOUR_USERNAME/mindguard-money.git
git push -u origin main
```

**2. Go to [vercel.com](https://vercel.com)**
- Sign up / log in with GitHub
- Click **"Add New Project"**
- Select your `mindguard-money` repository
- Click **Import**

**3. Set Environment Variables in Vercel**

Before clicking Deploy, scroll down to **Environment Variables** and add:

| Key | Value |
|---|---|
| `VITE_SUPABASE_URL` | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anon key |

> Find these in your Supabase dashboard → **Project Settings → API**

**4. Click Deploy** → Vercel builds and gives you a live URL like:
```
https://mindguard-money.vercel.app
```

**5. Auto-deploy on every push**
After setup, every `git push` auto-deploys — no manual steps needed.

---

## 📱 Step 3 — Make it Installable as a Phone App (PWA)

This turns your website into an app users can install from their browser — no App Store needed.

### A. Add `manifest.json`

Create `public/manifest.json`:

```json
{
  "name": "MindGuard Money",
  "short_name": "MindGuard",
  "description": "Your personal financial guardian",
  "start_url": "/dashboard",
  "display": "standalone",
  "background_color": "#0b0f19",
  "theme_color": "#10b981",
  "orientation": "portrait",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

### B. Update `index.html`

Add these lines inside `<head>`:

```html
<link rel="manifest" href="/manifest.json" />
<meta name="theme-color" content="#10b981" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
<meta name="apple-mobile-web-app-title" content="MindGuard" />
<link rel="apple-touch-icon" href="/icon-192.png" />
```

### C. Create App Icons

Create two PNG icons and put them in your `public/` folder:
- `icon-192.png` — 192×192 pixels
- `icon-512.png` — 512×512 pixels

> **Quick way:** Use [favicon.io](https://favicon.io) or [realfavicongenerator.net](https://realfavicongenerator.net) to generate icons from text or an image.

### D. Add a Service Worker (optional but recommended)

Install the Vite PWA plugin:
```bash
npm install -D vite-plugin-pwa
```

Update `vite.config.ts`:
```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'MindGuard Money',
        short_name: 'MindGuard',
        theme_color: '#10b981',
        background_color: '#0b0f19',
        display: 'standalone',
        start_url: '/dashboard',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
    }),
  ],
});
```

---

## 📲 Step 4 — Install on Your Phone

### Android (Chrome)
1. Open your Vercel URL in Chrome
2. Tap the **⋮ menu** (3 dots) → **"Add to Home screen"**
3. Tap **Add** → App appears on your home screen!

### iPhone (Safari)
1. Open your Vercel URL in Safari
2. Tap the **Share button** (box with arrow)
3. Scroll down → tap **"Add to Home Screen"**
4. Tap **Add** → Done!

---

## 🔒 Step 5 — Supabase Auth Settings (Important!)

After deploying, add your Vercel URL to Supabase's allowed URLs:

1. Go to **Supabase Dashboard → Authentication → URL Configuration**
2. Add your Vercel URL to **Site URL**:
   ```
   https://mindguard-money.vercel.app
   ```
3. Add to **Redirect URLs**:
   ```
   https://mindguard-money.vercel.app/**
   ```
4. Save — otherwise login/signup will fail on the live site

---

## 🎯 Final Checklist

- [ ] `EditTransactionModal.tsx` added to `src/components/`
- [ ] `TransactionList.tsx` replaced (has edit + delete)
- [ ] Code pushed to GitHub
- [ ] Vercel project created with env variables
- [ ] Supabase redirect URLs updated
- [ ] `manifest.json` created in `public/`
- [ ] `index.html` updated with PWA meta tags
- [ ] Icons created (192px + 512px)
- [ ] Tested "Add to Home Screen" on phone

---

## 🆘 Common Issues

| Problem | Fix |
|---|---|
| Login redirects to wrong URL | Add your Vercel URL to Supabase redirect URLs |
| Build fails on Vercel | Check env variables are set correctly |
| App not installable | Make sure `manifest.json` is in `public/` and `index.html` links it |
| Balance wrong after edit | Make sure old `TransactionList.tsx` is fully replaced |
| White screen on phone | Check browser console for errors, usually a missing env var |

---

Your app is now live, installable, and fully functional! 🎉