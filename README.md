#UDTA TEER
# Parents Guide (IMDb) — Stremio Add-on

This Stremio add-on shows IMDb Parents Guide severities:
- Sex & Nudity
- Violence & Gore
- Profanity
- Alcohol, Drugs & Smoking
- Frightening & Intense Scenes

The data is scraped from IMDb's parental guide for each movie/series (IMDb ID needed).

---

## Install in Stremio
1. Copy your deployed manifest link:https://YOURAPP.onrender.com/manifest.json
2. In Stremio → Add-ons → My Add-ons → **Install via link**.
3. Paste the link and install.

---

## Deploy to Render
1. Push this repo to GitHub.
2. Go to [Render](https://render.com) → **New Web Service**.
3. Connect your GitHub repo.
4. Set options:
- **Environment**: Node
- **Build Command**: `npm install`
- **Start Command**: `npm start`
5. Click **Deploy**.
6. When live, your manifest will be at:https://YOURAPP.onrender.com/manifest.json
---

## Run Locally
```bash
npm install
npm start
visit
http://localhost:7000/manifest.json
