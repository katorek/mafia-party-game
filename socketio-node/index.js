const app = require('express')();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
let Topic = require('./Topic');
let Phase = require('./Phase');
var _ = require('lodash');

let Role = require('./Role')
let Akcje = require('./Akcje')

const development = false;
const redirectUrl = (development) ? 'http://localhost:4200' : 'http://mafia.jaronsky.ddns.net';

app.get('/', (req, res) => {
  res.send('' +
    '<html lang="pl">' +
    '  <head>' +
    '    <meta http-equiv="Refresh" content="3; url=' + redirectUrl + '" />' +
    '    <title>Mafia</title>  ' +
    '  </head>' +
    '  <body>' +
    '    <p>Automatyczne przkierowanie w przeciągu <span id="countdown">3</span> sekund</p>' +
    '  </body>' +
    '</html>' +
    '');
});

// const users = [];
// const lobbiesNames = [];
const lobbies = new Map();
// 'ID' -> {users: [{uuid, user}, lobbyname, host:{uuid, user}, settings:{..}, lastupdate:milis ]}
//settings: {mafia, citizen, detective, doctor} <- all numbers
const games = new Map();
const defaultSettings = {mafia: 1, citizen: 1, detective: 0, doctor: 0, terrorist: 0, tie: 0, actionCards: []}
const refreshedData = {
  users: [
    {uuid: '622f0374-e3fd-434d-8d13-6771bcabd99c', user: 'TEST', role: 'mafia', action: 'burmistrz'},
    {
      uuid: '622f0374-e3fd-434d-8d13-6771bcabd99d',
      user: 'Monika',
      role: 'doctor',
      action: 'burmistrz',
      left: true
    },
    {
      uuid: '622f0374-e3fd-434d-8d13-6771bcabd99e',
      user: 'Aleks',
      role: 'mafia',
      action: 'burmistrz',
      vote: ['622f0374-e3fd-434d-8d13-6771bcabd99d', '622f0374-e3fd-434d-8d13-6771bcabd99f'],
      left: true
    },
    {uuid: '622f0374-e3fd-434d-8d13-6771bcabd99f', user: 'Piotr', role: 'detective', action: 'burmistrz', left: true},
  ],
  lobbyname: 'apex',
  host: {uuid: '622f0374-e3fd-434d-8d13-6771bcabd99c', user: 'prawy'},
  settings: {
    mafia: -1,
    citizen: -1,
    detective: -1,
    doctor: -1,
    terrorist: -1,
    tie: 0,
    actionCards: ['BURMISTRZ']
  },
  roles: {mafia: 1, doctor: 1, detective: 1, citizen: 0, terrorist: 0},
  phase: Phase.DAY,
  lastupdate: 1583826796868
}
if (development) {
  console.log('Development mode')
  games.set('622f0374-e3fd-434d-8d13-6771bcabd99x', (refreshedData));
  lobbies.set('622f0374-e3fd-434d-8d13-6771bcabd99x', (refreshedData));
}

