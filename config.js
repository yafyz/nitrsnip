
const mainToken = process.env['mainToken']
const AltToken = process.env['AltToken']

const d_webhook = process.env['d_webhook']
const d_err_webhook = process.env['d_err_webhook']


    module.exports = {
        "d_token": process.env.mainToken,
        "d_gateway": "wss://gateway.discord.gg/?encoding=etf&v=9&compress=zlib-stream",
        "d_webhook": process.env.d_webhook,
        "d_err_webhook": process.env.d_err_webhook || process.env.d_webhook,
   "read_messages_on_redeem_account": true,
        "debug_webhook": process.env.debug_webhook,
    "use_multiple_tokens": true,
        "tokens": process.env.AltToken,
        "show_messages": false,
        "cache_codes": true,
        "improve_latency": true
    }
