import { ApplyOptions } from '@sapphire/decorators';
import type { CommandOptions } from '@sapphire/framework';
import BotCommand from '../../types/BotCommand';
import { Message, EmbedBuilder } from 'discord.js';
import { sendLoadingMessage } from '../../lib/utils';
import { send } from '@sapphire/plugin-editable-commands';
import { queues } from './songplay';
import type { IServerMusicQueue } from '../../types/interfaces/Bot';
let skipVoters = 0;

@ApplyOptions<CommandOptions>({
  description: 'Skips to the next song.',
  fullCategory: ['Music'],
  aliases: ['sk', 'ihatethisone'],
  detailedDescription: 'A command that skips the currently playing Youtube video.',
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
        new EmbedBuilder()
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
  message.delete();
  return skipVoters;
};

const skipVote = async (serverQueue: IServerMusicQueue, message: Message) => {
  skipVoters += 1;
  // If less than half has not voted, request for others to do so
  if (skipVoters < Math.ceil(0.5 * (serverQueue.voiceChannel.members.size - 1))) {
    return send(message, {
      embeds: [
        new EmbedBuilder()
          .setColor('#FFFF00')
          .setTitle('Vote to skip?')
          .setDescription(
            `\`${skipVoters}/${
              serverQueue.voiceChannel.members.size - 1
            }\` people think this song sucks. If you agree, do \`?skip\` as well.`,
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
  // "Skipping" here really means just stopping the bot. The ?play command checks when bot has gone idle in VC
  if (!message.guild) {
    return send(message, {
      embeds: [
        new EmbedBuilder()
          .setColor('#FF0000')
          .setTitle('Error')
          .setDescription('Buddy, this command is not in DMs'),
      ],
    });
  }
  serverQueue.audioPlayer.stop(true);
  skipVoters = 0;
  return send(message, {
    embeds: [
      new EmbedBuilder()
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
