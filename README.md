# Parents Guide (IMDb) — Stremio Add-on

Shows IMDb Parents Guide severities:
- Sex & Nudity
- Violence & Gore
- Profanity
- Alcohol, Drugs & Smoking
- Frightening & Intense Scenes

## Deploy (Render)
1) Create a Render Web Service from this repo.
   - Environment: Node
   - Build Command: `npm install`
   - Start Command: `npm start`
2) (Optional) Add env var `OMDB_API_KEY` to fetch title/poster/plot for nicer cards.
3) Deploy. Your manifest will be at:
   `https://YOUR-APP.onrender.com/manifest.json`

## Install in Stremio
Stremio → Add-ons → My Add-ons → **Install via link** → paste your manifest URL.