import {environment} from '../environments/environment';
import {Injectable} from '@angular/core';
import * as io from 'socket.io-client';
import {Observable} from 'rxjs';
import {Message} from './model/message';
import {Topic} from './model/topic';
import {v4 as uuidv4} from 'uuid';
import * as _ from 'lodash';
import {SessionService} from './session.service';
import {Router} from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class SocketioService {
  socket;
  public lobby;
  state: State = {component: Comp.HOME};

  constructor(private session: SessionService,
              private router: Router) {
  }

  init() {
    let state: State = this.session.get('state');
    if (!state) {
      state = {uuid: uuidv4(), component: Comp.HOME};
    }

    this.updateState(state);

    this.socket = io(environment.SOCKET_ENDPOINT);

    if (state.component) {
      this.router.navigateByUrl(state.component);
    }
  }

  cleanStorage() {
    const state = this.socket.getFromLocal('state');
    if (state) {
      this.socket.updateState({component: Comp.HOME})
    }
    this.socket.sendMessage({
      topic: Topic.HOME,
    });
  }

  isDevelopment():boolean {
    return !environment.production
  }

  public sendMessage(message: Message) {
    this.appendUUID(message);
    // console.log('topic:',message.topic,' data:', message.data);
    this.socket.emit(message.topic, message.data);
  }

  private getObservableOnStr = (topic: string) => {
    return new Observable((observer) => {
      this.socket.on(topic, (message) => {
        observer.next(message);
      });
    });
  };

  private getObservableOnTopic = (topic: Topic) => {
    return this.getObservableOnStr(topic);
  };


  public getMessages = () => {
    return this.getObservableOnTopic(Topic.BROADCAST);
  };

  public getLobbies = () => {
    return this.getObservableOnTopic(Topic.LISTLOBBIES);
  };

  public personalSocket = () => {
    return this.getObservableOnStr(this.state.uuid);
  };


  private appendUUID(message: Message) {
    // console.log('appendUUID');
    // console.log(message);
    if (!message.data) {
      message.data = {uuid: this.state.uuid};
    } else {
      _.assignIn(message.data, {uuid: this.state.uuid});
    }
    // console.log(message);
  }

  public subscribeToLobby = (lobby: string) => {
    return this.getObservableOnStr('lobby-' + lobby);
  };

  public subscribeToGame = (gameUuid: string) => {
    return this.getObservableOnStr('game-' + gameUuid);
  };

  public subscribeToEndGame = (gameUuid: string) => {
    return this.getObservableOnStr('endgame-' + gameUuid);
  };

  public subscribeToChat = (gameUuid: string) => {
    return this.getObservableOnStr('chat-' + gameUuid);
  };

  saveInLocal(key: any, val: any) {
    this.session.set(key, val);
  }

  getFromLocal(key: any) {
    return this.session.get(key);
  }

  updateState(obj: any) {
    let state = this.getFromLocal('state');
    if (state instanceof String || state === '' || state === null) {
      state = obj;
    } else {
      state = _.assignIn(state, obj);
    }
    this.state = state;
    this.saveInLocal('state', state);
  }

  getUuid() {
    return this.state.uuid;
  }

  refreshState() {
    this.updateState(this.state);
  }
}

export interface State {
  component?: Comp;
  gameUuid?: string;
  uuid?: string;
  data?: any;
}

export enum Comp {
  GAME = '/game',
  LOBBY = '/lobby',
  HOME = '/'
}
