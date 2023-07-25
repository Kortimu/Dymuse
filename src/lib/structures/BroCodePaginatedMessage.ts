import {
  PaginatedMessage,
  type PaginatedMessageOptions,
  type PaginatedMessagePage,
} from '@sapphire/discord.js-utilities';
import { ButtonStyle, ComponentType } from 'discord.js';

export class BroCodePaginatedMessage extends PaginatedMessage {
  public constructor(options: PaginatedMessageOptions = {}) {
    super(options);
    this.setActions([
      {
        customId: '@sapphire/paginated-messages.firstPage',
        style: ButtonStyle.Primary,
        emoji: '⏪',
        type: ComponentType.Button,
        run: ({ handler }) => (handler.index = 0),
      },
      {
        customId: '@sapphire/paginated-messages.previousPage',
        style: ButtonStyle.Primary,
        emoji: '◀️',
        type: ComponentType.Button,
        run: ({ handler }) => {
          if (handler.index === 0) {
            handler.index = handler.pages.length - 1;
          } else {
            --handler.index;
          }
        },
      },
      {
        customId: '@sapphire/paginated-messages.nextPage',
        style: ButtonStyle.Primary,
        emoji: '▶️',
        type: ComponentType.Button,
        run: ({ handler }) => {
          if (handler.index === handler.pages.length - 1) {
            handler.index = 0;
          } else {
            ++handler.index;
          }
        },
      },
      {
        customId: '@sapphire/paginated-messages.goToLastPage',
        style: ButtonStyle.Primary,
        emoji: '⏩',
        type: ComponentType.Button,
        run: ({ handler }) => (handler.index = handler.pages.length - 1),
      },
      {
        customId: '@sapphire/paginated-messages.randomPage',
        style: ButtonStyle.Secondary,
        emoji: '🎲',
        type: ComponentType.Button,
        run: ({ handler }) => (handler.index = Math.floor(Math.random() * handler.pages.length)),
      },
      {
        customId: '@sapphire/paginated-messages.stop',
        style: ButtonStyle.Danger,
        emoji: '⏹️',
        type: ComponentType.Button,
        run: ({ collector }) => {
          collector.stop();
        },
      },
    ]);
  }

  public override addPage(page: PaginatedMessagePage): this {
    this.pages.push(page);

    return this;
  }
}
