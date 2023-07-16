import { ApplyOptions } from '@sapphire/decorators';
import type { Command, CommandOptions } from '@sapphire/framework';
import BotCommand from '../../types/BotCommand';
import { EmbedBuilder } from 'discord.js';
import { pickRandom, sendLoadingInteraction } from '../../lib/utils';
import { answers } from '../../lib/data/8ball-answers';

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
  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand((builder) => {
      builder
        .setName(this.name)
        .setDescription(this.description)
        .addStringOption((option) =>
          option
            .setName('question')
            .setDescription('The question to ask the all-knowing 8-ball.')
            .setRequired(true),
        ),
        { guildIds: ['864115119721676820'] };
    });
  }

  public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
    await sendLoadingInteraction(interaction);

    const question = interaction.options.get('question');

    if (!question) {
      return interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setColor('#ff00ff')
            .setTitle('No question? Sure, I can read your mind anyways. The 8-ball says...')
            .setDescription('Mate, you did not put in a question. '),
        ],
      });
    }

    return interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setTitle(`My 8-ball says that the answer to "${question.value}" is...`)
          .setDescription(`**${pickRandom(answers)}**`)
          .setColor('#ff00ff')
          .setThumbnail('https://canary.discord.com/assets/0cfd4882c0646d504900c90166d80cf8.svg')
          .setFooter({
            text: "Don't even try entering gibberish.",
          }),
      ],
    });
  }
}
