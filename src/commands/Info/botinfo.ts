import { ApplyOptions } from '@sapphire/decorators';
import type { Command, CommandOptions } from '@sapphire/framework';
import BotCommand from '../../types/BotCommand';
import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { sendLoadingInteraction } from '../../lib/utils';
import { client } from '../..';
import { baseEmbedFormat, formatSeconds } from '../../lib/constants';

@ApplyOptions<CommandOptions>({
  description: 'Gives additional information about the bot.',
  fullCategory: ['Info'],
  aliases: ['bi', 'botinfo', 'bot'],
  detailedDescription:
    'A command that provides the user with additional information about the bot, such as the creation date, features and more.',
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

    // Get the required bot information, check if it is available
    const botId = client.id;
    if (!botId) {
      return;
    }
    const bot = client.users.cache.get(botId);
    if (!bot || !client.uptime) {
      return;
    }

    const botUptime = formatSeconds(Math.floor(client.uptime / 1000));

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setLabel('🌐 Github Repository')
        .setURL('https://www.github.com/Kortimu/Dymuse')
        .setStyle(ButtonStyle.Link),
    );

    return interaction.editReply({
      embeds: [
        baseEmbedFormat()
          .setTitle('Dymuse v3.0.0')
          .setDescription(
            `${bot} is a bot made by Kortimu to serve as a pretty neat thingamajigididoo.\n\nThe bot has been online for \`${botUptime}\`.\nThe last major update happened in \`December 27th 2021\`.\nThe last minor update happened in \`December 30th 2021\`.`,
          )
          .setThumbnail(bot?.avatarURL()),
      ],
      components: [row],
    });
  }
}
