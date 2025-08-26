const express = require("express");
const fetch = require("node-fetch");
const cheerio = require("cheerio");
const cors = require("cors");

const app = express();
app.use(cors());

// --- Stremio Manifest ---
// I've removed the "idPrefixes" line to make the add-on more compatible.
const manifest = {
  id: "org.parentsguide",
  version: "1.0.2", // Updated version again
  name: "IMDb Parents Guide", // Simplified the name slightly
  description: "Adds a Parents Guide summary to the stream list.",
  types: ["movie", "series"],
  resources: ["stream"]
  // "idPrefixes" has been removed from here.
};

// --- Manifest route ---
app.get("/manifest.json", (req, res) => {
  res.json(manifest);
});

// The rest of your code remains exactly the same...
// --- Stream provider route ---
app.get("/stream/:type/:id.json", async (req, res) => {
  const { type, id } = req.params;

  // Added this check back in to be safe
  if (!id.startsWith("tt")) {
    return res.json({ streams: [] });
  }

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
    
    const guideText = Object.entries(sections)
      .map(([k, v]) => `${k}: ${v}`)
      .join(" | ");

    if (!guideText) {
      return res.json({ streams: [] });
    }

    const stream = {
      title: "ℹ️ Parents Guide",
      description: guideText
    };

    return res.json({ streams: [stream] });

  } catch (err) {
    console.error(err);
    return res.json({ streams: [] });
  }
});

const PORT = process.env.PORT || 7000;
app.listen(PORT, () => {
  console.log("Parents Guide Add-on running on port " + PORT);
});
      
