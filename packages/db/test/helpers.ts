import { MikroORM } from "@mikro-orm/postgresql";

import cliConfig from "../src/mikro-orm.config";

/** ORM with the Migrator, pointed at TEST_DATABASE_URL (falls back to DATABASE_URL). */
export async function initTestOrm(): Promise<MikroORM> {
  const clientUrl = process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL;
  const orm = await MikroORM.init({ ...cliConfig, clientUrl, pool: { min: 0, max: 2 } });
  await orm.migrator.up();
  return orm;
}

export const uniqueEmail = (label: string) => `test-${label}-${crypto.randomUUID()}@example.test`;
