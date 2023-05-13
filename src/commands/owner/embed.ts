import { ApplyOptions } from '@sapphire/decorators';
import type { CommandOptions } from '@sapphire/framework';
import BotCommand from '../../types/BotCommand';
import { Message, EmbedBuilder } from 'discord.js';
import { sendLoadingMessage } from '../../lib/utils';
import { send } from '@sapphire/plugin-editable-commands';

@ApplyOptions<CommandOptions>({
  description: 'Allows the user to make an embed by themselves.',
  fullCategory: ['Owner'],
  aliases: ['e'],
  preconditions: ['OwnerOnly'],
  detailedDescription:
    'Users that are considered "owners" by the bot can use this command to make a simple embed with a title and description.',
  notes: ['If needed, field functionality can be added. Not yet, though.'],
})
export class UserCommand extends BotCommand {
  public async messageRun(message: Message) {
    // Sends loading message
    await sendLoadingMessage(message);

    const embed = new EmbedBuilder();
    // Show how far the user has gotten (might be a better way to do this)
    let stage = 0;

    // Start a message collector for embed title
    const titleCollector = message.channel.createMessageCollector({
      max: 1,
      time: 20 * 1000,
    });
    // Inform the user for what needs to be done
    send(message, {
      embeds: [
        new EmbedBuilder()
          .setColor('#FF0000')
          .setTitle('Embed Creation (1/2)')
          .setDescription('Write the title of the embed.'),
      ],
    });

    // If something is found, continue
    titleCollector.on('collect', (msgTitle) => {
      embed.setTitle(msgTitle.content);
      msgTitle.delete();
      // Line 21 explains this
      stage = 1;
      send(message, {
        embeds: [
          new EmbedBuilder()
            .setColor('#FFFF00')
            .setTitle('Embed Creation (2/2)')
            .setDescription('Write the description of the embed.'),
        ],
      });

      // Start a message collector for embed description
      const descriptionCollector = message.channel.createMessageCollector({
        max: 1,
        time: 120 * 1000,
      });
      descriptionCollector.on('collect', (msgDesc) => {
        embed.setDescription(msgDesc.content);
        msgDesc.delete();
        // Line 9 + 10 explains this
        stage = 2;
        // Send the abomination of a result
        message.channel.send({ embeds: [embed.setColor('#FF00FF')] });
        // Congratulate the user
        send(message, {
          embeds: [
            new EmbedBuilder()
              .setColor('#00FF00')
              .setTitle('Success!')
              .setDescription('An embed has been made.'),
          ],
        });
        setTimeout(() => {
          message.delete();
        }, 5 * 1000);
      });
      // If time is up, ...
      descriptionCollector.on('end', () => {
        if (stage < 2) {
          // ...bully the user with a 'embed fail' meme
          send(message, {
            embeds: [
              new EmbedBuilder()
                .setTitle('Embed creation time ended')
                .setDescription('got tired of waiting lmao')
                .setImage(
                  'https://media.tenor.com/images/cc496f3f03100e13c831e2ff3a028a83/tenor.gif',
                ),
            ],
          });
        }
      });
    });
    // If time is up, ...
    titleCollector.on('end', () => {
      if (stage < 1) {
        // ...also bully the user
        send(message, {
          embeds: [
            new EmbedBuilder()
              .setTitle('Got tired of waiting lmao')
              .setDescription('Better luck next time')
              .setImage(
                'https://c.tenor.com/JKMrttHgJmAAAAAM/nikocado-avocado-epic-embed-fail.gif',
              ),
          ],
        });
      }
    });
  }
}