io.on('connection', (socket) => {
  // socket.on('disconnect', () => {
  //   // console.log('user disconnected');
  // });

  socket.on(Topic.REFRESHDATA, () => {
    if (!development) return;
    const uuid = refreshedData.host.uuid;
    games.set(uuid, {
        users: [
          {uuid: '622f0374-e3fd-434d-8d13-6771bcabd99c', user: 'TEST', role: 'mafia', action: 'burmistrz'},
          {
            uuid: '622f0374-e3fd-434d-8d13-6771bcabd99d',
            user: 'doctor',
            role: 'doctor',
            action: 'burmistrz',
            vote: ['622f0374-e3fd-434d-8d13-6771bcabd99e']
          },
          {
            uuid: '622f0374-e3fd-434d-8d13-6771bcabd99e',
            user: 'mafia',
            role: 'mafia',
            action: 'burmistrz',
            vote: ['622f0374-e3fd-434d-8d13-6771bcabd99d', '622f0374-e3fd-434d-8d13-6771bcabd99f']
          },
          {uuid: '622f0374-e3fd-434d-8d13-6771bcabd99f', user: 'detective', role: 'detective', action: 'burmistrz'},
        ],
        uuid: '622f0374-e3fd-434d-8d13-6771bcabd99c',
        lobbyname: 'apex',
        host: {uuid: '622f0374-e3fd-434d-8d13-6771bcabd99c', user: 'prawy'},
        settings: {
          mafia: -1,
          citizen: -1,
          detective: -1,
          doctor: -1,
          terrorist: -1,
          tie: 0,
          actionCards: ['BURMISTRZ']
        },
        roles: {mafia: 1, doctor: 1, detective: 1, citizen: 0, terrorist: 0},
        phase: Phase.DAY,
        lastupdate: 1587826796868
      }
    );
    // console.log(games.get(uuid))
    sendGameData(uuid, games.get(uuid));
  })

  socket.on(Topic.MAFIACHAT, (msgData) => {
    // console.log('chat-mafia-'+msgData.gameUuid);
    //msgData => {gameUuid, msg:{ from, content, to?}}
    io.emit('chat-mafia-' + msgData.gameUuid, msgData.msg);
  })

  socket.on(Topic.LOBBYSETTINGS, (data) => {
    lobbies.get(data.lobby).settings = data.settings;
    lobbies.get(data.lobby).lastupdate = Date.now();
    io.emit('lobby-' + data.lobby, {
      settings: data.settings,
    })
  })

  socket.on(Topic.STARTGAME, (data) => {
    let gameLobby = lobbies.get(data.lobby);
    // _.assignIn(lobbies.get(data.lobby), {uuid: data.gameUuid});
    _.assignIn(gameLobby, {uuid: data.gameUuid})

    startLobby(data.lobby, data.gameUuid);
    let game = assign(gameLobby);

    sendGameData(data.gameUuid, game);
  })

  socket.on(Topic.GAMEDATA, (data) => {
    const uuid = data.gameUuid;
    let game = games.get(uuid)
    if (data.action) {
      switch (data.action) {
        case 'kill': {

          _.assignIn((game.actions) ? game.actions : game, (game.actions) ? {mafia: true} : {actions: {mafia: true}});
          _.assignIn(game.users.find(u => u.uuid === data.target), {tokill: true})
          break;
        }
        case 'check': {
          _.assignIn((game.actions) ? game.actions : game, (game.actions) ? {detective: true} : {actions: {detective: true}});
          _.assignIn(game.users.find(u => u.uuid === data.target), {tocheck: true})
          break;
        }
        case 'heal': {
          _.assignIn((game.actions) ? game.actions : game, (game.actions) ? {doctor: true} : {actions: {doctor: true}});
          _.assignIn(game.users.find(u => u.uuid === data.target), {toheal: true})
          break;
        }
        case 'vote': {
          //       data: {gameUuid: this.gameUuid, action: 'vote', target: user.uuid, from: this.player.uuid}
          const voteOnIdx = game.users.findIndex(u => u.uuid === data.target);
          if (voteOnIdx !== -1) {
            //cast vote
            const voteOn = game.users[voteOnIdx];
            if (voteOn.vote && voteOn.vote.length > 0) {
              voteOn.vote.findIndex(uuid => uuid === data.from) === -1 ? voteOn.vote.push(data.from) : null;
            } else {
              _.assignIn(voteOn, {vote: [data.from]})
            }

            _.assignIn(game.users[voteOnIdx], voteOn);

            const votesSorted = game.users.filter(u => !u.dead).map(u => (u.vote && u.vote.length > 0) ? u.vote.length : 0).sort((a, b) => b - a);
            const allVotes = votesSorted.reduce((a, b) => a + b);

            // if everyone voted
            if (allVotes === game.users.length) {

              /* one player will die*/
              if (votesSorted[0] > votesSorted[1]) {
                _.assignIn(game.users.filter(u => !u.dead && u.vote && u.vote.length === votesSorted[0])[0], {dead: true});
              } else if (votesSorted[0] === votesSorted[1]) { // tie
                const val = votesSorted[0];
                let numberOfcandidatesToKill = votesSorted.filter(v => v === val).length;
                let toKill = _.random(numberOfcandidatesToKill - 1);
                for (let i = 0; i < game.users.length; i++) {
                  const u = game.users[i]
                  if (!u.dead && u.vote && u.vote.length === val) {
                    if (toKill-- === 0) {
                      _.assignIn(game.users[i], {dead: true});
                      break;
                    }
                  }
                }
              }
              game.users.filter(u => !u.dead).forEach(u => u.vote = []); // clear old votes
              game.phase = Phase.NIGHT;
            }
          }

          break;
        }
      }
      game = updateRolesAndPhase(game);
      games.set(uuid, game);
      game.lastupdate = Date.now();
    }
    if (game) {
      sendGameData(uuid, game)

      checkWinner(game);
    }
  })

  function checkWinner(game) {
    //mafia win if only mafia alive
    //others win of mafia dead
    if (!game.users) return;
    const alivePlayers = game.users.filter(u => !u.dead);
    const aliveMafia = alivePlayers.filter(u => u.role === 'mafia').length;
    const otherAlive = alivePlayers.length - aliveMafia;


    if (aliveMafia === 0 || otherAlive === 0) {
      io.emit('endgame-' + game.uuid, {winner: (aliveMafia === 0) ? 'town' : 'mafia'})
      return true
    }
    return false
  }

  function updateRolesAndPhase(game) {

    // const actions = game.actions;
    if (game.actions) {
      const actions = {
        doctor: (game.roles.doctor > 0) ? game.actions.doctor : true,
        mafia: (game.roles.mafia > 0) ? game.actions.mafia : true,
        detective: (game.roles.detective > 0) ? game.actions.detective : true,
      }
      game.users.forEach(u => {
        if (u.dead) {
          switch (u.role) {
            case 'doctor': {
              game.roles.doctor = true;
              actions.doctor = true;
              break;
            }
            case 'detective': {
              game.roles.detective = true;
              actions.detective = true;
              break;
            }
          }
        } else if (u.tokill && u.toheal) {
          actions.mafia = true;
          game.roles.mafia = true;
          actions.doctor = true;
          game.roles.doctor = true;
        } else if (u.tokill) {
          actions.mafia = true;
          game.roles.mafia = true;
          if (actions.doctor) {
            u.dead = true;
          }
        } else if (u.toheal) {

          actions.doctor = true;
          game.actions.doctor = true;
          if (actions.mafia) {
            u.toheal = false;
          }
        }
        if (u.tocheck) {
          u.checked = true;
          u.tocheck = false;
          actions.detective = true;
          game.roles.detective = true;
        }
        // _.assignIn(u, {tokill: false, toheal: false});
      });

      if (actions.mafia && actions.detective && actions.doctor) {
        game.phase = Phase.DAY;
        game.users.forEach(u => _.assignIn(u, {tokill: false, toheal: false}));
        _.assignIn(game.actions, {doctor: false, detective: false, mafia: false});
      }
    }

    return game;
  }

  socket.on(Topic.NEWLOBBY, (data) => {
    var lobbyName = data.lobby;
    var user = data.user;
    addUserToLobby(data)
    sendLobbies();
    // sendLobbyInfo(data.lobby);
  });

  socket.on(Topic.JOINLOBBY, (data) => {
    addUserToLobby(data);
  });

  socket.on(Topic.LOBBYINFO, (data) => {
    sendLobbyInfo(data.lobby);
  });

  socket.on(Topic.HOME, (data) => {
    lobbies.forEach(lobby => {

      const idx = lobby.users.findIndex(u => u.uuid === data.uuid);

      if (idx !== -1) {
        lobby.users.splice(idx, 1)
        if (lobby.users.length < 1) {
          removeLobby(lobby.lobbyname);
        } else {
          sendLobbyInfo(lobby.lobbyname)
        }
      }
    })


    games.forEach(game => {

      const idx = game.users.findIndex(u => u.uuid === data.uuid);

      if (idx !== -1) {
        const userThatLeft = game.users[idx];
        switch (userThatLeft.role) {
          case 'mafia': {
            game.roles.mafia--;
            break;
          }
          case 'detective': {
            game.roles.detective--;
            break;
          }
          case 'doctor': {
            game.roles.doctor--;
            break;
          }
          case 'citizen': {
            game.roles.citizen--;
            break;
          }
          case 'terrorist': {
            game.roles.terrorist--;
            break;
          }
        }
        game.users[idx].dead = true;
        _.assignIn(game.users[idx], {left: true})
        if (game.users.findIndex(u => !u.left) === -1) {
          removeGame(game.uuid);
        } else {
          checkWinner(game);
        }
      }
    })

  })

  socket.on(Topic.FINDLOBBY, () => {
    sendLobbies();
  });

  function setPhase(game, phase) {
    return _.assignIn(game, {phase: phase})
  }

  function sendGameData(uuid, data) {
    io.emit('game-' + uuid, data)
  }

  function assign(lobby) {
    const gameSettings = lobby.settings;

    let users = lobby.users;
    let roles = [];
    let actions = lobby.settings.actionCards.filter(c => c.enabled);
    lobby.roles = {mafia: 0, detective: 0, doctor: 0, citizen: 0, terrorist: 0}

    gameSettings.roles.forEach(r => {
      lobby.roles[r.key] = r.value
    })

    while (lobby.roles.mafia-- > 0) roles.push(Role.MAFIA);
    while (lobby.roles.citizen-- > 0) roles.push(Role.CITIZEN);
    while (lobby.roles.detective-- > 0) roles.push(Role.DETECTIVE);
    while (lobby.roles.doctor-- > 0) roles.push(Role.DOCTOR);
    while (lobby.roles.terrorist-- > 0) roles.push(Role.TERRORIST);

    roles = _.shuffle(roles)
    users = _.shuffle(users)
    // card: 'UPPER', enabled:, duplicates:
    // actions = _.shuffle(actions).map(a => _.toLower(a))

    let actionsToAssign = [];

    const duplicatesActions = actions.filter(c => c.duplicates).map(c => c.card);
    const allActionsOnce = actions.filter(c => c.enabled).map(c => c.card);

    allActionsOnce.forEach(a => actionsToAssign.push(a))

    while (actionsToAssign.length < users.length && duplicatesActions.length !== 0) {
      actionsToAssign.push(duplicatesActions[_.random(duplicatesActions.length - 1)])
    }

    actionsToAssign = _.shuffle(actionsToAssign)

    for (let i = 0; i < users.length; i++) {
      if (i < actionsToAssign.length) _.assignIn(users[i], {action: actionsToAssign[i]});
      // if (i % roles.length !== i) {
      _.assignIn(users[i], (i % roles.length !== i) ? {role: Role.CITIZEN} : {role: roles[i % roles.length]});
      //
      //   _.assignIn(users[i], {role: Role.CITIZEN}, {action: actionsToAssign[i % actionsToAssign.length]});
      // } else {
      //   // _.assignIn(users[i], {role: roles[i % roles.length]})
      //   _.assignIn(users[i], {role: roles[i % roles.length]}, {action: actionsToAssign[i % actionsToAssign.length]})
      // }
    }


    lobby.users = users;
    lobby.lastupdate = Date.now()
    lobby = setPhase(lobby, Phase.DAY)

    removeLobby(lobby.lobbyname)
    games.set(lobby.uuid, lobby)
    return lobby
  }

  function addUserToLobby(data) {
    // users.push()
    var lobby = lobbies.get(data.lobby)
    if (lobby === undefined) {
      lobby = {
        users: [{uuid: data.uuid, user: data.user}],
        lobbyname: data.lobby,
        host: {uuid: data.uuid, user: data.user},
        settings: {
          roles: [
            {min: 1, max: -1, value: 1, enabled: true, show: "Mafia", key: "mafia"},
            {min: 0, max: 1, value: 0, enabled: true, show: "Doctor", key: "doctor"},
            {min: 0, max: 1, value: 0, enabled: true, show: "Policjant", key: "detective"},
            {min: 0, max: 0, value: 0, enabled: false, show: "Terrorysta", key: "terrorist"},
            {min: 1, max: -1, value: 1, enabled: true, show: "Obywatel", key: "citizen"},
          ], tie: 0, actionCards: []
        }
      }
    } else {
      lobby.users.push({uuid: data.uuid, user: data.user})
    }
    lobby.lastupdate = Date.now();
    lobbies.set(data.lobby, lobby)

  }

  function startLobby(lobbyname, uuid) {
    const lobby = lobbies.get(lobbyname)
    io.emit('lobby-' + lobbyname, {
      started: true, gameUuid: uuid
    })
  }

  function sendLobbyInfo(lobbyname) {
    const lobby = lobbies.get(lobbyname)
    if (lobby) {
      io.emit('lobby-' + lobbyname, {
        users: lobby.users,
        host: lobby.host,
        settings: lobby.settings,
      })
    }
  }

  // function setLobbyHost(data) {
  //   const lobby = lobbies.get(data.lobby)
  //   _.assignIn(lobby, {host1: 'lala'})
  // }

});

