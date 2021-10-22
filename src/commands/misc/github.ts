import { ApplyOptions } from "@sapphire/decorators"
import { Command, CommandOptions } from "@sapphire/framework";
import { Message, MessageEmbed } from "discord.js"
import { sendLoadingMessage } from "../../lib/utils"
import { send } from "@sapphire/plugin-editable-commands"

@ApplyOptions<CommandOptions>({
    description: "Sends a link to the bot's repository.",
    fullCategory: ['misc'],
    aliases: ['githublink', 'git']
})

export class UserCommand extends Command {
    public async messageRun(message: Message) {
        await sendLoadingMessage(message)

        return send(message, {
            embeds: [
                new MessageEmbed()
                .setTitle('This bot has a Github page!')
                .setDescription('**Link:** https://github.com/Kortimu/DylanBot')
            ]
        })

        console.log
    }
}