import { ApplyOptions } from '@sapphire/decorators';
import type { CommandOptions, Args } from '@sapphire/framework';
import BotCommand from '../../types/BotCommand';
import { Message, EmbedBuilder } from 'discord.js';
import { sendLoadingMessage } from '../../lib/utils';
import { formatSeconds } from '../../lib/constants';
import { send } from '@sapphire/plugin-editable-commands';
import type { ISong } from '../../types/interfaces/Bot';
import ytdl from 'ytdl-core';

@ApplyOptions<CommandOptions>({
  description: 'Shows info about a Youtube video.',
  fullCategory: ['Info'],
  aliases: ['youtubeinfo', 'vidi'],
  syntax: '<url>',
  examples: [
    'videoinfo https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    'vidi https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  ],
  detailedDescription: 'A command that gives information about a Youtube video.',
})
export class UserCommand extends BotCommand {
  public async messageRun(message: Message, args: Args) {
    // Sends loading message
    await sendLoadingMessage(message);
    showInfo(message, args);
    message.delete();
  }
}

const showInfo = async (message: Message, args: Args) => {
  const songUrl = await args.pick('string').catch(() => '');
  // If no URL specified
  if (songUrl === '') {
    return send(message, {
      embeds: [
        new EmbedBuilder()
          .setColor('#FF0000')
          .setTitle('Error')
          .setDescription('What should I look for? EMPTY AIR?!'),
      ],
    }).then((msg) => {
      setTimeout(() => {
        msg.delete();
      }, 10 * 1000);
    });
  }
  // Get info about the URL
  let songInfo = null;
  try {
    songInfo = await getSongInfo(message, songUrl);
  } catch (error) {
    throw 'Error getting song info';
  }
  if (songInfo === null) {
    return send(message, {
      embeds: [
        new EmbedBuilder()
          .setColor('#FF0000')
          .setTitle('Error')
          .setDescription('Am I expected to find something that does not exist?!'),
      ],
    }).then((msg) => {
      setTimeout(() => {
        msg.delete();
      }, 10 * 1000);
    });
  }

  // The data gained gets stored in interface for ease of use
  const rawData = await ytdl.getBasicInfo(songInfo.videoDetails.video_url, { lang: 'en' });
  const duration = parseInt(rawData.videoDetails.lengthSeconds, 10);
  const song: ISong = {
    info: rawData,
    url: rawData.videoDetails.video_url,
    title: rawData.videoDetails.title,
    duration,
    formattedDuration: formatSeconds(duration),
    creationDate: rawData.videoDetails.publishDate,
    views: rawData.videoDetails.viewCount,
    likes: rawData.videoDetails.likes?.toString() ?? 'Not shown',
    subscribers: rawData.videoDetails.author.subscriber_count?.toString() ?? 'Not shown',
    bestThumbnail: rawData.videoDetails.thumbnails[3],
    channelName: rawData.videoDetails.author.name,
    channelLogo:
      rawData.videoDetails.author.thumbnails?.[0].url ??
      // Typical user profile picture
      'https://yt3.ggpht.com/a-/AAuE7mDaHtAVove7M4KGX3OGtmBjsfpBGCbIPNrwAA=s900-mo-c-c0xffffffff-rj-k-no',
  };

  return send(message, {
    embeds: [
      new EmbedBuilder()
        .setColor('#FF00FF')
        .setTitle('Information about the video:')
        .setDescription(
          `**URL:** ${song.url}\n\n**Title:** ${song.title}\n**Length:** ${song.formattedDuration}\n**Published:** ${song.creationDate}\n\n**Views:** ${song.views}\n**Likes:** ${song.likes}\n\n**Channel:** ${song.channelName}\n**Subsribers:** ${song.subscribers}`,
        )
        .setImage(song.bestThumbnail.url)
        .setThumbnail(song.channelLogo),
    ],
  });
};

const getSongInfo = async (message: Message, songUrl: string) => {
  let songInfo = null;

  // If URL is not valid
  if (!ytdl.validateURL(songUrl)) {
    send(message, {
      embeds: [
        new EmbedBuilder()
          .setColor('#FF0000')
          .setTitle('Error')
          .setDescription('bro that URL is wack'),
      ],
    }).then((msg) => {
      setTimeout(() => {
        msg.delete();
      }, 10 * 1000);
    });
    return songInfo;
  }

  try {
    songInfo = await ytdl.getInfo(songUrl);
  } catch (error) {
    console.log(error);
    throw 'Error getting the video from the URL';
  }
  return songInfo;
};
