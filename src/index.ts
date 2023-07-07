import { ActivityType } from 'discord.js';
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
    'Guilds',
    'GuildMembers',
    'GuildBans',
    'GuildEmojisAndStickers',
    'GuildVoiceStates',
    'GuildMessages',
    'GuildMessageReactions',
    'DirectMessages',
    'DirectMessageReactions',
    'MessageContent',
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
