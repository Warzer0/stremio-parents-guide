const express = require("express");
const fetch = require("node-fetch");
const cheerio = require("cheerio");
const cors = require("cors");

const app = express();
app.use(cors());

// --- Stremio Manifest ---
// We are changing the add-on to be a "meta" provider
// that will add a video to the details page.
const manifest = {
  id: "org.parentsguide.infobox",
  version: "2.0.0", // Major version update
  name: "IMDb Parents Guide Box",
  description: "Creates a separate box with Parents Guide info on the details page.",
  types: ["movie", "series"],
  resources: ["meta"],
  idPrefixes: ["tt"]
};

// --- Manifest route ---
app.get("/manifest.json", (req, res) => {
  res.json(manifest);
});

// --- Meta enricher route ---
// This now provides a "videos" array to create the box
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

    if (!guideText) {
      return res.json({ meta: {} });
    }

    // This is the "dummy" video object.
    // We use its properties to display our info.
    const dummyVideo = {
        id: id + ":pguide", // Unique ID for our video
        title: "IMDb Parents Guide", // The title of the box
        released: guideText // We use the "released" field to show the guide text
    };

    // We return this inside a "videos" array in the meta object.
    const meta = {
        id: id,
        type: type,
        videos: [dummyVideo]
    };

    return res.json({ meta: meta });

  } catch (err) {
    console.error(err);
    return res.json({ meta: {} });
  }
});

const PORT = process.env.PORT || 7000;
app.listen(PORT, () => {
  console.log("Parents Guide Add-on running on port " + PORT);
});
  
