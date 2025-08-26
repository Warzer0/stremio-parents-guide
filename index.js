// Stremio Parents Guide add-on (IMDb)
// Shows only the five Parents Guide severities.
// Optional: if OMDB_API_KEY is set, we fetch title/poster/plot to make the card prettier.

const express = require("express");
const { addonBuilder } = require("stremio-addon-sdk");
const fetch = require("node-fetch");
const cheerio = require("cheerio");

// --- ENV ---
const PORT = process.env.PORT || 7000;
const OMDB_API_KEY = process.env.OMDB_API_KEY || ""; // optional

// --- helpers ---
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123 Safari/537.36";

// Extract first "tt1234567" found
function extractImdbId(id) {
  const m = String(id).match(/tt\d{6,9}/);
  return m ? m[0] : null;
}

// Map label aliases to a stable key
const LABELS = [
  { key: "sexNudity",     aliases: ["Sex & Nudity", "Sex/Nudity", "Sex and Nudity"] },
  { key: "violenceGore",  aliases: ["Violence & Gore", "Violence/Gore", "Violence and Gore"] },
  { key: "profanity",     aliases: ["Profanity"] },
  { key: "alcoholDrugs",  aliases: ["Alcohol, Drugs & Smoking", "Alcohol / Drugs / Smoking", "Alcohol/Drugs/Smoking"] },
  { key: "frightening",   aliases: ["Frightening & Intense Scenes", "Frightening/Intense Scenes", "Frightening and Intense Scenes"] },
];

const ORDER = ["sexNudity", "violenceGore", "profanity", "alcoholDrugs", "frightening"];

// Fuzzy severity detection
function findSeverity(html) {
  const text = html.replace(/\s+/g, " ").toLowerCase();
  if (text.includes("severe")) return "Severe";
  if (text.includes("moderate")) return "Moderate";
  if (text.includes("mild")) return "Mild";
  if (text.includes("none")) return "None";
  return "Unknown";
}

function extractSectionSeverity($, aliasList) {
  const headings = $("h2, h3, h4, section, div");
  for (const el of headings.toArray()) {
    const $el = $(el);
    const txt = $el.text().trim();
    if (!txt) continue;
    for (const alias of aliasList) {
      if (txt.toLowerCase().includes(alias.toLowerCase())) {
        const blockHtml = $el.closest("section").html() || $el.parent().html() || $el.html();
        if (blockHtml) return findSeverity(blockHtml);
      }
    }
  }
  const body = $.root().text();
  for (const alias of aliasList) {
    const i = body.toLowerCase().indexOf(alias.toLowerCase());
    if (i !== -1) {
      const slice = body.slice(Math.max(0, i - 200), i + 400);
      return findSeverity(slice);
    }
  }
  return "Unknown";
}

async function fetchParentsGuide(imdbId) {
  const url = `https://www.imdb.com/title/${imdbId}/parentalguide/`;
  const res = await fetch(url, { headers: { "User-Agent": UA, "Accept-Language": "en-US,en;q=0.9" }});
  if (!res.ok) throw new Error(`IMDb fetch failed: ${res.status}`);
  const html = await res.text();
  const $ = cheerio.load(html);

  const result = {};
  for (const { key, aliases } of LABELS) {
    result[key] = extractSectionSeverity($, aliases);
  }
  return result;
}

async function fetchBasicMetaViaOMDb(imdbId) {
  if (!OMDB_API_KEY) return {};
  try {
    const u = `http://www.omdbapi.com/?apikey=${OMDB_API_KEY}&i=${encodeURIComponent(imdbId)}`;
    const r = await fetch(u);
    const d = await r.json();
    if (d && d.Response === "True") {
      return {
        name: d.Title || "",
        year: d.Year || "",
        poster: d.Poster && d.Poster !== "N/A" ? d.Poster : undefined,
        description: d.Plot && d.Plot !== "N/A" ? d.Plot : undefined
      };
    }
  } catch (_) {}
  return {};
}

function formatDescription(sev) {
  const map = {
    sexNudity: "Sex & Nudity",
    violenceGore: "Violence & Gore",
    profanity: "Profanity",
    alcoholDrugs: "Alcohol/Drugs/Smoking",
    frightening: "Frightening/Intense Scenes",
  };
  return [
    "Parents Guide:",
    `${map.sexNudity}: ${sev.sexNudity}`,
    `${map.violenceGore}: ${sev.violenceGore}`,
    `${map.profanity}: ${sev.profanity}`,
    `${map.alcoholDrugs}: ${sev.alcoholDrugs}`,
    `${map.frightening}: ${sev.frightening}`
  ].join("\n");
}

// --- Stremio Add-on ---
const builder = new addonBuilder({
  id: "org.parentsguide.imdb",
  version: "1.0.0",
  name: "Parents Guide (IMDb)",
  description: "Shows IMDb Parents Guide severities (Sex/Nudity, Violence/Gore, Profanity, Alcohol/Drugs/Smoking, Frightening/Intense Scenes).",
  catalogs: [],
  resources: ["meta"],
  types: ["movie", "series"]
});

builder.defineMetaHandler(async ({ type, id }) => {
  try {
    const imdbId = extractImdbId(id);
    if (!imdbId) {
      return { meta: { id, type, name: "Parents Guide", description: "No IMDb ID found for this item." } };
    }

    const [sev, basic] = await Promise.all([
      fetchParentsGuide(imdbId),
      fetchBasicMetaViaOMDb(imdbId)
    ]);

    const descBlock = formatDescription(sev);

    const meta = {
      id,
      type,
      name: basic.name || `Parents Guide (${imdbId})`,
      year: basic.year,
      poster: basic.poster,
      description: basic.description ? (basic.description + "\n\n" + descBlock) : descBlock,
      parentsGuide: { order: ORDER, ...sev },
      background: basic.poster
    };

    return { meta };
  } catch (err) {
    console.error("Meta error:", err.message);
    return { meta: { id, type, name: "Parents Guide", description: "Failed to fetch Parents Guide." } };
  }
});

// --- Express wrapper for hosting ---
const app = express();
app.use("/", builder.getInterface());
app.get("/health", (req, res) => res.send("ok"));

app.listen(PORT, () => {
  console.log("Addon running on port " + PORT);
});
