import { Schema, model } from 'mongoose';

const reqString = {
  type: String,
  require: true,
};

interface Setting {
  guildId: string;
  botPrefix: string;
  // language: Array<string>;
  kindness: boolean;
  ignoredPrefixes: Array<string>;
  welcomeId: string;
  leaderboardId: string;
  levelRoles: Array<object>;
  xpMultiplier: number;
}

export const guildSchema = new Schema<Setting>({
  guildId: reqString,
  botPrefix: {
    type: String,
    default: '?',
  },
  // language: {
  //   type: Array({})
  // },
  kindness: {
    type: Boolean,
  },
  welcomeId: {
    type: String,
  },
  leaderboardId: {
    type: String,
  },
  ignoredPrefixes: {
    type: Array({
      type: String,
    }),
  },
  levelRoles: {
    type: Array({
      id: String,
      level: Number,
    }),
  },
  xpMultiplier: {
    type: Number,
    default: 1,
  },
});

export const GuildModel = model<Setting>('server-settings', guildSchema);
