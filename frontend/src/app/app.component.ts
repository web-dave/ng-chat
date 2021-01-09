import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { from, Subject } from 'rxjs';
import { mergeMap, takeUntil, tap } from 'rxjs/operators';
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
  myPeer!: IPeerJs;
  peers: {
    [id: string]: any;
  } = {};
  id: string = '';
  constructor(private cdr: ChangeDetectorRef) {}
  ngOnInit(): void {
    this.socket.pipe(takeUntil(this.end$)).subscribe((m) => {
      switch (m.type) {
        case 'connection':
          if (m.message === 'Welcome') {
            const name = prompt('Whats your name?');
            console.log(name);
            this.id = m.id;
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
      .pipe(
        tap((stream) => (this.localStream = stream)),
        mergeMap(() =>
          // @ts-ignore
          from(import('./../assets/peer.js'))
        )
      )
      .pipe(takeUntil(this.end$))
      .subscribe((data) => {
        this.myPeer = new data.default(this.id) as IPeerJs;
        this.myPeer.on('open', (id) => {
          console.log(id);
        });
        // this.myPeer.on('call', (call) => {
        //   call.answer(this.localStream);
        //   call.on('stream', (stream: MediaStream) => {
        //     this.remoteStreams.push(stream);
        //   });
        // });
      });
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

export interface IPeerJs {
  connections: any;
  destroyed: boolean;
  disconnected: boolean;
  id: string;
  open: boolean;
  options: {
    config: { iceServers: any[]; sdpSemantics: string };
    debug: number;
    host: string;
    key: string;
    path: string;
    port: number;
    secure: boolean;
    token: string;
  };
  socket: WebSocket;
  on(
    event:
      | 'signal'
      | 'stream'
      | 'connect'
      | 'open'
      | 'call'
      | 'data'
      | 'track'
      | 'close'
      | 'error',
    fn: {
      (param1?: any, param2?: any): void;
    }
  ): void;
  call(id: string, stream: MediaStream, options?: any): any;
}
