import { DataSource } from "typeorm";
import { config } from "dotenv";
import { join } from "path";

config({ path: ".env", override: true });

/**
 * Dedicated DataSource for files under `database/seed/*`.
 *
 * Shares the `migrations` tracking table with the main DataSource, so seeds
 * run via `seed:run` are also recognised by `migration:show` / `migration:run`
 * — and vice versa. The two DataSources differ only in which files they load,
 * so each command only operates on the matching subset.
 */
export default new DataSource({
  type: "postgres",
  url: process.env.DATABASE_URL,
  entities: [join(__dirname, "..", "src", "models", "**", "*.entity.{ts,js}")],
  migrations: [join(__dirname, "seed", "*.{ts,js}")],
  migrationsTableName: "migrations",
  synchronize: false,
});
