import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { from, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { WebSocketSubject } from 'rxjs/webSocket';

interface IMsg {
  type: 'connection' | 'message' | 'join' | 'leave';
  message: string;
  id: string;
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'frontend';
  msg: string = '';
  messages: IMsg[] = [];
  end$ = new Subject();
  room = '';
  socket = new WebSocketSubject<IMsg>('ws://localhost:3002');
  name: string = '';
  localStream: MediaStream;
  remoteStreams: MediaStream[] = [];
  constructor(private cdr: ChangeDetectorRef) {}
  ngOnInit(): void {
    this.socket.pipe(takeUntil(this.end$)).subscribe((m) => {
      switch (m.type) {
        case 'connection':
          if (m.message === 'Welcome') {
            const name = prompt('Whats your name?');
            console.log(name);
            if (name) {
              this.name = name;
              this.sendMessage(this.name, 'connection');
            }
          }
          break;
        case 'message':
          this.messages.push(m);
          break;
      }
    });
  }

  initVideo() {
    from(navigator.mediaDevices.getUserMedia({ audio: false, video: true }))
      .pipe(takeUntil(this.end$))
      .subscribe((stream) => (this.localStream = stream));
  }

  sendMessage(
    message: string,
    type: 'connection' | 'message' | 'join' | 'leave' = 'message'
  ) {
    this.socket.next({ type, id: this.room, message });
    this.msg = '';
  }
  joinRoom() {
    const room = prompt('Please enter Room Name');
    if (room) {
      this.room = room;
      this.sendMessage(this.room, 'join');
      this.initVideo();
    }
  }

  ngOnDestroy() {
    this.end$.next(1);
  }
}
