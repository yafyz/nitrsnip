const regex_str = /(?:discord\.gift|(?:discord|discordapp)\.com\/gifts)\/([A-Za-z0-9]+)/g
const config = require("./config");
const http_client = new (require("./http"))("discord.com");
let db;
if (!config["cache_codes"])
    db = new (require("./database"))("files/db.json")

const rawph1 = "POST /api/v9/entitlements/gift-codes/";
const rawph2 = `/redeem HTTP/1.1
host: discord.com
content-length: 0
authorization: ${config.d_token}\r\n\r\n`;

const chars = Buffer.from("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789");
const charslen = chars.length;

function reportErr(e) {
    console.log(e);
    if (config.d_err_webhook == "" || typeof config.d_err_webhook != "string") {
        console.log("Invalid error report webhook");
        return;
    }
    if (e.stack != null && e.stack != undefined)
        sendWebhook(config.d_err_webhook, JSON.stringify({"embeds": [{"color": 3092790,"description": e.stack.replace("\\", "\\\\").replace("\n", "\\n")}]}));
    else
        sendWebhook(config.d_err_webhook, JSON.stringify({"embeds": [{"color": 3092790,"description": "Stack was null"}]}));
}
let code_queue = []
let get_code_status;
let set_code_status;


function randomString(len) {
    let buf = Buffer.allocUnsafe(len);
    for (let i = 0; i < len; i++)
        buf[i] = chars[~~(Math.random()*charslen)];
    return buf.toString("ascii");
}

function Init() {
    process.on('uncaughtException', reportErr);
    if (config["cache_codes"]) {
        let cache = [];
        get_code_status = (code) => cache[code];
        set_code_status = (code, status) => cache[code] = status;
    } else {
        db.assureValueExists("codes", {});
        get_code_status = (code) => db.getValue("codes")[code];
        set_code_status = (code, status) => db.getValue("codes")[code] = status;
    }
    http_client.connect(true, () => {
        if (code_queue.length > 0) {
            for (const v of code)
                handleGift(v[0], v[1])
        } else {
            if (config.improve_latency)
                http_client.request_raw(rawph1+randomString(16)+rawph2);
            else
                http_client.request("POST", "/api/v9/entitlements/gift-codes/"+Math.random())
        }
    });
}

async function sendWebhook(webhook, body) {
    await http_client.request("POST", webhook, {"content-type": "application/json"}, body);
}

async function reportGiftStatus(code, payload, res, latency, timethen) {
    let body = res.Body.toString()
    console.log(`| REDEEM | ${body}`);
    let js = {};
    try {
        js = JSON.parse(body);
    } catch (error) {
        reportErr(error);
        return;
    }

    if (js.code == 10038) // Code invalid
        set_code_status(code, 0);
    else if (js.code == 50050) // Code claimed
        set_code_status(code, 1);
    else if (js.code == 50070) // Gamepass code
        set_code_status(code, 2);
    else if (js.consumed == true) // Code valid
        set_code_status(code, 3);

    sendWebhook(config.d_webhook, JSON.stringify({
        "embeds": [{
            "title": `${code}`,
            "color": js.code     == 10038 ? 15417396 :
                     js.code     == 50050 ? 15258703 :
                     js.code     == 50070 ? 4360181  :
                     js.consumed == true  ? 1237834  : 0,
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
    }));

    if (config.debug_webhook) {
        let tstr = "";
        for (let t of res.pt) 
            tstr += (t-timethen)+"/";
        tstr = tstr.substr(0, tstr.length-1); // remove extra "/"

        sendWebhook(config.debug_webhook, JSON.stringify({
            "embeds": [{
                "color": 16515934,
                "title": code,
                "footer": {"text": `t: ${tstr}ms`},
                "description": res.Raw
                }
            ]
        }));
    }
}

function handleGift(code, payload) {
    if (get_code_status(code) != undefined)
        return;
    if (!http_client.is_connected) {
        code_queue.push([code, payload])
        return
    }
    // synchronously send the request/imediately
    let res = http_client.request_raw(rawph1+code+rawph2);
    let timethen = Date.now(); // get time after sending for minimal latency instead of before
    console.log(`| GIFT | '${code}'`);
    (async ()=>{ // wait for it asynchronously
        res = await res;
        if (res.Error != null)
            reportErr(err);
        reportGiftStatus(code, payload, res, Date.now()-timethen, timethen);
    })();
}

function checkForGift(packet) {
    for (const match of packet.d.content.matchAll(regex_str)) {
        let mlen = match[1].length;
        if (mlen === 16 /* normal code length */ /* || mlen === 24 gamepass/game code length - gamepass codes suck */)
            handleGift(match[1], packet.d);
    }
}

module.exports = {
    checkForGift: checkForGift,
    Init: Init
}