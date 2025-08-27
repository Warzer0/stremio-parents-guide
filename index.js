const express = require("express");
const fetch = require("node-fetch");
const cheerio = require("cheerio");
const cors = require("cors");

const app = express();
app.use(cors());

// --- Stremio Manifest ---
const manifest = {
  id: "org.parentsguide.final",
  version: "3.0.1", // New version with your fallback logic
  name: "IMDb Parents Guide",
  description: "Adds a Parents Guide summary to the top of the movie/series description.",
  types: ["movie", "series"],
  resources: ["meta"],
  idPrefixes: ["tt"]
};

// --- Manifest route ---
app.get("/manifest.json", (req, res) => {
  res.json(manifest);
});

// --- Meta enricher route ---
app.get("/meta/:type/:id.json", async (req, res) => {
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
        const shortLabel = label.replace(" & Gore", "").replace(" & Nudity", "").replace(", Drugs & Smoking", "");
        sections[shortLabel] = severity;
      }
    });
    
    const guideText = Object.entries(sections)
      .map(([k, v]) => `${k}: ${v}`)
      .join(" | ");

    // If the scraper finds nothing, we will also use the fallback text.
    if (!guideText) {
      throw new Error("Scraper found no data.");
    }

    const newDescription = `[PARENTS GUIDE: ${guideText}]\n\n---\n\n`;

    const meta = {
        id: id,
        type: type,
        description: newDescription
    };

    return res.json({ meta: meta });

  } catch (err) {
    // THIS IS THE NEW PART BASED ON YOUR IDEA
    // If anything in the "try" block fails, we run this code.
    console.error("Scraping failed, serving fallback text. Error:", err.message);
    
    // We create the description using your fallback text.
    const fallbackDescription = `[PARENTS GUIDE: udta-teer]\n\n---\n\n`;
    
    const meta = {
        id: id,
        type: type,
        description: fallbackDescription
    };

    return res.json({ meta: meta });
  }
});

const PORT = process.env.PORT || 7000;
app.listen(PORT, () => {
  console.log("Parents Guide Add-on running on port " + PORT);
});
  
