import * as net from 'net';
import { appConfig } from '..';

type RconResponseHandler = (type: number, response: string) => void;

class RconClient {
  private socket: net.Socket | null = null;
  private timeout: number = 5000;
  private nextId: number = 0;
  private packages: { [id: number]: RconResponseHandler } = {};

  public connected: boolean = false;
  public authed: boolean = false;

  constructor(
    public host: string,
    public port: number,
    public password: string,
  ) {}

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.socket = net.connect(this.port, this.host, async () => {
        this.connected = true;
        if (appConfig.debug) {
          console.log(`[DEBUG] Connected to ${this.host}:${this.port}`);
        }
        try {
          await this.authenticate();
          resolve();
        } catch (err) {
          reject(err);
        }
      });

      this.socket.on('data', (data: Buffer) => this.handleData(data));
      this.socket.on('error', (err) => {
        this.connected = false;
        reject(err);
      });
      this.socket.on('close', () => {
        this.connected = false;
        if (appConfig.debug) {
          console.log('[DEBUG] Rcon connection closed');
        }
      });
    });
  }

  private handleData(data: Buffer) {
    const id = data.readInt32LE(4);
    const type = data.readInt32LE(8);
    const response = data.toString('utf8', 12, data.length - 2);

    if (this.packages[id]) {
      this.packages[id](type, response);
      delete this.packages[id];
    } else if (appConfig.debug) {
      console.log('[DEBUG] Unexpected RCON response', { id, type, response });
    }
  }

  private authenticate(): Promise<void> {
    if (this.authed) return Promise.resolve();

    return this.sendPackage(3, this.password).then(() => {
      this.authed = true;
      if (appConfig.debug) {
        console.log(`[DEBUG] Authenticated with ${this.host}:${this.port}`);
      }
    });
  }

  disconnect() {
    this.connected = false;
    this.authed = false;
    if (this.socket) {
      this.socket.end();
      this.socket = null;
    }
  }

  async sendCommand(cmd: string): Promise<string> {
    if (!this.authed) {
      throw new Error('Not authenticated');
    }
    return this.sendPackage(2, cmd);
  }

  private sendPackage(type: number, payload: string): Promise<string> {
    if (!this.connected || !this.socket) {
      return Promise.reject('Not connected');
    }

    const id = this.nextId++;
    const length = 14 + Buffer.byteLength(payload);
    const buff = Buffer.alloc(length);

    buff.writeInt32LE(length - 4, 0);
    buff.writeInt32LE(id, 4);
    buff.writeInt32LE(type, 8);
    buff.write(payload, 12);
    buff.writeInt8(0, length - 2);
    buff.writeInt8(0, length - 1);

    this.socket.write(buff);

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        delete this.packages[id];
        reject('RCON server did not respond in time');
      }, this.timeout);

      this.packages[id] = (respType, response) => {
        clearTimeout(timeout);
        if (respType === -1) {
          return reject('Authentication failed');
        }
        resolve(response);
      };
    });
  }
}

export default RconClient;