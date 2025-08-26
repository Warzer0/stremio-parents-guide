// --- Meta enricher route ---
app.get("/meta/:type/:id.json", async (req, res) => {
  const { type, id } = req.params;

  if (!id.startsWith("tt")) {
    return res.json({ meta: {} });
  }

  try {
    const url = `https://www.imdb.com/title/${id}/parentalguide`;

    // ADD THIS HEADERS OBJECT TO DISGUISE OUR REQUEST
    const headers = {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36"
    };

    // PASS THE HEADERS TO THE FETCH REQUEST
    const response = await fetch(url, { headers: headers });
    const html = await response.text();
    const $ = cheerio.load(html);

    const sections = {};
    $("li[data-testid='rating-item']").each((_, el) => {
      const label = $(el).find("a.ipc-metadata-list-item__label").text().trim().replace(":", "");
      const severity = $(el).find("div.ipc-html-content-inner-div").text().trim();
      if (label && severity) {
        sections[label] = severity;
      }
    });
    
    const description = Object.entries(sections)
      .map(([k, v]) => `${k}: ${v}`)
      .join("\n");

    res.json({
      meta: {
        id,
        type,
        description: description
      }
    });
  } catch (err) {
    console.error(err);
    res.json({ meta: {} });
  }
});
