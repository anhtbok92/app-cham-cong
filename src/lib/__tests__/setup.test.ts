import { describe, it, expect } from "vitest";
import fc from "fast-check";

describe("Project setup", () => {
  it("vitest is configured correctly", () => {
    expect(1 + 1).toBe(2);
  });

  it("fast-check is configured correctly", () => {
    fc.assert(
      fc.property(fc.integer(), fc.integer(), (a, b) => {
        return a + b === b + a;
      }),
      { numRuns: 100 }
    );
  });
});
