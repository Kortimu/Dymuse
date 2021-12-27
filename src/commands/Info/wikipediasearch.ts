import { ApplyOptions } from '@sapphire/decorators';
import type { Args, CommandOptions } from '@sapphire/framework';
import BotCommand from '../../types/BotCommand';
import { Message, MessageEmbed } from 'discord.js';
import { sendLoadingMessage } from '../../lib/utils';
import { send } from '@sapphire/plugin-editable-commands';
import wikipedia from 'wikipedia';

@ApplyOptions<CommandOptions>({
  description: 'Search on Wikipedia.',
  fullCategory: ['Info'],
  aliases: ['wikisr', 'wsearch', 'wikisearch'],
  detailedDescription: 'A command that allows to look up anything on Wikipedia.',
  syntax: '<search term>',
  examples: ['wikisr feet', 'wsearch the dunning-kruger effect'],
})
export class UserCommand extends BotCommand {
  public async messageRun(message: Message, args: Args) {
    // Sends loading message
    await sendLoadingMessage(message);

    const searchTerm = await args.rest('string').catch(() => undefined);
    if (!searchTerm) {
      return send(message, {
        embeds: [
          new MessageEmbed()
            .setColor('#FF0000')
            .setTitle('Error')
            .setDescription('Very funny. If you want results, enter in an actual result.'),
        ],
      });
    }
    return searchWiki(message, searchTerm);
  }
}

async function searchWiki(message: Message, searchTerm: string) {
  const resultEmbed = new MessageEmbed()
    .setColor('#FF00FF')
    .setFooter('It may take a while to load all results.');
  send(message, {
    embeds: [
      new MessageEmbed()
        .setColor('#FFFF00')
        .setTitle('Searching...')
        .setDescription('Looking for results...'),
    ],
  });
  const wikiSearch = await wikipedia.search(searchTerm, { limit: 10, suggestion: false });

  if (!wikiSearch.results) {
    return send(message, {
      embeds: [
        new MessageEmbed()
          .setColor('#FF0000')
          .setTitle('Error')
          .setDescription(`there is no result about \`${searchTerm}\` lol`),
      ],
    });
  }
  let text = '';
  let index = 0;
  wikiSearch.results.forEach((result) => {
    index++;
    text += `#${index} **${result.title}**\n`;
    send(message, {
      embeds: [
        resultEmbed
          .setTitle(`Pick from the ${wikiSearch.results.length} results:`)
          .setDescription(text),
      ],
    });
  });
  return collectResponse(message, wikiSearch.results);
}

function collectResponse(message: Message, options: any) {
  const collector = message.channel.createMessageCollector({
    max: 1,
    time: 20 * 1000,
  });

  collector.on('collect', async (msg) => {
    const resultPick = parseInt(msg.content, 10);
    if (!resultPick || resultPick > options.length || resultPick < 1) {
      send(msg, {
        embeds: [
          new MessageEmbed()
            .setColor('#FF0000')
            .setTitle('Error')
            .setTitle(`Pick betweeen 1 and **${options.length}**, ya dunce`),
        ],
      });
    }
    const resultTitle = options[resultPick - 1].title;
    const page = await wikipedia.page(resultTitle);
    const summary = await page.summary();
    send(msg, {
      embeds: [
        new MessageEmbed()
          .setColor('#FF00FF')
          .setTitle(`Info about "${summary.title}"`)
          .setDescription(
            `${summary.extract.replace(
              /^(.{300}[^\s]*).*/,
              '$1',
            )}...\n\n**Continue reading [here](${page.fullurl})**`,
          )
          .setThumbnail(
            summary.thumbnail?.source ??
              'https://en.wikipedia.org/static/images/project-logos/enwiki.png',
          ),
      ],
    }).then(() => {
      msg.delete();
    });
  });
  collector.on('end', () => {
    send(message, {
      embeds: [
        new MessageEmbed()
          .setColor('#FF0000')
          .setTitle('Error')
          .setDescription('I am not waiting that long for a response, bye'),
      ],
    }).then((msg) => {
      setTimeout(() => {
        msg.delete();
      }, 10 * 1000);
    });
  });

  message.delete();
}
