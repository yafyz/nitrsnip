const fs = require("fs");
function onExit(obj, e) {
    fs.writeFileSync(obj.path, JSON.stringify(obj.jObj));
    if (typeof e == "object") {
        console.log(e);
    } else if (e == "SIGINT") {
        process.exit();
    }
}

class database {
    path = "";
    jObj = {};

    constructor(db_path, autosave=true) {
        if (!fs.existsSync(db_path)) {
            fs.writeFileSync(db_path, "{}");
        }
        {
            let str = fs.readFileSync(db_path);
            this.jObj = JSON.parse(str != "" && str || "{}");
            this.path = db_path;
        }
        if (autosave) {
            let obj = this;
            
            process.on('beforeExit', ()=>onExit(obj));
            process.on('SIGINT', ()=>onExit(obj, "SIGINT"));
            process.on('uncaughtException', (e)=>onExit(obj, e));
        }
    }

    save = function() {
        fs.writeFileSync(this.path, JSON.stringify(this.jObj));
    }

    assureValueExists = function(path, value) {
        let obj = this.jObj;
        let sp = path.split("/");
        let plen = sp.length;
        sp.forEach((v,i) => {
            if (obj[v] == undefined && plen-1 == i)
                obj[v] = value;
            if (obj[v] == undefined)
                obj[v] = {};
            obj = obj[v];
        });
    }

    getValue = function(path) {
        let obj = this.jObj;
        path.split("/").forEach(v => {
            obj = obj[v];
        });
        return obj;
    }

    setValue = function(path, value) {
        let obj = this.jObj;
        let sp = path.split("/");
        let key = sp.pop();
        sp.forEach(v => {
            obj = obj[v];
        });
        obj[key] = value;
        return obj;
    }
}

module.exports = database;