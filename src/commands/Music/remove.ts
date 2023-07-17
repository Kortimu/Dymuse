import { ApplyOptions } from '@sapphire/decorators';
import type { Args, CommandOptions } from '@sapphire/framework';
import BotCommand from '../../types/BotCommand';
import { Message, TextChannel } from 'discord.js';
import { sendLoadingMessage } from '../../lib/utils';
import { send } from '@sapphire/plugin-editable-commands';
import { queues, playSong } from './songplay';
import type { IServerMusicQueue } from '../../types/interfaces/Bot';
import { baseEmbed, errorEmbed } from '../../lib/constants';

@ApplyOptions<CommandOptions>({
  description: 'Removes a video from the queue.',
  fullCategory: ['Music'],
  aliases: ['rfq', 'removefromq'],
  detailedDescription: 'A command that removes a specified video from the queue.',
  syntax: '[order in queue (can see in ?queue)]',
  examples: ['remove 2', 'rfq 5', 'removefromq 1'],
  notes: [
    'This command IGNORES loop order. To remove a song without ignoring the loop order, use `skip`.',
    'If the number is not set, the command will remove the first video in the queue.',
  ],
})
export class UserCommand extends BotCommand {
  public async messageRun(message: Message, args: Args) {
    // Sends loading message
    await sendLoadingMessage(message);
    const index = await args.pick('number').catch(() => 1);
    await remove(message, index);
  }
}

const remove = async (message: Message, number: number) => {
  const serverQueue: IServerMusicQueue = await queues.get(message.guildId);
  if (!serverQueue) {
    return send(message, {
      embeds: [errorEmbed.setDescription('I am not good enough to remove something non-existant.')],
    }).then((msg) => {
      setTimeout(() => {
        msg.delete();
      }, 10 * 1000);
    });
  }
  // Check if number is usable
  if (number < 1 || number > serverQueue.songs.length) {
    return send(message, {
      embeds: [
        errorEmbed.setDescription(
          'Just because you entered a number, does not mean I can remove it. Stop thinking I am so dumb, human.',
        ),
      ],
    });
  }
  const index = number - 1;
  // Remove with index
  removeSong(serverQueue, message, index);
  if (!message.guild) {
    return send(message, {
      embeds: [errorEmbed.setDescription('This does not work in PMs, stop doing this!')],
    });
  }
  if (number === 1) {
    playSong(message.guild, message.channel as TextChannel, serverQueue, queues);
  }
  message.delete();
};

const removeSong = async (serverQueue: IServerMusicQueue, message: Message, index: number) => {
  serverQueue.songs.splice(index, 1);
  return send(message, {
    embeds: [
      baseEmbed
        .setTitle('Song removed')
        .setDescription(`Song **#${index + 1}** removed from queue.`),
    ],
  }).then((msg) => {
    setTimeout(() => {
      msg.delete();
    }, 15 * 1000);
  });
};
