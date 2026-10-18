import { z } from "zod";

import { withScope, type AppContainer } from "../container/container";
import { apiHandler, type RouteHandler } from "./apiHandler";
import { MethodNotAllowedError } from "./errors";
import { pageQuerySchema, type Page, type PageQuery } from "./pagination";
import { parseJsonBody, parseQuery } from "./validation";

const HTTP_CREATED = 201;
const idQuerySchema = z.object({ id: z.uuid() });

interface WriteOperation<S, Schema extends z.ZodType, R> {
  schema: Schema;
  run: (service: NoInfer<S>, input: z.output<Schema>) => Promise<R>;
}

interface UpdateOperation<S, Schema extends z.ZodType, R> {
  schema: Schema;
  run: (service: NoInfer<S>, id: string, input: z.output<Schema>) => Promise<R>;
}

export interface CrudRouteConfig<S, TItem, CreateSchema extends z.ZodType, UpdateSchema extends z.ZodType> {
  /** Picks the service from the request scope. */
  service: (scope: AppContainer) => S;
  /** `GET ?page=&pageSize=` */
  list?: (service: NoInfer<S>, query: PageQuery) => Promise<Page<TItem>>;
  /** `POST` with a JSON body parsed by `schema` */
  create?: WriteOperation<S, CreateSchema, TItem>;
  /** `PUT ?id=` with a JSON body parsed by `schema` */
  update?: UpdateOperation<S, UpdateSchema, TItem>;
  /** `DELETE ?id=` */
  remove?: (service: NoInfer<S>, id: string) => Promise<void>;
}

export interface CrudHandlers {
  GET: RouteHandler<unknown>;
  POST: RouteHandler<unknown>;
  PUT: RouteHandler<unknown>;
  DELETE: RouteHandler<unknown>;
}

const methodNotAllowed: RouteHandler<unknown> = apiHandler(async () => {
  throw new MethodNotAllowedError();
});

/**
 * Builds route handlers for a plain CRUD resource; the route file becomes configuration:
 * `export const { GET } = makeCrudRoute({ service: (s) => s.resolve("userService"), list: (svc, q) => svc.list(q) })`.
 * Re-export only the methods you configured; the others answer 405.
 * Workflow endpoints that are not plain CRUD use `apiHandler` directly.
 */
export function makeCrudRoute<
  S,
  TItem,
  CreateSchema extends z.ZodType = z.ZodNever,
  UpdateSchema extends z.ZodType = z.ZodNever,
>(config: CrudRouteConfig<S, TItem, CreateSchema, UpdateSchema>): CrudHandlers {
  const { list, create, update, remove } = config;
  const inScope = <R>(fn: (service: S) => Promise<R>) => withScope((scope) => fn(config.service(scope)));
  const handlers: CrudHandlers = {
    GET: methodNotAllowed,
    POST: methodNotAllowed,
    PUT: methodNotAllowed,
    DELETE: methodNotAllowed,
  };

  if (list) {
    handlers.GET = apiHandler(async (request) => {
      const query = parseQuery(request, pageQuerySchema);
      return inScope((service) => list(service, query));
    });
  }
  if (create) {
    handlers.POST = apiHandler(
      async (request) => {
        const input = await parseJsonBody(request, create.schema);
        return inScope((service) => create.run(service, input));
      },
      { successStatus: HTTP_CREATED },
    );
  }
  if (update) {
    handlers.PUT = apiHandler(async (request) => {
      const { id } = parseQuery(request, idQuerySchema);
      const input = await parseJsonBody(request, update.schema);
      return inScope((service) => update.run(service, id, input));
    });
  }
  if (remove) {
    handlers.DELETE = apiHandler(async (request) => {
      const { id } = parseQuery(request, idQuerySchema);
      await inScope((service) => remove(service, id));
      return null;
    });
  }
  return handlers;
}
