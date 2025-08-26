// index.js (Corrected Version)

const express = require("express");
const fetch = require("node-fetch");
const cheerio = require("cheerio");
const cors = require("cors");

const app = express();
app.use(cors());

// --- Stremio Manifest ---
const manifest = {
  id: "org.parentsguide",
  version: "1.0.0",
  name: "Parents Guide (IMDb)",
  description: "Shows IMDb Parents Guide severities: Sex/Nudity, Violence, Profanity, Alcohol, Frightening Scenes.",
  types: ["movie", "series"],
  resources: ["meta"],
  catalogs: []
};

// --- Manifest route ---
app.get("/manifest.json", (req, res) => {
  res.json(manifest);
});

// --- Meta enricher route ---
app.get("/meta/:type/:id.json", async (req, res) => {
  const { type, id } = req.params;

  if (!id.startsWith("tt")) {
    return res.json({ meta: {} }); // Return empty meta for non-IMDb IDs
  }

  try {
    const url = `https://www.imdb.com/title/${id}/parentalguide`;
    const response = await fetch(url);
    const html = await response.text();
    console.log(html)
    const $ = cheerio.load(html);

    const sections = {};

    // NEW LOGIC STARTS HERE:
    // We are now looking for each list item with the 'rating-item' test ID.
    $("li[data-testid='rating-item']").each((_, el) => {

      // The label (e.g., "Sex & Nudity:") is in an <a> tag with a specific class.
      const label = $(el).find("a.ipc-metadata-list-item__label").text().trim().replace(":", "");

      // The severity (e.g., "Mild") is in a <div> with a specific class.
      const severity = $(el).find("div.ipc-html-content-inner-div").text().trim();

      if (label && severity) {
        sections[label] = severity;
      }
    });
    
    const description = Object.entries(sections)
      .map(([k, v]) => `${k}: ${v}`)
      .join("\n"); // Using newline for better formatting in Stremio

    res.json({
      meta: {
        id,
        type,
        // Let's add the guide to the movie description
        description: description
      }
    });
  } catch (err) {
    console.error(err);
    res.json({ meta: {} }); // Return empty meta on error
  }
});

// --- Render / Port ---
const PORT = process.env.PORT || 7000;
app.listen(PORT, () => {
  console.log("Parents Guide Add-on running on port " + PORT);
});
                                            
