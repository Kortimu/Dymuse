import { ApplyOptions } from "@sapphire/decorators";
import { Args, Command, CommandOptions } from "@sapphire/framework";
import { send } from "@sapphire/plugin-editable-commands"
import { Message, MessageEmbed } from "discord.js";
import { sendLoadingMessage } from "../../lib/utils"

@ApplyOptions<CommandOptions>({
    description: 'Lists all commands or details about a certain command/category.',
    fullCategory: ['General'],
    aliases: ['h'],
    detailedDescription: 'A command that displays information about any command available to the user.\nThe commands shown *should* be only the ones the user has permissions to use.'
})

export class UserCommand extends Command {
    public async messageRun(message: Message, args: Args) {
        // Sends the loading message
        await sendLoadingMessage(message);

        // Get all command names
        let commandNames: string[] = []
        for (const { name } of this.store.values()) commandNames.push(name)

        // Check if the user has specified a certain command/category
        const targetCommand = await args.pick('string').catch(() => undefined)
        let helpEmbed = new MessageEmbed();
        // Not mandatory, just a way to not repeat too much
        const commands = this.container.stores.get('commands')

        // Create a map with a key as a category, and all values as commands in said category
        const categories = new Map<string, Command[]>()
        commands.forEach((cmd) => {
            cmd.fullCategory.forEach((cat) => {
                const cmds = categories.get(cat) ?? []
                cmds.push(cmd)
                categories.set(cat, cmds)
            })
        })

        // If user has specified a command/category
        if (targetCommand) {
            // Check if the specified command/category exists
            const lowCommand = targetCommand.toLowerCase()
            const categoryCheck = lowCommand[0].toUpperCase() + lowCommand.slice(1)
            // If a command exists
            if (commandNames.includes(targetCommand.toLowerCase())) {
                // If a command exists, show extended info about it
                const cmdName = commandNames.filter((command) => commands.get(command)?.name === targetCommand.toLowerCase()).toString()
                const detailedDescription = commands.get(cmdName)?.detailedDescription || 'No description has been previded.'
                const aliases = commands.get(cmdName)?.aliases.map((alias) => '\`' + alias + '\`')
                const category = commands.get(cmdName)?.category
                helpEmbed.addFields(
                {
                    name: 'Aliases',
                    value: `\`${cmdName}\`, ${aliases}`
                }, {
                    name: 'Category',
                    value: `${category}`
                }, {
                    name: 'Description',
                    value: `${detailedDescription}`
                }, {
                    name: 'Examples',
                    value: `Coming Soon™` // Too lazy to bother with extended classes, gonna add later
                })
                // Send said info
                return send(message, {
                    embeds: [
                        helpEmbed
                        .setColor('#FF00FF')
                        .setTitle(`Information about ${targetCommand}:`)
                    ]
                })
            // If a category exists
            } else if (categories.get(categoryCheck)) {
                // Remove all keys and values from map not related to the chosen category
                commands.forEach((cmd) => {
                    cmd.fullCategory.forEach((cat) => {
                        if (commands.get(cmd.name)?.category?.toLowerCase() !== targetCommand.toLowerCase()) {
                            categories.delete(cat)
                        }
                    })
                })
            // Show an error (I know, a rarity for this bot, shut up)
            } else {
                helpEmbed.addField('Error', `There is no command or category with the name **${targetCommand}**. Below are all of the supported commands.`)
            }
        }
        
        // If nothing specified, get all commands, and show them in a simple list
        Array.from(categories.keys()).forEach(cat => {
            let text = ''
            
            commandNames.filter((command) => commands.get(command)?.category === cat).forEach((cmd) => {
                const description = commands.get(cmd)?.description
                const aliases = commands.get(cmd)?.aliases.map((alias) => '\`' + alias + '\`')

                text += `**?${cmd}** [${aliases}] **→** ${description}\n`
            })
            
            helpEmbed.addField(cat, text)
        });

        // Sends the embed of all commands
        return send(message, {
            embeds: [
                helpEmbed
                .setTitle('All available commands:')
                .setColor('#FF00FF')
            ]
        });
    }
}