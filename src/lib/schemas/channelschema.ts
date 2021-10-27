import { Schema, model } from 'mongoose'

const reqString = {
    type: String,
    require: true
}

interface Channel {
    _id: string,
    welcomeId: string,
    leaderboardId: string
}

const channelSchema = new Schema<Channel>({
    _id: reqString,
    welcomeId: {
        type: String
    },
    leaderboardId: {
        type: String
    }
})

export const ChannelModel = model<Channel>('channel-ids', channelSchema)