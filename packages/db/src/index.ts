// `db` is the only package that imports @mikro-orm/*; other packages use these re-exports.
export type { EntityManager, MikroORM } from "@mikro-orm/postgresql";

export * from "./entities";
export { getOrm } from "./orm";
