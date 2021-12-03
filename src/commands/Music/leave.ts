import { ApplyOptions } from '@sapphire/decorators';
import type { CommandOptions } from '@sapphire/framework';
import BotCommand from '../../types/BotCommand';
import { Message, MessageEmbed } from 'discord.js';
import { sendLoadingMessage } from '../../lib/utils';
import { send } from '@sapphire/plugin-editable-commands';
import { queues } from './songplay';
import { getVoiceConnection } from '@discordjs/voice';

@ApplyOptions<CommandOptions>({
  description: 'Makes the bot leave the VC.',
  fullCategory: ['Music'],
  aliases: ['disconnect', 'dcon', 'plsleavenow', 'bye'],
  detailedDescription: 'A command that disconnects the bot from the voice channel.',
  notes: ['When the bot leaves, the queue gets deleted as well.'],
})
export class UserCommand extends BotCommand {
  public async messageRun(message: Message) {
    // Sends loading message
    await sendLoadingMessage(message);
    leave(message);
  }
}

const leave = async (message: Message) => {
  if (!message.guildId || !message.member) {
    return;
  }
  const connection = getVoiceConnection(message.guildId);
  if (!connection) {
    return send(message, {
      embeds: [
        new MessageEmbed()
          .setColor('#FF0000')
          .setTitle('Error')
          .setDescription('THE BOT IS NOT EVEN IN THE VC, WHY ARE YOU DOING THIS'),
      ],
    }).then((msg) => {
      message.delete();
      setTimeout(() => {
        msg.delete();
      }, 10 * 1000);
    });
  }
  const musicQueue = queues;
  const serverQueue = musicQueue.get(message.guildId);
  if (message.member.voice.channel !== serverQueue.voiceChannel) {
    return send(message, {
      embeds: [
        new MessageEmbed()
          .setColor('#FF0000')
          .setTitle('Error')
          .setDescription('Nice try buddy, you need to join VC to do that.'),
      ],
    }).then((msg) => {
      message.delete();
      setTimeout(() => {
        msg.delete();
      }, 10 * 1000);
    });
  }
  connection.destroy();
  musicQueue.delete(message.guildId);
  return send(message, {
    embeds: [
      new MessageEmbed()
        .setColor('#FF00FF')
        .setTitle('Yeet')
        .setDescription("Fine, guess I'll go. Not like I wanted to stay!"),
    ],
  }).then(() => {
    message.delete();
  });
};
