import { ApplyOptions } from '@sapphire/decorators';
import { Command, CommandOptions } from '@sapphire/framework';
import { send } from '@sapphire/plugin-editable-commands';
import { Message, MessageEmbed } from 'discord.js';
import { sendLoadingMessage } from '../../lib/utils';

@ApplyOptions<CommandOptions>({
  description: 'ping pong',
  fullCategory: ['Misc'],
  aliases: ['p'],
  detailedDescription:
    'A command used to see the latency of the bot, as well as being a general test command. It has basically no use besides the occasional lag check.',
})
export class UserCommand extends Command {
  public async messageRun(message: Message) {
    // Sends loading message
    const msg = await sendLoadingMessage(message);

    // Sends a questionably rude ping message back
    return send(message, {
      embeds: [
        new MessageEmbed()
          .setTitle('Oh, you want some dumb phrase like "Pong!" back? No. Fuck you.')
          .addFields(
            {
              name: 'The amount of time wasted on your device (very cringe):',
              value: `${Math.round(this.container.client.ws.ping)} ms`,
            },
            {
              name: 'Framework moment:',
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
