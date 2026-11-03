import { describe, expect, it } from "vitest";
import { canCancel, money, nextStatus, normalizeStatus, shiftMonth } from "./utils";

describe("order helpers", () => {
  it("normalizes API status casing", () => expect(normalizeStatus("preparing")).toBe("PREPARING"));
  it("maps the operational status flow", () => {
    expect(nextStatus("PENDING")).toEqual({ status: "PREPARING", label: "開始製作" });
    expect(nextStatus("PREPARING")?.status).toBe("READY");
    expect(nextStatus("READY")?.status).toBe("COMPLETED");
    expect(nextStatus("COMPLETED")).toBeNull();
  });
  it("only allows active orders to be cancelled", () => {
    expect(canCancel("PENDING")).toBe(true);
    expect(canCancel("COMPLETED")).toBe(false);
    expect(canCancel("cancelled")).toBe(false);
  });
  it("formats New Taiwan dollar values", () => expect(money(12345)).toContain("12,345"));
});

describe("chart month navigation", () => {
  it("moves across year boundaries in both directions", () => {
    expect(shiftMonth("2026-01", -1)).toBe("2025-12");
    expect(shiftMonth("2026-12", 1)).toBe("2027-01");
  });
  it("rejects invalid months and years outside the picker range", () => {
    expect(shiftMonth("2026-13", 1)).toBeNull();
    expect(shiftMonth("2026-00", -1)).toBeNull();
    expect(shiftMonth("1900-01", -1)).toBeNull();
  });
});
