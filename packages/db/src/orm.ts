import { MikroORM } from "@mikro-orm/postgresql";

import { createOrmConfig } from "./config";

// One ORM (and connection pool) per process; cached on globalThis so dev-mode
// hot reloads don't open a new pool on every change.
const globalForOrm = globalThis as typeof globalThis & {
  __devmentorOrm?: Promise<MikroORM>;
};

export function getOrm(): Promise<MikroORM> {
  globalForOrm.__devmentorOrm ??= MikroORM.init(createOrmConfig());
  return globalForOrm.__devmentorOrm;
}
