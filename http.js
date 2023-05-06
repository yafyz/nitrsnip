const tls = require("tls");

class Response {
    StatusCode = "0";
    StatusMessage = "";
    Headers = {};
    ContentLength = 0;
    Body = null;
    Raw = null;
    Error = null;
    pt = null;
}

class httpClient {
    socket = null;
    options = null;
    is_connected = false;
    reconnect = false;

    #queue = [];
    #is_reconnect = false;

    constructor(host) {
        this.options = {
            host: host,
            port: 443,
            rejectUnauthorized:false,
            requestCert:false
        }
    }
    connect = function(reconnect, on_reconnect_callback = ()=>{}) {
        return new Promise(res=> {
            this.reconnect = reconnect;
            this.socket = tls.connect(this.options, ()=>{
                this.is_connected = true;
                //if (this.#is_reconnect)
                    on_reconnect_callback();
                res(this.socket.authorized);
            });
            this.socket.setEncoding("ascii");
            this.socket.on("data", d => {
                if (this.#queue.length > 0)
                    if (this.#queue[0](d))
                        this.#queue.shift();
            })
            if (this.reconnect) {
                this.socket.on("end", ()=>{
                    console.log("ended")
                    this.is_connected = false;
                    this.#is_reconnect = true;
                    this.connect(this.reconnect, on_reconnect_callback);
                })
            }
        });
    }

    #get_response = function() {
        return new Promise(resolve=>{
            let res = new Response();
            res.Raw = "";
            res.pt = [];

            let content_filled = 0;

            let is_chunked = false;
            let got_chunks = false;
            let headers_finished = false;
            let last_chunk_end = "";
            let chunks = [];

            let callback = d => {
                res.pt.push(Date.now());
                res.Raw += d;

                if (res.StatusCode == "0" || !headers_finished) {
                    d = res.Raw;

                    let hthead = d.indexOf("\r\n");
                    let scode_start = d.indexOf(" ");
                    let scode_end = d.indexOf(" ", scode_start+1);
                    res.StatusCode = d.slice(scode_start+1, scode_end);
                    res.StatusMessage = d.slice(scode_end+1, hthead);

                    let lastidx = hthead+2;
                    let nextidx;
                    let hstr;
                    let colonidx;

                    while (true) {
                        nextidx = d.indexOf("\r\n", lastidx);
                        if (lastidx > nextidx)
                            return false;
                        hstr = d.slice(lastidx, nextidx);
                        lastidx = nextidx+2;
                        if (hstr === "")
                            break;
                        colonidx = hstr.indexOf(":");
                        res.Headers[hstr.slice(0,colonidx).toLowerCase()] = hstr.slice(colonidx+2);
                    }

                    headers_finished = true;

                    res.ContentLength = Number.parseInt(res.Headers["content-length"]);
                    if (!isNaN(res.ContentLength)) {
                        res.Body = Buffer.allocUnsafe(res.ContentLength);
                        let bstring = d.slice(lastidx);
                        content_filled += res.Body.write(bstring, content_filled);
                    } else {
                        is_chunked = true;
                        let szlen = d.indexOf("\r\n", lastidx);
                        let len = Number.parseInt(d.slice(lastidx, szlen), 16);
                        let bstring = d.slice(szlen+2);
                        res.Body = Buffer.allocUnsafe(len);
                        res.Body.write(bstring,0);
                        content_filled += res.Body.write(bstring, 0);
                    }
                } else {
                    if (!is_chunked) {
                        content_filled += res.Body.write(d, content_filled);
                    } else {
                        try {
                            if (d == "0\r\n\r\n") {
                                got_chunks = true;
                                if (chunks.length > 0) {
                                    chunks.push(res.Body);
                                    res.Body = Buffer.concat(chunks);
                                }
                            } else {
                                if (last_chunk_end == "\r\n") {
                                    chunks.push(res.Body);
                                    let szlen = d.indexOf("\r\n");
                                    let len = Number.parseInt(d.slice(0, szlen), 16);
                                    res.Body = Buffer.allocUnsafe(len);
                                    content_filled = 0;
                                    d = d.slice(szlen+2);
                                }
                                last_chunk_end = d.slice(-2);
                                if (last_chunk_end == "\r\n")
                                    d = d.slice(0,-2);
                                content_filled += res.Body.write(d, content_filled);
                            }
                        } catch (ex) {
                            res.Error = ex;
                            resolve(res);
                        }
                    }
                }
                if (content_filled >= res.ContentLength || got_chunks) {
                    resolve(res);
                    return true;
                }
            };
            this.#queue.push(callback);
        });
    }

    request = function (method, path, headers={Host: this.options.host}, body = "", get_response=true) {
        let payload = `${method} ${path} HTTP/1.1\n`;
        if (headers["Host"] == undefined)
            payload += `Host: ${this.options.host}\n`;
        if (body.length > 0 || method != "GET")
            payload += `Content-Length: ${body.length}\n`;
        for (const v in headers)
            payload += `${v}: ${headers[v]}\n`;
        payload += "\n";
        if (body.length != 0)
            payload += body;
        this.socket.write(payload);
        if (get_response)
            return this.#get_response();
        return;
    }

    request_raw = function(payload="") {
        this.socket.write(payload);
        return this.#get_response();
    }
}

module.exports = httpClient