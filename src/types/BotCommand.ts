// Extend the default Command class to include:
// testOnly (only works in servers listed in the .env, otherwise sends an error saying that the feature is not yet finished)
// syntax '${prefix}${command} <mandatory> [optional]'
// examples [each. example]
// usage 'usage'
// additonalnotes [each, point]

import { Command, CommandOptions } from '@sapphire/framework';
import { client } from '../index';
import type { PieceContext } from '@sapphire/pieces';

export default abstract class BotCommand extends Command {
  public syntax: string;
  public examples: string[];
  public notes: string[];

  public constructor(context: PieceContext, { name, ...options }: CommandOptions) {
    super(context, { name, ...options });

    this.syntax = `${client.options.defaultPrefix}${name} ${options.syntax}`;
    if (!options.syntax) {
      this.syntax = `${client.options.defaultPrefix}${name}`;
    }
    this.examples = options.examples?.map(
      (example) => `${client.options.defaultPrefix}${example}\n`,
    ) ?? [`${client.options.defaultPrefix}${name}`];
    this.notes = options.notes?.map((note) => `${note}\n`) ?? [''];
  }
}
