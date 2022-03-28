import { ApplyOptions } from '@sapphire/decorators';
import type { Args, CommandOptions } from '@sapphire/framework';
import BotCommand from '../../types/BotCommand';
import { Message, MessageEmbed } from 'discord.js';
import { pickRandom, sendLoadingMessage } from '../../lib/utils';
import { answers } from '../../lib/data/8-ball';
import { send } from '@sapphire/plugin-editable-commands';

@ApplyOptions<CommandOptions>({
  description: 'A typical 8-Ball.',
  fullCategory: ['Fun'],
  aliases: ['8-ball', '8b'],
  detailedDescription: 'A command that answers your deepest questions.',
  syntax: '[question]',
  examples: [
    '8ball is farting a good idea',
    '8-ball Should I spare the children?',
    '8b Are you sentient?',
  ],
  notes: ["Please don't take the answers as fact, the answer is LITERALLY random."],
})
export class UserCommand extends BotCommand {
  public async messageRun(message: Message, args: Args) {
    // Sends loading message
    await sendLoadingMessage(message);
    const question = await args.rest('string').catch(() => '');
    answerQuestion(message, question);
  }
}

// Picks a random response from 8-ball.ts. If nothing is specified, change text accordingly.
async function answerQuestion(message: Message, question: string) {
  const answerEmbed = new MessageEmbed()
    .setColor('#FF00FF')
    .setTitle(`My answer to "${question}" is...`)
    .setDescription(`**${pickRandom(answers)}**`)
    .setFooter({
      text: 'Even if you entered gibberish, I can still read your mind.'
    });
  if (question === '') {
    answerEmbed
      .setTitle('Reading your mind, my answer is...')
      .setFooter({
        text: 'No need to hide the question - I read your mind to answer.'
      });
  }
  await send(message, {
    embeds: [answerEmbed],
  });
  message.delete();
}
