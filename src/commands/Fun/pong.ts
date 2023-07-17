import { ApplyOptions } from '@sapphire/decorators';
import type { CommandOptions } from '@sapphire/framework';
import BotCommand from '../../types/BotCommand';
import { Message } from 'discord.js';
import { sendLoadingMessage } from '../../lib/utils';
import { send } from '@sapphire/plugin-editable-commands';
import { baseEmbed } from '../../lib/constants';

@ApplyOptions<CommandOptions>({
  description: 'yes',
  fullCategory: ['Fun'],
  aliases: ['pong', 'pong', 'pong'],
  detailedDescription: 'Do it.',
})
export class UserCommand extends BotCommand {
  public async messageRun(message: Message) {
    // Sends loading message
    await sendLoadingMessage(message);
    // Returns an embed with the link
    return send(message, {
      embeds: [
        baseEmbed
          .setTitle('oh wow')
          .setDescription(
            'You actually said it. Here is your reward: https://www.youtube.com/watch?v=dQw4w9WgXcQ',
          ),
      ],
    });
  }
}
