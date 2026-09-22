import { describe, expect, it } from "vitest";
import { databaseDateMonthRange, taipeiMonthRange } from "../src/utils/time.js";

describe("Taipei report ranges", () => {
  it("returns every calendar day in September without shifting the boundaries", () => {
    const range = taipeiMonthRange("2026-09");

    expect(range.start.toISOString()).toBe("2026-08-31T16:00:00.000Z");
    expect(range.end.toISOString()).toBe("2026-09-30T16:00:00.000Z");
    expect(range.days).toHaveLength(30);
    expect(range.days[0]).toBe("2026-09-01");
    expect(range.days.at(-1)).toBe("2026-09-30");
  });

  it("uses calendar-date boundaries for date-only expense columns", () => {
    const range = databaseDateMonthRange("2026-09");

    expect(range.start.toISOString()).toBe("2026-09-01T00:00:00.000Z");
    expect(range.end.toISOString()).toBe("2026-10-01T00:00:00.000Z");
  });
});
