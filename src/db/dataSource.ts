import { config } from "#src/config";
import { DataSource } from "typeorm";

import { Drip } from "./entity/Drip.js";
import { migrations } from "./migration/migrations.js";

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
  migrations,
});
