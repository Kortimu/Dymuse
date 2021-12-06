import { Precondition } from '@sapphire/framework';
import type { Message } from 'discord.js';
import { envParseArray } from '../lib/env-parser';

const TEST_GUILDS = envParseArray('TEST_GUILDS');

export class UserPrecondition extends Precondition {
  public async run(message: Message) {
    if (!message.guildId) return this.error({ message: 'A test command cannot be run in PMs.' });
    return TEST_GUILDS.includes(message.guildId)
      ? this.ok()
      : this.error({ message: 'This command can only be used in test servers.' });
  }
}

declare module '@sapphire/framework' {
  interface Preconditions {
    TestOnly: never;
  }
}
