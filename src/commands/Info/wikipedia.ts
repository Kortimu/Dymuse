import { ApplyOptions } from '@sapphire/decorators';
import type { Command, CommandOptions } from '@sapphire/framework';
import BotCommand from '../../types/BotCommand';
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
  EmbedBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
} from 'discord.js';
import { sendLoadingInteraction } from '../../lib/utils';
import wikipedia, { type wikiSearchResult } from 'wikipedia';

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
    await sendLoadingInteraction(interaction);

    const searchTerms = interaction.options.getString('search');
    if (!searchTerms) {
      return interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setTitle('Error')
            .setDescription('No search terms were input!')
            .setColor('#FF0000'),
        ],
      });
    }

    await interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setTitle('🔍 Searching...')
          .setDescription('Looking for the best result...')
          .setColor('#FFFF00'),
      ],
    });

    const wikiResponse = await wikipedia.search(searchTerms, { limit: 1, suggestion: false });

    if (!wikiResponse.results) {
      return interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setTitle('Error')
            .setDescription(`Nothing of value was found by searching \`${searchTerms}\`!`)
            .setColor('#FF0000'),
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
      } else {
        return interaction.editReply({
          embeds: [
            new EmbedBuilder()
              .setColor('#ff0000')
              .setTitle('Error')
              .setDescription(
                'Some *real* wacky problem occured. Please annoy @kortimu over this ASAP!',
              ),
          ],
        });
      }
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
    new EmbedBuilder()
      .setTitle(summary.title)
      // Gets the first 300 letters from the Wiki article
      .setDescription(
        `${summary.extract.replace(/^(.{300}[^\s]*).*/, '$1')}...\n\n**Continue reading [here](${
          page.fullurl
        })**`,
      )
      .setColor('#00FF00')
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
      new EmbedBuilder()
        .setColor('#FFFF00')
        .setTitle('🔍 Searching...')
        .setDescription('Getting the first 10 results from the search terms...'),
    ],
    components: [],
  });

  const wikiResponse = await wikipedia.search(searchTerms, { limit: 10, suggestion: false });

  if (!wikiResponse.results) {
    return interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setColor('#FF0000')
          .setTitle('Error')
          .setDescription(`No results from \`${searchTerms}\`.`),
      ],
    });
  }

  let selectComponent = new StringSelectMenuBuilder()
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
        new EmbedBuilder()
          .setColor('#ffff00')
          .setTitle(`Pick from the ${wikiResponse.results.length} results:`)
          .setDescription(text)
          .setFooter({
            text: 'Fetching all of the results might take a while.',
          }),
      ],
    });
  }

  const selectMessage = await interaction.editReply({
    embeds: [
      new EmbedBuilder()
        .setColor('#ffff00')
        .setTitle(`Pick from the ${wikiResponse.results.length} results:`)
        .setDescription(text)
        .setFooter({
          text: 'Fetching all of the results might take a while.',
        }),
    ],
    components: [new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectComponent)],
  });

  try {
    const selectCollector = await selectMessage.awaitMessageComponent({
      componentType: ComponentType.StringSelect,
      filter: (collected) => collected.user.id === interaction.user.id,
      time: 60 * 1000,
    });
    if (selectCollector.customId == 'wiki-search-select') {
      const resultIndex = +selectCollector.values[0];
      const wikiEmbed = await makeWikiEmbed(wikiResponse, searchTerms, resultIndex);
      return await interaction.editReply({
        embeds: [wikiEmbed],
        components: [],
      });
    } else {
      return interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setColor('#ff0000')
            .setTitle('Error')
            .setDescription(
              'Some *real* wacky problem occured. Please annoy @kortimu over this ASAP!',
            ),
        ],
      });
    }
  } catch (e) {
    return interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setColor('#ff0000')
          .setTitle('Error')
          .setDescription(
            'Some *real* wacky problem occured. Please annoy @kortimu over this ASAP!',
          ),
      ],
    });
  }
};
