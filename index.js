const express = require("express");
const fetch = require("node-fetch");
const cheerio = require("cheerio");
const cors = require("cors");

const app = express();
app.use(cors());

// --- Stremio Manifest ---
// We are switching back to a "stream" provider.
const manifest = {
  id: "org.parentsguide.stream",
  version: "4.0.0", // Final stream version
  name: "IMDb Parents Guide [Stream]",
  description: "Adds a Parents Guide summary to the stream list.",
  types: ["movie", "series"],
  resources: ["stream"],
  idPrefixes: ["tt"]
};

// --- Manifest route ---
app.get("/manifest.json", (req, res) => {
  res.json(manifest);
});

// --- Stream provider route ---
app.get("/stream/:type/:id.json", async (req, res) => {
  const { type, id } = req.params;
  let guideText = "udta-teer"; // Default fallback text

  try {
    const url = `https://www.imdb.com/title/${id}/parentalguide`;
    
    const headers = {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36"
    };

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
    
    const realGuideText = Object.entries(sections)
      .map(([k, v]) => `${k}: ${v}`)
      .join(" | ");

    // If the scraper found real data, use it. Otherwise, we'll use the fallback.
    if (realGuideText) {
      guideText = realGuideText;
    }

  } catch (err) {
    console.error("Scraping failed, will serve fallback text. Error:", err.message);
    // If an error occurs, guideText is already set to "udta-teer"
  }

  // This is the "dummy" stream that will always be created.
  const stream = {
    title: "ℹ️ Parents Guide", // Main title in the list
    description: guideText // The subtitle with the details or "udta-teer"
  };

  return res.json({ streams: [stream] });
});

const PORT = process.env.PORT || 7000;
app.listen(PORT, () => {
  console.log("Parents Guide Add-on running on port " + PORT);
});
                                                                                        
