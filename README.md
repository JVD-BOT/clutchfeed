# ClutchFeed 🎮⚡

Esports highlights, live scores and community in one feed.  
Built with React + Vite. Deployable to Vercel in minutes.

---

## Stack
- **React 18** — UI
- **Vite 5** — build tool
- **vite-plugin-pwa** — makes it installable as an Android/iOS app
- **Vercel** — free hosting with auto-deploy from GitHub

---

## Getting Started (do this when you get home)

### Step 1 — Install dependencies
```bash
npm install
```

### Step 2 — Run locally
```bash
npm run dev
```
Open `http://localhost:5173` in your browser.  
Works on mobile too — your phone and laptop must be on the same WiFi.  
Visit your laptop's local IP (shown in terminal) on your phone.

### Step 3 — Build for production
```bash
npm run build
```

### Step 4 — Preview the production build
```bash
npm run preview
```

---

## Deploy to Vercel (free)

### Option A — Via Vercel Dashboard (easiest)
1. Push this folder to a GitHub repo
2. Go to [vercel.com](https://vercel.com) → New Project
3. Import your GitHub repo
4. Leave all settings as default
5. Click Deploy

Vercel auto-detects Vite. Your app will be live at `clutchfeed.vercel.app` (or whatever name you pick).

### Option B — Via Vercel CLI
```bash
npm install -g vercel
vercel
```

---

## Push to GitHub

```bash
# From inside this folder:
git init
git add .
git commit -m "Initial ClutchFeed build"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/clutchfeed.git
git push -u origin main
```

After this, every `git push` auto-deploys to Vercel.

---

## Get it on the Play Store (Android)

Once deployed to Vercel:

1. Go to [pwabuilder.com](https://pwabuilder.com)
2. Paste your Vercel URL (e.g. `https://clutchfeed.vercel.app`)
3. Click Start → Android → Download Package
4. You get an `.apk` file
5. Go to [play.google.com/console](https://play.google.com/console)
6. Pay the one-time £20 developer fee
7. Create new app → upload the APK
8. Fill in store listing details → Submit for review
9. Review takes 3–7 days for a new account

---

## Add Your Real Logo

When you have a logo:
1. Replace `public/icons/icon-192.png` with your 192×192 logo
2. Replace `public/icons/icon-512.png` with your 512×512 logo
3. The logo appears in: app header, hero section, Play Store icon, home screen icon

The `Logo` component is at the top of `src/ClutchFeed.jsx` — clearly marked with a comment showing exactly where to swap in your real logo image.

---

## Connect YouTube Data API (for real clips)

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create project → Enable YouTube Data API v3
3. Create credentials → API Key
4. In `ClutchFeed.jsx`, find `YT_POOL` and replace with API calls
5. Free tier: 10,000 units/day (100 searches = 100 units)

---

## Project Structure

```
clutchfeed/
├── public/
│   └── icons/
│       ├── icon-192.png    ← replace with your logo
│       └── icon-512.png    ← replace with your logo
├── src/
│   ├── main.jsx            ← React entry (don't touch)
│   ├── App.jsx             ← imports ClutchFeed (don't touch)
│   └── ClutchFeed.jsx      ← THE WHOLE APP IS IN HERE
├── index.html              ← fonts + meta tags
├── vite.config.js          ← build config + PWA settings
├── package.json            ← dependencies
└── .gitignore
```

---

## Features Built

| Feature | Status |
|---------|--------|
| Personalised feed (game + category filter) | ✅ |
| Short-form clip feed with thumbnails | ✅ |
| Inline YouTube video player | ✅ |
| Prev / Next clip navigation | ✅ |
| AI-powered feed refresh (Anthropic API) | ✅ |
| Live esports scores strip | ✅ |
| Trending games row | ✅ |
| GG / Clutch / Noscope / Oof reactions | ✅ |
| Daily streak counter | ✅ |
| For You / Following feed tabs | ✅ |
| Weekly leaderboard (top 3 clips) | ✅ |
| Clip challenges (live community events) | ✅ |
| Comments sheet with @mention | ✅ |
| ClutchFeed Pro upgrade preview | ✅ |
| Onboarding flow (5 steps, 60 seconds) | ✅ |
| Submit / drop a clip | ✅ |
| Save clips to library | ✅ |
| Search by game + top players | ✅ |
| Gamer profile page | ✅ |
| Arena hero section | ✅ |
| PWA (installable on Android + iOS) | ✅ |

---

## Costs

| Item | Cost |
|------|------|
| Vercel hosting | Free |
| GitHub | Free |
| Anthropic API (AI refresh) | Free tier |
| YouTube Data API | Free tier |
| Domain (optional, later) | ~£20/year |
| Google Play developer fee (one-time) | £20 |
| **Total to launch** | **£20** |

---

*ClutchFeed — April 2026*
