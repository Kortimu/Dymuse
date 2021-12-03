import type { Command, CommandOptions } from '@sapphire/framework';

declare module '@sapphire/framework' {
  // eslint-disable-next-line no-shadow
  interface Command {
    syntax: string;
    examples: string[];
    notes: string[];
  }
  // eslint-disable-next-line no-shadow
  interface CommandOptions {
    syntax?: string;
    examples?: string[];
    notes?: string[];
  }
}
