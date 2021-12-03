import { ApplyOptions } from '@sapphire/decorators';
import type { CommandOptions } from '@sapphire/framework';
import BotCommand from '../../types/BotCommand';
import { Message, MessageEmbed } from 'discord.js';
import { sendLoadingMessage } from '../../lib/utils';
import { send } from '@sapphire/plugin-editable-commands';

@ApplyOptions<CommandOptions>({
  description: 'Gives additional information about the bot.',
  fullCategory: ['Info'],
  aliases: ['bi', 'botinfo', 'bot'],
  detailedDescription:
    'A command that provides the user with additional information about the bot, such as the creation date, features and more.',
})
export class UserCommand extends BotCommand {
  public async messageRun(message: Message) {
    // Sends loading message
    await sendLoadingMessage(message);
    // Gets bot's info
    const botId = '864115909513969675';
    if (!message.client) {
      return;
    }
    const bot = message.client.users.cache.get(botId);
    if (!bot) {
      return;
    }

    // Returns an embed with the info
    return send(message, {
      embeds: [
        new MessageEmbed()
          .setColor('#FF00FF')
          .setTitle('DylanBot v2.0.1')
          .setDescription(
            `${bot} is a bot made for Dylan, the owner of \`The Shag Syndicate\`. It has:\n- Multiple fun and useful (who am I kidding, mostly fun) commands\n- Leaderboards\n- Levels and more!\n\nGithub link: https://github.com/Kortimu/DylanBot`,
          )
          .setThumbnail(bot.avatarURL() || ''),
      ],
    });
  }
}
