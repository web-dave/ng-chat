import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { from, Subject } from 'rxjs';
import { mergeMap, takeUntil, tap } from 'rxjs/operators';
import { WebSocketSubject } from 'rxjs/webSocket';
type IMsgType = 'connection' | 'message' | 'join' | 'leave' | 'available';
interface IMsg {
  type: IMsgType;
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
  socket = new WebSocketSubject<IMsg>('ws://localhost:3002');
  _room = '';
  room = '';
  _name: string = '';
  name: string = '';
  localStream: MediaStream;
  remoteStreams: MediaStream[] = [];
  myPeer!: IPeerJs;
  peers: {
    [id: string]: any;
  } = {};
  id: string = '';
  remoteNames: string[] = [];
  constructor(private cdr: ChangeDetectorRef) {}
  ngOnInit(): void {
    this.socket.pipe(takeUntil(this.end$)).subscribe(
      (m) => {
        switch (m.type) {
          case 'connection':
            if (m.message === 'Welcome') {
              this.id = m.id;
            }
            break;
          case 'message':
            this.messages.push(m);
            break;
          case 'available':
            const call = this.myPeer.call(m.id, this.localStream);
            this.connectToNewUser(call);
            break;
          case 'leave':
            this.peers[m.id]?.close();
            break;
        }
      },
      (err) => {
        console.error(err);
        this.name = '';
        this.room = '';
      },
      () => console.info('CLOSED')
    );
  }

  setName(v) {
    if (v) {
      this.name = v;
      this.sendMessage(this.name, 'connection');
    }
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
        this.myPeer = new data.default(this.name) as IPeerJs;
        this.myPeer.on('open', (id) => {
          console.log(id);
        });
        this.myPeer.on('call', (call) => {
          call.answer(this.localStream);
          this.connectToNewUser(call);
        });
      });
  }

  startCall() {
    this.sendMessage(this.name, 'available');
  }

  sendMessage(message: string, type: IMsgType = 'message') {
    this.socket.next({ type, id: this.room, message });
    this.msg = '';
  }
  setRoom(v) {
    if (v) {
      this.room = v;
      this.sendMessage(this.room, 'join');
      this.initVideo();
    }
  }

  connectToNewUser(call: any) {
    console.log(call.peer);
    call.on('stream', (stream: MediaStream) => {
      this.remoteStreams.push(stream);
      this.peers[call.peer] = call;
      this.remoteNames = Object.keys(this.peers);
      console.log(this.remoteNames);
    });
    call.on('close', () => {
      this.peers[call.peer].close();
    });

    console.log(this.peers);
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
