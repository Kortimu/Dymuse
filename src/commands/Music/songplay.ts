import { ApplyOptions } from '@sapphire/decorators';
import type { Args, CommandOptions } from '@sapphire/framework';
import BotCommand from '../../types/BotCommand';
import { Guild, Message, MessageEmbed, TextChannel, VoiceChannel } from 'discord.js';
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
import { formatSeconds } from '../../lib/constants';
import type { IServerMusicQueue, ISong } from '../../types/interfaces/Bot';
import ytdl from 'ytdl-core';
import ytsr from 'ytsr';
export const queues = new Map();

@ApplyOptions<CommandOptions>({
  name: 'play',
  description: 'Plays audio from Youtube.',
  fullCategory: ['Music'],
  aliases: ['pl', 'youtube'],
  detailedDescription: 'A command that plays a user-requested Youtube video in audio form.',
  preconditions: ['TestOnly'],
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
          new MessageEmbed()
            .setColor('#FF0000')
            .setTitle('Error')
            .setDescription(
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
    throw 'Error getting song info';
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
  const info: ISong = {
    info: rawData,
    url: rawData.videoDetails.video_url,
    title: rawData.videoDetails.title,
    duration,
    formattedDuration: formatSeconds(duration),
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
      new MessageEmbed()
        .setColor('#FF00FF')
        .setTitle('Song found!')
        .setDescription(`\`${info.title}\` is about to play...`),
    ],
  });
  if (!message.guild) {
    throw 'Guild not found (why in DMs)';
  }
  const voiceChannel = message.member.voice.channel as VoiceChannel;

  let musicQueue = queues.get(message.guild.id);
  if (!musicQueue) {
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
      new MessageEmbed()
        .setColor('#FF00FF')
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

  if (!ytdl.validateURL(songUrl)) {
    const result = `${songUrl} ${await args.rest('string').catch(() => '')}`;
    send(message, {
      embeds: [
        new MessageEmbed()
          .setColor('#FFFF00')
          .setTitle('Searching...')
          .setDescription(`Searching \`${result}\` on Youtube...`),
      ],
    });

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
    throw 'Error getting the video from the URL';
  }
  return songInfo;
};

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
  if (!queue) {
    return;
  }
  if (queue.songs.length === 0) {
    return emptyQueue(guild.id, channel, queue, musicQueue);
  }
  const connection = connect(queue.voiceChannel);
  const { songs } = queue;
  queue.audioPlayer = await getSongPlayer(songs[0]);
  connection.subscribe(queue.audioPlayer);
  queue.isPlaying = true;

  setTimeout(() => {
    if (queue.songs.length === 1) {
      return;
    }
    let nextSong = songs[1];
    if (queue.repeatMode === 'single') {
      [nextSong] = songs;
    }
    nextPreview(nextSong, channel);
  }, (songs[0].duration - 10) * 1000);

  queue.audioPlayer.on(AudioPlayerStatus.Idle, () => {
    queue.isPlaying = false;
    songFinish(guild, channel, queue, musicQueue);
  });
};

const addSongToQueue = (musicQueue: IServerMusicQueue, song: ISong) => {
  musicQueue.songs.push(song);
  return musicQueue;
};

export const songFinish = (
  guild: Guild,
  channel: TextChannel,
  serverQueue: IServerMusicQueue,
  musicQueue: Map<string, IServerMusicQueue>,
) => {
  if (serverQueue !== null) {
    const { songs } = serverQueue;
    if (serverQueue.repeatMode === 'all') {
      serverQueue.songs.push(songs[0]);
    }
    if (serverQueue.repeatMode === 'all' || serverQueue.repeatMode === 'off') {
      serverQueue.songs.shift();
    }
    playSong(guild, channel, serverQueue, musicQueue);
    songPreview(songs[0], channel);
  }
};

const nextPreview = (song: ISong, channel: TextChannel) => {
  // Preview song 10 seconds before playing it
  if (!song) {
    return;
  }
  channel
    .send({
      embeds: [
        new MessageEmbed()
          .setColor('#FFFF00')
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
        new MessageEmbed()
          .setColor('#FF00FF')
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
  const connection = getVoiceConnection(guildId);
  if (serverQueue.voiceChannel.members.size === 1) {
    connection?.destroy();
    musicQueue.delete(guildId);
    channel.send({
      embeds: [
        new MessageEmbed()
          .setColor('#FF0000')
          .setTitle('Music Stopped')
          .setDescription('Everyone left, not playing music alone'),
      ],
    });
    return;
  }
  setTimeout(() => {
    if (serverQueue.songs.length === 0) {
      connection?.destroy();
      musicQueue.delete(guildId);
      channel.send({
        embeds: [
          new MessageEmbed()
            .setColor('#FF0000')
            .setTitle('bye')
            .setDescription('aight imma head out'),
        ],
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
