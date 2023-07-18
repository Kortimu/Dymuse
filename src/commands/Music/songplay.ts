import { ApplyOptions } from '@sapphire/decorators';
import type { Args, CommandOptions } from '@sapphire/framework';
import BotCommand from '../../types/BotCommand';
import { Guild, Message, TextChannel, VoiceChannel } from 'discord.js';
import {
  AudioPlayerStatus,
  createAudioPlayer,
  createAudioResource,
  entersState,
  getVoiceConnection,
  joinVoiceChannel,
  StreamType,
} from '@discordjs/voice';
import { sendLoadingMessage } from '../../lib/utils';
import { send } from '@sapphire/plugin-editable-commands';
import { baseEmbedFormat, errorEmbedFormat, formatSeconds, loadEmbedFormat } from '../../lib/constants';
import type { IServerMusicQueue, ISong } from '../../types/interfaces/Bot';
import ytdl from 'ytdl-core';
import ytsr from 'ytsr';

// Define variables for use in other files
export const queues = new Map();
export let curDur = 0;

@ApplyOptions<CommandOptions>({
  name: 'play',
  description: 'Plays audio from Youtube.',
  fullCategory: ['Music'],
  aliases: ['pl', 'youtube'],
  detailedDescription: 'A command that plays a user-requested Youtube video in audio form.',
  syntax: '<url/search term>',
  examples: ['pl https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'youtube party rock apple'],
  notes: [
    "This command is very unstable at the moment. If there are problems, don't be surprised.",
  ],
})
export class UserCommand extends BotCommand {
  public async messageRun(message: Message, args: Args) {
    // Sends loading message
    await sendLoadingMessage(message);
    if (!args) {
      send(message, {
        embeds: [
          errorEmbedFormat().setDescription(
            'How do you think I can find something with no link or search term? Reading your mind?!',
          ),
        ],
      });
      return;
    }
    await play(message, args);
  }
}

const play = async (message: Message, args: Args) => {
  if (!message.member) {
    return;
  }
  if (!message.member.voice.channel) {
    return send(message, {
      embeds: [errorEmbedFormat().setDescription('You need to be in a voice channel to use this, duh')],
    });
  }

  // Find info about the song
  let songInfo = null;
  try {
    songInfo = await getSongInfo(message, args);
  } catch (error) {
    throw 'Error getting song info';
  }
  if (songInfo === null) {
    return send(message, {
      embeds: [errorEmbedFormat().setDescription('Am I expected to find something that does not exist?!')],
    });
  }

  // Get info from the URL, add data to an interface for ease of use
  const rawData = await ytdl.getBasicInfo(songInfo.videoDetails.video_url, { lang: 'en' });
  const duration = parseInt(rawData.videoDetails.lengthSeconds, 10);
  const info: ISong = {
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
      'https://yt3.ggpht.com/a-/AAuE7mDaHtAVove7M4KGX3OGtmBjsfpBGCbIPNrwAA=s900-mo-c-c0xffffffff-rj-k-no',
  };
  // Found! (Embed)
  send(message, {
    embeds: [
      baseEmbedFormat().setTitle('Song found!').setDescription(`\`${info.title}\` is about to play...`),
    ],
  });
  if (!message.guild) {
    throw 'Guild not found (why in DMs)';
  }
  const voiceChannel = message.member.voice.channel as VoiceChannel;

  // Each guild has their own queue
  let musicQueue = queues.get(message.guild.id);
  if (!musicQueue) {
    // Default settings for a queue
    musicQueue = {
      voiceChannel,
      songs: [],
      audioPlayer: null,
      isPlaying: false,
      repeatMode: 'off',
    };
    queues.set(message.guild.id, musicQueue);
  }

  const serverQueue = addSongToQueue(musicQueue, info);

  if (!serverQueue.isPlaying) {
    playSong(message.member.guild, message.channel as TextChannel, serverQueue, queues);
  }
  message.delete();
  return send(message, {
    embeds: [
      baseEmbedFormat()
        .setTitle('Song added to queue!')
        .setDescription(
          `**Title:** ${info.title}\n**Length:** ${info.formattedDuration}\n**Channel:** ${info.channelName}`,
        )
        .setImage(info.bestThumbnail.url)
        .setThumbnail(info.channelLogo),
    ],
  }).then((msg) => {
    setTimeout(() => {
      msg.delete();
    }, 10 * 1000);
  });
};

const getSongInfo = async (message: Message, args: Args) => {
  let songInfo = null;
  let songUrl = await args.pick('string');

  // If URL is not valid, check if result can be found by searching on Youtube
  if (!ytdl.validateURL(songUrl)) {
    const result = `${songUrl} ${await args.rest('string').catch(() => '')}`;
    send(message, {
      embeds: [
        loadEmbedFormat()
          .setTitle('Searching...')
          .setDescription(`Searching \`${result}\` on Youtube...`),
      ],
    });

    // Make sure the Youtube URL is a video
    let filters = null;
    try {
      filters = await ytsr.getFilters(result);
    } catch (error) {
      console.log(error);
      console.log('Error getting filters');
    }
    if (filters === null) {
      throw 'Why are filters null?!';
    }

    const filter = filters.get('Type')?.get('Video')?.url ?? result;

    // Try looking up on Youtube
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

  // Return the info the function that called it
  try {
    songInfo = await ytdl.getInfo(songUrl);
  } catch (error) {
    console.log(error);
    throw 'Error getting the video from the URL';
  }
  return songInfo;
};

// Create an audio player to play videos on VC
const getSongPlayer = async (song: ISong) => {
  const player = createAudioPlayer();
  const stream = ytdl(song.url, {
    filter: 'audioonly',
    highWaterMark: 1 << 25,
  });
  const resource = createAudioResource(stream, {
    inputType: StreamType.Arbitrary,
  });
  player.play(resource);
  return entersState(player, AudioPlayerStatus.Playing, 15 * 1000);
};

export const playSong = async (
  guild: Guild,
  channel: TextChannel,
  queue: IServerMusicQueue,
  musicQueue: Map<string, IServerMusicQueue>,
) => {
  // If queue is empty, do the needed actions
  if (queue.songs.length === 0) {
    return emptyQueue(guild.id, channel, queue, musicQueue);
  }
  // Connect to VC, play next video in queue
  const connection = connect(queue.voiceChannel);
  const { songs } = queue;
  queue.audioPlayer = await getSongPlayer(songs[0]);
  connection.subscribe(queue.audioPlayer);
  queue.isPlaying = true;

  // Start a timer, to track the current play time. There might be a built-in variable for this, could not find one
  let preview = false;
  const timer = setInterval(() => {
    if (curDur < queue.songs[0].duration - 10) {
      return curDur++;
    }
    curDur++;
    if (queue.songs.length === 1) {
      return;
    }
    let upcomingSong = songs[1];
    if (queue.repeatMode === 'single') {
      [upcomingSong] = songs;
    }

    // 10 seconds before the end, show preview ONCE
    if (!preview) {
      nextPreview(upcomingSong, channel);
      preview = true;
    }
    clearInterval(timer);
    return curDur;
  }, 1 * 1000);

  // If bot is not playing music, do the needed actions
  queue.audioPlayer.on(AudioPlayerStatus.Idle, () => {
    queue.isPlaying = false;
    clearTimeout(timer);
    songFinish(guild, channel, queue, musicQueue);
  });
};

const addSongToQueue = (musicQueue: IServerMusicQueue, song: ISong) => {
  // Adds song to the end of array
  musicQueue.songs.push(song);
  return musicQueue;
};

export const songFinish = (
  guild: Guild,
  channel: TextChannel,
  serverQueue: IServerMusicQueue,
  musicQueue: Map<string, IServerMusicQueue>,
) => {
  curDur = 0;
  // If queue is still active, remove the first element of array, and maybe put it back in
  if (serverQueue !== null) {
    const { songs } = serverQueue;
    if (serverQueue.repeatMode === 'all') {
      serverQueue.songs.push(songs[0]);
    }
    if (serverQueue.repeatMode === 'all' || serverQueue.repeatMode === 'off') {
      serverQueue.songs.shift();
    }
    if (!serverQueue.songs) {
      console.log('uh oh');
    }
    playSong(guild, channel, serverQueue, musicQueue);
    songPreview(songs[0], channel);
  }
};

const nextPreview = (song: ISong, channel: TextChannel) => {
  // Preview video 10 seconds before it plays
  if (!song) {
    return;
  }
  channel
    .send({
      embeds: [
        loadEmbedFormat()
          .setTitle('Coming up...')
          .setDescription(
            `**URL:** ${song.url}\n**Title:** ${song.title}\n**Length:** ${song.formattedDuration}\n**Channel:** ${song.channelName}`,
          )
          .setImage(song.bestThumbnail.url)
          .setThumbnail(song.channelLogo),
      ],
    })
    .then((msg) => {
      setTimeout(() => {
        msg.delete();
      }, 9 * 1000);
    });
};

const songPreview = (song: ISong, channel: TextChannel) => {
  // Shows currently playing song for 5 seconds
  if (!song) {
    return;
  }
  channel
    .send({
      embeds: [
        baseEmbedFormat()
          .setTitle('Playing...')
          .setDescription(
            `**URL:** ${song.url}\n**Title:** ${song.title}\n**Length:** ${song.formattedDuration}\n**Channel:** ${song.channelName}`,
          )
          .setImage(song.bestThumbnail.url)
          .setThumbnail(song.channelLogo),
      ],
    })
    .then((msg) => {
      setTimeout(() => {
        msg.delete();
      }, 10 * 1000);
    });
};

const emptyQueue = (
  guildId: string,
  channel: TextChannel,
  serverQueue: IServerMusicQueue,
  musicQueue: Map<string, IServerMusicQueue>,
) => {
  // If queue empty, leave after 60 seconds or when everyone leaves
  serverQueue.audioPlayer.stop();
  const connection = getVoiceConnection(guildId);
  if (serverQueue.voiceChannel.members.size === 1 && connection) {
    console.log('everybody left lmao');
    connection.destroy();
    musicQueue.delete(guildId);
    channel.send({
      embeds: [
        errorEmbedFormat()
          .setTitle('Music Stopped')
          .setDescription('Everyone left, not playing music alone'),
      ],
    });
    return;
  }
  setTimeout(() => {
    if (serverQueue.songs.length === 0 && connection) {
      console.log('no more songs lol');
      connection.destroy();
      musicQueue.delete(guildId);
      channel.send({
        embeds: [errorEmbedFormat().setTitle('bye').setDescription('aight imma head out')],
      });
    }
  }, 60 * 1000);
};

const connect = (channel: VoiceChannel) => {
  const connection = joinVoiceChannel({
    channelId: channel.id,
    guildId: channel.guild.id,
    adapterCreator: channel.guild.voiceAdapterCreator,
  });
  return connection;
};
