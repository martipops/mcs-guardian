# Guardian - Minecraft Discord Bot

A Discord bot that bridges Minecraft server chat and Discord channels.

## Features

- Real-time Minecraft chat relay to Discord
- Player join/leave notifications
- Configurable message filtering using RegEx

# Installation
First, download this repository and place the repo folder in your minecraft server (or wherever convenient as long as you modify the `config.json` later)

## Prerequisites
- Node.js

## Discord Bot Setup

1. Go to the [Discord Developer Portal](https://discord.com/developers/applications)
2. Click "New Application" and name your bot
3. Navigate to "Bot" section and click "Add Bot"
4. Copy the bot token (keep it secret and in a safe place for later)
5. Enable the "Message Content Intent" toggle in this section.
6. Go to the "Installation" section and copy that link.
7. Add `&scope=bot` to the end of the link. For example: 
  ```
  https://discord.com/oauth2/authorize?client_id=138512333765763&scope=bot
  ```
8. Open your modified link to add the bot to your discord server

## Configuration

```json
{
  "debug": true, // Enable debug logging
  "discord": {
    "token": "YOUR_BOT_TOKEN_HERE", // Your Discord bot token
    "channelId": "YOUR_CHANNEL_ID_HERE" // Discord channel ID (Right click channel and press "Copy Message ID")
  },
  "minecraft": {
    "rcon": {
      "host": "localhost", // Minecraft server host
      "port": 25575, // RCON port
      "password": "your_rcon_password" // RCON password
    },
    "logs": {
      "file_path": "../logs/latest.log", // Path to Minecraft server log file
      "message_whitelist": [ // Message filtering rules
        {
          "discord_message_prefix": "", // Prefix for Discord messages
          "regex": ".*\\[Server thread/INFO\\] \\[net.minecraft.server.MinecraftServer/\\]: \\<", // Chat message pattern to detect
          "remove_regex": "^.*\\]: " // Pattern to remove from message
        },
        {
          "discord_message_prefix": "", // Prefix for Discord messages
          "regex": "joined the game|left the game", // Join/leave message pattern
          "remove_regex": "^.*\\]: " // Pattern to remove from message
        }
      ]
    }
  }
}
```
## Running the Bot
```
npm install
npm run dev
```
