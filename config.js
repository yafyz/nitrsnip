const fs = require("fs");
module.exports = JSON.parse(fs.readFileSync("files/config.json"));