import { ApplyOptions } from '@sapphire/decorators';
import type { Args, CommandOptions } from '@sapphire/framework';
import BotCommand from '../../types/BotCommand';
import { Message, MessageEmbed } from 'discord.js';
import { sendLoadingMessage } from '../../lib/utils';
import { send } from '@sapphire/plugin-editable-commands';
import { UserModel } from '../../lib/schemas/userschema';
import { getNeededXP } from '../../listeners/levels';

@ApplyOptions<CommandOptions>({
  description: 'Gives additional information about a user.',
  fullCategory: ['Info'],
  aliases: ['i', 'useri', 'uinfo'],
  detailedDescription:
    'A command that provides the user with additional information about a specific user, such as the creation date, join date and more.',
  syntax: '[user]',
  examples: ['i @Kortimu', 'useri', 'uinfo @DylanBot'],
  notes: ['If no user is specified, information shown will be about the message author.'],
})
export class UserCommand extends BotCommand {
  public async messageRun(message: Message, args: Args) {
    // Sends loading message
    await sendLoadingMessage(message);
    const infoEmbed = new MessageEmbed();
    // Gets the specified user/member
    const targetMember = await args.pick('member').catch(() => message.member);
    if (targetMember === null) return;
    const targetUser = targetMember.user;

    // Find the member in question
    const result = await UserModel.findOne({
      guildId: targetMember.guild.id,
      userId: targetUser.id,
    });
    if (!result) return;
    const { xp, level } = result;

    // Show info about the user
    if (targetMember.joinedAt !== null) {
      infoEmbed
        .addFields(
          {
            name: 'Username',
            value: `${targetUser} - \`${targetUser.username}#${targetUser.discriminator}\``,
          },
          {
            name: 'Progress',
            value: `Level: **${level}**\nXP: ${xp}/${getNeededXP(level)} (${Math.round(
              (xp / getNeededXP(level)) * 100,
            )}%)`,
          },
          {
            name: 'Account creation date',
            value: `<t:${Math.floor(targetUser.createdAt.getTime() / 1000)}:f>\n(<t:${Math.floor(
              targetUser.createdAt.getTime() / 1000,
            )}:R>)`,
            inline: true,
          },
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
        )
        .setFooter(`ID: ${targetUser.id}`);
      if (targetUser.avatarURL !== null) {
        infoEmbed.setThumbnail(targetMember.displayAvatarURL({ dynamic: true }) as string);
      }
    }

    // Returns an embed with the info
    return send(message, {
      embeds: [infoEmbed.setColor('#FF00FF').setTitle(`Information about ${targetUser.username}:`)],
    });
  }
}
