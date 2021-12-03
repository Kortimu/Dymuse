import { ApplyOptions } from '@sapphire/decorators';
import type { CommandOptions } from '@sapphire/framework';
import BotCommand from '../../types/BotCommand';
import { Message, MessageEmbed } from 'discord.js';
import { sendLoadingMessage } from '../../lib/utils';
import { send } from '@sapphire/plugin-editable-commands';
import { queues } from './songplay';
import type { IServerMusicQueue, ISong } from '../../types/interfaces/Bot';

@ApplyOptions<CommandOptions>({
  description: 'Shows info about the currently playing video.',
  fullCategory: ['Music'],
  aliases: ['np', 'nowplaying'],
  detailedDescription:
    'A command that displays additional information about the currently playing Youtube video.',
  preconditions: ['TestOnly'],
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
          new MessageEmbed()
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

const sendQueue = async (message: Message, songInfo: ISong) => {
  return send(message, {
    embeds: [
      new MessageEmbed()
        .setColor('#FF00FF')
        .setTitle('Currently playing song:')
        .setDescription(
          `**Title:** ${songInfo.title}\n**Length:** ${songInfo.formattedDuration}\n**Channel:** ${songInfo.channelName}`,
        )
        .setImage(songInfo.bestThumbnail.url)
        .setThumbnail(songInfo.channelLogo),
    ],
  }).then((msg) => {
    message.delete();
    setTimeout(() => {
      msg.delete();
    }, 20 * 1000);
  });
};
