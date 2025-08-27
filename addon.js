const { addonBuilder } = require("stremio-addon-sdk");

// This is the simplest possible manifest.
const manifest = {
  id: "org.udtateer.test",
  version: "5.0.0",
  name: "Udta-Teer Test Addon",
  description: "A simple addon to test if the server is responding.",
  types: ["movie", "series"],
  resources: ["stream"],
  catalogs: [], // We need this empty list
  idPrefixes: ["tt"]
};

const builder = new addonBuilder(manifest);

// This handler does NOT fetch any data.
// It instantly returns the same static stream every time.
builder.defineStreamHandler(async function(args) {
  
  const stream = {
    title: "UDTA-TEER",
    description: "If you can see this, the server is working!"
  };

  // It will always resolve with this one stream.
  return Promise.resolve({ streams: [stream] });
});

module.exports = builder.getInterface();