function sendLobbies() {
  const data = {
    lobbies: Array.from(lobbies.keys()),
    games: Array.from(games.values()).map(game => game.lobbyname),
  }

  io.emit(Topic.LISTLOBBIES, data);
}

function removeLobby(lobbyname) {
  lobbies.delete(lobbyname);
  sendLobbies();
}

function removeGame(uuid) {
  games.delete(uuid);
  sendLobbies();
}


http.listen(3000, () => {
  console.log('listening on *:3000');
});

const second = 1000;
const minute = 60 * second;
// let lastDate = Date.now()

var cleanOldGames = setInterval(function () {
  console.log("Cleaning old games and lobbies...")
  //get not changed lobbies and games and remove them
  const before = Date.now() - (15 * minute * second);

  const lobbiesNames = Array.from(lobbies.keys())
  const gamesUuids = Array.from(lobbies.keys())


  lobbiesNames.forEach(lobbyName => {
    if (lobbies.get(lobbyName).lastupdate < before) {
      console.log("Removing old lobby: ", lobbyName)
      removeLobby(lobbyName)
    }
  })

  gamesUuids.forEach(uuid => {
    const game = games.get(uuid);
    if (game.lastupdate < before) {
      console.log("Removing old game: ", game.lobbyname)
      removeGame(uuid)
    }
  })

}, 10 * minute * second);
// cleanOldGames();


