import { ApplyOptions } from '@sapphire/decorators';
import type { Command, CommandOptions } from '@sapphire/framework';
import BotCommand from '../../types/BotCommand';
import { sendLoadingInteraction } from '../../lib/utils';
import { broCode } from '../../lib/data/bro-code';
import { baseEmbedFormat } from '../../lib/constants';
import { BroCodePaginatedMessage } from '../../lib/structures/BroCodePaginatedMessage';

@ApplyOptions<CommandOptions>({
  description: 'Sends specific or random Bro Code rules.',
  fullCategory: ['Fun'],
  aliases: ['bcode', 'bro', 'thecode'],
  detailedDescription:
    'A command that sends either a specific Bro Code rule, a random one, or all of the rules.',
  syntax: '[1-27/all]',
  examples: ['brocode 21', 'bcode all', 'thecode'],
  notes: [
    'If no argument is specified, a random rule will be sent.',
    'If the user picks all rules, they get it sent in PMs, to not clutter the channel too much.',
  ],
})
export class UserCommand extends BotCommand {
  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand((builder) => {
      builder.setName(this.name).setDescription(this.description)
      .addNumberOption((option) =>
        option
          .setName('rule')
          .setDescription('The number of the rule to request. If left empty, a random rule will be chosen.')
          .setMinValue(1)
          .setMaxValue(broCode.length)
        ),
        { guildIds: ['864115119721676820'] };
    });
  }

  public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
    await sendLoadingInteraction(interaction);
    const paginator = new BroCodePaginatedMessage()

    broCode.forEach((rule) => {
      paginator.addPageEmbed(
        baseEmbedFormat()
          .setTitle(`Rule #${broCode.indexOf(rule) + 1}`)
          .setDescription(`${rule}`)
      )
    })

    const ruleNumber = interaction.options.getNumber('rule') ?? Math.ceil(Math.random() * paginator.pages.length)
    paginator.setIndex(Math.floor(ruleNumber) - 1)

    paginator.run(interaction)
  }
}
