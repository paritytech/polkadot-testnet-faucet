const Datastore = require('nedb');
const crypto = require('crypto');

const SECOND  = 1000;
const MINUTE  = 60 * SECOND; 
const HOUR    = 60 * MINUTE;
const DAY     = 20 * HOUR; // almost 1 day, give some room for people missing their normal daily slots

const CompactionTimeout = 10 * SECOND;

const sha256 = x =>
  crypto
    .createHash('sha256')
    .update(x, 'utf8')
    .digest('hex');

const now = () => new Date().getTime();

class Storage {
  constructor(filename = './storage.db', autoload = true) {
    this._db = new Datastore({ filename, autoload });
  }

  async close() {
    this._db.persistence.compactDatafile();

    return new Promise((resolve, reject) => {
      this._db.on('compaction.done', () => {
        this._db.removeAllListeners('compaction.done');
        resolve();
      });

      setTimeout(() => {
        resolve();
      }, CompactionTimeout);
    });
  }

  async isValid(username, addr, limit = 2, span = DAY) {
    username = sha256(username);
    addr = sha256(addr);

    const totalUsername = await this._query(username, span);
    const totalAddr = await this._query(addr, span);

    if (totalUsername < limit && totalAddr < limit) {
      return true;
    }

    return false;
  }

  async saveData(username, addr) {
    username = sha256(username);
    addr = sha256(addr);

    await this._insert(username);
    await this._insert(addr);
    return true;
  }

  async _insert(item) {
    const timestamp = now();

    return new Promise((resolve, reject) => {
      this._db.insert({ item, timestamp }, (err) => {
        if (err) reject(err);
        resolve();
      });
    });
  }

  async _query(item, span) {
    const timestamp = now();

    const query = {
      $and: [
        {item},
        {timestamp: { $gt: timestamp - span }},
      ],
    };

    return new Promise((resolve, reject) => {
      this._db.find(query, (err, docs) => {
        if (err) reject();
        resolve(docs.length);
      });
    });
  }
}

module.exports = Storage;
