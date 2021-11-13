import { ApplyOptions } from '@sapphire/decorators';
import { Command, CommandOptions } from '@sapphire/framework';
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
export class UserCommand extends Command {
  public async messageRun(message: Message) {
    // Sends loading message
    await sendLoadingMessage(message);
    // Gets bot's info
    const botId = '864115909513969675';
    if (!message.client) {
      return;
    }
    const bot = message.client.users.cache.get(botId);

    // Returns an embed with the info
    return send(message, {
      embeds: [
        new MessageEmbed()
          .setColor('#FF00FF')
          .setTitle('Information about the bot:')
          .setDescription(
            `${bot} is a bot made for the Dylan, the owner of \`The Shag Syndicate\`. It has:\n- Multiple fun and useful commands\n- Features tailored to the server\nAnd more!`,
          ),
      ],
    });
  }
}
