const fs = require("fs");
const gifts = require("./gift");
const dclient = require("./client.js");
const config = require("./config");
const webserver = require("./webserver");

function handleEvent(packet) {
    if (packet.t == "MESSAGE_CREATE") {
        if (config["show_messages"])
            console.log(`${packet.d.author.username} > ${packet.d.content}`);
        gifts.checkForGift(packet);
    }
}

let tokens = [];
let clients = [];

if (config["read_messages_on_redeem_account"])
    tokens.push(config["d_token"]);

if (config["use_multiple_tokens"]) {
    if (config["tokens_file"] != undefined) {
        let t = fs.readFileSync(config["tokens_file"]).toString();
        t.split("\n").forEach(v=>{
            v = v.split(";")[0].trim();
            if (v != "")
                tokens.push(v);
        })
    } else {
        config["tokens"].split(";").forEach(v=>{
            v = v.trim();
            if (v != "")
                tokens.push(v);
        })
    }
}

if (process.env.PORT || config["force_webserver"]) {
    webserver.startWebServer(process.env.PORT)
}

(async ()=>{
    gifts.Init();
    for (let i = 0; i < tokens.length; i++) {
        console.log(`Creating dclient for account n${i}`)

        var cl = new dclient(tokens[i], config.d_gateway, handleEvent);
        cl.connect();

        clients[i] = cl;
        await new Promise(res=>setTimeout(res, 1000));
    }

    setInterval(() => {
        const datenow = Date.now();
        let msg = "";

        for (idx in clients) {
            let cl = clients[idx];

            if (datenow - cl.last_heartbeat_timestamp > 100000) {
                cl.disconnect();
                msg += `Account n${idx} last heartbeat was ${~~(datenow - cl.last_heartbeat_timestamp)/1000}s ago\n`;
            }
        }

        if (msg != "") {
            msg = msg.trim();
            console.log(msg);

            gifts.sendWebhook(config.d_err_webhook ? config.d_err_webhook : config.d_webhook, JSON.stringify({
                "embeds": [{
                        "color": 0xFF0000,
                        "description": msg,
                        "footer": {
                            "text": "All above were attempted to reconnect"
                        },
                    }
                ]
            }));
        }
    }, 60000);
})();