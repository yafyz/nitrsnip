const WebSocket = require("ws")
const erlpack = require("erlpack")
const zlib = require("zlib-sync")
const op = require("./op")
const gifts = require("./gift")
const config = require("./config")

const authData = erlpack.pack({"op":op.IDENTIFY,"d":{"token":config.d_token,"capabilities":61,"properties":{"os":"Windows","browser":"Chrome","device":"","browser_user_agent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.66 Safari/537.36","browser_version":"87.0.4280.66","os_version":"10","referrer":"","referring_domain":"","referrer_current":"https://discord.com/","referring_domain_current":"discord.com","release_channel":"stable","client_build_number":72382,"client_event_source":null},"presence":{"status":"invisible","since":0,"activities":[],"afk":false},"compress":false,"client_state":{"guild_hashes":{},"highest_last_message_id":"0","read_state_version":0,"user_guild_settings_version":-1}}})

const ZLIB_SUFFIX = 0x0000FFFF
let zlib_inflate = null

let ws = null
let heartbeat_id = null

let got_heartbeat_ack = null
let last_sequence = null

async function handleEvent(packet) {
    //console.log(`| DISPATCH | ${packet.t}`)
    if (packet.t == "MESSAGE_CREATE") {
        console.log(`${packet.d.author.username} > ${packet.d.content}`)
        gifts.checkForGift(packet)
    }
}

async function handlePacket(packet) {
    if (packet.s != undefined)
        last_sequence = packet.s

    switch (packet.op) {
        case op.DISPATCH:
            handleEvent(packet)
            break
        case op.HELLO:
            const heartbeat_interval = packet.d.heartbeat_interval
            console.log("| OP | HELLO")
            console.log(`| SET | heartbeat_interval: ${heartbeat_interval}`)
            if (heartbeat_id != null)
                clearInterval(heartbeat_id)
            heartbeat_id = setInterval(()=>{
                if (!got_heartbeat_ack) {
                    ws.close();
                    return
                }
                if (ws != null) {
                    ws.send(erlpack.pack({op: op.HEARTBEAT, d: last_sequence}))
                    console.log("| HEARTBEAT |")
                    got_heartbeat_ack = false
                }
            }, heartbeat_interval)
            break
        case op.HEARBEAT_ACK:
            got_heartbeat_ack = true
            console.log("| OP | HEARBEAT_ACK")
            break
        default:
            console.log(`| OP | ${JSON.stringify(packet)}`)
    }
}


function connect() {    
    ws = new WebSocket(config.gateway);

    ws.on("open", ()=>{
        zlib_inflate = new zlib.Inflate({chunkSize: 65535, flush: zlib.Z_SYNC_FLUSH});
        got_heartbeat_ack = true;
        console.log("| WS | OPEN");
        ws.send(authData);
        console.log("| WS | SENT AUTH");
    })
    
    ws.on('message', async data => {
        if (data.readUInt32BE(data.length-4) ^ ZLIB_SUFFIX == 0) {
            zlib_inflate.push(data, zlib.Z_SYNC_FLUSH);
            if (zlib_inflate.result == undefined)
                return;
            
            handlePacket(erlpack.unpack(zlib_inflate.result));
        } else {
            console.log(data.buffer.toString());
        }
    });

    ws.on("close", connect);
}

connect();