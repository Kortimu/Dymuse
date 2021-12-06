import { ApplyOptions } from '@sapphire/decorators';
import type { Args, CommandOptions } from '@sapphire/framework';
import BotCommand from '../../types/BotCommand';
import { Message, MessageEmbed } from 'discord.js';
import { sendLoadingMessage } from '../../lib/utils';
import { send } from '@sapphire/plugin-editable-commands';

@ApplyOptions<CommandOptions>({
  description: 'Rolls a dice.',
  fullCategory: ['Fun'],
  aliases: ['diceroll', 'dice'],
  detailedDescription: 'A command that rolls a dice.',
  syntax: '[size of dice]',
  examples: ['?rolldice 20', '?dice', '?diceroll 100000'],
  notes: ['By default, the dice has 6 sides.'],
})
export class UserCommand extends BotCommand {
  public async messageRun(message: Message, args: Args) {
    // Sends loading message
    await sendLoadingMessage(message);
    const size = await args.pick('number').catch(() => 6);
    rollDice(message, size);
  }
}

async function rollDice(message: Message, size: number) {
  const result = Math.ceil(Math.random() * size);
  if (size <= 0) {
    return send(message, {
      embeds: [
        new MessageEmbed()
          .setColor('#FF0000')
          .setTitle('Error')
          .setDescription('What kind of dice are you trying to roll?!'),
      ],
    }).then((msg) => {
      message.delete();
      setTimeout(() => {
        msg.delete();
      }, 5 * 1000);
    });
  }
  return send(message, {
    embeds: [
      new MessageEmbed()
        .setColor('#FF00FF')
        .setTitle(`You rolled a ${size} side dice...`)
        .setDescription(`...and rolled a **${result}**`),
    ],
  }).then(() => {
    message.delete();
  });
}
