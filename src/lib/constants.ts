import { EmbedBuilder } from 'discord.js';
import { join } from 'path';

export const rootDir = join(__dirname, '..', '..');
export const srcDir = join(rootDir, 'src');

export const RandomLoadingMessage = [
  'Computing...',
  'Thinking...',
  'Loading...',
  'Questioning life...',
  'Mining Bitcoin...',
];

export const formatSeconds = (duration: number) => {
  const seconds = Math.floor(duration % 60);
  const minutes = Math.floor((duration / 60) % 60);
  const hours = Math.floor(duration / (60 * 60));

  const displayHours = hours > 0 ? `${hours}h ` : '';
  const displayMinutes = minutes < 10 ? `${minutes}` : minutes;
  const displaySeconds = seconds < 10 ? `${seconds}` : seconds;

  return `\`${displayHours}${displayMinutes}m ${displaySeconds}s\``;
};

export const baseEmbed = new EmbedBuilder().setColor('#b441cc');

export const errorEmbed = new EmbedBuilder()
  .setColor('#ff0000')
  .setTitle('Error!')
  .setDescription(
    'An oopsie owie has happened! If possible, annoy the developer (@kortimu) about this.',
  );

export const loadingEmbed = new EmbedBuilder()
  .setColor('#ffff00')
  .setFooter({
    text: 'Please await a response. It might take a while for everything to be sent out.',
  });
