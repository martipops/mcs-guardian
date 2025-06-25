export interface AppConfig {
  debug: boolean;
  rcon: {
    host: string;
    port: number;
    password: string;
  };
  discord: {
    token: string;
    channelId: string;
  };
}

interface WhitelistEntry {
  discord_message_prefix: string;
  regex: string;
  remove_regex?: string;
}