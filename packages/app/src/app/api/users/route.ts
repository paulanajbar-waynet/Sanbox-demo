import { makeCrudRoute } from "@devmentor/core";

// TODO(auth PR): requireSession + admin check before this ships publicly. Read-only until then.
export const { GET } = makeCrudRoute({
  service: (scope) => scope.resolve("userService"),
  list: (service, query) => service.list(query),
});
