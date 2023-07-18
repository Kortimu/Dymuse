import { Events, Listener, type PieceContext } from '@sapphire/framework';
import { Guild, GuildMember, TextChannel } from 'discord.js';
import { GuildModel } from '../lib/schemas/guildschema';
import { baseEmbedFormat } from '../lib/constants';

export class UserEvent extends Listener<typeof Events.GuildMemberAdd> {
  public constructor(context: PieceContext) {
    super(context, {
      event: Events.GuildMemberAdd,
    });
  }

  public run(member: GuildMember) {
    const { guild } = member;
    if (!guild) {
      return;
    }

    sendMessage(guild, member);
  }
}

const sendMessage = async (guild: Guild, member: GuildMember) => {
  const guildId = guild.id;
  // Find all guilds with chosen channels
  const result = await GuildModel.findOne({
    guildId,
  });
  if (!result) return;
  // If 'as TextChannel' not specified, it could be a VoiceChannel, which cannot send messages!
  const channel = guild.channels.cache.get(result.welcomeId) as TextChannel;
  // Checks if correct channel
  if (channel) {
    // Sends embed
    channel.send({
      embeds: [
        baseEmbedFormat()
          .setTitle('Someone has joined!')
          .setDescription(`Welcome ${member} to the server!`),
      ],
    });
  }
  // Check if user should be given level role < 2
  for (const role of result.levelRoles) {
    const roleId = Object(role).id;
    const levelReq = Object(role).level;
    if (levelReq <= 1) {
      // Give the damn role
      member.roles.add(roleId);
    }
  }
};
