const regex_str = /(?:discord\.gift|(?:discord|discordapp)\.com\/gifts)\/([A-Za-z0-9]+)/g
const config = require("./config");
const https_client = new (require("./http"))("discord.com");
const db = new (require("./database"))("files/db.json");

function reportErr(e) {
    console.log(e)
    if (config.d_err_webhook == "" || typeof config.d_err_webhook != "string") {
        console.log("Invalid error report webhook")
        return
    }
    if (e.stack != null && e.stack != undefined)
        sendWebhook(config.d_err_webhook, JSON.stringify({"embeds": [{"color": 3092790,"description": e.stack.replace("\\", "\\\\").replace("\n", "\\n")}]}))
    else
        sendWebhook(config.d_err_webhook, JSON.stringify({"embeds": [{"color": 3092790,"description": "Stack was null"}]}))
}

function Init() {
    process.on('uncaughtException', reportErr);
    db.assureValueExists("codes", {});
    https_client.connect(true, () => https_client.request("POST", `/api/`));
}

async function sendWebhook(webhook, body) {
    await https_client.request("POST", webhook, {"content-type": "application/json"}, body);
}

async function reportGiftStatus(code, payload, body, latency) {
    console.log(`| REDEEM | ${body}`)
    let js = {code: 0}
    try {
        js = JSON.parse(body)
    } catch (error) {
        reportErr(error)
        return
    }
    
    if (js.code == 10038) // Code invalid
        db.getValue("codes")[code] = 0;
    else if (js.code == 50050) // Code claimed
        db.getValue("codes")[code] = 1;
    else if (js.code == 50070) // Gamepass code
        db.getValue("codes")[code] = 2;
    else if (js.consumed == true) // Code valid
        db.getValue("codes")[code] = 3;
    
    sendWebhook(config.d_webhook, JSON.stringify({
        "embeds": [
          {
            "title": `${code}`,
            "color": js.code == 10038 ? 15417396 :
                     js.code == 50050 ? 15258703 :
                     js.code == 50070 ? 4360181 :
                     js.code == 0 ? 0 : 1237834,
            "footer": {
                "text": `Latency: ${latency}ms`
            },
            "fields": [
                {"name": "Message", "value": payload.content, "inline": true},
                {"name": "Message link", "value": `https://discord.com/channels/${payload.guild_id}/${payload.channel_id}/${payload.id}`, "inline": true},
                {"name": "Response", "value": body.replace(/"/g, "\\\""), "inline": true}
            ]
          }
        ]
    }))
}

async function handleGift(code, payload) {
    code = code.trim();
    console.log(`| GIFT | '${code}'`);
    if (db.getValue("codes")[code] != undefined)
        return;
    let timethen = Date.now();
    let res = await https_client.request("POST", `/api/v8/entitlements/gift-codes/${code}/redeem`, {authorization: config.d_token, "content-type": "application/json"}, "{\"channel_id\":null,\"payment_source_id\":null}");
    if (res.Error != null)
        reportErr(err);
    reportGiftStatus(code, payload, res.Body.toString(), Date.now()-timethen);
}

async function checkForGift(packet) {
    for (const match of packet.d.content.matchAll(regex_str))
        handleGift(match[1], packet.d)
}

module.exports = {
    checkForGift: checkForGift,
    Init: Init
}