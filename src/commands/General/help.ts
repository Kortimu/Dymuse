import { ApplyOptions } from '@sapphire/decorators';
import type { Args, CommandOptions } from '@sapphire/framework';
import BotCommand from '../../types/BotCommand';
import { send } from '@sapphire/plugin-editable-commands';
import { Message, MessageEmbed } from 'discord.js';
import { sendLoadingMessage } from '../../lib/utils';

@ApplyOptions<CommandOptions>({
  description: 'Lists all commands or details about a certain command/category.',
  fullCategory: ['General'],
  aliases: ['h'],
  detailedDescription:
    'A command that displays information about any command available to the user.\nThe commands shown *should* be only the ones the user has permissions to use.',
  syntax: '[command/category]',
  examples: ['help', 'h general', 'help GeNeRaL'],
  notes: ['If no argument is specified, all commands are shown.'],
})
export class UserCommand extends BotCommand {
  public async messageRun(message: Message, args: Args) {
    // Sends the loading message
    await sendLoadingMessage(message);

    // Get all command names
    const commandNames: string[] = [];
    for (const { name } of this.store.values()) commandNames.push(name);

    // Check if the user has specified a certain command/category
    const targetCommand = await args.pick('string').catch(() => undefined);
    const helpEmbed = new MessageEmbed();
    // Not mandatory, just a way to not repeat too much
    const commands = this.container.stores.get('commands');

    // Create a map with a key as a category, and all values as commands in said category
    const categories = new Map<string, BotCommand[]>();
    commands.forEach((cmd) => {
      cmd.fullCategory.forEach((cat) => {
        const cmds = categories.get(cat) ?? [];
        cmds.push(cmd);
        categories.set(cat, cmds);
      });
    });

    // If user has specified a command/category
    if (targetCommand) {
      // Check if the specified command/category exists
      const lowCommand = targetCommand.toLowerCase();
      const categoryCheck = lowCommand[0].toUpperCase() + lowCommand.slice(1);
      // If a command exists
      if (commandNames.includes(targetCommand.toLowerCase())) {
        // If a command exists, show extended info about it
        const cmdName = commandNames
          .filter((command) => commands.get(command)?.name === targetCommand.toLowerCase())
          .toString();
        const detailedDescription =
          commands.get(cmdName)?.detailedDescription || 'No description has been previded.';
        const aliases = commands.get(cmdName)?.aliases.map((alias) => `\`${alias}\``);
        const category = commands.get(cmdName)?.category;
        const syntax = commands.get(cmdName)?.syntax;
        const examples = commands
          .get(cmdName)
          ?.examples.map((example) => `${example}\n`)
          .toString()
          .replace(/\n./g, '');
        const notes = commands.get(cmdName)?.notes;
        const mappedNotes = notes
          ?.map((note) => `- ${note}\n`)
          .toString()
          .replace(/\n./g, '');
        helpEmbed.addFields(
          {
            name: 'Aliases',
            value: `\`${cmdName}\`, ${aliases}`,
          },
          {
            name: 'Category',
            value: `${category}`,
          },
          {
            name: 'Description',
            value: `${detailedDescription}`,
          },
          {
            name: 'Syntax',
            value: `\`${syntax}\``,
          },
          {
            name: 'Examples',
            value: `${examples}`,
          },
        );
        if (notes?.[0] !== '') {
          helpEmbed.addField('Additional Notes', `${mappedNotes}`);
        }
        // Send said info
        return send(message, {
          embeds: [helpEmbed.setColor('#FF00FF').setTitle(`Information about ${targetCommand}:`)],
        });
        // If a category exists
      } else if (categories.get(categoryCheck)) {
        // Remove all keys and values from map not related to the chosen category
        commands.forEach((cmd) => {
          cmd.fullCategory.forEach((cat) => {
            if (commands.get(cmd.name)?.category?.toLowerCase() !== targetCommand.toLowerCase()) {
              categories.delete(cat);
            }
          });
        });
        // Show an error (I know, a rarity for this bot, shut up)
      } else {
        return send(message, {
          embeds: [
            helpEmbed
              .setColor('#FF0000')
              .addField(
                'Error',
                `There is no command or category with the name **${targetCommand}**. To view all commands, type the help command with no additional words.`,
              )
          ]
        })
      }
    }

    // If nothing specified, get all commands, and show them in a simple list
    Array.from(categories.keys()).forEach((cat) => {
      let text = '';

      commandNames
        .filter((command) => commands.get(command)?.category === cat)
        .forEach((cmd) => {
          const description = commands.get(cmd)?.description;
          const aliases = commands.get(cmd)?.aliases.map((alias) => `\`${alias}\``);

          text += `**?${cmd}** [${aliases}] **→** ${description}\n`;
        });

      helpEmbed.addField(cat, text);
    });

    message.author.send({
      embeds: [helpEmbed.setTitle('All available commands:').setColor('#FF00FF')],
    })

    // Sends the embed of all commands
    return send(message, {
      embeds: [
        new MessageEmbed()
          .setColor('#FF00FF')
          .setTitle('All commands sent')
          .setDescription('...to PMs. No need to clutter the chat.')
      ],
    });
  }
}
