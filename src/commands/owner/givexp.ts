import { ApplyOptions } from '@sapphire/decorators';
import type { Args, CommandOptions } from '@sapphire/framework';
import BotCommand from '../../types/BotCommand';
import { Message } from 'discord.js';
import { sendLoadingMessage } from '../../lib/utils';
import { send } from '@sapphire/plugin-editable-commands';
import { UserModel } from '../../lib/schemas/userschema';
import { baseEmbed } from '../../lib/constants';

@ApplyOptions<CommandOptions>({
  description: 'Gives XP to a user.',
  fullCategory: ['Owner'],
  aliases: ['giveexp'],
  preconditions: ['OwnerOnly'],
  syntax: '[user]',
  examples: ['giveexp @Kortimu', 'givexp'],
  notes: ['This should be used mostly for punishment. Abuse of this power will make you PAY!'],
})
export class UserCommand extends BotCommand {
  public async messageRun(message: Message, args: Args) {
    // Finds all the info in the command message
    const targetUser = await args.pick('user').catch(() => message.author);
    const targetXP = await args.pick('integer');
    const { guild } = message;
    // Guild might not exist, check if is not undefined
    if (!guild) {
      console.log('holup');
      return;
    }
    // Sends loading message
    await sendLoadingMessage(message);

    // Adds experience to the database
    addXP(guild.id, targetUser.id, targetXP, message);
  }
}

const addXP = async (guildId: string, userId: string, xpToAdd: number, message: Message) => {
  // Find user in the database, and add the XP to them
  const result = await UserModel.findOneAndUpdate(
    {
      guildId,
      userId,
    },
    {
      guildId,
      userId,
      $inc: {
        xp: xpToAdd,
      },
    },
    {
      upsert: true,
      new: true,
    },
  );
  const { xp } = result;
  // Sends embed
  return send(message, {
    embeds: [
      baseEmbed
        .setTitle('Transaction was a success!')
        .setDescription(`You gave <@${userId}> ${xpToAdd} XP. Now they have **${xp}** XP!`),
    ],
  });
};
