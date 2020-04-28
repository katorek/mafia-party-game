import {AfterViewChecked, Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import {Comp, SocketioService} from '../socketio.service';
import {User} from '../model/user';
import {Router} from '@angular/router';
import {LobbyInfo} from '../lobby/lobby.component';
import {GameInfo, InfoService} from '../info/info.service';
import {Topic} from '../model/topic';
import {FormControl, FormGroup} from '@angular/forms';
import * as _ from 'lodash';
import {MatDialog} from '@angular/material/dialog';
import {WinnerDialogComponent} from '../winner-dialog/winner-dialog.component';

@Component({
  selector: 'app-game',
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.css']
})
export class GameComponent implements OnInit, AfterViewChecked {
  gameUuid: string;
  host: User;
  player: User;
  role: GameInfo;
  action: GameInfo;
  players: User[] = [];
  initialColumns: string[] = ['user', 'dead', 'votes', 'vote'];
  displayedColumns: string[] = ['user', 'dead', 'votes', 'vote'];
  form: FormGroup;
  phase: Phase;
  didAction = false;
  @ViewChild('scrollMe') private myScrollContainer: ElementRef;

  messageControl: FormControl;
  loremFrom = ['Arek', 'Ola', 'prawy1', 'Wojtek'];
  lorem: string[] = [];
  loremText = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum';
  private roleInitialized = false;
  winner = '';
  showedWinner = true;

  // @ViewChild('messageForm') messageForm: Form;

  mafiaMessages: Message[] = [
    {from: 'Aleks', to: '', content: 'Ala ma kota'},
    {from: 'TEST', to: '', content: 'Test wiadomości'},
    {from: 'Aleks', to: '', content: 'Co tu się staneło? WTF xD'},
  ];

  constructor(public dialog: MatDialog,
              private socket: SocketioService,
              private infoService: InfoService,
              private router: Router) {
  }

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  ngOnInit(): void {
    if (this.isDevelopment()) {
      this.lorem = this.loremText.split(' ');
    }
    this.winner = '';
    this.createForm();
    if (this.socket.state?.component !== Comp.GAME) {
      this.router.navigateByUrl('/');
    } else if (this.socket.state.gameUuid) {
      this.host = this.socket.state.data.host;
      this.gameUuid = this.socket.state.gameUuid;
      this.socket.subscribeToEndGame(this.gameUuid).subscribe((data: EndGame) => {
        this.winner = data.winner;
      });
      this.socket.subscribeToGame(this.gameUuid).subscribe((game: LobbyInfo) => {
        if (game.phase === Phase.NIGHT && this.phase === Phase.NIGHT) {
          return;
        }
        if (game?.users) {
          if (game.phase !== this.phase) {
            this.didAction = false;
            this.phase = game.phase;
          }
          this.player = game.users.find(u => u.uuid === this.socket.getUuid());
          this.role = this.getInfo('role', this.player.role);
          this.action = this.getInfo('action', this.player.action);
          this.prepareSettingsForRole();
          this.players = game.users;
          this.phase = game.phase;
        }
      });

      this.socket.sendMessage({
        topic: Topic.GAMEDATA,
        data: {gameUuid: this.gameUuid}
      });


    }
    // this.development();
  }

  private scrollToBottom(): void {
    try {
      this.myScrollContainer.nativeElement.scrollTop = this.myScrollContainer.nativeElement.scrollHeight;
    } catch (err) {
    }
  }

  prepareSettingsForRole() {
    if (!this.roleInitialized) {
      if (this.player.role === 'mafia') {
        this.socket.subscribeToChat('mafia-' + this.gameUuid).subscribe((msg: Message) => {
          const lastMsg = this.mafiaMessages[this.mafiaMessages.length - 1];
          if (lastMsg.from === msg.from) {
            this.mafiaMessages[this.mafiaMessages.length - 1].content += '\n' + msg.content;
          } else {
            this.mafiaMessages.push(msg);
          }
        });
        this.displayedColumns.push('mafia');
      }
      if (this.player.role === 'doctor') {
        this.displayedColumns.push('doctor');
      }
      if (this.player.role === 'detective') {
        this.displayedColumns.push('detective');
      }
      this.roleInitialized = true;
    }
  }

  // chat functions
  sendMsg() {
    if (this.isFormValid()) {
      this.socket.sendMessage({
        topic: Topic.MAFIACHAT,
        data: {
          gameUuid: this.gameUuid,
          msg: {
            from: this.player.user,
            content: this.messageControl.value,
          }
        }
      });
    }
    this.form.reset();
  }

  // form functions
  private createForm() {
    this.messageControl = new FormControl('');
    this.form = new FormGroup({
      msgArea: this.messageControl
    });
  }

  isFormValid(): boolean {
    return this.winner === '' && this.messageControl.value && this.messageControl.value.length > 0;
  }

  // view functions
  private getInfo(category: string, key: string): GameInfo {
    return this.infoService.getShowAndDescription(category, key);
  }

  summary() {
    return 'Żywych: ' + this.players.filter(p => !p.dead).length;
  }

  dead(element: User) {
    const suffix = (this.player.role === 'mafia' && element.role === 'mafia') ? ' - Mafia' : '';
    return (element.dead) ? 'Nie' : 'Tak' + suffix;
  }

  deadStyle(dead: boolean) {
    return (dead) ? 'dead' : 'dead';
  }

  isDead(row: any) {
    return row.dead;
  }

  seeIfMafia(row: any) {
    return (this.player.role === 'mafia' && row.role === 'mafia') ||
      (this.player.role === 'detective' && !row.dead && row.checked && row.role === 'mafia');
  }

  voteSummary(user: User) {
    if (user?.vote?.length > 0) {
      return user?.vote?.length + ' <- [' + user.vote.map(uuid => this.players.find(u => u.uuid === uuid)?.user).join(', ') + ']';
    }
    return '';
  }

  // Development functions
  randomMsg() {
    this.socket.sendMessage({
      topic: Topic.MAFIACHAT,
      data: {
        gameUuid: this.gameUuid,
        msg: {
          from: this.loremFrom[_.random(this.loremFrom.length - 1)],
          content: this.randomText(),
        }
      }
    });
  }

  isDevelopment(): boolean {
    return this.socket.isDevelopment();
  }

  randomText() {
    let words = _.random(2, 5);
    let msg = '';
    while (words-- > 0) {
      msg += this.lorem[_.random(this.lorem.length - 1)] + ' ';
    }
    return msg;
  }

  development() {
    this.host = this.socket.state.data.host;
    this.gameUuid = this.socket.state.gameUuid;

    const x = {
      users: [
        {uuid: '622f0374-e3fd-434d-8d13-6771bcabd99c', user: 'TESTOWY', role: 'mafia', action: 'burmistrz', dead: false, checked: true},
        {uuid: 'b4ba7849-609e-4f75-b57c-b83ebdbd5569', user: 'Tomek', role: 'citizen', action: 'kamizelka', dead: false, checked: true},
        {uuid: 'b4ba7849-609e-4f75-b57c-b83ebdbd5569', user: 'Ola', role: 'mafia', action: 'kamizelka', dead: false, checked: false},
        {uuid: 'b4ba7849-609e-4f75-b57c-b83ebdbd5569', user: 'Arek', role: 'citizen', action: 'kamizelka', dead: true, checked: false},
        {uuid: 'b4ba7849-609e-4f75-b57c-b83ebdbd5569', user: 'Wojtek', role: 'mafia', action: 'kamizelka', dead: false, checked: false},
      ],
      lobbyname: 'apex',
      host: {uuid: 'b4ba7849-609e-4f75-b57c-b83ebdbd5569', user: 'incognito'},
      settings: {mafia: -1, citizen: -1, detective: -1, doctor: -1, terrorist: -1, actionCards: [{card: 'BURMISTRZ'}, {card: 'KAMIZELKA'}]},
      lastupdate: 1587773830416
    };
    //min: number,
    //   max: number,
    //   value: number,
    //   enabled: boolean,
    //   show: string,
    //   key: string
    this.players = x.users;
    this.player = x.users.find(u => u.uuid === this.socket.getUuid());
    this.role = this.getInfo('role', this.player.role);
    this.prepareSettingsForRole();
    this.action = this.getInfo('action', this.player.action);
  }

  repeatMsg() {
    this.socket.sendMessage({
      topic: Topic.MAFIACHAT,
      data: {
        gameUuid: this.gameUuid,
        msg: {
          from: this.mafiaMessages[this.mafiaMessages.length - 1].from,
          content: this.randomText(),
        }
      }
    });
  }

  refreshData() {
    this.socket.sendMessage({
      topic: Topic.REFRESHDATA
    });
    this.didAction = false;
    // this.roleInitialized = false;
    // this.prepareSettingsForRole();
  }

  setRole(role: string) {
    this.player.role = role;
    this.role = this.getInfo('role', this.player.role);
    this.action = this.getInfo('action', this.player.action);
    this.displayedColumns = [];
    this.initialColumns.forEach(c => this.displayedColumns.push(c));
    this.roleInitialized = false;
    this.prepareSettingsForRole();
    this.didAction = false;
  }

//  button actions
  kill(user: User) {
    this.didAction = true;
    console.log(user);
    this.socket.sendMessage({
      topic: Topic.GAMEDATA,
      data: {gameUuid: this.gameUuid, action: 'kill', target: user.uuid}
    });
  }

  check(user: User) {
    this.didAction = true;

    this.socket.sendMessage({
      topic: Topic.GAMEDATA,
      data: {gameUuid: this.gameUuid, action: 'check', target: user.uuid}
    });
  }

  vote(user: User) {
    this.didAction = true;
    this.socket.sendMessage({
      topic: Topic.GAMEDATA,
      data: {gameUuid: this.gameUuid, action: 'vote', target: user.uuid, from: this.player.uuid}
    });
  }

  heal(user: User) {
    this.didAction = true;
    this.socket.sendMessage({
      topic: Topic.GAMEDATA,
      data: {gameUuid: this.gameUuid, action: 'heal', target: user.uuid}
    });
  }

  isMafia(element: any) {
    return (element.role === 'mafia') ? 'Mafia' : 'Nie mafia';
  }

  getPhase() {
    if (this.phase) {
      return this.infoService.getShowAndDescription('phase', this.phase);
    }
    return null;
  }

  setPhase(isDay: boolean) {
    this.phase = (isDay) ? Phase.DAY : Phase.NIGHT;
  }

  isDisabled(action: string) {
    if (this.winner !== '') {
      return true;
    }
    if (this.didAction) {
      return true;
    }
    switch (action) {
      case 'vote': {
        return this.phase === 'night';
      }
      case 'doctor': {
        return this.phase === 'day';
      }
      case 'mafia': {
        return this.phase === 'day';
      }
      case 'detective': {
        return this.phase === 'day';
      }
    }
  }


  // showWinner(won: string) {
  //   if (!this.showedWinner) {
  //     this.showedWinner = true;
  //     this.dialog.open(WinnerDialogComponent, {
  //       width: '250px',
  //       data: {winner: won}
  //     });
  //   }
  // }

  getWinner() {
    return (this.winner === 'mafia') ? 'Zwyciężyła Mafia !' : 'Zwyciężyło miasto !';
  }

  cleanStorage() {
    this.socket.cleanStorage();
  }
}

interface Message {
  from: string;
  to?: string;
  content: string;
}

interface EndGame {
  winner: string;
}

export enum Phase {
  DAY = 'day',
  NIGHT = 'night',
  // MAFIA = 'mafia',
  // DETECTIVE = 'detective',
  // DOCTOR = 'doctor',
  // VOTE = 'vote',
}
