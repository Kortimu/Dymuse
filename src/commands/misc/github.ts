import { ApplyOptions } from '@sapphire/decorators';
import type { CommandOptions } from '@sapphire/framework';
import BotCommand from '../../types/BotCommand';
import { Message, MessageEmbed } from 'discord.js';
import { sendLoadingMessage } from '../../lib/utils';
import { send } from '@sapphire/plugin-editable-commands';

@ApplyOptions<CommandOptions>({
  description: "Sends a link of the bot's repository.",
  fullCategory: ['Misc'],
  aliases: ['githublink', 'git'],
  detailedDescription: 'A command that sends the link for the DylanBot Github repository.',
})
export class UserCommand extends BotCommand {
  public async messageRun(message: Message) {
    // Sends loading message
    await sendLoadingMessage(message);

    // Returns an embed with the link
    return send(message, {
      embeds: [
        new MessageEmbed()
          .setTitle('This bot has a Github page!')
          .setDescription('**Link:** https://github.com/Kortimu/DylanBot'),
      ],
    });
  }
}
