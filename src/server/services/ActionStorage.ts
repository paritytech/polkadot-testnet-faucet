import crypto from 'crypto';
import Datastore from 'nedb';

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 20 * HOUR; // almost 1 day, give some room for people missing their normal daily slots

const CompactionTimeout = 10 * SECOND;

const LIMIT_USERS = 1;
const LIMIT_ADDRESSES = 1;

const sha256 = (x: string) =>
  crypto.createHash('sha256').update(x, 'utf8').digest('hex');

const now = () => new Date().getTime();

export default class ActionStorage {
  private db: Datastore;

  constructor(filename = './storage.db', autoload = true) {
    this.db = new Datastore({ autoload, filename });
  }

  async close(): Promise<void> {
    this.db.persistence.compactDatafile();

    return new Promise((resolve) => {
      this.db.on('compaction.done', () => {
        this.db.removeAllListeners('compaction.done');
        resolve();
      });

      setTimeout(() => {
        resolve();
      }, CompactionTimeout);
    });
  }

  async isValid(username: string, addr: string): Promise<boolean> {
    username = sha256(username);
    addr = sha256(addr);

    const totalUsername = await this.query(username);
    const totalAddr = await this.query(addr);

    console.log(totalAddr, totalUsername);

    return (
      Number(totalUsername) < LIMIT_USERS && Number(totalAddr) < LIMIT_ADDRESSES
    );
  }

  async saveData(username: string, addr: string): Promise<boolean> {
    username = sha256(username);
    addr = sha256(addr);

    await this.insert(username);
    await this.insert(addr);
    return true;
  }

  private async insert(item: string): Promise<void> {
    const timestamp = now();

    return new Promise((resolve, reject) => {
      this.db.insert({ item, timestamp }, (err) => {
        if (err) reject(err);
        resolve();
      });
    });
  }

  private async query(item: string): Promise<number> {
    const timestamp = now();

    const query = {
      $and: [{ item }, { timestamp: { $gt: timestamp - DAY } }],
    };

    return new Promise((resolve, reject) => {
      this.db.find(query, (err: Error, docs: Record<string, string>[]) => {
        if (err) reject(err);
        resolve(docs.length);
      });
    });
  }
}
