import { ApplyOptions } from '@sapphire/decorators';
import type { CommandOptions } from '@sapphire/framework';
import BotCommand from '../../types/BotCommand';
import { Message, EmbedBuilder } from 'discord.js';
import { sendLoadingMessage } from '../../lib/utils';
import { send } from '@sapphire/plugin-editable-commands';
import { curDur, queues } from './songplay';
import type { IServerMusicQueue, ISong } from '../../types/interfaces/Bot';
import { formatSeconds } from '../../lib/constants';

@ApplyOptions<CommandOptions>({
  description: 'Shows info about the currently playing video.',
  fullCategory: ['Music'],
  aliases: ['np', 'nowplaying'],
  detailedDescription:
    'A command that displays additional information about the currently playing Youtube video.',
  notes: [
    'This command displays more information than the "Coming up..." or "Playing..." embed does.',
  ],
})
export class UserCommand extends BotCommand {
  public async messageRun(message: Message) {
    // Sends loading message
    await sendLoadingMessage(message);
    if (!message.guild) {
      return;
    }
    const serverQueue: IServerMusicQueue = queues.get(message.guildId);
    if (!serverQueue) {
      return send(message, {
        embeds: [
          new EmbedBuilder()
            .setColor('#FF0000')
            .setTitle('Error')
            .setDescription(
              'You are not fooling me, there is no video queue. If this is entertainment for you, go touch grass.',
            ),
        ],
      }).then((msg) => {
        message.delete();
        setTimeout(() => {
          msg.delete();
        }, 10 * 1000);
      });
    }
    const { songs } = serverQueue;
    await sendQueue(message, songs[0]);
  }
}

const sendQueue = async (message: Message, song: ISong) => {
  // Returns additional information, previously stored when song was requested
  return send(message, {
    embeds: [
      new EmbedBuilder()
        .setColor('#FF00FF')
        .setTitle('Currently playing song:')
        .setDescription(
          `**URL:** ${song.url}\n**Title:** ${song.title}\n**Views:** ${song.views}\n**Channel:** ${
            song.channelName
          }\n\n**Length:** ${formatSeconds(curDur)} ${progressBar(song.duration)} ${
            song.formattedDuration
          }`,
        )
        .setImage(song.bestThumbnail.url)
        .setThumbnail(song.channelLogo),
    ],
  }).then((msg) => {
    message.delete();
    setTimeout(() => {
      msg.delete();
    }, 20 * 1000);
  });
};

const progressBar = (duration: number) => {
  // Puts the O in the place it needs to, depending on how far the video is
  let progress = '---------';
  const percentage = Math.round(10 * (curDur / duration));
  progress = `${progress.slice(0, percentage)}O${progress.slice(percentage)}`;
  return progress;
};
