import { defineConfig, type Options } from "@mikro-orm/postgresql";

import { entities } from "./entities";

/** Runtime ORM options shared by the app and the CLI. */
export function createOrmConfig(overrides: Options = {}): Options {
  const clientUrl = process.env.DATABASE_URL;
  if (!clientUrl) {
    throw new Error("DATABASE_URL is not set");
  }

  return defineConfig({
    clientUrl,
    entities,
    pool: { min: 0, max: Number(process.env.DATABASE_POOL_MAX ?? 10) },
    debug: process.env.MIKRO_ORM_DEBUG === "true",
    ...overrides,
  });
}
