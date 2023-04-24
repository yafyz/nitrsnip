const http = require("http");

module.exports = {
    startWebServer: function (port) {
        http.createServer((_req, res) => {
            res.writeHead(200);
            res.end("bruh");
        }).listen(port, "0.0.0.0", () => {
            console.log(`Web server running on ${port}`);
        });
    }
}