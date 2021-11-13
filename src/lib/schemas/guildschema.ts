import { Schema, model } from 'mongoose';

const reqString = {
  type: String,
  require: true,
};

interface Setting {
  guildId: string;
  welcomeId: string;
  leaderboardId: string;
  levelRoles: Array<object>;
  muteRole: string;
}

const guildSchema = new Schema<Setting>({
  guildId: reqString,
  welcomeId: {
    type: String,
  },
  leaderboardId: {
    type: String,
  },
  levelRoles: {
    type: Array({
      id: String,
      level: Number,
    }),
  },
  muteRole: {
    type: String,
  },
});

export const GuildModel = model<Setting>('server-settings', guildSchema);
