import { DataSource } from "typeorm";

import { Drip } from "./entity/Drip";
import { migrations } from "./migration/migrations";

export const AppDataSource = new DataSource({
  type: "sqlite",
  database: "sqlite.db",
  synchronize: false,
  logging: ["error", "warn"],
  entities: [Drip],
  subscribers: [],
  migrations,
});
