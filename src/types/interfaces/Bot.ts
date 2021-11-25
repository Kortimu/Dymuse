import type { VoiceChannel } from 'discord.js';
import type { AudioPlayer } from '@discordjs/voice';
import type ytdl from 'ytdl-core';

export interface ISong {
  info: ytdl.videoInfo;
  url: string;
  title: string;
  duration: number;
  formattedDuration: string;
  bestThumbnail: ytdl.thumbnail;
  channelName: string;
  channelLogo: string;
}

export interface IServerMusicQueue {
  voiceChannel: VoiceChannel;
  songs: Array<ISong>;
  audioPlayer: AudioPlayer;
  isPlaying: boolean;
  repeatMode: string;
}
