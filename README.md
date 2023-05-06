# nitrsnip
a discord nitrosniper which actualy tries to be fast instead of mindlessly using packages

it does one thing and one only, snipe nitros, hopefully fast, no other BS (like fancy output and ascii art)
# features
Uses it's own HTTP and discord client

multi-token sniping support

uses minimal ammount of packages (uses 3 packages, 2 of which are native modules, and has total of 6 dependencies)

functional push notifications !!
# setup
download the repo as zip (green "Code" button, then click "Download ZIP"), extract it somewhere

or you can also clone the repo

get node, run `npm install` in the root directory (you must have a c/c++ compiler, easiest way is to do it through node setup), configure

then to run it do `node .` in the root directory
# config
create directory `files`, and in there create new file named `config.json`, which is the main config file

for webhook, enter only the path

ex. `https://discord.com/api/webhooks/11111111/xx-xx` becomes `/api/webhooks/11111111/xx-xx`

example main config:
```json
{
    "d_token": "",
    "d_gateway": "wss://gateway.discord.gg/?encoding=etf&v=9&compress=zlib-stream",
    "d_webhook": "/api/webhooks/11111111/xx-xx",
    "d_err_webhook": "/api/webhooks/222222/yy-yy",
    "read_messages_on_redeem_account": true,
    "use_multiple_tokens": true,
    "tokens_file": "files/tokens.txt",
    "show_messages": true
}
```
the token file supports comments (';'), tokens are seperated by new line
ex.
```
xxxx.xxxx ;1 comment
yyyy.yyyy; 2
```

each option explanation
```json
"d_token" main discord token
"d_gateway" discord gateway, copy the value from example there
"d_webhook" webhook to send notifications about snipe attempts to
"d_err_webhook" webhook to send errors to
"read_messages_on_redeem_account" snipe nitros from your main discord token
"use_multiple_tokens" use multiple tokens, if set to true, it will load tokens from "tokens_file"
"tokens_file" path to file with tokens, can be empty if "use_multiple_tokens" is set to false
"show_messages" if set to true, will log messages to the console
"tokens" used if "tokens_file" is not specified, tokens seperated by ; (no comment support)
"cache_codes" when true, codes are only temporarily cached till the application is restarted, when false they are saved on exit and loaded upon startup
"improve_latency" improves latency on first request after HTTP connect by attempting to claim a random code, might be a risky thing to enable (might not actually make a difference because when this is not enabled, it instead just checks if a random code exists without authentication)
"force_webserver" forces to start a web server even when env var PORT is not set (*ahem* replit *ahem*)
```
all config can also be specified using env vars, env vars are only used if the directory files does not exist
# latency vs total time
basicaly, latency is what you care about, for full explanation refer to this issue

https://github.com/yafyz/nitrsnip/issues/4#issuecomment-904839322
# heroku
heroku deploying and auto-updater was moved to [yafyz/nitrsnip_deploy](https://github.com/yafyz/nitrsnip_deploy)
# TBA
make it so it does not make such a big fingerprint (tbh not like others snipers even try to)
# other
snipe at your own risk as its against discord ToS, probably

the speed heavily depends on your latency to discord servers (or cloudflare servers, idk, discord website is behind cloudflare proxy), on AWS you often get sub 55ms response times (lowest 33ms)

idk rewrite in future maybe but idk anymore

if you got speed improvements ideas, contact me, pull request, whatever floats your boat

you can donate me BTC `bc1qpxh9vkx4w2r2vcu3ynz7aukfds6szuaut9553z` or ETH `0x77fA812c6AbAbf2bE50Aae5Bf499551F57b57932`, any donation is appreciated

or you can also star the repo, i don't like asking for it but everyone else does it and has way more stars

# contact
discord: fyz#0300

do not message me about settings this up pls
