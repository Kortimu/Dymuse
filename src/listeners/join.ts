import { Events, Listener, PieceContext } from '@sapphire/framework'
import { Guild, GuildMember, MessageEmbed, TextChannel } from 'discord.js'
import { GuildModel } from '../lib/schemas/guildschema'

export class UserEvent extends Listener<typeof Events.GuildMemberAdd> {
    public constructor(context: PieceContext) {
        super(context, {
            event: Events.GuildMemberAdd
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
                .setColor('#00FF00')
                .setTitle('Someone has joined!')
                .setDescription(`Welcome ${member} to the server!`)
            ]
        })
    }
    // Check if user should be given level role < 2
    for (let i = 0; i < result.levelRoles.length; i++) {
        const roleId = Object(result.levelRoles[i]).id
        const levelReq = Object(result.levelRoles[i]).level
        if (levelReq <= 1) {
            // Give the damn role
            member.roles.add(roleId)
        }
    }
}