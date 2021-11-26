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
  const hours = Math.floor((duration / (60 * 60)) % 60);

  const displayHours = hours > 0 ? `${hours}:` : '';
  const displayMinutes = minutes < 10 ? `0${minutes}` : minutes;
  const displaySeconds = seconds < 10 ? `0${seconds}` : seconds;

  return `\`${displayHours}${displayMinutes}:${displaySeconds}\``;
};
