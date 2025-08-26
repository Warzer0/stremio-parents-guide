const express = require("express");
const fetch = require("node-fetch");
const cheerio = require("cheerio");
const cors = require("cors");

const app = express();
app.use(cors());

// --- Stremio Manifest ---
// We've changed "resources" from ["meta"] to ["stream"]
// and added an "idPrefixes" to only activate for IMDb items.
const manifest = {
  id: "org.parentsguide",
  version: "1.0.1", // I've updated the version number
  name: "Parents Guide (IMDb)",
  description: "Adds a Parents Guide summary to the stream list.",
  types: ["movie", "series"],
  resources: ["stream"], // This is the key change
  idPrefixes: ["tt"]
};

// --- Manifest route ---
app.get("/manifest.json", (req, res) => {
  res.json(manifest);
});

// --- Stream provider route ---
// This route now responds to /stream/movie/tt... requests
app.get("/stream/:type/:id.json", async (req, res) => {
  const { type, id } = req.params;

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
        // We can shorten the labels to save space
        const shortLabel = label.replace(" & Gore", "").replace(" & Nudity", "").replace(", Drugs & Smoking", "");
        sections[shortLabel] = severity;
      }
    });
    
    // Format the guide into a single line for the stream title
    const guideText = Object.entries(sections)
      .map(([k, v]) => `${k}: ${v}`)
      .join(" | ");

    if (!guideText) {
      return res.json({ streams: [] });
    }

    // This is the "dummy" stream. It's not playable.
    // Its title contains all the information.
    const stream = {
      title: "ℹ️ Parents Guide", // Main title
      description: guideText // Subtitle with the details
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
          
