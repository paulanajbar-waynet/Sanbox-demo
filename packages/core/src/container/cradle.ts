import type { EntityManager, MikroORM } from "@devmentor/db";

import type { Clock } from "../clock";
import type { Logger } from "../logger";
import type { UserService } from "../services/auth/user.service";

/** Every DI binding, by key. A new service is one new line here and one in container.ts. */
export interface Cradle {
  // Singletons
  logger: Logger;
  clock: Clock;
  orm: MikroORM;
  // Request-scoped
  em: EntityManager;
  userService: UserService;
}
