import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

// Package boundaries (see AGENTS.md and .ai/docs/engineering-standards.md):
// app → core → db; ui is standalone and importable by app only; only db imports @mikro-orm/*.
const internal = (...names) => names.map((name) => `@devmentor/${name}`);
const restrict = (packages, patterns, message) => ({
  paths: packages.map((name) => ({ name, message })),
  patterns: [{ group: [...packages.map((name) => `${name}/*`), ...patterns], message }],
});
const merge = (...rules) => ({
  paths: rules.flatMap((rule) => rule.paths),
  patterns: rules.flatMap((rule) => rule.patterns),
});

const noOrm = restrict(["@mikro-orm/core"], ["@mikro-orm/*"], "Only packages/db may import MikroORM; use @devmentor/db re-exports.");
const noReact = restrict(["next", "react", "react-dom"], [], "This package must not depend on Next.js or React.");

const boundaries = {
  "packages/db/**": merge(
    restrict(internal("core", "app", "ui"), [], "db is the bottom layer and must not import other @devmentor packages."),
    noReact,
  ),
  "packages/core/**": merge(
    restrict(internal("app", "ui"), [], "core may depend only on @devmentor/db."),
    noOrm,
    noReact,
  ),
  "packages/ui/**": merge(
    restrict(internal("core", "db", "app"), [], "ui is standalone; it must not import other @devmentor packages."),
    noOrm,
  ),
  "packages/app/**": merge(
    restrict(internal("db"), [], "app talks to the database through @devmentor/core services, not @devmentor/db."),
    noOrm,
  ),
};

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    settings: { next: { rootDir: "packages/app/" } },
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
      "no-console": "error",
    },
  },
  ...Object.entries(boundaries).map(([glob, options]) => ({
    files: [glob],
    rules: { "@typescript-eslint/no-restricted-imports": ["error", options] },
  })),
  {
    // Raw fetch to the API is allowed only in apiCall; everything else goes through it.
    files: ["packages/app/src/**", "packages/ui/src/**"],
    ignores: ["packages/ui/src/backend/api/apiCall.ts"],
    rules: {
      "no-restricted-globals": ["error", { name: "fetch", message: "Use apiCall/apiCallOrThrow from @devmentor/ui." }],
    },
  },
  {
    // CLI scripts report to the terminal.
    files: ["scripts/**"],
    rules: { "no-console": "off" },
  },
  {
    // Tests create fixtures directly through the data layer.
    files: ["packages/*/test/**"],
    rules: { "@typescript-eslint/no-restricted-imports": "off" },
  },
  globalIgnores(["**/.next/**", "**/out/**", "**/build/**", "**/next-env.d.ts", "**/node_modules/**"]),
]);

export default eslintConfig;
