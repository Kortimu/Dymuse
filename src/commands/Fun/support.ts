import { ApplyOptions } from '@sapphire/decorators';
import type { Command, CommandOptions } from '@sapphire/framework';
import BotCommand from '../../types/BotCommand';
import { pickRandom, sendLoadingInteraction } from '../../lib/utils';
import { supportArray } from '../../lib/data/support-messages';
import { baseEmbedFormat } from '../../lib/constants';

@ApplyOptions<CommandOptions>({
  description: '"Supports" the user emotionally.',
  fullCategory: ['Fun'],
  aliases: ['es', 'emotionalsupport'],
  detailedDescription:
    'A command that sends a random "supportive" message to a user of your choosing in their PMs.',
  cooldownDelay: 300 * 1000,
  syntax: '[target user]',
  examples: ['support', 'es <@355005049849643008>'],
  notes: [
    "Please don't take these messages seriously",
    'If no user is specified, the PM will be sent to the person that wrote the command.',
  ],
})
export class UserCommand extends BotCommand {
  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand((builder) => {
      builder
        .setName(this.name)
        .setDescription(this.description)
        .addUserOption((option) =>
          option
            .setName('target')
            .setDescription(
              'A user you may wish to send support to. If left empty, you will be the target.',
            )
            .setRequired(false),
        ),
        { guildIds: ['864115119721676820'] };
    });
  }

  public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
    await sendLoadingInteraction(interaction);
    const supportiveMessage = baseEmbedFormat()
      .setTitle("Need some help? Here's a useful message!")
      .setDescription(pickRandom(supportArray));

    const target = interaction.options.getUser('target');
    if (!target) {
      return interaction.editReply({
        embeds: [supportiveMessage],
      });
    }

    supportiveMessage.setTitle("Need some help? No? Who cares, here's a useful message someone requested!");
    await target.send({
      embeds: [supportiveMessage],
    });
    return interaction.editReply({
      embeds: [
        baseEmbedFormat()
          .setTitle('Message sent!')
          .setDescription('The user is now enjoying one of the many wisdoms I have to offer.'),
      ],
    });
  }
}
