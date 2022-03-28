import { Listener, Events, PieceContext } from '@sapphire/framework';
import { Client, MessageEmbed, TextChannel } from 'discord.js';
import { GuildModel } from '../lib/schemas/guildschema';
import { UserModel } from '../lib/schemas/userschema';
import { getNeededXP } from './levels';

export class UserEvent extends Listener<typeof Events.ClientReady> {
  public constructor(context: PieceContext) {
    super(context, {
      event: Events.ClientReady,
    });
  }

  // Every 10 seconds, update the leaderboard
  public run(client: Client) {
    setInterval(async () => {
      await updateLeaderboard(client);
    }, 1000 * 10);
  }
}

async function fetchTopMembers(guildId: string) {
  const leaderEmbed = new MessageEmbed().setTitle('User leaderboard:').setColor('#FF00FF');
  // Find all users from the guild, and sort them
  const results = await UserModel.find({
    guildId,
  }).sort({
    level: -1,
    xp: -1,
  });

  // Display found user info in an embed
  for (let result = 0; result < results.length; result++) {
    const { userId, level = 1, xp = 0, rank } = results[result];
    const needed = getNeededXP(level);
    let progress = '';
    // Make the progress bar
    const filled = Math.round((xp / needed) * 10);
    for (let slot = 1; slot <= 10; slot++) {
      if (slot === 1) {
        if (slot > filled) {
          progress += `<:Bar1Empty:908668400488841307>`;
        } else if (slot === filled) {
          progress += `<:Bar1Half:908669070952501268>`;
        } else {
          progress += `<:Bar1Full:908669763675385927>`;
        }
      } else if (slot === 10) {
        if (slot > filled) {
          progress += `<:Bar3Empty:908668400434294804>`;
        } else {
          progress += `<:Bar3Half:908669070944108604>`;
        }
      } else if (slot) {
        if (slot > filled) {
          progress += `<:Bar2Empty:908668400430100520>`;
        } else if (slot === filled) {
          progress += `<:Bar2Half:908669070818295819>`;
        } else {
          progress += `<:Bar2Full:908669763633442877>`;
        }
      }
    }

    // Update their rank (used for other commands)
    await UserModel.findOneAndUpdate(
      {
        guildId,
        userId,
      },
      {
        rank: result + 1,
      },
      {
        upsert: true,
        new: true,
      },
    );

    // Displays each user's info in one embed field
    leaderEmbed.addFields(
      {
        name: `#${rank}`,
        value: `<@${userId}>`,
        inline: true,
      },
      {
        name: 'Level',
        value: `${level}`,
        inline: true,
      },
      {
        name: 'Progress',
        value: `${progress} (${Math.round((xp / needed) * 100)}%)`,
        inline: true,
      },
    );
  }
  leaderEmbed.setFooter({
    text: 'This leaderboard gets updated once every 10 SECONDS. Some results might be inaccurate.',
  });

  return leaderEmbed;
}

const updateLeaderboard = async (client: Client) => {
  const results = await GuildModel.find({});

  // For each guild:
  for (const result of results) {
    const { leaderboardId, guildId } = result;
    // Get the guild from database
    const guild = client.guilds.cache.get(guildId);
    if (guild) {
      // Get the channel from the database
      const channel = guild.channels.cache.get(leaderboardId) as TextChannel;
      if (channel) {
        // Get the first message from the channel
        const messages = await channel.messages.fetch();
        const firstMessage = messages.first();

        const topMembers = await fetchTopMembers(guildId);

        // Edit existing message. If there is none, send one.
        try {
          if (firstMessage) {
            firstMessage.edit({ embeds: [topMembers] });
          } else {
            channel.send({ embeds: [topMembers] });
          }
        } catch {
          console.log('Embed update failed :(');
        }
      }
    }
  }
};
