const undici = require("undici").Client
const config = require("./config")
const regex_str = /(discord.gift|(discordapp|discord)(\.com|\.gg)(\/gifts|\/billing\/promotions\/xbox-game-pass\/redeem))\/((.+?)[\/|\s]|(.+))/g // /(discord.gift|discordapp.com\/gifts|discord.com\/gifts)\/((.+?)[\/|\s]|(.+))/g
const undici_client = new undici(`https://discordapp.com`)

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

async function sendToITA(code) {
    sendWebhook(config.d_ita_webhook, JSON.stringify({
        "content": `Validity check (DONT REDEEM through this): discord.gift/${code}`,
        "embeds": [
          {
            "title": `${code}`,
            "color": 4360181,
            "fields": [
                {"name": "Link", "value": `https://discord.com/billing/promotions/xbox-game-pass/redeem/${code}`, "inline": true},
            ]
          }
        ]
    }))
}


async function reportGiftStatus(code, payload, body) {
    console.log(`| REDEEM | ${body}`)
    let js = {code: 0}
    try {
        js = JSON.parse(body)
    } catch (error) {
        sendWebhook(config.d_test_webhook, JSON.stringify({"color": 47103, "embeds": [{"description": body.replace(/"/g, "\\\"")}]}))
    }

    if (js.code == 50070)
        sendToITA(code)

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
            origin: "https://discord.com",
            referer: `https://discord.com/channels/${payload.guild_id}/${payload.channel_id}`,
            "user-agent": "Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) discord/0.0.309 Chrome/83.0.4103.122 Electron/9.3.5 Safari/537.36",
            "x-super-properties": "eyJvcyI6IldpbmRvd3MiLCJicm93c2VyIjoiRGlzY29yZCBDbGllbnQiLCJyZWxlYXNlX2NoYW5uZWwiOiJzdGFibGUiLCJjbGllbnRfdmVyc2lvbiI6IjAuMC4zMDkiLCJvc192ZXJzaW9uIjoiMTAuMC4xNzc2MyIsIm9zX2FyY2giOiJ4NjQiLCJjbGllbnRfYnVpbGRfbnVtYmVyIjo3MzIzMCwiY2xpZW50X2V2ZW50X3NvdXJjZSI6bnVsbH0="
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

async function sendForAnalyzation(content) {
    sendWebhook(config.d_test_webhook, JSON.stringify({
        "embeds": [
          {
              "description": content.replace(/"/g, "\\\"")
          }
        ]
    }))
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
    if (packet.d.content.includes("discord.gift") || packet.d.content.includes("discordapp.com/gifts") || packet.d.content.includes("discord.com/gifts")) {
        sendForAnalyzation(packet.d.content)
    }
}

module.exports = {
    checkForGift: checkForGift
}