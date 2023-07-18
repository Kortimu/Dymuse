import { ApplyOptions } from '@sapphire/decorators';
import type { Command, CommandOptions } from '@sapphire/framework';
import BotCommand from '../../types/BotCommand';
import { pickRandom, sendLoadingInteraction } from '../../lib/utils';
import { baseEmbedFormat, loadEmbedFormat } from '../../lib/constants';

@ApplyOptions<CommandOptions>({
  description: 'Flips a coin.',
  fullCategory: ['Fun'],
  aliases: ['flipcoin', 'coin'],
  detailedDescription: 'A command that flips a coin.',
  notes: ['The art is temporary. When I figure out how to do a crown, I will remake it.'],
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

    await interaction
      .editReply({
        embeds: [
          loadEmbedFormat()
            .setTitle('Flipping coin...')
            .setDescription('haha coin go brrr')
            .setImage('https://cdn.discordapp.com/emojis/916815063673896960.gif?size=64'),
        ],
      })
      .then(() => {
        setTimeout(async () => {
          const results = ['heads', 'tails'];
          const result = pickRandom(results);
          const resultEmbed = baseEmbedFormat()
            .setTitle('The coin landed on...')
            .setDescription(`...${result}`);
          if (result === 'heads') {
            resultEmbed.setImage(
              'https://cdn.discordapp.com/emojis/917122876170174504.png?size=64',
            );
          } else {
            resultEmbed.setImage(
              'https://cdn.discordapp.com/emojis/917122876153409626.png?size=64',
            );
          }
          return await interaction.editReply({
            embeds: [resultEmbed],
          });
        }, 1.5 * 1000);
      });
  }
}
