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
      send (message, {
        embeds: [
          new MessageEmbed()
            .setColor('#FF0000')
            .setTitle('Error')
            .setDescription('How do you think I can find something with no link or search term? Reading your mind?!')
        ]
      })
      return
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
    songInfo = await getSongInfo(message, args);
  } catch (error) {
    throw 'Error getting song info'
  }
  if (songInfo === null) {
    return send(message, {
      embeds: [
        new MessageEmbed()
          .setColor('#FF0000')
          .setTitle('Error')
          .setDescription('Am I expected to find something that does not exist?!'),
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
    bestThumbnail: rawData.videoDetails.thumbnails[3],
    channelName: rawData.videoDetails.author.name,
    channelLogo: rawData.videoDetails.author.thumbnails?.[0].url ?? 'https://yt3.ggpht.com/a-/AAuE7mDaHtAVove7M4KGX3OGtmBjsfpBGCbIPNrwAA=s900-mo-c-c0xffffffff-rj-k-no'
  };
  // Found! (Embed)
  send(message, {
    embeds: [
      new MessageEmbed()
        .setColor('#FF00FF')
        .setTitle('Song found!')
        .setDescription(`\`${info.title}\` is about to play...`)
    ]
  })

  playSong(message.member.voice.channel as VoiceChannel, info);

  return send(message, {
    embeds: [
      new MessageEmbed()
        .setColor('#FF00FF')
        .setTitle('Song added to queue!')
        .setDescription(
          `**Title:** ${info.title}\n**Length:** ${formatSeconds(info.duration)}\n**Channel:** ${info.channelName}`,
        )
        .setImage(info.bestThumbnail.url)
        .setThumbnail(info.channelLogo),
    ],
  });
};

const getSongInfo = async (message: Message, args: Args) => {
  let songInfo = null;
  let songUrl = await args.pick('string');

  if (!ytdl.validateURL(songUrl)) {
    const result = `${songUrl} ${await args.rest('string').catch(() => '')}`;
    send(message, {
      embeds: [
        new MessageEmbed()
          .setColor('#FFFF00')
          .setTitle('Searching...')
          .setDescription(`Searching \`${result}\` on Youtube...`)
      ]
    })

    const filters = await ytsr.getFilters(result)
    const filter = filters.get('Type')?.get('Video')?.url ?? result

    try {
      const results: any = await ytsr(filter, {
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

const formatSeconds = (duration: number) => {
  const seconds = Math.floor(duration % 60)
  const minutes = Math.floor((duration / 60) % 60)
  const hours = Math.floor((duration / (60 * 60)) % 60)

  const displayHours = (hours > 0) ? `${hours}:` : '';
  const displayMinutes = (minutes < 10) ? `0${minutes}` : minutes;
  const displaySeconds = (seconds < 10) ? `0${seconds}` : seconds;

  return `\`${displayHours}${displayMinutes}:${displaySeconds}\``;
}