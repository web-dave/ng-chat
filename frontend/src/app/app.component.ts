import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { WebSocketSubject } from 'rxjs/webSocket';

interface IMsg {
  type: 'connection' | 'message';
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
  id: string;
  constructor(private cdr: ChangeDetectorRef) {}
  ngOnInit(): void {
    this.socket.pipe(takeUntil(this.end$)).subscribe((m) => {
      switch (m.type) {
        case 'connection':
          if (m.message === 'Welcome') {
            this.id = m.id;
          }
          break;
        case 'message':
          this.messages.push(m);
          break;
      }
    });
  }

  sendMessage() {
    this.socket.next({ type: 'message', id: this.id, message: this.msg });
    this.msg = '';
  }
  ngOnDestroy() {
    this.end$.next(1);
  }
}
