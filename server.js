const { addonBuilder, serveHTTP } = require("stremio-addon-sdk");
const express = require("express");
const fetch = require("node-fetch");
const cheerio = require("cheerio");

// --- Addon Manifest & Logic ---
const manifest = {
  id: "org.parentsguide.final",
  version: "8.0.0",
  name: "IMDb Parents Guide",
  description: "Adds a Parents Guide summary to the stream list.",
  resources: ["stream"],
  types: ["movie", "series"],
  catalogs: [],
  idPrefixes: ["tt"]
};

const builder = new addonBuilder(manifest);

builder.defineStreamHandler(async function(args) {
  let guideText = "Could not load guide.";
  try {
    const url = `https://www.imdb.com/title/${args.id}/parentalguide`;
    const headers = { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36" };
    const response = await fetch(url, { headers: headers });
    const html = await response.text();
    const $ = cheerio.load(html);
    const sections = {};
    $("li[data-testid='rating-item']").each((_, el) => {
      const label = $(el).find("a.ipc-metadata-list-item__label").text().trim().replace(":", "");
      const severity = $(el).find("div.ipc-html-content-inner-div").text().trim();
      if (label && severity && severity !== "None") {
        const shortLabel = label.replace(" & Gore", "").replace(" & Nudity", "").replace(", Drugs & Smoking", "");
        sections[shortLabel] = severity;
      }
    });
    const realGuideText = Object.entries(sections).map(([k, v]) => `${k}: ${v}`).join(" | ");
    if (realGuideText) { guideText = realGuideText; }
  } catch (err) {
    console.error("Scraping failed, using fallback. Error:", err.message);
  }
  const stream = { title: "ℹ️ Parents Guide", description: guideText };
  return Promise.resolve({ streams: [stream] });
});

const addonInterface = builder.getInterface();
const app = express();
const router = express.Router();

// This creates your landing page
router.get("/", (req, res) => {
    const manifestUrl = `${req.protocol}://${req.get("host")}/manifest.json`;
    const landingPageHTML = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Parents Guide Add-on</title>
            <style> body { font-family: sans-serif; background: #1a1a1a; color: white; text-align: center; padding: 50px; } a { color: #ffdd57; border: 2px solid #ffdd57; padding: 10px 20px; border-radius: 5px; } </style>
        </head>
        <body>
            <h1>IMDb Parents Guide Add-on</h1>
            <a href="stremio://install-addon/${encodeURIComponent(manifestUrl)}">Click Here to Install</a>
        </body>
        </html>
    `;
    res.send(landingPageHTML);
});

// This serves the add-on data
router.use((req, res, next) => {
    serveHTTP(addonInterface, { req, res, next });
});

app.use('/', router);

module.exports = app;
    
