import { ApplyOptions } from '@sapphire/decorators';
import { Args, Command, CommandOptions } from '@sapphire/framework';
import { Message, MessageEmbed, VoiceChannel } from 'discord.js';
import {
  AudioPlayerStatus,
  createAudioPlayer,
  createAudioResource,
  entersState,
  joinVoiceChannel,
  StreamType,
} from '@discordjs/voice';
import { sendLoadingMessage } from '../../lib/utils';
import { send } from '@sapphire/plugin-editable-commands';
import ytdl from 'ytdl-core';
import ytsr from 'ytsr';

@ApplyOptions<CommandOptions>({
  description: 'Plays audio from Youtube.',
  fullCategory: ['Music'],
  aliases: ['pl', 'youtube'],
  detailedDescription: 'A command that plays a user-requested Youtube video in audio form.',
})
export class UserCommand extends Command {
  public async messageRun(message: Message, args: Args) {
    // Sends loading message
    await sendLoadingMessage(message);
    if (!args) {
      return;
    }
    play(message, args);
  }
}

const play = async (message: Message, args: Args) => {
  if (!message.member) {
    return;
  }
  if (!message.member.voice.channel) {
    return send(message, {
      embeds: [
        new MessageEmbed()
          .setColor('#FF0000')
          .setTitle('Error')
          .setDescription('You need to be in a voice channel to use this, duh'),
      ],
    });
  }

  let songInfo = null;
  try {
    songInfo = await getSongInfo(args);
  } catch (error) {
    console.log(error);
  }
  if (songInfo === null) {
    return send(message, {
      embeds: [
        new MessageEmbed()
          .setColor('#FF0000')
          .setTitle('Error')
          .setDescription('Song not found, dumbass'),
      ],
    });
  }

  const rawData = await ytdl.getBasicInfo(songInfo.videoDetails.video_url, { lang: 'en' });
  const duration = parseInt(rawData.videoDetails.lengthSeconds, 10);
  const info = {
    info: rawData,
    url: rawData.videoDetails.video_url,
    title: rawData.videoDetails.title,
    duration,
    bestThumbnail: rawData.videoDetails.thumbnails[0],
  };

  playSong(message.member.voice.channel as VoiceChannel, info);

  return send(message, {
    embeds: [
      new MessageEmbed()
        .setColor('#FF00FF')
        .setTitle('Song added to queue!')
        .setDescription(
          `**Title:** ${info.title}\n**Length:** ${info.duration} seconds (shut up, showing time in a fancy way is hard)`,
        ),
    ],
  });
};

const getSongInfo = async (args: Args) => {
  let songInfo = null;
  let songUrl = await args.pick('string');

  if (!ytdl.validateURL(songUrl)) {
    const result = `${songUrl} ${await args.rest('string').catch(() => '')}`;
    try {
      const results: any = await ytsr(result, {
        limit: 1,
      });
      songUrl = results.items[0].url;
    } catch (error) {
      console.log(error);
      throw 'Error searching for song';
    }

    if (!ytdl.validateURL(songUrl)) {
      throw 'Song not found... for some reason';
    }

    console.log(result);
  }

  try {
    songInfo = await ytdl.getInfo(songUrl);
  } catch (error) {
    console.log(error);
    throw 'Error getting the video from the URL.';
  }
  return songInfo;
};

const getSongPlayer = async (song: any) => {
  const player = createAudioPlayer();
  const stream = ytdl(song.url, {
    filter: 'audioonly',
    highWaterMark: 1 << 25,
  });
  const resource = createAudioResource(stream, {
    inputType: StreamType.Arbitrary,
  });
  player.play(resource);
  return entersState(player, AudioPlayerStatus.Playing, 10 * 1000);
};

const playSong = async (voiceChannel: VoiceChannel, songInfo: any) => {
  const connection = connect(voiceChannel);
  const audioPlayer = await getSongPlayer(songInfo);
  connection.subscribe(audioPlayer);
};

const connect = (channel: VoiceChannel) => {
  const connection = joinVoiceChannel({
    channelId: channel.id,
    guildId: channel.guild.id,
    adapterCreator: channel.guild.voiceAdapterCreator,
  });
  return connection;
};
