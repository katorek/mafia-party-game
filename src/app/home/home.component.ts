import {AfterViewInit, Component, Inject, OnInit} from '@angular/core';
import {Topic} from '../model/topic';
import {SocketioService, Comp} from '../socketio.service';
import {LOCAL_STORAGE, StorageService} from 'ngx-webstorage-service';
import {SessionService} from '../session.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  lobbies: string[] = [];
  data: any;
  username?: any;
  games: string[] = [];

  constructor(private socket: SocketioService) {
  }

  ngOnInit(): void {
    // this.disconnectFromGamesAndLobbies();
    this.username = this.getFromLocal('username');
    this.socket.getLobbies().subscribe(((data: ActiveRooms) => {
      // this.lobbies = data.lobbies;
      if(this.games){
        this.games = data.games;
      }
      if(this.lobbies){
        this.lobbies = data.lobbies;
      }
    }));
    this.refreshLobbies();
  }

  saveInLocal(key, val): void {
    this.socket.saveInLocal(key, val);
  }

  getFromLocal(key): void {
    return this.socket.getFromLocal(key);
  }


  public refreshLobbies() {
    this.socket.sendMessage({
      topic: Topic.FINDLOBBY
    });
  }

  joinLobby(lobbyname: string, newGame: boolean) {
    this.saveInLocal('username', this.username);
    this.saveInLocal('lobby', lobbyname);
    this.socket.updateState({component: Comp.LOBBY})
    this.socket.lobby = lobbyname;
    this.socket.sendMessage({
      topic: newGame ? Topic.NEWLOBBY : Topic.JOINLOBBY,
      data: {lobby: lobbyname, user: this.username}
    });
  }

  private disconnectFromGamesAndLobbies() {
    const state = this.socket.getFromLocal('state');
    if (state) {
      this.socket.state.component = Comp.HOME;

    }
    this.socket.sendMessage({
      topic: Topic.HOME,
    });
  }


  lobbynameAlreadyExists(lobbyname: string) {
    return this.lobbies.findIndex(l => l === lobbyname) !== -1;
  }
}

interface ActiveRooms {
  games?: string[];
  lobbies?: string[];
}
