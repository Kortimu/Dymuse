import { Schema, model } from 'mongoose'

const reqString = {
    type: String,
    require: true
}

interface Setting {
    guildId: string,
    welcomeId: string,
    leaderboardId: string,
    levelRoles: Array<object>
}

const guildSchema = new Schema<Setting>({
    guildId: reqString,
    welcomeId: {
        type: String
    },
    leaderboardId: {
        type: String
    },
    levelRoles: {
        type: Array<Object>({
            id: String,
            level: Number
        })
    }
})

export const GuildModel = model<Setting>('server-settings', guildSchema)