import { appConfig } from "..";
import * as fs from 'fs';
import * as readline from 'readline';
import { debugLog } from "../utils";
import { WhitelistEntry } from "../typings";


type LogCallback = (message: string, prefix: string) => void;

export class LogWatcher {
  private filePath: string = appConfig.minecraft.logs.file_path;
  private whitelist: WhitelistEntry[] = appConfig.minecraft.logs.message_whitelist;
  private fileSize: number = 0;
  private watcher: fs.FSWatcher | null = null;
  private callbacks: LogCallback[] = [];

  constructor() {
    this.init();
  }

  public async registerCallback(callback: LogCallback) {
    this.callbacks.push(callback);
  }

  public async unregisterCallback(callback: LogCallback) {
    this.callbacks = this.callbacks.filter(cb => cb !== callback);
  }

  private async init() {
    try {
      const stats = fs.statSync(this.filePath);
      this.fileSize = stats.size;
    } catch (err) {
      console.error(`[LogWatcher] Could not stat log file: ${err}`);
      return;
    }
    this.watcher = fs.watch(this.filePath, (eventType) => {
      if (eventType === 'change') {
        this.processNewLines();
      }
    });
  }

  private processNewLines() {
    fs.stat(this.filePath, (err, stats) => {
      if (err) return;
      if (stats.size < this.fileSize) {
        this.fileSize = 0; // Log rotated or truncated
      }
      if (stats.size > this.fileSize) {
        const stream = fs.createReadStream(this.filePath, {
          start: this.fileSize,
          end: stats.size
        });
        const rl = readline.createInterface({ input: stream });
        rl.on('line', (line) => this.handleLine(line));
        rl.on('close', () => {
          this.fileSize = stats.size;
        });
      }
    });
  }

  private handleLine(line: string) {
    debugLog(`Processing log line: ${line}`, 'LogWatcher');
    const entry = this.whitelist.find(entry => new RegExp(entry.regex).test(line));
    if (!entry) return;

    let formattedLine = line;
    if (entry.remove_regex) {
      const removeRegex = new RegExp(entry.remove_regex, "g");
      formattedLine = formattedLine.replace(removeRegex, "");
    }

    this.callbacks.forEach(callback => callback(formattedLine, entry.discord_message_prefix));
  }

  public close() {
    if (this.watcher) {
      this.watcher.close();
      this.watcher = null;
    }
  }
}