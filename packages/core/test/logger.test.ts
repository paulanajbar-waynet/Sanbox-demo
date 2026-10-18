import { Writable } from "node:stream";

import { describe, expect, it } from "vitest";

import { createLogger } from "../src";

function captureLog(entry: object): Record<string, unknown> {
  const lines: string[] = [];
  const sink = new Writable({
    write(chunk, _encoding, done) {
      lines.push(chunk.toString());
      done();
    },
  });
  createLogger({ level: "info" }, sink).info(entry, "test");
  return JSON.parse(lines[0]);
}

describe("logger redaction", () => {
  it("never writes passwords, tokens or auth headers", () => {
    const line = captureLog({
      password: "hunter2",
      user: { email: "a@example.test", passwordHash: "hash", token: "jwt.value.here" },
      req: { headers: { authorization: "Bearer abc", cookie: "session=abc" } },
    });
    const text = JSON.stringify(line);

    for (const secret of ["hunter2", "hash", "jwt.value.here", "Bearer abc", "session=abc"]) {
      expect(text).not.toContain(secret);
    }
    expect(text).toContain("a@example.test");
  });
});
