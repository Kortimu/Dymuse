import { Events, Listener, PieceContext } from '@sapphire/framework'
import { Guild, GuildMember, MessageEmbed, TextChannel } from 'discord.js'
import { GuildModel } from '../lib/schemas/guildschema'

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
    const guildId = guild.id
    // Find all guilds with chosen channels
    const result = await GuildModel.findOne({
        guildId: guildId
    })
    if (!result) return
    // If 'as TextChannel' not specified, it could be a VoiceChannel, which cannot send messages!
    const channel = guild.channels.cache.get(result.welcomeId) as TextChannel
    // Checks if correct channel
    if (channel) {
        // Sends embed
        channel.send({
            embeds: [
                new MessageEmbed()
                .setColor('#FF0000')
                .setTitle('Someone has left')
                .setDescription(`Bye bye ${member}`)
            ]
        })
    }
}