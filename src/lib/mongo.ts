import mongoose from 'mongoose';
import 'dotenv/config'
import { Listener, ListenerOptions, PieceContext } from '@sapphire/framework';

export class UserEvent extends Listener {
    public constructor(context: PieceContext, options?: ListenerOptions) {
		super(context, {
			...options,
			once: true
		});
	}
    
    public async run() {
        await mongoose.connect(process.env.MONGO_URI || '', {
            keepAlive: true,
        }).then(() =>{
            console.log('Connected to the database!');
        }).catch((err) => {
            console.log(err);
        });
    }
}