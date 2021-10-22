import { ApplyOptions } from "@sapphire/decorators"
import { Args, Command, CommandOptions } from "@sapphire/framework";
import { Message, MessageEmbed } from "discord.js"
import { sendLoadingMessage } from "../../lib/utils"
import { send } from "@sapphire/plugin-editable-commands"

@ApplyOptions<CommandOptions>({
    description: 'Supports the user.',
    fullCategory: ['misc'],
    aliases: ['es', 'support'],
    cooldownDelay: 20000
})

export class UserCommand extends Command {
    public async messageRun(message: Message, args: Args) {
        const targetUser = await args.pick('user').catch(() => message.author)

        await sendLoadingMessage(message)

        const supportArray = [
            "If you feel useless, remember that `Faster Darts` exists. It is so useless, you probably didn't even get the reference.",
            'If life is beating you down, just remember that no one cares.',
            "Sometimes the solution to your problems IS violence. Don't listen to what the government says, they are LIARS",
            'I ate a banana today, and it definitely tasted worse than your feet.',
            'If you think your life is meaningless, remember that Aqua Man has a fucking boat.',
            'Others think you are useless? Trust me, the Glare had it much worse.',
            'I ran out of supporting messages, so have an insult. Fuck you.',
            'The owner of this server hates you, why should I care?',
            'Give up on your dreams and die. Actually, no, my owner needs attention. Stay alive for his sake.',
            "Think you have no friends? I have way less friends than you, since I can't have any."
        ]
        
        const supportPick = Math.floor(Math.random() * supportArray.length)

        const support = supportArray[supportPick]

        targetUser.send({
            embeds: [
                new MessageEmbed()
                .setColor('#FF00FF')
                .setTitle(`Emotional Support Incoming!`)
                .setDescription(support + `\n\nHope it helped, ${targetUser}! <3`)
            ]
        })

        return send(message, {
            embeds: [
                new MessageEmbed()
                .setColor('#FF00FF')
                .setTitle(`Emotional Support Incoming!`)
                .setDescription(`I have sent something "helpful" in DMs to ${targetUser}.`)
            ]
        })
    }
}