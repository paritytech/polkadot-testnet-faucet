import { DataSource } from "typeorm";

import { config } from "src/config";

import { Drip } from "./entity/Drip";
import { Initial1692350473907 } from "./migration/1692350473907-initial";

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
  migrations: [Initial1692350473907],
});
