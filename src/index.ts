import { ActivityType, GatewayIntentBits, Partials } from 'discord.js';
import './lib/setup';
import { LogLevel, SapphireClient } from '@sapphire/framework';

export const client = new SapphireClient({
  defaultPrefix: '?',
  regexPrefix: /^(hey +)?bot[,! ]/i,
  caseInsensitiveCommands: true,
  logger: {
    level: LogLevel.Debug,
  },
  shards: 'auto',
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildModeration,
    GatewayIntentBits.GuildEmojisAndStickers,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.DirectMessageReactions,
    GatewayIntentBits.MessageContent
  ],
  partials: [
    Partials.Channel
  ],
  presence: {
    status: 'online',
    activities: [
      {
        name: 'TikTok compilations',
        type: ActivityType.Watching,
      },
    ],
  },
  loadMessageCommandListeners: true,
});

const main = async () => {
  try {
    client.logger.info('Logging in...');
    await client.login();
    client.logger.info('Logged in!');
  } catch (error) {
    client.logger.fatal(error);
    client.destroy();
    process.exit(1);
  }
};

main();
