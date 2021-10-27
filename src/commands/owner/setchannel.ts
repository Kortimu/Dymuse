import { ApplyOptions } from "@sapphire/decorators"
import { Args, Command, CommandOptions } from "@sapphire/framework";
import { Message, MessageEmbed, TextChannel, } from "discord.js"
import { sendLoadingMessage } from "../../lib/utils"
import { send } from "@sapphire/plugin-editable-commands"
import { ChannelModel } from '../../lib/schemas/channelschema'

@ApplyOptions<CommandOptions>({
    description: "Sets a channel for the database to read it.",
    fullCategory: ['owner'],
    aliases: ['setc'],
    preconditions: ['OwnerOnly']
})

export class UserCommand extends Command {
    public async messageRun(message: Message, args: Args) {
        await sendLoadingMessage(message)

        const targetChannel = await args.pick('channel').catch(() => message.channel) as TextChannel
        const targetName = await args.pick('string')

        if (targetName == 'leaderboard') {
            setLeaderboardChannel(targetChannel, message)
        }
    }
}

const setLeaderboardChannel = async (channel: TextChannel, message: Message) => {
    if (!message.guild) {
        return
    }

    const guildId = message.guild.id
    const channelId = channel.id

    const result = await ChannelModel.findOneAndUpdate({
        _id: guildId,
        leaderboardId: channelId
    }, {
        _id: guildId,
        leaderBoardId: channelId
    }, {
        upsert: true,
        new: true
    })

    const { leaderboardId } = result

    return send(message, {
        embeds: [
            new MessageEmbed()
            .setColor('#00FF00')
            .setTitle('Successfully set!')
            .setDescription(`The leaderboard channel is set as ${leaderboardId}`)
        ]
    })

}