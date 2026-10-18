import { getOrm, type MikroORM } from "@devmentor/db";
import { asClass, asFunction, asValue, createContainer, InjectionMode, type AwilixContainer } from "awilix";

import { systemClock } from "../clock";
import { logger } from "../logger";
import { UserService } from "../services/auth/user.service";
import type { Cradle } from "./cradle";

export type AppContainer = AwilixContainer<Cradle>;

/** Explicit registration only (no loadModules), so every binding is greppable. */
export function createAppContainer(orm: MikroORM): AppContainer {
  const container = createContainer<Cradle>({ injectionMode: InjectionMode.PROXY, strict: true });
  container.register({
    logger: asValue(logger),
    clock: asValue(systemClock),
    orm: asValue(orm),
    em: asFunction(({ orm }: Pick<Cradle, "orm">) => orm.em.fork()).scoped(),
    userService: asClass(UserService).scoped(),
  });
  return container;
}

// One root container per process; cached on globalThis so dev-mode hot reloads reuse it.
const globalForContainer = globalThis as typeof globalThis & {
  __devmentorContainer?: Promise<AppContainer>;
};

export function getContainer(): Promise<AppContainer> {
  globalForContainer.__devmentorContainer ??= getOrm().then(createAppContainer);
  return globalForContainer.__devmentorContainer;
}

/** Runs `fn` in a fresh request scope (own forked EntityManager) and disposes it afterwards. */
export async function withScope<T>(fn: (scope: AppContainer) => Promise<T>): Promise<T> {
  const scope = (await getContainer()).createScope<Cradle>();
  try {
    return await fn(scope);
  } finally {
    await scope.dispose();
  }
}
