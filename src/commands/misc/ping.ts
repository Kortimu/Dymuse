import { ApplyOptions } from '@sapphire/decorators';
import { Command, CommandOptions } from '@sapphire/framework';
import { send } from '@sapphire/plugin-editable-commands';
import { Message, MessageEmbed } from 'discord.js';
import { sendLoadingMessage } from '../../lib/utils';

@ApplyOptions<CommandOptions>({
	description: 'ping pong',
    fullCategory: ['misc']
})
export class UserCommand extends Command {
	public async messageRun(message: Message) {
		const msg = await sendLoadingMessage(message);

		return send(message, {
            embeds: [
                new MessageEmbed()
                .setTitle(`Oh, you want some dumb phrase like "Pong!" back? No. All you will get is some stats back, because fuck you.`)
                .addFields(
                    {
                        name: 'The amount of time wasted on your device, waiting for this message to load (very cringe):',
                        value: `${Math.round(this.container.client.ws.ping)} ms`
                    }, {
                        name: 'Framework moment:',
                        value: `${(msg.editedTimestamp || msg.createdTimestamp) - (message.editedTimestamp || message.createdTimestamp)} ms`
                    }
                )
                .setColor('#00FF00')
            ]
        });
	}
}