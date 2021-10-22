import { ApplyOptions } from "@sapphire/decorators";
import { Command, CommandOptions } from "@sapphire/framework";
import { send } from "@sapphire/plugin-editable-commands"
import { Message, MessageEmbed } from "discord.js";
import { sendLoadingMessage } from "../../lib/utils"

@ApplyOptions<CommandOptions>({
    description: 'Lists all available commands.',
    fullCategory: ['misc']
})

// Help command
export class UserCommand extends Command {
    public async messageRun(message: Message) {
        // Sends the loading message
        await sendLoadingMessage(message);

        let helpEmbed = new MessageEmbed();

        // Setup command name collection
        const commandNames = new Set<string>();
		for (const { name } of this.store.values()) commandNames.add(name);

        // Testing new code
        const cmdNames = new Set<string>();
        const userCommand = UserCommand

		for (const { name } of this.store.values()) cmdNames.add(name);

        console.log(this.container.stores.get('categories'))

        console.log(userCommand)

		for (const cmdName of cmdNames) {
			// const command = this.store.filter((command) => command.name === cmdName);

            // Old test code
            // const test = command.values()
            
            // console.log(commands.get('categories'))

            // console.log(what?.store.get(this.description));

            helpEmbed.addField(
                cmdName,
                'I have no clue how to show args or descriptions aaaaaaaaa'
            )
        };

        // Make the embed (old code)
        // for (let i = 0; i < nameArray.length; i++) {
        //     helpEmbed.addField(
        //         nameArray[i],
        //         descriptionArray[i]
        //     );
        // }

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