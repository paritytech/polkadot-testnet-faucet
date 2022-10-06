import crypto from 'crypto';
import { Database, RunResult } from 'sqlite3';

const LIMIT_USERS = 1;
const LIMIT_ADDRESSES = 1;
const HOURS_SPAN = 20;
const TABLE_NAME = 'records';
const ENTRY_COLUMN_NAME = 'entry';
const TS_COLUMN_NAME = 'ts';

const sha256 = (x: string) =>
  crypto.createHash('sha256').update(x, 'utf8').digest('hex');

export default class ActionStorage {
  private db: Database;

  constructor(filename = './sqlite.db') {
    this.db = new Database(filename, (err) => {
      if (err) {
        return console.error(err.message);
      }
      console.log('Connected to the in-memory SQlite database.');
    });

    this.db.serialize(() => {
      this.db.run(
        `CREATE TABLE IF NOT EXISTS ${TABLE_NAME} (
              id INTEGER PRIMARY KEY,
              ${ENTRY_COLUMN_NAME} TEXT,
              ${TS_COLUMN_NAME} TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
        )`
      );
    });
  }

  async isValid(username: string, addr: string): Promise<boolean> {
    username = sha256(username);
    addr = sha256(addr);

    const totalUsername = await this.query(username);
    const totalAddr = await this.query(addr);

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

  private async insert(item: string): Promise<unknown> {
    return new Promise((resolve, reject) => {
      const now = new Date().toISOString();
      this.db.run(
        `INSERT INTO ${TABLE_NAME}(${ENTRY_COLUMN_NAME}, ${TS_COLUMN_NAME}) VALUES ($entry, $ts)`,
        { $entry: item, $ts: now },
        (res: RunResult, err: Error | null) => {
          if (err) reject(err);
          resolve(res);
        }
      );
    });
  }

  private async query(item: string): Promise<number> {
    return new Promise((resolve, reject) => {
      this.db.all(
        `
            SELECT ${ENTRY_COLUMN_NAME}
            FROM ${TABLE_NAME}
            WHERE
                ${ENTRY_COLUMN_NAME} = $entry
                AND
                datetime(${TS_COLUMN_NAME}) > datetime('now', '-${HOURS_SPAN} hour')
        `,
        { $entry: item },
        (err: Error | null, rows) => {
          if (err) reject(err);
          resolve(rows.length);
        }
      );
    });
  }
}
