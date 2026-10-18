import "server-only";

import { registerCore, type CoreCradle } from "@devmentor/core";
import { getOrm, registerDb, type DbCradle } from "@devmentor/db";
import { createContainer, InjectionMode, type AwilixContainer } from "awilix";

export type Cradle = CoreCradle & DbCradle;
export type AppContainer = AwilixContainer<Cradle>;

const globalForContainer = globalThis as typeof globalThis & {
  __devmentorContainer?: Promise<AppContainer>;
};

async function buildContainer(): Promise<AppContainer> {
  const container = createContainer<Cradle>({ injectionMode: InjectionMode.PROXY, strict: true });
  registerCore(container);
  registerDb(container, await getOrm());
  return container;
}

/** Process-wide root container (singletons only). */
export function getContainer(): Promise<AppContainer> {
  globalForContainer.__devmentorContainer ??= buildContainer();
  return globalForContainer.__devmentorContainer;
}

/** Runs `fn` in a fresh request scope (own forked EntityManager) and disposes it afterwards. */
export async function withRequestScope<T>(fn: (scope: AppContainer) => Promise<T>): Promise<T> {
  const scope = (await getContainer()).createScope<Cradle>();
  try {
    return await fn(scope);
  } finally {
    await scope.dispose();
  }
}
