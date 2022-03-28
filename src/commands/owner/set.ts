import { ApplyOptions } from '@sapphire/decorators';
import type { Args, CommandOptions } from '@sapphire/framework';
import BotCommand from '../../types/BotCommand';
import { Message, MessageEmbed } from 'discord.js';
import { sendLoadingMessage } from '../../lib/utils';
import { send } from '@sapphire/plugin-editable-commands';
import { GuildModel } from '../../lib/schemas/guildschema';
// import { guildSchema } from '../../lib/schemas/guildschema'

@ApplyOptions<CommandOptions>({
  description: 'Sets a setting for the database to read it.',
  fullCategory: ['Owner'],
  aliases: ['settings'],
  preconditions: ['OwnerOnly'],
  detailedDescription:
    'Users that are considered owners by the bot can set the settings and values used by the bot to, for example, display leaderboards or welcome new users in a channel.',
  syntax: '<setting> [add/remove] <value>',
  examples: ['set xpMultiplier 2.4', 'settings', 'settings botPrefix //'],
  notes: [
    'This is getting rewamped. Many features are clunky or are not implemented yet',
    'I am bad at making competent things really fast.',
  ],
})
export class UserCommand extends BotCommand {
  public async messageRun(message: Message, args: Args) {
    // Sends a loading message
    await sendLoadingMessage(message);

    // Finds args from sent command - a text channel and the name of the database
    const property = await args.pick('string').catch(() => null)
    let mode = await args.pick('string').catch(() => null)
    let value = await args.rest('string').catch(() => null)

    // In the case that mode is not inputted (it's optional)
    if (mode && mode !== 'add' && mode !== 'remove' && mode !== 'reset') {
      value = `${mode}${value ? ` ${value}` : ''}`
      mode = null
    }

    // With no additional arguments, view all settings
    if (!property) {
      await showSettings(message);
      return;
    }
    if (!value) {
      settingInfo(property, message);
      return;
    }

    if (!message.guild) {
      return send(message, {
        embeds: [
          new MessageEmbed()
            .setColor('#FF0000')
            .setTitle('Error')
            .setDescription('Stop being annoying and doing this in PMs.')
        ]
      })
    }

    // Adds the value to the setting, if possible
    return applySetting(message, property, mode, value);
  }
};

const applySetting = async (message: Message, property: string, mode: string | null, value: string | null) => {
  if (!message.guild) {
    return send(message, {
      embeds: [
        new MessageEmbed()
          .setColor('#FF0000')
          .setTitle('Error')
          .setDescription('Stop being annoying and doing this in PMs.')
      ]
    })
  }

  const result = await GuildModel.findOne({
    guildId: message.guild.id
  })
  if (!result) {
    return send(message, {
      embeds: [
        new MessageEmbed()
          .setColor('#FFFF00')
          .setTitle('Error fixed!')
          .setDescription('Your server info is not in the database. Default settings applied. Please repeat the command to change the setting you desire.')
      ]
    })
  }

  const settings = result.toObject()
  const setting = Object.keys(settings).filter(key => { return key.toLowerCase() === property.toLowerCase() }).toString()

  if (!setting) {
    return send(message, {
      embeds: [
        new MessageEmbed()
          .setColor('#FF0000')
          .setTitle('Error')
          .setDescription(`No setting with the name \`${property}\` was found. Did you type it in correctly?`)
      ]
    })
  }

  // TODO: make arrays work with this
  console.log(mode)

  try {
    await GuildModel.findOneAndUpdate({
      guildId: message.guild.id,
    }, {
      $set: {
        [setting]: value
      }
    }, {
      new: true,
    })
  } catch {
    return send(message, {
      embeds: [
        new MessageEmbed()
          .setColor('#FF0000')
          .setTitle('Error')
          .setDescription(`Value \`${value}\` is not a value for the setting.`)
      ]
    })
  }

  return send(message, {
    embeds: [
      new MessageEmbed()
        .setColor('#FF00FF')
        .setTitle('Setting changed!')
        .setDescription(`Setting "${setting}" now has the value \`${value}\`.`)
    ]
  })
}

const settingInfo = (property: string, message: Message) => {
  return send(message, {
    embeds: [
      new MessageEmbed()
        .setColor('#FF00FF')
        .setTitle(`Info about ${property}`)
        .setDescription('info or something')
    ]
  })
}

// TOOD: make the final embed look better
const showSettings = async (message: Message) => {
  const result = await GuildModel.findOne({
    guildId: message.guildId
  })
  if (!result) {

    // Add settings to database (default values stored somewhere)

    // send(message, {
    //   embeds: [
    //     new MessageEmbed()
    //       .setColor('#FFFF00')
    //       .setTitle('Error')
    //       .setDescription('This server seems to have no settings. Default have been added to the database.')
    //   ]
    // })

    return
  }
  const settings = result.toObject()
  let text = ''

  Object.keys(settings).forEach(key => {
    if (key === '_id' || key === '__v' || key === 'guildId') {
      return
    }

    let value = Object(settings)[key] ?? 'none'

    // TODO: make this somehow dynamically detect array of objects
    if (key === 'levelRoles' && result.levelRoles) {
      value = ''
      result.levelRoles.forEach(role => {
        const { id } = Object(role)
        const { level } = Object(role)

        value += `Required level for <@&${id}>: **${level}**\n`
      })
    }

    text += `**${key}** -> \`${value}\`\n`
  })

  return send(message, {
    embeds: [
      new MessageEmbed()
        .setColor('#FF00FF')
        .setTitle('All Settings')
        .setDescription(text)
    ]
  })
}