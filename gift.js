const undici = require("undici").Client
const fs = require("fs")
const config = JSON.parse(fs.readFileSync("files/config.json"));
const regex_str = /(?:discord\.gift|(?:discord|discordapp)(?:\.com|\.gg)(?:\/gift|\/gifts|\/billing\/promotions\/xbox-game-pass\/redeem))\/([A-Za-z0-9]+)/g
const undici_client = new undici(`https://discordapp.com`)
const db = new (require("./database"))("files/db.json")

function sendSocket(path, method) {
    undici_client.request({
        host: "discord.com",
        path: path,
        method: method,
    })
}

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
    sendSocket("/api/", "GET");
    setInterval(()=>sendSocket("/api/", "GET"), 2000);
}

async function sendWebhook(webhook, body) {
    undici_client.request({
        path: webhook,
        method: "POST",
        headers: {
            host: "discord.com",
            "content-type": "application/json",
        },
        body: body
    })
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
    console.log(`| GIFT | '${code}'`)
    if (db.getValue("codes")[code] != undefined)
        return
    let timethen = Date.now();
    undici_client.request({
        path: `/api/v8/entitlements/gift-codes/${code}/redeem`,
        method: "POST",
        headers: {
            host: "discord.com",
            authorization: config.d_token,
            "content-type": "application/json",
        },
        body: "{\"channel_id\":null,\"payment_source_id\":null}"
    }, (err, data)=>{
        if (err != null) {
            console.log(`| REDEEM |`)
        }
        let body = ""
        data.body.setEncoding('utf8')
        data.body.on("end", ()=>reportGiftStatus(code, payload, body, Date.now()-timethen))
        data.body.on("data", (bdy)=>{
            console.log(`| ONDATA | ${bdy}`)
            body += bdy
        })
    })
}

async function checkForGift(packet) {
    for (const match of packet.d.content.matchAll(regex_str))
        handleGift(match[1], packet.d)
}

module.exports = {
    checkForGift: checkForGift,
    Init: Init
}