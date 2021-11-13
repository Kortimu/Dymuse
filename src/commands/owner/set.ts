import { ApplyOptions } from '@sapphire/decorators';
import { Args, Command, CommandOptions } from '@sapphire/framework';
import { Message, MessageEmbed, TextChannel } from 'discord.js';
import { sendLoadingMessage } from '../../lib/utils';
import { send } from '@sapphire/plugin-editable-commands';
import { GuildModel } from '../../lib/schemas/guildschema';

@ApplyOptions<CommandOptions>({
  description: 'Sets a setting for the database to read it.',
  fullCategory: ['Owner'],
  aliases: ['setsetting', 'setting', 'settingset'],
  preconditions: ['OwnerOnly'],
  detailedDescription:
    'Users that are considered owners by the bot can set the settings and values used by the bot to, for example, displaying leaderboards or welcoming new users in a specific channel.',
})
export class UserCommand extends Command {
  public async messageRun(message: Message, args: Args) {
    // Sends a loading message
    await sendLoadingMessage(message);

    // Finds args from sent command - a text channel and the name of the database
    const targetChannel = (await args.pick('channel').catch(() => message.channel)) as TextChannel;
    const targetRole = await args.pick('role').catch(() => undefined);
    let targetVar = undefined;
    if (targetRole) targetVar = targetRole;
    else targetVar = targetChannel;

    const targetName = await args.pick('string');

    // Checks what the name of the database was called
    if (targetName === 'leaderboard' || 'welcome' || 'mute') {
      setChannel(targetVar, message, targetName);
    }
  }
}

const setChannel = async (variable: any, message: Message, targetName: string) => {
  // In case guild doesn't exist
  if (!message.guild) {
    return;
  }

  const guildId = message.guild.id;
  const variableId = variable.id;

  // Add the new channel ID to the database
  if (targetName === 'leaderboard') {
    await GuildModel.findOneAndUpdate(
      {
        guildId,
      },
      {
        leaderboardId: variableId,
      },
      {
        upsert: true,
        new: true,
      },
    );
  } else if (targetName === 'welcome') {
    await GuildModel.findOneAndUpdate(
      {
        guildId,
      },
      {
        welcomeId: variableId,
      },
      {
        upsert: true,
        new: true,
      },
    );
  } else if (targetName === 'mute') {
    await GuildModel.findOneAndUpdate(
      {
        guildId,
      },
      {
        muteRole: variableId,
      },
      {
        upsert: true,
        new: true,
      },
    );
  }

  // Confirm that the action has been done
  return send(message, {
    embeds: [
      new MessageEmbed()
        .setColor('#00FF00')
        .setTitle('Successfully set!')
        .setDescription(`The ${targetName} channel is set as <#${variableId}>`),
    ],
  });
};
