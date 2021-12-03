import { ApplyOptions } from '@sapphire/decorators';
import type { CommandOptions } from '@sapphire/framework';
import BotCommand from '../../types/BotCommand';
import { send } from '@sapphire/plugin-editable-commands';
import { Message, MessageEmbed } from 'discord.js';
import { sendLoadingMessage } from '../../lib/utils';

@ApplyOptions<CommandOptions>({
  description: 'ping pong',
  fullCategory: ['Misc'],
  aliases: ['p'],
  detailedDescription: 'A simple ping command with a small twist.',
})
export class UserCommand extends BotCommand {
  public async messageRun(message: Message) {
    // Sends loading message
    const msg = await sendLoadingMessage(message);

    // Sends a ping message back
    return send(message, {
      embeds: [
        new MessageEmbed()
          .setTitle('Do I really have to say it?')
          .addFields(
            {
              name: 'Bot latency (very cringe):',
              value: `${Math.round(this.container.client.ws.ping)} ms`,
            },
            {
              name: 'Framework latency (equally boring):',
              value: `${
                (msg.editedTimestamp || msg.createdTimestamp) -
                (message.editedTimestamp || message.createdTimestamp)
              } ms`,
            },
          )
          .setColor('#00FF00'),
      ],
    });
  }
}
