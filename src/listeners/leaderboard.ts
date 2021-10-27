import { Listener, Events, PieceContext } from '@sapphire/framework';
import { Client, MessageEmbed, TextChannel } from 'discord.js'
import { ChannelModel } from '../lib/schemas/channelschema'
import { UserModel } from '../lib/schemas/userschema'

export class UserEvent extends Listener<typeof Events.ClientReady> {
    public constructor(context: PieceContext) {
        super(context, {
            event: Events.ClientReady
        });
    }

    public async run(client: Client) {
        setInterval(async () => {
            updateLeaderboard(client)
        }, 1000 * 10)
    }
}

async function fetchTopMembers(guildId: string) {
    let leaderEmbed = new MessageEmbed()
    .setTitle('User leaderboard:')
    .setColor('#0000FF')

    const results = await UserModel.find({
        guildId
    }).sort({
        level: -1,
        xp: -1
    });

    for (let i = 0; i < results.length; i++) {
        const { userId, level = 1, xp = 0, rank } = results[i];

        await UserModel.findOneAndUpdate({
            guildId,
            userId
        }, {
            rank: i + 1
        }, {
            upsert: true,
            new: true
        });

        leaderEmbed.addFields({
            name: `#${rank}`,
            value: `<@${userId}>`,
            inline: true
        }, {
            name: `Level`,
            value: `${level}`,
            inline: true
        }, {
            name: `XP`,
            value: `${xp}`,
            inline: true
        })
    }

    leaderEmbed.setFooter(`This leaderboard gets updated once every 10 SECONDS. Results are innacurate at the moment.`)

    return leaderEmbed;
}

const updateLeaderboard = async (client: Client) => {
    const results = await ChannelModel.find({})

    for (const result of results) {
        const { leaderboardId, _id: guildId } = result
        
        const guild = client.guilds.cache.get(guildId)
        if (guild) {
            const channel = guild.channels.cache.get(leaderboardId) as TextChannel
            if (channel) {
                const messages = await channel.messages.fetch()
                const firstMessage = messages.first()

                const topMembers = await fetchTopMembers(guildId)

                if (firstMessage) {
                    firstMessage.edit({embeds: [topMembers]})
                } else {
                    channel.send({embeds: [topMembers]})
                }
            }
        }
    }
}