import { ApplyOptions } from "@sapphire/decorators"
import { Args, Command, CommandOptions } from "@sapphire/framework";
import { Message, MessageEmbed } from "discord.js"
import { sendLoadingMessage } from "../../lib/utils"
import { send } from "@sapphire/plugin-editable-commands"
import { UserModel } from '../../lib/schemas/userschema'

@ApplyOptions<CommandOptions>({
    description: 'Gives XP to a user.',
    fullCategory: ['owner'],
    aliases: ['giveexp'],
    preconditions: ['OwnerOnly']
})

export class UserCommand extends Command {
    public async messageRun(message: Message, args: Args) {
        const targetUser = await args.pick('user').catch(() => message.author)
        const targetXP = await args.pick('integer')
        const { guild } = message
        if (!guild) {
            console.log('holup')
            return
        }

        await sendLoadingMessage(message)

        addXP(guild.id, targetUser.id, targetXP, message)

        
    }
}

const addXP = async (guildId: string, userId: string, xpToAdd: number, message: Message) => {
    const result = await UserModel.findOneAndUpdate({
        guildId,
        userId
    }, {
        guildId,
        userId,
        $inc: {
            xp: xpToAdd
        }
    }, {
        upsert: true,
        new: true
    })

    const { xp } = result

    return send(message, {
        embeds: [
            new MessageEmbed()
            .setTitle('Transaction was a success!')
            .setDescription(`You gave <@${userId}> ${xpToAdd} XP. Now they have **${xp}** XP!`)
        ]
    })
}