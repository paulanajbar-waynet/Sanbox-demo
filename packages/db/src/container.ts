import type { EntityManager, MikroORM } from "@mikro-orm/postgresql";
import { asClass, asFunction, asValue, type AwilixContainer } from "awilix";

import { UserRepository } from "./repositories/UserRepository";

export interface DbCradle {
  orm: MikroORM;
  em: EntityManager;
  userRepository: UserRepository;
}

/**
 * Registers the data layer. `orm` is a process-wide singleton; `em` and
 * repositories are scoped, so each request scope gets its own forked EntityManager.
 */
export function registerDb(container: AwilixContainer, orm: MikroORM): void {
  container.register({
    orm: asValue(orm),
    em: asFunction(({ orm }: { orm: MikroORM }) => orm.em.fork()).scoped(),
    userRepository: asClass(UserRepository).scoped(),
  });
}
