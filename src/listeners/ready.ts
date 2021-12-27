import { ListenerOptions, PieceContext, Listener, Store } from '@sapphire/framework';
import { blue, gray, green, magenta, magentaBright, white, yellow } from 'colorette';
import mongoose from 'mongoose';
import 'dotenv/config';

const dev = process.env.NODE_ENV !== 'production';

export class UserEvent extends Listener {
  private readonly style = dev ? yellow : blue;

  public constructor(context: PieceContext, options?: ListenerOptions) {
    super(context, {
      ...options,
      once: true,
    });
  }

  public run() {
    this.printBanner();
    this.printStoreDebugInformation();
    this.mongoConnect();
  }

  private printBanner() {
    const success = green('+');

    const llc = dev ? magentaBright : white;
    const blc = dev ? magenta : blue;

    const line01 = llc('');
    const line02 = llc('');
    const line03 = llc('');

    // Offset Pad
    const pad = ' '.repeat(7);

    console.log(
      String.raw`
${line01} ${pad}${blc('v2.1.0')}
${line02} ${pad}[${success}] Gateway
${line03}${dev ? ` ${pad}${blc('<')}${llc('/')}${blc('>')} ${llc('DEVELOPMENT MODE')}` : ''}
		`.trim(),
    );
  }

  private printStoreDebugInformation() {
    const { client, logger } = this.container;
    const stores = [...client.stores.values()];
    const last = stores.pop()!;

    for (const store of stores) logger.info(this.styleStore(store));
    logger.info(this.styleStore(last));
  }

  private styleStore(store: Store<any>) {
    return gray(`├─ Loaded ${this.style(store.size.toString().padEnd(3, ' '))} ${store.name}.`);
  }

  private async mongoConnect() {
    const { logger } = this.container;
    logger.info(gray(`├─ ${yellow('Connecting')} to Mongo...`));
    await mongoose
      .connect(process.env.MONGO_URI || '', {
        keepAlive: true,
      })
      .then(() => {
        logger.info(gray(`└─ ${yellow('Connected')} to Mongo!`));
      })
      .catch((err) => {
        logger.error(err);
      });
  }
}
