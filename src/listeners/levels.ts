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
        const guild = message.guild
        const user = message.author
        const xp = message.content.length
        
        if (!guild) {
            console.log('No guild found.')
            return
        }
        if (user.bot) {
            return
        }

        addXP(guild.id, user.id, xp, message)
    }
}

const getNeededXP = (level: number) => level * level * 250

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

    let { xp, level } = result
    const needed = getNeededXP(level)

    if (xp >= needed) {
        ++level
        xp -= needed

        await UserModel.updateOne({
            guildId,
            userId
        }, {
            level,
            xp
        })

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