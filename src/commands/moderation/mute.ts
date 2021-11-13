import { ApplyOptions } from '@sapphire/decorators';
import { Args, Command, CommandOptions } from '@sapphire/framework';
import { GuildMember, Message, MessageEmbed } from 'discord.js';
import { sendLoadingMessage } from '../../lib/utils';
import { send } from '@sapphire/plugin-editable-commands';
import { GuildModel } from '../../lib/schemas/guildschema';

@ApplyOptions<CommandOptions>({
  description: 'Mutes a user for a selected amount of time.',
  fullCategory: ['Moderation'],
  aliases: ['m', 'muteuser'],
  detailedDescription:
    'A user with the Moderator role can apply the `Muted` role to a user. If you want auto-mod, my brain is too small to have something so important be handled by it.',
  preconditions: ['OwnerOnly'],
})
export class UserCommand extends Command {
  public async messageRun(message: Message, args: Args) {
    // Sends loading message
    await sendLoadingMessage(message);

    const targetMember = await args.pick('member');

    modifyLevelRole(message, targetMember);

    // Returns an embed with the link
    return send(message, {
      embeds: [
        new MessageEmbed()
          .setColor('#FF00FF')
          .setTitle('Imagine getting muted lmaoooo')
          .setDescription(`Get owned ${targetMember}`),
      ],
    });
  }
}

const modifyLevelRole = async (message: Message, targetMember: GuildMember) => {
  if (!message.guild) return;
  const { guild } = message;
  const guildSettings = await GuildModel.findOne({
    guildId: guild.id,
  });
  if (!guildSettings || !guildSettings.muteRole) {
    console.log('uh oh');
    return;
  }
  targetMember.roles.add(guildSettings.muteRole);
};
