import { ApplyOptions } from '@sapphire/decorators';
import type { Command, CommandOptions } from '@sapphire/framework';
import BotCommand from '../../types/BotCommand';
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
} from 'discord.js';
import { sendLoadingInteraction } from '../../lib/utils';
import wikipedia, { type wikiSearchResult } from 'wikipedia';
import { baseEmbedFormat, errorEmbedFormat, loadEmbedFormat } from '../../lib/constants';

@ApplyOptions<CommandOptions>({
  description: 'Show a Wikipedia page.',
  fullCategory: ['Info'],
  aliases: ['wiki'],
  detailedDescription: 'A command that shows a summary of the first Wikipedia result.',
  syntax: '<search term>',
  examples: ['wikipedia feet', 'wiki the dunning-kruger effect'],
})
export class UserCommand extends BotCommand {
  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand((builder) => {
      builder
        .setName(this.name)
        .setDescription(this.description)
        .addStringOption((option) =>
          option
            .setName('search')
            .setDescription('The search terms used to get the Wikipedia article.')
            .setRequired(true),
        ),
        { guildIds: ['864115119721676820'] };
    });
  }

  public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
    await sendLoadingInteraction(interaction, false);

    const searchTerms = interaction.options.getString('search');
    if (!searchTerms) {
      return interaction.editReply({
        embeds: [errorEmbedFormat().setDescription('No search terms were input!')],
      });
    }

    await interaction.editReply({
      embeds: [
        loadEmbedFormat()
          .setTitle('🔍 Searching...')
          .setDescription('Looking for the best result...'),
      ],
    });

    const wikiResponse = await wikipedia.search(searchTerms, { limit: 1, suggestion: false });

    if (!wikiResponse.results) {
      return interaction.editReply({
        embeds: [
          errorEmbedFormat().setDescription(
            `Nothing of value was found by searching \`${searchTerms}\`!`,
          ),
        ],
      });
    }

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setLabel('🔍 Not what you were looking for?')
        .setCustomId('wiki-search')
        .setStyle(ButtonStyle.Secondary),
    );

    const wikiEmbed = await makeWikiEmbed(wikiResponse, searchTerms, 0);
    const response = await interaction.editReply({
      embeds: [wikiEmbed],
      components: [row],
    });

    try {
      const buttonCollector = await response.awaitMessageComponent({
        filter: (collected) => collected.user.id === interaction.user.id,
        time: 60 * 1000,
      });

      if (buttonCollector.customId === 'wiki-search') {
        return advancedSearch(interaction, searchTerms);
      }
      return interaction.editReply({
        embeds: [errorEmbedFormat()],
      });
    } catch (e) {
      return interaction.editReply({
        components: [],
      });
    }
  }
}

const makeWikiEmbed = async (
  wikiResponse: wikiSearchResult,
  searchTerms: string,
  resultIndex: number,
) => {
  // Get the relevant information from the Wikipedia response
  const page = await wikipedia.page(wikiResponse.results[resultIndex].title);
  const summary = await page.summary();

  // TODO: Check for special cases (no article, real short article, etc)
  return (
    baseEmbedFormat()
      .setTitle(summary.title)
      // Gets the first 300 letters from the Wiki article
      .setDescription(
        `${summary.extract.replace(/^(.{300}[^\s]*).*/, '$1')}...\n\n**Continue reading [here](${
          page.fullurl
        })**`,
      )
      .setThumbnail(
        summary.thumbnail?.source ??
          // Wikipedia logo
          'https://en.wikipedia.org/static/images/project-logos/enwiki.png',
      )
      .setFooter({
        text: `Search terms used: "${searchTerms}"`,
      })
  );
};

const advancedSearch = async (
  interaction: Command.ChatInputCommandInteraction,
  searchTerms: string,
) => {
  await interaction.editReply({
    embeds: [
      loadEmbedFormat()
        .setTitle('🔍 Searching...')
        .setDescription('Getting the first 10 results from the search terms...'),
    ],
    components: [],
  });

  const wikiResponse = await wikipedia.search(searchTerms, { limit: 10, suggestion: false });

  if (!wikiResponse.results) {
    return interaction.editReply({
      embeds: [errorEmbedFormat().setDescription(`No results from \`${searchTerms}\`.`)],
    });
  }

  const selectComponent = new StringSelectMenuBuilder()
    .setCustomId('wiki-search-select')
    .setPlaceholder('Choose the result...');

  let text = '';
  for (let index = 0; index < wikiResponse.results.length; index++) {
    const result = wikiResponse.results[index];
    text += `#${index + 1} - **${result.title}**\n`;
    selectComponent.addOptions(
      new StringSelectMenuOptionBuilder()
        .setLabel(`#${index + 1} - ${result.title}`)
        .setValue(index.toString()),
    );

    interaction.editReply({
      embeds: [
        loadEmbedFormat()
          .setTitle(`Pick from the ${wikiResponse.results.length} results:`)
          .setDescription(text),
      ],
    });
  }

  const selectMessage = await interaction.editReply({
    embeds: [
      loadEmbedFormat()
        .setTitle(`Pick from the ${wikiResponse.results.length} results:`)
        .setDescription(text),
    ],
    components: [new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectComponent)],
  });

  try {
    const selectCollector = await selectMessage.awaitMessageComponent({
      componentType: ComponentType.StringSelect,
      filter: (collected) => collected.user.id === interaction.user.id,
      time: 60 * 1000,
    });
    if (selectCollector.customId === 'wiki-search-select') {
      const resultIndex = Number(selectCollector.values[0]);
      const wikiEmbed = await makeWikiEmbed(wikiResponse, searchTerms, resultIndex);
      return await interaction.editReply({
        embeds: [wikiEmbed],
        components: [],
      });
    }
    return interaction.editReply({
      embeds: [errorEmbedFormat()],
    });
  } catch (e) {
    return interaction.editReply({
      embeds: [errorEmbedFormat()],
    });
  }
};
