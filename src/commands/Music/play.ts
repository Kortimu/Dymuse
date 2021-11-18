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

@ApplyOptions<CommandOptions>({
  description: 'Plays audio from Youtube.',
  fullCategory: ['Music'],
  aliases: ['p'],
  detailedDescription: 'A command that plays a user-requested Youtube video in audio form.',
})
export class UserCommand extends Command {
  public async messageRun(message: Message, args: Args) {
    // Sends loading message
    await sendLoadingMessage(message);

    const url = await args.pick('string');
    console.log(url);

    play(message, url);
  }
}

const play = async (message: Message, url: string) => {
  if (!message.member) {
    return;
  }
  if (!message.member.voice.channel) {
    return send(message, {
      embeds: [
        new MessageEmbed()
          .setColor('#FF0000')
          .setTitle('Error')
          .setDescription('You need to be in a voice channel to use this lmao'),
      ],
    });
  }
  if (ytdl.validateURL(url)) {
    const rawData = await ytdl.getBasicInfo(url, { lang: 'en' });
    const duration = parseInt(rawData.videoDetails.lengthSeconds, 10);
    const info = {
      info: rawData,
      url: rawData.videoDetails.video_url,
      title: rawData.videoDetails.title,
      duration,
      bestThumbnail: rawData.videoDetails.thumbnails[0],
    };

    playSong(message.member.voice.channel as VoiceChannel, info);

    // URL specified
    return send(message, {
      embeds: [
        new MessageEmbed()
          .setColor('#FF00FF')
          .setTitle('Song added!')
          .setDescription(
            `**Title:** ${info.title}\n**Length:** ${info.duration} seconds (will look better later, shut up)`,
          ),
      ],
    });
  }
  // No URL specified
  return send(message, {
    embeds: [
      new MessageEmbed().setColor('#FF0000').setTitle('yikes').setDescription('das not url'),
    ],
  });
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
  return entersState(player, AudioPlayerStatus.Playing, 5 * 1000);
};

const playSong = async (voiceChannel: VoiceChannel, songInfo: any) => {
  const connection = await connect(voiceChannel);
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
