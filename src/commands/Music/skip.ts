import { ApplyOptions } from '@sapphire/decorators';
import type { CommandOptions } from '@sapphire/framework';
import BotCommand from '../../types/BotCommand';
import { Message, MessageEmbed, TextChannel } from 'discord.js';
import { sendLoadingMessage } from '../../lib/utils';
import { send } from '@sapphire/plugin-editable-commands';
import { queues, songFinish } from './songplay';
import type { IServerMusicQueue } from '../../types/interfaces/Bot';
let skipVoters = 0;

@ApplyOptions<CommandOptions>({
  description: 'Skips to the next song.',
  fullCategory: ['Music'],
  aliases: ['sk', 'ihatethisone'],
  detailedDescription: 'A command that skips the currently playing Youtube video.',
  preconditions: ['TestOnly'],
  notes: [
    'This command DOES NOT ignore loop order. To remove a song ignoring the loop order, use `remove`.',
  ],
})
export class UserCommand extends BotCommand {
  public async messageRun(message: Message) {
    // Sends loading message
    await sendLoadingMessage(message);
    await skip(message);
  }
}

const skip = async (message: Message) => {
  const serverQueue: IServerMusicQueue = await queues.get(message.guildId);
  if (!serverQueue) {
    return send(message, {
      embeds: [
        new MessageEmbed()
          .setColor('#FF0000')
          .setTitle('Error')
          .setDescription(
            'What am I supposed to skip, my empty soul? That would kinda useful, unlike your request.',
          ),
      ],
    }).then((msg) => {
      setTimeout(() => {
        msg.delete();
      }, 10 * 1000);
    });
  }
  // Voting system
  skipVote(serverQueue, message);
  console.log(skipVoters);
  message.delete();
  return skipVoters;
};

const skipVote = async (serverQueue: IServerMusicQueue, message: Message) => {
  skipVoters += 1;
  if (skipVoters < Math.ceil(0.5 * (serverQueue.voiceChannel.members.size - 1))) {
    return send(message, {
      embeds: [
        new MessageEmbed()
          .setColor('#FFFF00')
          .setTitle('Vote to skip?')
          .setDescription(
            `\`${skipVoters}/${
              serverQueue.voiceChannel.members.size - 1
            }\` people want to skip this song. If others agree, do \`?skip\` as well.`,
          ),
      ],
    }).then((msg) => {
      setTimeout(() => {
        msg.delete();
      }, 30 * 1000);
    });
  }
  skipSong(message, serverQueue);
};

const skipSong = async (message: Message, serverQueue: IServerMusicQueue) => {
  if (!message.guild) {
    return send(message, {
      embeds: [
        new MessageEmbed()
          .setColor('#FF0000')
          .setTitle('Error')
          .setDescription('Buddy, this command is not in DMs'),
      ],
    });
  }
  songFinish(message.guild, message.channel as TextChannel, serverQueue, queues);
  skipVoters = 0;
  return send(message, {
    embeds: [
      new MessageEmbed()
        .setColor('#FF00FF')
        .setTitle('Song skipped')
        .setDescription('Democracy wins again, I guess'),
    ],
  }).then((msg) => {
    setTimeout(() => {
      msg.delete();
    }, 10 * 1000);
  });
};
