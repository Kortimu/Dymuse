import { Events, Listener, PieceContext } from '@sapphire/framework'
import { Guild, GuildMember, MessageEmbed, TextChannel } from 'discord.js'
import { ChannelModel } from '../lib/schemas/channelschema'

export class UserEvent extends Listener<typeof Events.GuildMemberRemove> {
    public constructor(context: PieceContext) {
        super(context, {
            event: Events.GuildMemberRemove
        })
    }

    public async run(member: GuildMember) {
        const guild = member.guild
        if (!guild) {
            return
        }
        
        sendMessage(guild, member)
    }
}

const sendMessage = async (guild: Guild, member: GuildMember) => {
    // Find all guilds with chosen channels
    const results = await ChannelModel.find({})

    // For each guild/channel combo:
    for (const result of results) {
        const { welcomeId, guildId } = result
        // Find the needed guild
        if (guild.id == guildId) {
            // Find needed channel
            // If 'as TextChannel' not specified, it could be a VoiceChannel, which cannot send messages!
            const channel = guild.channels.cache.get(welcomeId) as TextChannel
            // Checks if correct channel
            if (channel) {
                // Sends embed
                channel.send({
                    embeds: [
                        new MessageEmbed()
                        .setColor('#FF0000')
                        .setTitle('Someone has left...')
                        .setDescription(`Say goodbye to ${member}...`)
                    ]
                })
            }
        }
    }
}