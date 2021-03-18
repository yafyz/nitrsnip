const fs = require("fs");
if (fs.existsSync("files")) {
    module.exports = JSON.parse(fs.readFileSync("files/config.json"));
} else {
    module.exports = {
        "d_token": process.env.d_token,
        "d_gateway": "wss://gateway.discord.gg/?encoding=etf&v=8&compress=zlib-stream",
        "d_webhook": process.env.d_webhook,
        "d_err_webhook": process.env.d_webhook,
        "read_messages_on_redeem_account": process.env.read_messages_on_redeem_account.toLowerCase() == "true",
        "use_multiple_tokens": process.env.use_multiple_tokens.toLowerCase() == "true",
        "tokens": process.env.tokens,
        "show_messages": process.env.show_messages,
        "cache_codes": true,
    }
}