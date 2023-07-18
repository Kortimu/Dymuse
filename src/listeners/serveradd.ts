import { Events, Listener, type PieceContext } from '@sapphire/framework';
import { Guild } from 'discord.js';
import { GuildModel } from '../lib/schemas/guildschema';
import { baseEmbedFormat } from '../lib/constants';

export class UserEvent extends Listener<typeof Events.GuildCreate> {
  public constructor(context: PieceContext) {
    super(context, {
      event: Events.GuildCreate,
    });
  }

  public async run(guild: Guild) {
    await setupSettings(guild);
    helloMessage(guild);
  }
}

const helloMessage = async (guild: Guild) => {
  (await guild.fetchOwner()).send({
    embeds: [
      baseEmbedFormat()
        .setTitle(`Dymuse has been invited to "${guild.name}"!`)
        .setDescription(
          'The fun making machine is added to your server!\n\nMake sure to check out the settings with `?settings`, to tweak the bot to your needs.',
        ),
    ],
  });
  guild.systemChannel?.send({
    embeds: [
      baseEmbedFormat()
        .setTitle('Knock knock, Dymuse is here!')
        .setDescription('hello hi use ?help to see cool commands ok bye'),
    ],
  });
};

const setupSettings = async (guild: Guild) => {
  await GuildModel.findOneAndUpdate(
    {
      guildId: guild.id,
    },
    {},
    {
      upsert: true,
      new: true,
    },
  );
};
