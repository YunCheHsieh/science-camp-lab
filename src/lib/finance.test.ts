import { describe, it, expect } from "vitest";
import {
  defaults,
  camp,
  annual,
  breakEven,
  makeSchedule,
  scheduleResult,
  makeBatch,
  monthResult,
  companyResult,
  companyDefaults,
  actualResult,
  type Params,
} from "./finance";
describe("canonical financial model", () => {
  it("keeps monthly and annual cents rounding consistent", () => {
    const p = {
      ...defaults,
      monthlyFixed: 123.456,
      price: 3200.126,
      venue: 4000.006,
    };
    expect(scheduleResult(makeSchedule(p), p).total).toEqual(annual(p));
  });
  it("matches all supplied default values", () => {
    expect(camp(defaults).direct).toBe(37840);
    expect(annual(defaults)).toMatchObject({
      revenue: 512000,
      direct: 302720,
      planning: 48000,
      reserve: 51200,
      retained: 110080,
      cost: 350720,
      operating: 161280,
    });
  });
  it("handles zero students", () => {
    const p = { ...defaults, students: 0 };
    expect(camp(p).revenue).toBe(0);
    expect(breakEven(p).price).toBeNull();
    expect(breakEven(p).events).toBeNull();
    expect(annual(p).retained).toBe(-213120);
  });
  it("zero events preserves annual fixed costs", () => {
    const p = { ...defaults, events: 0, monthlyFixed: 1000 };
    expect(annual(p)).toMatchObject({
      revenue: 0,
      cost: 12000,
      retained: -12000,
    });
    expect(breakEven(p).annualStudents).toBeNull();
    expect(breakEven(p).students).toBeNull();
  });
  it("zero revenue never creates invalid break-even requirements", () => {
    const b = breakEven({ ...defaults, price: 0 });
    expect(b.students).toBeNull();
    expect(b.events).toBeNull();
  });
  it("negative contribution cannot be solved by more events", () => {
    const b = breakEven({ ...defaults, price: 100 });
    expect(b.contribution).toBeLessThan(0);
    expect(b.events).toBeNull();
    expect(b.targetEvents).toBeNull();
  });
  it("flags enrollment beyond classroom capacity", () => {
    const b = breakEven({ ...defaults, capacity: 10 });
    expect(b.students).toBe(14);
    expect(b.overCapacity).toBe(true);
  });
  it("separates reserve allocation from operating result", () => {
    const zero = annual({ ...defaults, reserve: 0 }),
      high = annual({ ...defaults, reserve: 20 });
    expect(zero.retained).toBe(161280);
    expect(high.retained).toBe(58880);
    expect(high.cost).toBe(zero.cost);
    expect(high.operating).toBe(zero.operating);
    expect(breakEven({ ...defaults, reserve: 100 }).price).toBeNull();
  });
  it("scales staff and variable costs by days", () => {
    expect(camp({ ...defaults, days: 1 }).direct).toBe(22920);
    expect(camp({ ...defaults, days: 3 }).direct).toBe(52760);
  });
  it("sums default schedule to the same yearly model", () => {
    expect(scheduleResult(makeSchedule(defaults), defaults).total).toEqual(
      annual(defaults),
    );
  });
  it("supports mixed batches and monthly extras without double fixed charges", () => {
    const p = { ...defaults, monthlyFixed: 1000 };
    const months = makeSchedule({ ...p, events: 0 });
    months[0].batches = [
      makeBatch(p, "a", 2),
      { ...makeBatch(p, "b", 1), days: 1, price: 2000, extra: 1200 },
    ];
    months[6].batches = [makeBatch(p, "c", 3)];
    const t = scheduleResult(months, p).total;
    expect(t.events).toBe(6);
    expect(t.revenue).toBe(5 * 64000 + 40000);
    expect(t.fixed).toBe(12000);
    expect(t.cost).toBe(5 * 43840 + 22920 + 1200 + 6000 + 12000);
  });
  it("avoids duplicate salary planning costs explicitly", () => {
    const p = { ...defaults, monthlyFixed: 125000, planningInSalary: true };
    expect(camp(p).planning).toBe(0);
    expect(annual(p).retained).toBe(-1341920);
    expect(camp({ ...p, planningInSalary: false }).planning).toBe(6000);
    expect(camp({ ...p, monthlyFixed: 0 }).planning).toBe(6000);
  });
  it("rounds requirements upward and verifies boundary", () => {
    for (const fixed of [0, 1000, 125000]) {
      const p = { ...defaults, monthlyFixed: fixed };
      const b = breakEven(p);
      expect(
        annual({ ...p, events: b.targetEvents! }).retained,
      ).toBeGreaterThanOrEqual(p.target);
      expect(
        annual({ ...p, events: b.targetEvents! - 1 }).retained,
      ).toBeLessThan(p.target);
      expect(
        annual({ ...p, students: b.students! }).retained,
      ).toBeGreaterThanOrEqual(0);
      expect(annual({ ...p, students: b.students! - 1 }).retained).toBeLessThan(
        0,
      );
      expect(annual({ ...p, price: b.price! }).retained).toBeGreaterThanOrEqual(
        0,
      );
      expect(annual({ ...p, price: b.price! - 0.01 }).retained).toBeLessThan(0);
    }
  });
  it("zero fixed costs have zero-event break-even", () =>
    expect(breakEven(defaults).events).toBe(0));
  it("includes monthly human and classroom constraints", () => {
    const m = makeSchedule(defaults)[6];
    expect(monthResult({ ...m, weekends: 0 }, defaults).capacityWarning).toBe(
      true,
    );
    expect(monthResult({ ...m, personDays: 1 }, defaults).capacityWarning).toBe(
      true,
    );
  });
  it("company assumptions total 125000 monthly", () => {
    const r = companyResult(defaults, companyDefaults);
    expect(r.monthly).toBe(125000);
    expect(r.model.planningInSalary).toBe(true);
  });
  it("returns finite totals for boundary combinations", () => {
    for (const students of [0, 1, 100])
      for (const price of [0, 100, 3200])
        for (const events of [0, 8])
          for (const reserve of [0, 10, 100]) {
            const p: Params = { ...defaults, students, price, events, reserve };
            for (const v of Object.values(annual(p)))
              expect(Number.isFinite(v)).toBe(true);
            for (const v of Object.values(breakEven(p)))
              if (typeof v === "number") {
                expect(Number.isFinite(v)).toBe(true);
              }
          }
  });
  it("computes actual net contribution independently of reserves", () => {
    expect(
      actualResult({
        id: "a",
        name: "test",
        date: "2026-01-01",
        registered: 20,
        paid: 18,
        price: 3000,
        materials: 5000,
        staff: 12000,
        venue: 4000,
        other: 3000,
        hours: 20,
        refund: 3000,
        satisfaction: 4.5,
        returnRate: 80,
        expected: defaults,
      }),
    ).toMatchObject({
      revenue: 51000,
      cost: 24000,
      contribution: 27000,
      budgetVariance: -19840,
      enrollment: 90,
    });
  });
});
