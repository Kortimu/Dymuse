import { ApplyOptions } from '@sapphire/decorators';
import { Command, CommandOptions } from '@sapphire/framework';
import { Message, MessageEmbed } from 'discord.js';
import { sendLoadingMessage } from '../../lib/utils';
import { send } from '@sapphire/plugin-editable-commands';
import { queues } from './songplay';
import type { IServerMusicQueue } from '../../types/interfaces/Bot';

@ApplyOptions<CommandOptions>({
  description: 'Makes the music loop.',
  fullCategory: ['Music'],
  aliases: ['looping', 'repeat'],
  detailedDescription: 'A command that loops the currently playing Youtube video.',
})
export class UserCommand extends Command {
  public async messageRun(message: Message) {
    // Sends loading message
    await sendLoadingMessage(message);
    loop(message);
  }
}

const loop = async (message: Message) => {
  const serverQueue: IServerMusicQueue = queues.get(message.guildId);
  if (!serverQueue) {
    return send(message, {
      embeds: [
        new MessageEmbed()
          .setColor('#FF0000')
          .setTitle('Error')
          .setDescription(
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
  if (serverQueue.repeatMode === 'off') {
    serverQueue.repeatMode = 'single';
  } else if (serverQueue.repeatMode === 'single') {
    serverQueue.repeatMode = 'all';
  } else if (serverQueue.repeatMode === 'all') {
    serverQueue.repeatMode = 'off';
  }

  return send(message, {
    embeds: [
      new MessageEmbed()
        .setColor('#FF00FF')
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
