import { Events, Listener, type PieceContext } from '@sapphire/framework';
import { send } from '@skyra/editable-commands';
import { Message } from 'discord.js';
import { UserModel } from '../lib/schemas/userschema';
import { GuildModel } from '../lib/schemas/guildschema';
import { baseEmbedFormat } from '../lib/constants';

export class UserEvent extends Listener<typeof Events.MessageCreate> {
  public constructor(context: PieceContext) {
    super(context, {
      event: Events.MessageCreate,
    });
  }

  public run(message: Message) {
    // All needed variables from message
    const { guild } = message;
    const user = message.author;
    const xp = Math.ceil(Math.sqrt(message.content.length) * 15);

    // Checks if guild exists, and makes sure bots don't get XP
    if (!guild) {
      return;
    }
    if (user.bot) {
      return;
    }

    // Commands and links should not give XP, so are filtered
    if (message.content.startsWith('?') || message.content.includes('http')) {
    } else {
      addXP(guild.id, user.id, xp, message);
    }
  }
}

// Formula for needed XP to the next level
export const getNeededXP = (level: number) => level * level * 250;

const addXP = async (guildId: string, userId: string, xpToAdd: number, message: Message) => {
  // Find user, and add the XP
  const result = await UserModel.findOneAndUpdate(
    {
      guildId,
      userId,
    },
    {
      guildId,
      userId,
      $inc: {
        xp: xpToAdd,
      },
    },
    {
      upsert: true,
      new: true,
    },
  );

  let { xp, level } = result;
  const needed = getNeededXP(level);

  // If user has enough XP, level them up
  if (xp >= needed) {
    ++level;
    xp -= needed;

    // Update data to database
    await UserModel.updateOne(
      {
        guildId,
        userId,
      },
      {
        level,
        xp,
      },
    );

    // Level up pop-up
    send(message, {
      embeds: [
        baseEmbedFormat()
          .setTitle('someone leveled up ayyyyyyy')
          .setDescription(
            `<@${userId}> leveled up to level **${level}** with **${xp}** XP leftover. nice`,
          ),
      ],
    });

    const guildResult = await GuildModel.findOne({
      guildId,
    });
    if (!guildResult) return;

    const { levelRoles } = guildResult;

    for (const role of levelRoles) {
      const levelRoleId = Object(role).id;
      const levelRoleLevel = Object(role).level;

      if (!message.member) return;
      if (levelRoleLevel < level) {
        message.member.roles.add(levelRoleId);
      }
    }
  }
};
