import { ApplyOptions } from '@sapphire/decorators';
import type { CommandOptions, Command } from '@sapphire/framework';
import BotCommand from '../../types/BotCommand';
import { sendLoadingInteraction } from '../../lib/utils';
import { baseEmbedFormat } from '../../lib/constants';

@ApplyOptions<CommandOptions>({
  description: 'A simple test command.',
  fullCategory: ['Info'],
  aliases: ['p'],
  detailedDescription: 'A simple test command with some latency information and a dumb secret.',
})
export class UserCommand extends BotCommand {
  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand((builder) => {
      builder.setName(this.name).setDescription(this.description),
        { guildIds: ['864115119721676820'] };
    });
  }

  public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
    await sendLoadingInteraction(interaction);

    return interaction.editReply({
      embeds: [
        baseEmbedFormat()
          .setTitle('something something pong')
          .addFields(
            {
              name: 'Bot latency (very cringe):',
              value: `${Math.round(this.container.client.ws.ping)} ms`,
            },
            // {
            //   name: 'Framework latency (equally boring):',
            //   value: `${
            //     (interaction.createdTimestamp) -
            //     (loadInteraction.createdTimestamp)
            //   } ms`,
            // },
          )
          .setColor('#00FF00'),
      ],
    });
    // TODO: Do a silly thing with "pong" (maybe check if "pong" was added after the command (e.g. /ping pong)?)
  }
}
