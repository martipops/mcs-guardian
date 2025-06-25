import * as appConfigJson from '../config.json';
import { DiscordBridge } from './discord/client';
import { LogWatcher } from './minecraft/logWatcher';
import RconClient from './minecraft/rcon';
import { Message } from 'discord.js';
import { debugLog } from './utils';

export const appConfig = appConfigJson;

// RCON client instance
const { host, port, password } = appConfig.minecraft.rcon;
const rcon = new RconClient(host, port, password);

async function connectRcon(): Promise<void> {
  if (!rcon.connected) {
    await rcon.connect();
  }
}

// Send a message to the Minecraft server from Discord
async function sendToMc(message: Message): Promise<string> {
  debugLog(`Sending message to MC: ${message.content}`, 'Middleman');
  await connectRcon();
  const tellrawMessageJson = [ 
    {
      text: `@${message.author.displayName}: `,
      color: 'light_purple',
    },
    {
      text: message.content,
      color: 'white',
    }
  ]
  const tellrawMessage = JSON.stringify(tellrawMessageJson);
  return rcon.sendCommand(`tellraw @a ${tellrawMessage}`);
}

async function receiveFromMc(message: string, prefix: string) {
  debugLog(`Receiving message from MC: ${message}`, 'Middleman');
  await discord.sendMessage(`${prefix} ${message}`);
}

const discord = new DiscordBridge();
const logWatcher = new LogWatcher();

discord.start();

discord.registerEvents(sendToMc);
logWatcher.registerCallback(receiveFromMc);

process.on('SIGINT', () => {
  logWatcher.close();
  rcon.disconnect();
  process.exit();
});