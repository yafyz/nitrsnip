const undici = require("undici").Client
const fs = require("fs")
const config = JSON.parse(fs.readFileSync("files/config.json"));
const regex_str = /(discord.gift|(discordapp|discord)(\.com|\.gg)(\/gifts|\/billing\/promotions\/xbox-game-pass\/redeem))\/((.+?)[\/|\s]|(.+))/g
const undici_client = new undici(`https://discordapp.com`)

function sendSocket(path, method) {
    undici_client.request({
        host: "discord.com",
        path: path,
        method: method,
    })
}

function keepAlive() {
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

async function reportGiftStatus(code, payload, body) {
    console.log(`| REDEEM | ${body}`)
    let js = {code: 0}
    try {
        js = JSON.parse(body)
    } catch (error) {
        sendWebhook(config.d_test_webhook, JSON.stringify({"color": 47103, "embeds": [{"description": body.replace(/"/g, "\\\"")}]}))
    }

    sendWebhook(config.d_webhook, JSON.stringify({
        "embeds": [
          {
            "title": `${code}`,
            "color": js.code == 10038 ? 15417396 :
                     js.code == 50050 ? 15258703 :
                     js.code == 50070 ? 4360181 : 1237834,
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
    console.log(`| GIFT | '${code}'`)
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
        data.body.on("end", ()=>reportGiftStatus(code, payload, body))
        data.body.on("data", (bdy)=>{
            console.log(`| ONDATA | ${bdy}`)
            body += bdy
        })
    })
}

async function checkForGift(packet) {
    if (packet.d.webhook_id != undefined && packet.d.webhook_id.toString() == config.d_ita_id)
        return
    const matches = packet.d.content.matchAll(regex_str)
    for (const match of matches) {
        let s
        match.forEach((e)=> {if (e!=undefined) s = e})
        handleGift(s, packet.d)
    }
}

module.exports = {
    checkForGift: checkForGift,
    keepSocketAlive: keepAlive
}