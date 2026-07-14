declare module 'ws' {
  import { EventEmitter } from 'events';
  export type RawData = any;
  export namespace WebSocket {
    export type RawData = any;
  }
  export default class WebSocket extends EventEmitter {
    public static OPEN: number;
    public readyState: number;
    send(data: any): void;
    close(): void;
  }
  export class WebSocketServer extends EventEmitter {
    constructor(opts: any);
    on(evt: string, cb: (...args: any[]) => void): this;
    close(cb?: () => void): void;
  }
}
