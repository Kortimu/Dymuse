import { ApplyOptions } from '@sapphire/decorators';
import type { Args, CommandOptions } from '@sapphire/framework';
import BotCommand from '../../types/BotCommand';
import { Message } from 'discord.js';
import { sendLoadingMessage } from '../../lib/utils';
import { send } from '@sapphire/plugin-editable-commands';
import { baseEmbed, errorEmbed } from '../../lib/constants';

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
    // By default, dice is with 6 sides
    const size = await args.pick('number').catch(() => 6);
    rollDice(message, size);
  }
}

async function rollDice(message: Message, size: number) {
  const result = Math.ceil(Math.random() * size);
  // Checks for non-existant dice
  if (size <= 0) {
    return send(message, {
      embeds: [errorEmbed.setDescription('What kind of dice are you trying to roll?!')],
    }).then((msg) => {
      message.delete();
      setTimeout(() => {
        msg.delete();
      }, 5 * 1000);
    });
  }
  return send(message, {
    embeds: [
      baseEmbed
        .setTitle(`You rolled a ${size} side dice...`)
        .setDescription(`...and rolled a **${result}**`),
    ],
  }).then(() => {
    message.delete();
  });
}
