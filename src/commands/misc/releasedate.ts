import { ApplyOptions } from "@sapphire/decorators"
import { Command, CommandOptions } from "@sapphire/framework";
import { Message, MessageEmbed } from "discord.js"
import { sendLoadingMessage } from "../../lib/utils"
import { send } from "@sapphire/plugin-editable-commands"

@ApplyOptions<CommandOptions>({
    description: 'Shows the release date of the Discord bot.',
    fullCategory: ['misc'],
    aliases: ['rd', 'release']
})

export class UserCommand extends Command {
    public async messageRun(message: Message) {
        // Sends loading message
        await sendLoadingMessage(message)
        // UNIX time in Discord's timestamp format
        let time = '<t:1638309600:R>'

        // Sends the embed
        return send(message, {
            embeds: [
                new MessageEmbed()
                .setTitle('DylanBot will release...')
                .setDescription(time)
            ]
        })
    }
}