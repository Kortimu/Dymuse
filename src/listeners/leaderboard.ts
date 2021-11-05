import { Listener, Events, PieceContext } from '@sapphire/framework';
import { Client, MessageEmbed, TextChannel } from 'discord.js'
import { ChannelModel } from '../lib/schemas/channelschema'
import { UserModel } from '../lib/schemas/userschema'
import { getNeededXP } from './levels';

export class UserEvent extends Listener<typeof Events.ClientReady> {
    public constructor(context: PieceContext) {
        super(context, {
            event: Events.ClientReady
        });
    }

    public async run(client: Client) {
        // Every x 10 seconds, update the leaderboard
        setInterval(async () => {
            updateLeaderboard(client)
        }, 1000 * 10)
    }
}

async function fetchTopMembers(guildId: string) {
    // Create embed, which will be the leaderboard
    let leaderEmbed = new MessageEmbed()
    .setTitle('User leaderboard:')
    .setColor('#FF00FF')

    // Find all users from the guild, and sort them
    const results = await UserModel.find({
        guildId
    }).sort({
        level: -1,
        xp: -1
    });

    // Display found user info in an embed
    for (let i = 0; i < results.length; i++) {
        const { userId, level = 1, xp = 0, rank } = results[i];
        const needed = getNeededXP(level)
        // String to show progress
        let progress = ''
        // For each 10%, add 1 colored block
        for (let i = 0; i < Math.round(xp/needed * 10); i++) {
            progress += '🟪'
        }
        // For each missing 10%, add 1 empty block
        for (let i = 0; i < 10 - Math.round(xp/needed * 10); i++) {
            progress += '⬛'
        }
        // x + (10-x) = x + 10 - x = 10

        // Update their rank (used for other commands)
        await UserModel.findOneAndUpdate({
            guildId,
            userId
        }, {
            rank: i + 1
        }, {
            upsert: true,
            new: true
        });

        // Displays each user's info in one embed field, using inlines
        leaderEmbed.addFields({
            name: `#${rank}`,
            value: `<@${userId}>`,
            inline: true
        }, {
            name: `Level`,
            value: `${level}`,
            inline: true
        }, {
            name: `Progress`,
            value: `${progress} (${Math.round(xp/needed * 100)}%)`,
            inline: true
        })
    }
    // Footer moment
    leaderEmbed.setFooter(`This leaderboard gets updated once every 10 SECONDS. Some results might be inaccurate.`)

    return leaderEmbed;
}

const updateLeaderboard = async (client: Client) => {
    const results = await ChannelModel.find({})

    // For each guild:
    for (const result of results) {
        const { leaderboardId, guildId } = result
        // Get the guild from database
        const guild = client.guilds.cache.get(guildId)
        if (guild) {
            // Get the channel from the database
            const channel = guild.channels.cache.get(leaderboardId) as TextChannel
            if (channel) {
                // Get the first message from the channel
                const messages = await channel.messages.fetch()
                const firstMessage = messages.first()

                const topMembers = await fetchTopMembers(guildId)

                // Edit existing message. If there is none, send one.
                if (firstMessage) {
                    firstMessage.edit({embeds: [topMembers]})
                } else {
                    channel.send({embeds: [topMembers]})
                }
            }
        }
    }
}