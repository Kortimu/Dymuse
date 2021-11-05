import { ApplyOptions } from "@sapphire/decorators"
import { Args, Command, CommandOptions } from "@sapphire/framework";
import { Message, MessageEmbed, TextChannel, } from "discord.js"
import { sendLoadingMessage } from "../../lib/utils"
import { send } from "@sapphire/plugin-editable-commands"
import { ChannelModel } from '../../lib/schemas/channelschema'

@ApplyOptions<CommandOptions>({
    description: "Sets a channel for the database to read it.",
    fullCategory: ['Owner'],
    aliases: ['setc'],
    preconditions: ['OwnerOnly'],
    detailedDescription: 'Users that are considered owners by the bot can set the channels that the bot will update certain information, such as leaderboards or welcoming new users.'
})

export class UserCommand extends Command {
    public async messageRun(message: Message, args: Args) {
        // Sends a loading message
        await sendLoadingMessage(message)

        // Finds args from sent command - a text channel and the name of the database
        const targetChannel = await args.pick('channel').catch(() => message.channel) as TextChannel
        const targetName = await args.pick('string')

        // Checks what the name of the database was called
        if (targetName == 'leaderboard') {
            setLeaderboardChannel(targetChannel, message)
        }
        if (targetName == 'welcome') {
            setWelcomeChannel(targetChannel, message)
        }
    }
}

const setLeaderboardChannel = async (channel: TextChannel, message: Message) => {
    // In case guild doesn't exist
    if (!message.guild) {
        return
    }

    const guildId = message.guild.id
    const channelId = channel.id

    // Add the new channel ID to the database
    const result = await ChannelModel.findOneAndUpdate({
        guildId: guildId,
        leaderboardId: channelId
    }, {
        leaderBoardId: channelId
    }, {
        upsert: true,
        new: true
    })

    const { leaderboardId } = result

    // Confirm that the action has been done
    return send(message, {
        embeds: [
            new MessageEmbed()
            .setColor('#00FF00')
            .setTitle('Successfully set!')
            .setDescription(`The leaderboard channel is set as <#${leaderboardId}>`)
        ]
    })
}

// Same as leaderboard channel, except for welcome (soon will turn into one function)
const setWelcomeChannel = async (channel: TextChannel, message: Message) => {
    if (!message.guild) {
        return
    }

    const guildId = message.guild.id
    const channelId = channel.id

    const result = await ChannelModel.findOneAndUpdate({
        guildId: guildId,
        welcomeId: channelId,
    }, {
        welcomeId: channelId
    }, {
        upsert: true,
        new: true
    })

    const { welcomeId } = result

    return send(message, {
        embeds: [
            new MessageEmbed()
            .setColor('#00FF00')
            .setTitle('Successfully set!')
            .setDescription(`The welcome channel is set as <#${welcomeId}>`)
        ]
    })
}