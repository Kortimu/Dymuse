import { ApplyOptions } from '@sapphire/decorators';
import type { Args, CommandOptions } from '@sapphire/framework';
import BotCommand from '../../types/BotCommand';
import { Message, EmbedBuilder } from 'discord.js';
import { sendLoadingMessage } from '../../lib/utils';
import { send } from '@sapphire/plugin-editable-commands';
import wikipedia from 'wikipedia';

@ApplyOptions<CommandOptions>({
  description: 'Show a Wikipedia page.',
  fullCategory: ['Info'],
  aliases: ['wiki'],
  detailedDescription: 'A command that shows a summary of the first Wikipedia result.',
  syntax: '<search term>',
  examples: ['wikipedia feet', 'wiki the dunning-kruger effect'],
})
export class UserCommand extends BotCommand {
  public async messageRun(message: Message, args: Args) {
    // Sends loading message
    await sendLoadingMessage(message);

    const searchTerm = await args.rest('string').catch(() => undefined);
    if (!searchTerm) {
      return send(message, {
        embeds: [
          new EmbedBuilder()
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
  send(message, {
    embeds: [
      new EmbedBuilder()
        .setColor('#FFFF00')
        .setTitle('Searching...')
        .setDescription('Looking for the result...'),
    ],
  });
  // Find first result
  const wikiSearch = await wikipedia.search(searchTerm, { limit: 1, suggestion: false });

  if (!wikiSearch.results) {
    return send(message, {
      embeds: [
        new EmbedBuilder()
          .setColor('#FF0000')
          .setTitle('Error')
          .setDescription(`there is no result about \`${searchTerm}\` lol`),
      ],
    });
  }

  // Transform the found data into more useful data (for embed)
  const page = await wikipedia.page(wikiSearch.results[0].title);
  const summary = await page.summary();

  return send(message, {
    embeds: [
      new EmbedBuilder()
        .setColor('#FF00FF')
        .setTitle(summary.title)
        .setDescription(
          // Regex selects the first 300 characters. For now cuts off words
          `${summary.extract.replace(/^(.{300}[^\s]*).*/, '$1')}...\n\n**Continue reading [here](${
            page.fullurl
          })**`,
        )
        .setThumbnail(
          summary.thumbnail?.source ??
            // Wikipedia logo
            'https://en.wikipedia.org/static/images/project-logos/enwiki.png',
        ),
    ],
  });
}
