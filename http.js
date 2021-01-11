const tls = require("tls");

class Response {
    StatusCode = "0";
    StatusMessage = "";
    Headers = {};
    ContentLength = 0;
    Body = null;
}

class httpsSocket {
    socket = null;
    options = null;
    #queue = [];

    constructor(host) {
        this.options = {
            host: host,
            port: 443,
            rejectUnauthorized:false,
            requestCert:false
        }
    }
    connect = function(reconnect) {
        return new Promise(res=> {
            this.socket = tls.connect(this.options, ()=>res(this.socket.authorized));
            this.socket.setEncoding("ascii");
            this.socket.on("data", d => {
                if (this.#queue.length > 0)
                    if (this.#queue[0](d))
                        this.#queue.shift();
            })
            if (reconnect)
                this.socket.on("end", ()=>{
                    console.log("reconnect");
                    this.connect(reconnect);
                })
        });
    }

    request = function (method, path, headers={Host: this.options.host}, body = "") {
        let packet = `${method} ${path} HTTP/1.1\n`;
        if (headers["Host"] == undefined)
            packet += `Host: ${this.options.host}\n`;
        if (body.length > 0 || method != "GET")
            packet += `Content-Length: ${body.length}\n`;
        for (const v in headers)
            packet += `${v}: ${headers[v]}\n`;
        packet += "\n";
        if (body.length != 0)
            packet += body;
        this.socket.write(packet);

        return new Promise(resolve=>{
            let res = new Response();
            let content_filled = 0;
            let callback = d => {
                if (res.StatusCode == "0") {
                    let split = d.split("\r\n");

                    {let fidx = split[0].indexOf(" ");
                    let sidx = split[0].indexOf(" ", fidx+1);
                    res.StatusCode = split[0].slice(fidx+1, sidx);
                    res.StatusMessage = split[0].slice(sidx+1);}

                    let lastidx;
                    {let sidx;
                    for (let i = 1; i < split.length; i++) {
                        if (split[i] == "") {
                            lastidx = i;
                            break;
                        }
                        sidx = split[i].indexOf(":");
                        res.Headers[split[i].slice(0, sidx)] = split[i].slice(sidx+2);
                    }}
                    res.ContentLength = Number.parseInt(res.Headers["Content-Length"]);
                    res.Body = Buffer.alloc(res.ContentLength);
                    let bstring = split.slice(lastidx).join("");
                    res.Body.write(bstring,0);
                    content_filled += bstring.length;
                } else {
                    res.Body.write(d, content_filled);
                    content_filled += d.length;
                }

                if (content_filled >= res.ContentLength) {
                    resolve(res);
                    return true;
                }
            };
            this.#queue.push(callback);
        });
    }
}

module.exports = httpsSocket