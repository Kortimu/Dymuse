import { ApplyOptions } from '@sapphire/decorators';
import type { Args, CommandOptions } from '@sapphire/framework';
import BotCommand from '../../types/BotCommand';
import { Message } from 'discord.js';
import { sendLoadingMessage } from '../../lib/utils';
import { send } from '@sapphire/plugin-editable-commands';
import { queues } from './songplay';
import type { IServerMusicQueue } from '../../types/interfaces/Bot';
import { baseEmbed, errorEmbed } from '../../lib/constants';

@ApplyOptions<CommandOptions>({
  description: 'Makes the music loop.',
  fullCategory: ['Music'],
  aliases: ['looping', 'repeat'],
  detailedDescription: 'A command that loops the currently playing Youtube video.',
  syntax: '[all/single/off]',
  examples: ['loop all', 'looping single', 'repeat off', 'loop'],
})
export class UserCommand extends BotCommand {
  public async messageRun(message: Message, args: Args) {
    // Sends loading message
    await sendLoadingMessage(message);
    const option = await args.pick('string').catch(null);
    loop(message, option);
  }
}

const loop = async (message: Message, option: string) => {
  const serverQueue: IServerMusicQueue = queues.get(message.guildId);
  if (!serverQueue) {
    return send(message, {
      embeds: [
        errorEmbed.setDescription(
          'To change the loop setting, music needs to be playing. Seriously, why would you change it when it is not even playing?!',
        ),
      ],
    }).then((msg) => {
      message.delete();
      setTimeout(() => {
        msg.delete();
      }, 10 * 1000);
    });
  }
  // If no argument specified, cycle between the options. off -> single -> all -> off etc
  if (option === 'off' || option === 'single' || option === 'all') {
    serverQueue.repeatMode = option;
  } else if (option) {
    if (serverQueue.repeatMode === 'off') {
      serverQueue.repeatMode = 'single';
    } else if (serverQueue.repeatMode === 'single') {
      serverQueue.repeatMode = 'all';
    } else if (serverQueue.repeatMode === 'all') {
      serverQueue.repeatMode = 'off';
    }
  }
  return send(message, {
    embeds: [
      baseEmbed
        .setTitle('Command successful successful successful successful')
        .setDescription(`Looping is set to \`${serverQueue.repeatMode}\`.`),
    ],
  }).then((msg) => {
    message.delete();
    setTimeout(() => {
      msg.delete();
    }, 10 * 1000);
  });
};
