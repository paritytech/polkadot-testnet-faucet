import crypto from "crypto";
import { Database, RunResult } from "sqlite3";

const LIMIT_USERS = 1;
const LIMIT_ADDRESSES = 1;
const LIMIT_IPS = 3;
const HOURS_SPAN = 20;
const TABLE_NAME = "records";
const ENTRY_COLUMN_NAME = "entry";
const TS_COLUMN_NAME = "ts";

const sha256 = (x: string) => crypto.createHash("sha256").update(x, "utf8").digest("hex");

export default class ActionStorage {
  private db: Database;

  constructor(filename = "./sqlite.db") {
    this.db = new Database(filename, (err) => {
      if (err) {
        return console.error(err.message);
      }
      console.log("Connected to the in-memory SQlite database.");
    });

    this.db.serialize(() => {
      this.db.run(
        `CREATE TABLE IF NOT EXISTS ${TABLE_NAME} (
              id INTEGER PRIMARY KEY,
              ${ENTRY_COLUMN_NAME} TEXT,
              ${TS_COLUMN_NAME} TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
        )`,
      );
    });
  }

  async isValid(opts: { username?: string; addr?: string; ip?: string }): Promise<boolean> {
    const { username, addr, ip } = opts;
    if (username !== undefined) {
      const total = await this.query(sha256(username));
      if (Number(total) >= LIMIT_USERS) return false;
    }
    if (addr !== undefined) {
      const total = await this.query(sha256(addr));
      if (Number(total) >= LIMIT_ADDRESSES) return false;
    }
    if (ip !== undefined) {
      const total = await this.query(sha256(ip));
      if (Number(total) >= LIMIT_IPS) return false;
    }
    return true;
  }

  async saveData(opts: { username?: string; addr?: string; ip?: string }): Promise<void> {
    const { username, addr, ip } = opts;
    if (username !== undefined) {
      await this.insert(sha256(username));
    }
    if (addr !== undefined) {
      await this.insert(sha256(addr));
    }
    if (ip !== undefined) {
      await this.insert(sha256(ip));
    }
  }

  private async insert(item: string): Promise<unknown> {
    return await new Promise((resolve, reject) => {
      const now = new Date().toISOString();
      this.db.run(
        `INSERT INTO ${TABLE_NAME}(${ENTRY_COLUMN_NAME}, ${TS_COLUMN_NAME}) VALUES ($entry, $ts)`,
        { $entry: item, $ts: now },
        (res: RunResult, err: Error | null) => {
          if (err) reject(err);
          resolve(res);
        },
      );
    });
  }

  private async query(item: string): Promise<number> {
    return await new Promise((resolve, reject) => {
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
        },
      );
    });
  }
}
