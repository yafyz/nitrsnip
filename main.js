const fs = require("fs");
const gifts = require("./gift");
const dclient = require("./client.js");

async function handleEvent(packet) {
    if (packet.t == "MESSAGE_CREATE") {
        console.log(`${packet.d.author.username} > ${packet.d.content}`);
        gifts.checkForGift(packet);
    }
}

const config = JSON.parse(fs.readFileSync("files/config.json"));

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
    gifts.keepSocketAlive();
    for (let i = 0; i < tokens.length; i++) {
        console.log(`Crating dclient for account n${i}`)
        var cl = new dclient(tokens[i], config.d_gateway, handleEvent);
        cl.connect();
    }
})()

//tokens.forEach(token=>{
//});
//var c = new dclient(config.d_token, config.d_gateway, handleEvent);
//c.connect();