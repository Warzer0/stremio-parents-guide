const { addonBuilder } = require("stremio-addon-sdk");
const fetch = require("node-fetch");
const cheerio = require("cheerio");

const manifest = {
  id: "org.parentsguide.sdk",
  version: "4.1.1",
  name: "IMDb Parents Guide [SDK]",
  description: "Adds a Parents Guide summary to the stream list.",
  resources: ["stream"],
  types: ["movie", "series"],
  catalogs: [], // This empty list is required
  idPrefixes: ["tt"]
};

const builder = new addonBuilder(manifest);

builder.defineStreamHandler(async function(args) {
  let guideText = "udta-teer";

  try {
    const url = `https://www.imdb.com/title/${args.id}/parentalguide`;
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
    const realGuideText = Object.entries(sections).map(([k, v]) => `${k}: ${v}`).join(" | ");
    if (realGuideText) {
      guideText = realGuideText;
    }
  } catch (err) {
    console.error("Scraping failed, using fallback. Error:", err.message);
  }

  const stream = {
    title: "ℹ️ Parents Guide",
    description: guideText
  };
  return Promise.resolve({ streams: [stream] });
});

module.exports = builder.getInterface();
  
