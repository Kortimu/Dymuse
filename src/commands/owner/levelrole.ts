import { ApplyOptions } from '@sapphire/decorators';
import { Args, Command, CommandOptions } from '@sapphire/framework';
import { Message, MessageEmbed, Role } from 'discord.js';
import { sendLoadingMessage } from '../../lib/utils';
import { send } from '@sapphire/plugin-editable-commands';
import { GuildModel } from '../../lib/schemas/guildschema';

@ApplyOptions<CommandOptions>({
  description: 'A command for level role customization and viewing.',
  fullCategory: ['Owner'],
  aliases: ['lr', 'levelr', 'lrole'],
  preconditions: ['OwnerOnly'],
  detailedDescription:
    'Users that are considered owners by the bot can add, remove and view level roles for the server.',
})
export class UserCommand extends Command {
  public async messageRun(message: Message, args: Args) {
    // Sends a loading message
    await sendLoadingMessage(message);

    // Finds args from sent command - a text channel and the name of the database
    const targetRole = await args.pick('role').catch(() => undefined);
    const targetNumber = await args.pick('number').catch(() => 1);
    const targetName = await args.pick('string').catch(() => undefined);

    // If role and action specified, mess with the database
    if (targetRole && targetName) {
      modifyLevelRole(targetRole, message, targetNumber, targetName);
    } else {
      viewLevelRoles(message);
    }
  }
}

const modifyLevelRole = async (role: Role, message: Message, level: number, targetName: string) => {
  if (!message.guild) return;
  const guildId = message.guild.id;
  const roleId = role.id;

  // Perform action based on what was requested by user
  if (targetName === 'add') {
    await GuildModel.findOneAndUpdate(
      {
        guildId,
      },
      {
        $addToSet: {
          levelRoles: {
            id: roleId,
            level,
          },
        },
      },
      {
        upsert: true,
        new: true,
      },
    );
  }
  if (targetName === 'remove') {
    await GuildModel.findOneAndRemove(
      {
        guildId,
      },
      {
        levelRoles: [
          {
            id: roleId,
            level,
          },
        ],
      },
    );
  }
  // Send the damn response
  return send(message, {
    embeds: [
      new MessageEmbed()
        .setColor('#00FF00')
        .setTitle('Success!')
        .setDescription(
          `You **${targetName}ed** **<@&${roleId}>** with the level requirement of **${level}**!`,
        ),
    ],
  });
};

const viewLevelRoles = async (message: Message) => {
  if (!message.guild) return;
  const guildId = message.guild.id;
  const lRoleEmbed = new MessageEmbed();
  let text = '';
  // Get the guild's settings
  const result = await GuildModel.findOne({
    guildId,
  });
  if (!result) return;
  // Apply the needed role
  for (const role of result.levelRoles) {
    const roleId = Object(role).id;
    const levelReq = Object(role).level;
    text += `Required level for <@&${roleId}>: **${levelReq}**\n`;
  }
  // Inform user action has been successful
  return send(message, {
    embeds: [lRoleEmbed.setColor('#FF00FF').setTitle('All level roles:').setDescription(text)],
  });
};
