import crypto from 'crypto';
import Datastore from 'nedb';

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 20 * HOUR; // almost 1 day, give some room for people missing their normal daily slots

const CompactionTimeout = 10 * SECOND;

const sha256 = (x: string) =>
  crypto.createHash('sha256').update(x, 'utf8').digest('hex');

const now = () => new Date().getTime();

export default class ActionStorage {
  _db: Datastore;

  constructor(filename = './storage.db', autoload = true) {
    this._db = new Datastore({ autoload, filename });
  }

  async close(): Promise<void> {
    this._db.persistence.compactDatafile();

    return new Promise((resolve) => {
      this._db.on('compaction.done', () => {
        this._db.removeAllListeners('compaction.done');
        resolve();
      });

      setTimeout(() => {
        resolve();
      }, CompactionTimeout);
    });
  }

  async isValid(
    username: string,
    addr: string,
    limit = 1,
    span = DAY
  ): Promise<boolean> {
    username = sha256(username);
    addr = sha256(addr);

    const totalUsername = await this._query(username, span);
    const totalAddr = await this._query(addr, span);

    return Number(totalUsername) < limit && Number(totalAddr) < limit;
  }

  async saveData(username: string, addr: string): Promise<boolean> {
    username = sha256(username);
    addr = sha256(addr);

    await this._insert(username);
    await this._insert(addr);
    return true;
  }

  async _insert(item: string): Promise<void> {
    const timestamp = now();

    return new Promise((resolve, reject) => {
      this._db.insert({ item, timestamp }, (err) => {
        if (err) reject(err);
        resolve();
      });
    });
  }

  async _query(item: string, span: number): Promise<number> {
    const timestamp = now();

    const query = {
      $and: [{ item }, { timestamp: { $gt: timestamp - span } }],
    };

    return new Promise((resolve, reject) => {
      this._db.find(query, (err: Error, docs: Record<string, string>[]) => {
        if (err) reject(err);
        resolve(docs.length);
      });
    });
  }
}
