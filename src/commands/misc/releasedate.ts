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
        await sendLoadingMessage(message)

        let time = '<t:2128525894800:D>'

        return send(message, {
            embeds: [
                new MessageEmbed()
                .setTitle('DylanBot will release...')
                .setDescription(time)
            ]
        })
    }
}