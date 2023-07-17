import { ApplyOptions } from '@sapphire/decorators';
import type { CommandOptions } from '@sapphire/framework';
import BotCommand from '../../types/BotCommand';
import { Message } from 'discord.js';
import { pickRandom, sendLoadingMessage } from '../../lib/utils';
import { send } from '@sapphire/plugin-editable-commands';
import { baseEmbed, loadingEmbed } from '../../lib/constants';

@ApplyOptions<CommandOptions>({
  description: 'Flips a coin.',
  fullCategory: ['Fun'],
  aliases: ['flipcoin', 'coin'],
  detailedDescription: 'A command that flips a coin.',
  notes: ['The art is temporary. When I figure out how to do a crown, I will remake it.'],
})
export class UserCommand extends BotCommand {
  public async messageRun(message: Message) {
    // Sends loading message
    await sendLoadingMessage(message);
    flipCoin(message);
  }
}

function flipCoin(message: Message) {
  // Flipping animation (aesthetic only)
  send(message, {
    embeds: [
      loadingEmbed
        .setTitle('Flipping coin...')
        .setDescription('haha coin go brrr')
        .setImage('https://cdn.discordapp.com/emojis/916815063673896960.gif?size=64'),
    ],
  }).then((msg) => {
    setTimeout(() => {
      sendResult(msg);
      message.delete();
    }, 1 * 1000);
  });
}

// Send either of the results, based on pickRandom()
function sendResult(msg: Message) {
  const results = ['heads', 'tails'];
  const result = pickRandom(results);
  let url = '';
  if (result === results[0]) {
    url = 'https://cdn.discordapp.com/emojis/917122876170174504.png?size=64';
  } else {
    url = 'https://cdn.discordapp.com/emojis/917122876153409626.png?size=64';
  }
  msg.edit({
    embeds: [
      baseEmbed.setTitle('The coin landed on...').setDescription(`...${result}`).setImage(url),
    ],
  });
}
