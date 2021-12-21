import { ApplyOptions } from '@sapphire/decorators';
import type { CommandOptions } from '@sapphire/framework';
import BotCommand from '../../types/BotCommand';
import { Message, MessageEmbed } from 'discord.js';
import { sendLoadingMessage } from '../../lib/utils';
import { send } from '@sapphire/plugin-editable-commands';
import { queues } from './songplay';
import type { IServerMusicQueue } from '../../types/interfaces/Bot';

@ApplyOptions<CommandOptions>({
  description: 'Shows info about the video queue.',
  fullCategory: ['Music'],
  aliases: ['videoqueue', 'q'],
  detailedDescription:
    'A command that displays additional information about the Youtube video queue.',
  preconditions: ['TestOnly'],
})
export class UserCommand extends BotCommand {
  public async messageRun(message: Message) {
    // Sends loading message
    await sendLoadingMessage(message);
    if (!message.guild) {
      return;
    }
    const serverQueue: IServerMusicQueue = queues.get(message.guildId);
    if (!serverQueue || serverQueue.songs.length < 1) {
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
    await showQueue(message, serverQueue);
  }
}

const showQueue = async (message: Message, queueInfo: IServerMusicQueue) => {
  const queueEmbed = new MessageEmbed();
  let songNumber = 0;
  queueInfo.songs.forEach((song) => {
    songNumber += 1;
    queueEmbed.addField(
      `Video #${songNumber}`,
      `**Title:** ${song.title}\n**Duration:** ${song.formattedDuration}`,
    );
  });
  return send(message, {
    embeds: [queueEmbed.setColor('#FF00FF').setTitle('Video Queue:')],
  }).then((msg) => {
    message.delete();
    setTimeout(() => {
      msg.delete();
    }, 20 * 1000);
  });
};
