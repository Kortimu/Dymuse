import { Events, Listener, PieceContext } from '@sapphire/framework';
import { send } from '@skyra/editable-commands';
import { Message, MessageEmbed } from 'discord.js';
import { UserModel } from '../lib/schemas/userschema'

export class UserEvent extends Listener<typeof Events.MessageCreate> {
    public constructor(context: PieceContext) {
        super(context, {
            event: Events.MessageCreate
        });
    }

    public async run(message: Message) {
        // All needed variables from message
        const guild = message.guild
        const user = message.author
        const xp = message.content.length
        
        // Checks if guild exists, and makes sure bots don't get XP
        if (!guild) {
            console.log('No guild found.')
            return
        }
        if (user.bot) {
            return
        }

        // Commands and links should not give XP, so are filtered
        if (message.content.startsWith('?') || message.content.includes('http')) {
            return
        } else {
            addXP(guild.id, user.id, xp, message)
        }
    }
}

// Formula for needed XP to the next level
export const getNeededXP = (level: number) => level * level * 250

const addXP = async (guildId: string, userId: string, xpToAdd: number, message: Message) => {
    // Find user, and add the XP
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

    let { xp, level } = result
    const needed = getNeededXP(level)

    // If user has enough XP, level them up
    if (xp >= needed) {
        ++level
        xp -= needed

        // Update data to database
        await UserModel.updateOne({
            guildId,
            userId
        }, {
            level,
            xp
        })

        // Level up pop-up
        send(message, {
            embeds: [
                new MessageEmbed()
                .setColor('#00FF00')
                .setTitle('Someone leveled up!')
                .setDescription(`<@${userId}> leveled up to level **${level}** with **${xp}** leftover. Congrats!`)
            ]
        })
    }
}