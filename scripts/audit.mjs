// Fails on any high/critical npm advisory that is not in audit-allowlist.json.
// Allowlist entries expire at `reviewBy`, so an accepted risk is re-examined instead of forgotten.
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const BLOCKING = new Set(["high", "critical"]);
const today = new Date().toISOString().slice(0, 10);
const allowlist = JSON.parse(readFileSync(new URL("../audit-allowlist.json", import.meta.url), "utf8"));
const allowed = new Map(allowlist.filter((entry) => entry.reviewBy >= today).map((entry) => [entry.advisory, entry]));

let report;
try {
  report = execFileSync("npm", ["audit", "--json"], { encoding: "utf8", stdio: ["ignore", "pipe", "inherit"] });
} catch (error) {
  // npm audit exits non-zero when it finds anything; the JSON report is still on stdout.
  report = error.stdout;
}

const advisories = new Map();
for (const vulnerability of Object.values(JSON.parse(report).vulnerabilities ?? {})) {
  for (const via of vulnerability.via) {
    if (typeof via === "object" && BLOCKING.has(via.severity)) {
      advisories.set(via.url.split("/").pop(), { name: via.name, title: via.title, severity: via.severity });
    }
  }
}

const blocking = [...advisories].filter(([id]) => !allowed.has(id));
for (const [id, { name, title }] of advisories) {
  if (allowed.has(id)) console.log(`allowed until ${allowed.get(id).reviewBy}: ${id} (${name}) ${title}`);
}
for (const entry of allowlist.filter((e) => e.reviewBy < today)) {
  console.error(`expired allowlist entry (reviewBy ${entry.reviewBy}): ${entry.advisory}; re-evaluate it`);
}
for (const [id, { name, title, severity }] of blocking) {
  console.error(`BLOCKING ${severity}: ${id} (${name}) ${title}`);
}
process.exit(blocking.length ? 1 : 0);
