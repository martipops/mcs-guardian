import { Client, Events, GatewayIntentBits, TextChannel, Message } from "discord.js";
import { appConfig } from "..";

export class DiscordBridge {
  private client: Client;
  private channelId: string;

  constructor(channelId?: string) {
    this.channelId = channelId ?? appConfig.discord.channelId;
    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
      ],
    });
  }

  async start() {
    await this.client.login(appConfig.discord.token);
  }

  public registerEvents(onDiscordMessage: (msg: Message) => void) {
    this.client.once(Events.ClientReady, readyClient => {
      console.log(`Ready! Logged in as ${readyClient.user.tag}`);
    });

    this.client.on(Events.MessageCreate, (message: Message) => {
      if (message.author.bot) return;
      onDiscordMessage(message);
    });
  }

  async sendMessage(content: string) {
    const channel = await this.getChannel();
    if (!channel) throw new Error("Discord channel not found or not a text channel.");
    await channel.send(content);
  }

  private async getChannel(): Promise<TextChannel | null> {
    const channel = await this.client.channels.fetch(this.channelId);
    if (channel && channel.isTextBased()) {
      return channel as TextChannel;
    }
    return null;
  }
}