import { ApplyOptions } from "@sapphire/decorators";
import { Command, CommandOptions } from "@sapphire/framework";
import { send } from "@sapphire/plugin-editable-commands"
import { Message, MessageEmbed } from "discord.js";
import { sendLoadingMessage } from "../../lib/utils"

@ApplyOptions<CommandOptions>({
    description: 'Lists all available commands.',
    fullCategory: ['misc'],
    aliases: ['h']
})

// Help command
export class UserCommand extends Command {
    public async messageRun(message: Message) {
        // Sends the loading message
        await sendLoadingMessage(message);

        let helpEmbed = new MessageEmbed();

        // Setup command name collection
        const cmdNames = new Set<string>();

		for (const { name } of this.store.values()) cmdNames.add(name);

        // For each command, add an embed field with the necessary fields
		for (const cmdName of cmdNames) {
			
            const commandDescription = this.container.stores.get('commands').get(cmdName)?.description
            const commandAlias = this.container.stores.get('commands').get(cmdName)?.aliases
            const commandCategory = this.container.stores.get('commands').get(cmdName)?.fullCategory

            helpEmbed.addField(
                `?${cmdName}`,
                `**Category:** ${commandCategory}\n**Description:** ${commandDescription}\n**Aliases:** ${commandAlias}`
            )
        };

        // Send the embed
        return send(message, {
            embeds: [
                helpEmbed
                .setTitle('All available commands:')
                .setColor('#00FF00')
            ]
        });
    }
}