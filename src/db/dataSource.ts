import { DataSource } from "typeorm";

import { config } from "src/config";
import { Initial1692268197398 } from "src/db/migration/1692268197398-initial";

import { Drip } from "./entity/Drip";

export const AppDataSource = new DataSource({
  type: "postgres",
  host: config.Get("DB_HOST"),
  port: config.Get("DB_PORT"),
  username: config.Get("DB_USERNAME"),
  password: config.Get("DB_PASSWORD"),
  database: config.Get("DB_DATABASE_NAME"),
  synchronize: false,
  logging: ["error", "warn"],
  entities: [Drip],
  subscribers: [],
  migrations: [Initial1692268197398],
});
