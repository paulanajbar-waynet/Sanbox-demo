import { describe, expect, it } from "vitest";

import { loadEnv, systemClock } from "../src";

describe("systemClock", () => {
  it("returns the current time", () => {
    const before = Date.now();
    const now = systemClock.now().getTime();
    expect(now).toBeGreaterThanOrEqual(before);
    expect(now).toBeLessThanOrEqual(Date.now());
  });
});

describe("loadEnv", () => {
  it("applies defaults", () => {
    expect(loadEnv({})).toEqual({ NODE_ENV: "development", LOG_LEVEL: "info" });
  });

  it("names the invalid variable without echoing its value", () => {
    expect(() => loadEnv({ LOG_LEVEL: "s3cr3t-value" })).toThrow(/LOG_LEVEL/);
    expect(() => loadEnv({ LOG_LEVEL: "s3cr3t-value" })).not.toThrow(/s3cr3t-value/);
  });
});
