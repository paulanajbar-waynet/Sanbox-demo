import { asValue, type AwilixContainer } from "awilix";

import { systemClock, type Clock } from "./clock";

export interface CoreCradle {
  clock: Clock;
}

export function registerCore(container: AwilixContainer): void {
  container.register({
    clock: asValue(systemClock),
  });
}
