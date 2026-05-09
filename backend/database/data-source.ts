import { DataSource } from "typeorm";
import { config } from "dotenv";
import { join } from "path";

config({ path: ".env", override: true });

export default new DataSource({
  type: "postgres",
  url: process.env.DATABASE_URL,
  entities: [join(__dirname, "..", "src", "models", "**", "*.entity.{ts,js}")],
  migrations: [join(__dirname, "migrations", "*.{ts,js}")],
  migrationsTableName: "migrations",
  synchronize: false,
});
