import { ApplyOptions } from '@sapphire/decorators';
import type { Args, CommandOptions } from '@sapphire/framework';
import BotCommand from '../../types/BotCommand';
import { Message, EmbedBuilder } from 'discord.js';
import { sendLoadingMessage } from '../../lib/utils';
import { send } from '@sapphire/plugin-editable-commands';
import { supportArray } from '../../lib/data/support-messages';

@ApplyOptions<CommandOptions>({
  description: '"Supports" the user emotionally.',
  fullCategory: ['Fun'],
  aliases: ['es', 'emotionalsupport'],
  detailedDescription:
    'A command that sends a random "supportive" message to a user of your choosing in their PMs.',
  cooldownDelay: 20000,
  syntax: '[target user]',
  examples: ['support', 'es <@355005049849643008>'],
  notes: [
    "Please don't take these messages seriously",
    'If no user is specified, the PM will be sent to the person that wrote the command.',
  ],
})
export class UserCommand extends BotCommand {
  public async messageRun(message: Message, args: Args) {
    // Find user in the message
    const targetUser = await args.pick('user').catch(() => message.author);
    // Send loading message
    await sendLoadingMessage(message);

    // Randomly picks 1 option out of the array
    const supportPick = Math.floor(Math.random() * supportArray.length);
    const support = supportArray[supportPick];

    // Sends the message in DMs
    targetUser.send({
      embeds: [
        new EmbedBuilder()
          .setColor('#FF00FF')
          .setTitle('Emotional Support Incoming!')
          .setDescription(`${support}\n\nHope it helped, ${targetUser}! <3`),
      ],
    });
    // Sends the message in the channel
    return send(message, {
      embeds: [
        new EmbedBuilder()
          .setColor('#FF00FF')
          .setTitle('Emotional Support Incoming!')
          .setDescription(`I have sent something "helpful" in DMs to ${targetUser}.`),
      ],
    });
  }
}
