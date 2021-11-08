import { ApplyOptions } from "@sapphire/decorators"
import { Args, Command, CommandOptions } from "@sapphire/framework";
import { Message, MessageEmbed, TextChannel, } from "discord.js"
import { sendLoadingMessage } from "../../lib/utils"
import { send } from "@sapphire/plugin-editable-commands"
import { GuildModel } from '../../lib/schemas/guildschema'

@ApplyOptions<CommandOptions>({
    description: "Sets a channel for the database to read it.",
    fullCategory: ['Owner'],
    aliases: ['setc', 'sc'],
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
        if (targetName === 'leaderboard' || targetName === 'welcome') {
            setChannel(targetChannel, message, targetName)
        }
    }
}

const setChannel = async (channel: TextChannel, message: Message, targetName: string) => {
    // In case guild doesn't exist
    if (!message.guild) {
        return
    }

    const guildId = message.guild.id
    const channelId = channel.id

    // Add the new channel ID to the database
    if (targetName === 'leaderboard') {
        await GuildModel.findOneAndUpdate({
            guildId: guildId
        }, {
            leaderboardId: channelId
        }, {
            upsert: true,
            new: true
        })
    } else if (targetName === 'welcome') {
        await GuildModel.findOneAndUpdate({
            guildId: guildId
        }, {
            welcomeId: channelId
        }, {
            upsert: true,
            new: true
        })
    }

    // Confirm that the action has been done
    return send(message, {
        embeds: [
            new MessageEmbed()
            .setColor('#00FF00')
            .setTitle('Successfully set!')
            .setDescription(`The ${targetName} channel is set as <#${channelId}>`)
        ]
    })
}