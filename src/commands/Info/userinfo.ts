import { ApplyOptions } from '@sapphire/decorators';
import type { Command, CommandOptions } from '@sapphire/framework';
import BotCommand from '../../types/BotCommand';
import { sendLoadingInteraction } from '../../lib/utils';
import { UserModel } from '../../lib/schemas/userschema';
import { getNeededXP } from '../../listeners/levels';
import { baseEmbed } from '../../lib/constants';

@ApplyOptions<CommandOptions>({
  description: 'Gives additional information about a user.',
  fullCategory: ['Info'],
  aliases: ['ui', 'useri', 'uinfo'],
  detailedDescription:
    'A command that provides the user with additional information about a specific user, such as the creation date, join date and more.',
  syntax: '[user]',
  examples: ['i @Kortimu', 'useri', 'uinfo @Dymuse'],
  notes: ['If no user is specified, information shown will be about the message author.'],
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
            .setDescription('The user to look up information about.')
            .setRequired(true),
        ),
        { guildIds: ['864115119721676820'] };
    });
  }

  public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
    await sendLoadingInteraction(interaction);

    const infoEmbed = baseEmbed;
    let targetUser = interaction.options.getUser('target');

    // If the user does not exist, default to the user who sent the slash command
    if (!targetUser) {
      targetUser = interaction.client.user;
    }

    const result = await UserModel.findOne({
      guildId: interaction.guild?.id,
      userId: targetUser,
    });
    console.log(result);

    let userXp = 0;
    let userLevel = 0;

    if (result) {
      userXp = result.xp;
      userLevel = result.level;
    }

    infoEmbed
      .addFields(
        {
          name: 'Username',
          value: targetUser.username,
        },
        {
          name: 'Progress',
          value: `Level: **${userLevel}**\nXP: ${userXp}/${getNeededXP(userLevel)} (${Math.round(
            (userXp / getNeededXP(userLevel)) * 100,
          )}%)`,
        },
        {
          name: 'Account creation date',
          value: `<t:${Math.floor(targetUser.createdAt.getTime() / 1000)}:f>\n(<t:${Math.floor(
            targetUser.createdAt.getTime() / 1000,
          )}:R>)`,
          inline: true,
        },
      )
      .setFooter({
        text: `ID: ${targetUser?.id}`,
      })
      .setThumbnail(targetUser.displayAvatarURL() as string);

    if (interaction.guild !== null) {
      const targetMember = interaction.guild.members.cache.get(targetUser.id);
      if (!targetMember || targetMember.joinedAt === null) {
        return;
      }

      infoEmbed.addFields(
        {
          name: 'Join date',
          value: `<t:${Math.floor(targetMember.joinedAt.getTime() / 1000)}:f>\n(<t:${Math.floor(
            targetMember.joinedAt.getTime() / 1000,
          )}:R>)`,
          inline: true,
        },
        {
          name: `Roles (${targetMember.roles.cache.size})`,
          value: `${targetMember.roles.cache.map((role) => `${role}`).join('\n')}`,
        },
      );
    }

    return interaction.editReply({
      embeds: [infoEmbed.setTitle(`Info about ${targetUser.username}`).setColor('#00FF00')],
    });
  }
}
