const addonInterface = require('./addon');
const { serveHTTP } = require('stremio-addon-sdk');

serveHTTP(addonInterface, { port: process.env.PORT || 7000 });
