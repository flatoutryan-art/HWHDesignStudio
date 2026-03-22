# HWH Design Studio

AI-powered kitchen design visualiser for HWH Designs. Built as a mobile-first PWA — customers choose a kitchen style, describe their space, and receive an AI-generated design concept with material recommendations and a before/after reveal.

---

## Project Structure

```
hwh-design-studio/
├── index.html        ← The entire app (single-file PWA)
├── vercel.json       ← Vercel deployment config
├── .gitignore        ← Git ignore rules
└── README.md         ← This file
```

---

## Deployment: GitHub + Vercel

### Step 1 — Create GitHub Repository

1. Go to [github.com](https://github.com) → **New repository**
2. Name it: `hwh-design-studio`
3. Set to **Public** (required for free Vercel deployment)
4. **Do not** initialise with README (you already have one)
5. Click **Create repository**

### Step 2 — Push files to GitHub

Open Terminal in the project folder and run:

```bash
git init
git add .
git commit -m "Initial deploy: HWH Design Studio"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/hwh-design-studio.git
git push -u origin main
```

Replace `YOUR_USERNAME` with your GitHub username.

### Step 3 — Deploy to Vercel

1. Go to [vercel.com](https://vercel.com) → **Add New Project**
2. Click **Import** next to `hwh-design-studio`
3. Framework Preset: **Other**
4. Root Directory: leave as `/`
5. Click **Deploy**

Vercel will give you a live URL like: `hwh-design-studio.vercel.app`

---

## Custom Subdomain (e.g. studio.hwhdesigns.co.za)

### In Vercel:
1. Go to your project → **Settings → Domains**
2. Add: `studio.hwhdesigns.co.za`
3. Vercel will show you a DNS record to add

### In Cloudflare (same flow as AI Readiness Scorecard):
1. Go to your domain DNS settings
2. Add a **CNAME** record:
   - **Name:** `studio`
   - **Target:** `cname.vercel-dns.com`
   - **Proxy:** Enabled (orange cloud)
3. Wait 2–5 minutes for propagation

---

## Customisation Checklist

Before going live, update these in `index.html`:

| Item | Where to find it | What to change |
|------|-----------------|----------------|
| WhatsApp number | `openWhatsApp()` function | Replace `27833000000` with Kim's number |
| Brand name | `HWH Studio` in header | Update if Kim wants a different name |
| Contact email | Lead form (optional) | Add EmailJS if email capture needed |
| Kitchen photos | `.style-card-bg` CSS classes | Add real photo URLs as `background-image` |

### To update WhatsApp number:
Find this line in `index.html`:
```js
window.open(`https://wa.me/27833000000?text=...`)
```
Replace `27833000000` with Kim's number in international format (no + or spaces), e.g. `27711234567`

---

## How the AI works

- Uses the Anthropic Claude API (`claude-sonnet-4-20250514`) directly from the browser
- Requires no backend — the API key is handled by the hosting environment
- In **Claude preview**: shows a styled fallback with a yellow "Preview mode" indicator
- On **live deployment**: calls the API and shows a green "AI-generated design" indicator
- If the API fails for any reason, the fallback content displays automatically — no broken states

---

## Tech Stack

- Vanilla HTML/CSS/JS — no build step, no dependencies
- Google Fonts: Cormorant Garamond + DM Sans
- Anthropic Claude API (browser-direct)
- PWA-ready (mobile-first, viewport locked)

---

## Support

Built by REV Your Business — revyourbusiness.co.za  
Contact: flatout.ryan@gmail.com | +27 71 685 8624
