import { createContainer } from "awilix";
import { describe, expect, it } from "vitest";

import { registerCore, systemClock, type CoreCradle } from "../src";

describe("systemClock", () => {
  it("returns the current time", () => {
    const before = Date.now();
    const now = systemClock.now().getTime();
    expect(now).toBeGreaterThanOrEqual(before);
    expect(now).toBeLessThanOrEqual(Date.now());
  });
});

describe("registerCore", () => {
  it("registers the clock", () => {
    const container = createContainer<CoreCradle>();
    registerCore(container);
    expect(container.resolve("clock")).toBe(systemClock);
  });
});
