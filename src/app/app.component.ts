import {Component, HostListener, OnInit} from '@angular/core';
import {Comp, SocketioService} from './socketio.service';
import {Topic} from './model/topic';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {

  constructor(private socket: SocketioService) {
  }

  ngOnInit() {
    this.socket.init();
  }

  uuid() {
    return this.socket.getUuid();
  }

  cleanStorage() {
    this.socket.cleanStorage();
  }

}


