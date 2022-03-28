import { Schema, model } from 'mongoose';

const reqString = {
  type: String,
  require: true,
};

interface Setting {
  guildId: string;
  botPrefix: string;
  // friendlyMode: boolean;
  // ignoredPrefixes: Array<string>;
  welcomeId: string;
  leaderboardId: string;
  levelRoles: Array<object>;
  xpMultiplier: number;
  muteRole: string;
}

export const guildSchema = new Schema<Setting>({
  guildId: reqString,
  botPrefix: {
    type: String,
    default: '?',
  },
  welcomeId: {
    type: String,
  },
  leaderboardId: {
    type: String,
  },
  // TODO: make this into a key-value pair (type: number)
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
  muteRole: {
    type: String,
  },
});

export const GuildModel = model<Setting>('server-settings', guildSchema);
