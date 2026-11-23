import { describe, it, expect } from "vitest";
import { exportCSV, importCSV } from "./csv";
import { defaults, type Actual } from "./finance";
import { initialState, stateSchema } from "./state";
const record: Actual = {
  id: "a",
  name: '科學, "實作"\n測試',
  date: "2026-11-24",
  registered: 20,
  paid: 18,
  price: 3200,
  materials: 4000,
  staff: 14000,
  venue: 4000,
  other: 2000,
  hours: 48,
  refund: 1000,
  satisfaction: 4.5,
  returnRate: 90,
  expected: defaults,
};
describe("persistence and CSV integrity", () => {
  it("roundtrips Chinese, commas, quotes, newlines and budget snapshot", () =>
    expect(importCSV(exportCSV([record]))).toEqual([record]));
  it("mitigates spreadsheet formula injection and roundtrips name", () => {
    const r = { ...record, name: "=SUM(A1)" };
    const text = exportCSV([r]);
    expect(text).toContain("'=SUM(A1)");
    expect(importCSV(text)[0].name).toBe(r.name);
  });
  it("rejects missing headers", () =>
    expect(() => importCSV("name,price\na,3")).toThrow("欄位不完整"));
  it("rejects negative and impossible values atomically", () => {
    expect(() => importCSV(exportCSV([{ ...record, paid: -1 }]))).toThrow();
    expect(() => importCSV(exportCSV([{ ...record, paid: 21 }]))).toThrow();
    expect(() =>
      importCSV(exportCSV([{ ...record, refund: 999999 }])),
    ).toThrow();
  });
  it("rejects impossible calendar dates", () =>
    expect(() =>
      importCSV(exportCSV([{ ...record, date: "2026-02-31" }])),
    ).toThrow());
  it("rejects duplicate IDs", () =>
    expect(() => importCSV(exportCSV([record, record]))).toThrow("重複 ID"));
  it("validates initial backup and rejects corrupt data", () => {
    expect(stateSchema.safeParse(initialState()).success).toBe(true);
    expect(
      stateSchema.safeParse({
        ...initialState(),
        params: { ...defaults, price: Infinity },
      }).success,
    ).toBe(false);
    expect(
      stateSchema.safeParse({ ...initialState(), version: 2 }).success,
    ).toBe(false);
  });
});
