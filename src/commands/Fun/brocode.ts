import { ApplyOptions } from '@sapphire/decorators';
import type { Args, CommandOptions } from '@sapphire/framework';
import BotCommand from '../../types/BotCommand';
import { Message, MessageEmbed } from 'discord.js';
import { sendLoadingMessage, pickRandom } from '../../lib/utils';
import { send } from '@sapphire/plugin-editable-commands';
import { broCode } from '../../lib/data/bro-code';

@ApplyOptions<CommandOptions>({
  description: 'Sends specific or random Bro Code rules.',
  fullCategory: ['Fun'],
  aliases: ['bcode', 'bro', 'thecode'],
  detailedDescription:
    'A command that sends either a specific Bro Code rule, a random one, or all of the rules.',
  preconditions: ['TestOnly'],
  syntax: '[1-27/all]',
  examples: ['brocode 21', 'bcode all', 'thecode'],
  notes: [
    'If no argument is specified, a random rule will be sent.',
    'If the user picks all rules, they get it sent in PMs, to not clutter the channel too much.',
  ],
})
export class UserCommand extends BotCommand {
  public async messageRun(message: Message, args: Args) {
    // Send loading message
    await sendLoadingMessage(message);

    const option = await args.pick('string').catch(() => '');
    await sendRule(option, message);
  }
}

async function sendRule(option: string, message: Message) {
  const ruleEmbed = new MessageEmbed().setColor('#FF00FF');
  let text = '';
  // Turns the argument into a number
  const selectedOption = Number(option);
  const parsedOption = selectedOption - 1;
  // Check if argument is between the first and last rule
  if (parsedOption < broCode.length && parsedOption >= 0) {
    return send(message, {
      embeds: [
        ruleEmbed.setTitle(`Rule #${selectedOption}`).setDescription(`${broCode[parsedOption]}`),
      ],
    });
  }
  // If specified, send all rules in PMs (less clutter)
  if (option === 'all') {
    let counter = 1;
    broCode.forEach((rule) => {
      text += `**Rule #${counter} -** ${rule}\n`;
      counter += 1;
    });
    send(message, {
      embeds: [
        new MessageEmbed()
          .setColor('#FF00FF')
          .setTitle('Bro code sent')
          .setDescription('...to PMs. No need to clutter the channel.'),
      ],
    });
    return message.author.send({
      embeds: [ruleEmbed.setTitle('The Bro Code').setDescription(text)],
    });
  }
  // Pick a random rule otherwise
  const randomRule = pickRandom(broCode);
  return send(message, {
    embeds: [
      ruleEmbed
        .setTitle(`Random rule: #${broCode.indexOf(randomRule) + 1}`)
        .setDescription(randomRule),
    ],
  });
}
