# nitrsnip
a discord nitrosniper which actualy tries to be fast instead of mindlessly using packages

it does one thing and one only, snipe nitros, hopefully fast, no other BS (like fancy output and ascii art)
# features
Uses it's own HTTP and discord client

multi-token sniping support

uses minimal ammount of packages (uses 3 packages, 2 of which are native modules, and has total of 6 dependecies)
# setup
download the repo as zip (green "Code" button, then click "Download ZIP"), extract it somewhere

get node, run `npm install` in the root directory, configure

then to run it do `node .` in the root directory
# config
create directory `files`, and in there create new file named `config.json`, which is the main config file

for webhook, enter only the path

ex. `https://discord.com/api/webhooks/11111111/xx-xx` becomes `/api/webhooks/11111111/xx-xx`

example main config:
```json
{
    "d_token": "",
    "d_gateway": "wss://gateway.discord.gg/?encoding=etf&v=8&compress=zlib-stream",
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
```
# TBA
easy heroku deploy

# other
snipe at your own risk as its against discord ToS, probably

i have also planned to make my own WS client for this, but i feel like its a waste of time trying to do that as i would gain more performance by just rewriting this in a different language

due to reasons above, this project wont get much updates, as i will probably be working on rewriting this in C

you can donate me BTC `bc1qpxh9vkx4w2r2vcu3ynz7aukfds6szuaut9553z` or ETH `0x77fA812c6AbAbf2bE50Aae5Bf499551F57b57932`, any donation is appreciated

# contact
discord: fyz#7690
