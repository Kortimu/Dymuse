import { ApplyOptions } from '@sapphire/decorators';
import type { CommandOptions } from '@sapphire/framework';
import BotCommand from '../../types/BotCommand';
import { Message, MessageEmbed } from 'discord.js';
import { sendLoadingMessage } from '../../lib/utils';
import { send } from '@sapphire/plugin-editable-commands';
import { client } from '../../index';
import { formatSeconds } from '../../lib/constants';

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
    if (!message.client || !client.uptime) {
      return;
    }
    const bot = message.client.users.cache.get(botId);
    if (!bot) {
      return;
    }
    const uptime = formatSeconds(Math.floor(client.uptime / 1000));

    // Returns an embed with the info
    return send(message, {
      embeds: [
        new MessageEmbed()
          .setColor('#FF00FF')
          .setTitle('DylanBot v2.1.1')
          .setDescription(
            `${bot} is a bot made for Dylan, the owner of \`The Shag Syndicate\`. This bot is still in development, and a lot might (and will) change.\n\n**Bot uptime:** ${uptime}\n\n If you want to contribute for some reason, here is the link to the [Github repository.](https://github.com/Kortimu/DylanBot)`,
          )
          .setThumbnail(bot.avatarURL() || ''),
      ],
    });
  }
}
