const fs = require("fs");
module.exports = JSON.parse(fs.readFileSync("files/config.json"));
/*if (!process.env.d_token)
    module.exports = JSON.parse(fs.readFileSync("files/config.json"));
else {
    let tokens = process.env.tokens;
    return {
        "d_token": process.env.d_token,
        "d_gateway": process.env.d_gateway,//"wss://gateway.discord.gg/?encoding=etf&v=8&compress=zlib-stream",
        "d_webhook": process.env.d_webhook,
        "d_err_webhook": process.env.d_webhook,
        "read_messages_on_redeem_account": process.env.read_messages_on_redeem_account,
        "use_multiple_tokens": process.env.use_multiple_tokens,
        "tokens_file": "files/tokens.txt",
        "show_messages": process.env.show_messages
    }
}*/