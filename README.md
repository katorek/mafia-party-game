# Mafia Party game

## Description

This is attempt to create place, where group of friends can host [Mafia Party Game](https://en.wikipedia.org/wiki/Mafia_%28party_game%29) online.  
My primary goal is to remove the need for Game Master who coordinates game so that everybody can actively participate in game.  
"Working" demo can be found [here](http://mafia.jaronsky.ddns.net/) with almost always up-to-date version from develop branch.

## Technology stack

Frontend: Angular 9  
Backend: Node express  
I've decided to use SocketIO (Websocket Client) for communication between webpage and server

## Todo

1. Implement custom logic into game designed by me and my friends - action cards - to diversify the gameplay
2. Enable translation - add I18n service and english language - currently everything is in my native language - polish
 
## Setting up before building & developing

1. `npm install` in main directory and inside `socketio-node` directory  
2. Change [redirectUrl](socketio-node/index.js#L12) `redirectUrl` with your personal site  
3. Change [SOCKET_ENDPOINT](src/environments/environment.prod.ts#L3) `SOCKET_ENDPOINT` with your personal site  
 
## Developing, testing etc.

* server: 
1. For easy testing i created some fake data, to use it change [development](socketio-node/index.js#L11) to `true`  
Start server with: `node index.js`  
* front: `ng serve` and navigate to `http://localhost:4200/`

## Deploying on production

* server: 
1. Set [development](socketio-node/index.js#L11) to `false` 
2. Start [index.js](socketio-node/index.js) with `node index.js`
* front: `ng build --prod`

