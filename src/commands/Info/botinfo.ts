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
    const botId = client.id;
    if (!botId) {
      return;
    }
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
          .setTitle('Dymuse v3.0.0')
          .setDescription(
            `${bot} is an entertainment/utility bot made by Kortimu with some slight tweaks from the usual Discord bot.\n\n**Bot uptime:** ${uptime}\n**Last update:** \`30 Dec 2021\` \n\nIf you want to contribute or just see the source code, [here is the link](https://github.com/Kortimu/DylanBot) to the Github repository.`,
          )
          .setThumbnail(bot.avatarURL() || ''),
      ],
    });
  }
}
