const fs = require("fs");
const gifts = require("./gift");
const dclient = require("./client.js");
const config = require("./config");

function handleEvent(packet) {
    if (packet.t == "MESSAGE_CREATE") {
        if (config["show_messages"])
            console.log(`${packet.d.author.username} > ${packet.d.content}`);
        gifts.checkForGift(packet);
    }
}

let tokens = [];

if (config["read_messages_on_redeem_account"])
    tokens.push(config["d_token"]);

if (config["use_multiple_tokens"]) {
    let t = fs.readFileSync(config["tokens_file"]).toString();
    t.split("\n").forEach(v=>{
        v = v.split(";")[0].trim();
        if (v != "")
            tokens.push(v);
    })
}

(async ()=>{
    gifts.Init();
    for (let i = 0; i < tokens.length; i++) {
        console.log(`Creating dclient for account n${i}`)
        var cl = new dclient(tokens[i], config.d_gateway, handleEvent);
        cl.connect();
    }
})();