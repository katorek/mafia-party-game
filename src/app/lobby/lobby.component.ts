import {AfterContentInit, Component, OnInit} from '@angular/core';
import {SocketioService, Comp} from '../socketio.service';
import {Topic} from '../model/topic';
import {Router} from '@angular/router';
import {User} from '../model/user';
import {ActionCards} from '../model/action-cards';
import * as _ from 'lodash';
import {Phase} from '../game/game.component';
import {v4 as uuidv4} from 'uuid';


@Component({
  selector: 'app-lobby',
  templateUrl: './lobby.component.html',
  styleUrls: ['./lobby.component.css']
})
export class LobbyComponent implements OnInit {
  actionCards: Card[] = [];
  ActionCards = ActionCards;
  players: User[] = [];
  lobby;
  host: User;
  settings: Settings = {
    roles: [
      {min: 1, max: -1, value: 1, enabled: true, show: 'Mafia', key: 'mafia'},
      {min: 0, max: 1, value: 0, enabled: true, show: 'Doctor', key: 'doctor'},
      {min: 0, max: 1, value: 0, enabled: true, show: 'Policjant', key: 'detective'},
      {min: 0, max: 0, value: 0, enabled: false, show: 'Terrorysta', key: 'terrorist'},
      {min: 1, max: -1, value: 1, enabled: true, show: 'Obywatel', key: 'citizen'},
    ],
    // mafia: 1, citizen: 1, detective: 0, doctor: 0, terrorist: 0,
    actionCards: []
  };
  user: User;
  tieOptions = [
    {key: 0, show: 'Losowo', checked: true, enabled: true},
    {key: 1, show: 'Decyduje założyciel gry', checked: false, enabled: false}
  ];

  // roleSettings = ;

  tieSelected = this.tieOptions[0].key;
  actionCardsWorking: boolean = false;
  actionCardsChecked: boolean = false;

  constructor(private socket: SocketioService,
              private router: Router) {
  }

  ngOnInit(): void {
    for (let actionCardsKey in this.ActionCards) {
      this.actionCards.push({card: actionCardsKey, enabled: false, duplicates: false});
    }

    // if(this.socket.isDevelopment()) {
    //   return
    // }
    const state = this.socket.getFromLocal('state');
    if (this.socket.getFromLocal('state')) {
      if (state?.component === Comp.LOBBY) {
        const lobbyname = this.socket.getFromLocal('lobby');
        if (lobbyname) {
          this.socket.lobby = lobbyname;
        }
      }
    } else if (!this.socket.lobby) {
      this.router.navigateByUrl('/');
    }
    this.lobby = this.socket.lobby;
    this.socket.subscribeToLobby(this.lobby).subscribe((lobby: LobbyInfo) => {
      if (lobby.users) {
        this.players = lobby.users;
        this.user = this.players.find(u => u.uuid === this.socket.getUuid());
      }
      if (!this.host && lobby.host) {
        this.host = lobby.host;
      }
      if (lobby.settings) {
        this.updateSettings(lobby.settings);
        // this.settings = lobby.settings;
      }
      if (lobby.started) {
        this.joinGame(lobby.gameUuid);
      }
    });
    this.socket.sendMessage({
      topic: Topic.LOBBYINFO,
      data: {lobby: this.socket.lobby}
    });
    // this.socketService.
  }

  private joinGame(gameUuid: string) {
    this.socket.state.component = Comp.GAME;
    this.socket.state.data = {host: this.host};
    this.socket.state.gameUuid = gameUuid;
    this.socket.refreshState();
    this.router.navigateByUrl('/game');
  }


  updateForm() {
    if (this.isHost()) {
      this.validateInputs();
      this.settings.actionCards = this.actionCards;
      console.log(this.settings);
      this.socket.sendMessage({
        topic: Topic.LOBBYSETTINGS,
        data: {lobby: this.lobby, action: 'settings', settings: this.settings}
      });
    }
  }

  validateInputs() {
    this.settings.roles.forEach(r => {
      r.value = (r.value < r.min) ? r.min : r.value;
      r.value = (r.max !== -1 && r.value > r.max) ? r.max : r.value;
    });
  }

  isHost() {
    return this.host && this.socket.getUuid() === this.host.uuid;
  }

  summary() {
    return this.settings.roles.map(r => r.value).reduce((a, b) => a + b);
  }

  startGame() {
    this.socket.sendMessage({
      topic: Topic.STARTGAME,
      data: {lobby: this.lobby, gameUuid: uuidv4()}
    });
  }

  isSelected(key: string) {
    return false;
    // return this.settings.actionCards?.findIndex(card => card === key) !== -1;
  }

  private updateSettings(settings: SettingsDTO) {
    if (settings.roles) {
      this.settings.roles = settings.roles;
    } else {
      this.settings.roles.forEach(r => {
        // console.log('r.key, settings[r.key]', r.key, settings[r.key]);
        r.value = (settings[r.key]) ? settings[r.key] : r.value;
      });
    }
    // console.log(this.settings.roles);

    // SettingsDTO
  }

  isDevelopment(): boolean {
    return this.socket.isDevelopment();
  }
}

export interface LobbyInfo {
  users?: User[];
  host?: User;
  settings?: SettingsDTO;
  roles?: Roles,
  started?: boolean;
  phase?: Phase;
  gameUuid?: string;
}

export interface Roles {
  mafia: number;
  doctor: number;
  detective: number;
}

interface RoleInput {
  min: number,
  max: number,
  value: number,
  enabled: boolean,
  show: string,
  key: string
}

interface SettingsDTO {
  mafia: number;
  citizen: number;
  detective: number;
  doctor: number;
  terrorist: number;
  roles?: RoleInput[];
}

export interface Settings {
  roles?: RoleInput[];
  // mafia: number;
  // citizen: number;
  // detective: number;
  // doctor: number;
  // terrorist: number;
  tie?: number;
  actionCards?: Card[];
}

interface Card {
  card: string;
  enabled: boolean;
  duplicates: boolean;
}
