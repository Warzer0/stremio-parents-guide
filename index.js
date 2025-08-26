const express = require("express");
const fetch = require("node-fetch");
const cheerio = require("cheerio");
const cors = require("cors");  // <-- add this line

const app = express();
app.use(cors());  // <-- add this line

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
    return res.json({ meta: { id, type, name: "Parents Guide", description: "IMDb ID required" } });
  }

  try {
    const url = `https://www.imdb.com/title/${id}/parentalguide`;
    const response = await fetch(url);
    const html = await response.text();
    const $ = cheerio.load(html);

    const sections = {};
    $("section[data-testid='sub-section']").each((_, el) => {
      const label = $(el).find("h4").text().trim();
      const severity = $(el).find("span").first().text().trim();
      if (label) sections[label] = severity || "Not rated";
    });

    res.json({
      meta: {
        id,
        type,
        name: "IMDb Parents Guide",
        description: Object.entries(sections)
          .map(([k, v]) => `${k}: ${v}`)
          .join(" | ")
      }
    });
  } catch (err) {
    console.error(err);
    res.json({ meta: { id, type, name: "Parents Guide", description: "Not available" } });
  }
});

// --- Render / Port ---
const PORT = process.env.PORT || 7000;
app.listen(PORT, () => {
  console.log("Parents Guide Add-on running on port " + PORT);
});
