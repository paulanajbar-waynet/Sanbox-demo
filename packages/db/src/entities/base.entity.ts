import { p } from "@mikro-orm/postgresql";

/** Properties shared by every entity: UUID primary key (no sequential-ID enumeration) and creation time. */
export const baseProperties = {
  id: p.uuid().primary().onCreate(() => crypto.randomUUID()),
  createdAt: p.datetime().onCreate(() => new Date()),
};
