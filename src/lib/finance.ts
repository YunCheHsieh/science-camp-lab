/** Shared deterministic model. Monetary components are rounded to cents per camp.
 * Reserves are allocated cash, never accounting expense. Tax is not modeled. */
export type Params = {
  events: number;
  days: number;
  students: number;
  price: number;
  lecturers: number;
  assistants: number;
  hours: number;
  lecturerRate: number;
  assistantRate: number;
  venue: number;
  equipment: number;
  admin: number;
  variable: number;
  planning: number;
  reserve: number;
  monthlyFixed: number;
  planningInSalary: boolean;
  minimum: number;
  ideal: number;
  capacity: number;
  target: number;
};
export const defaults: Params = {
  events: 8,
  days: 2,
  students: 20,
  price: 3200,
  lecturers: 1,
  assistants: 2,
  hours: 8,
  lecturerRate: 350,
  assistantRate: 220,
  venue: 4000,
  equipment: 2000,
  admin: 2000,
  variable: 430,
  planning: 6000,
  reserve: 10,
  monthlyFixed: 0,
  planningInSalary: false,
  minimum: 14,
  ideal: 20,
  capacity: 30,
  target: 100000,
};
export const money = (n: number) =>
  Math.round((n + Number.EPSILON) * 100) / 100;
export const nt = (n: number) =>
  `NT$${new Intl.NumberFormat("zh-TW", { maximumFractionDigits: 2 }).format(n || 0)}`;
export const count = (n: number | null, unit = "場") =>
  n === null ? "無法達成" : `${n.toLocaleString("zh-TW")} ${unit}`;
export function camp(p: Params, extra = 0) {
  const revenue = money(p.students * money(p.price));
  const lecturer = money(
    p.lecturers * money(p.lecturerRate) * p.hours * p.days,
  );
  const assistant = money(
    p.assistants * money(p.assistantRate) * p.hours * p.days,
  );
  const students = money(p.students * money(p.variable) * p.days);
  const planning =
    p.planningInSalary && p.monthlyFixed > 0 ? 0 : money(p.planning);
  const direct = money(
    lecturer +
      assistant +
      students +
      money(p.venue) +
      money(p.equipment) +
      money(p.admin) +
      money(extra),
  );
  const reserve = money((revenue * p.reserve) / 100);
  const cost = money(direct + planning);
  const operating = money(revenue - cost);
  return {
    revenue,
    lecturer,
    assistant,
    students,
    planning,
    direct,
    reserve,
    cost,
    operating,
    retained: money(operating - reserve),
    extra,
  };
}
export function annual(p: Params) {
  const c = camp(p),
    fixed = money(money(p.monthlyFixed) * 12);
  const revenue = money(c.revenue * p.events),
    direct = money(c.direct * p.events),
    planning = money(c.planning * p.events),
    reserve = money(c.reserve * p.events);
  const cost = money(direct + planning + fixed),
    operating = money(revenue - cost);
  return {
    revenue,
    direct,
    planning,
    reserve,
    cost,
    fixed,
    operating,
    retained: money(operating - reserve),
    events: p.events,
    students: p.events * p.students,
    days: p.events * p.days,
  };
}
/** Small monotonic search verifies cents rounding at the exact boundary. Null = no feasible solution. */
function minimumInteger(predicate: (n: number) => boolean): number | null {
  if (predicate(0)) return 0;
  let high = 1;
  while (high < 1e9 && !predicate(high)) high *= 2;
  if (high >= 1e9 && !predicate(high)) return null;
  let low = 0;
  while (low + 1 < high) {
    const mid = Math.floor((low + high) / 2);
    if (predicate(mid)) high = mid;
    else low = mid;
  }
  return high;
}
export function breakEven(p: Params) {
  const c = camp(p),
    fixed = money(money(p.monthlyFixed) * 12);
  const unit = money(
    money(p.price) * (1 - p.reserve / 100) - money(p.variable) * p.days,
  );
  const allocated = p.events > 0 ? fixed / p.events : fixed === 0 ? 0 : null;
  const students =
    allocated === null || unit <= 0
      ? null
      : minimumInteger(
          (n) => camp({ ...p, students: n }).retained + 0.000001 >= allocated,
        );
  const price =
    p.students === 0 || p.reserve >= 100 || allocated === null
      ? null
      : minimumInteger(
          (n) =>
            camp({ ...p, price: n / 100 }).retained + 0.000001 >= allocated,
        );
  const events =
    c.retained <= 0
      ? null
      : minimumInteger((n) => money(c.retained * n - fixed) >= 0);
  const targetEvents =
    c.retained <= 0
      ? null
      : minimumInteger((n) => money(c.retained * n - fixed) >= p.target);
  const annualStudents =
    p.events === 0 || unit <= 0
      ? null
      : minimumInteger((n) => annual({ ...p, students: n }).retained >= 0);
  return {
    students,
    price: price === null ? null : price / 100,
    events,
    targetEvents,
    annualStudents,
    unit,
    contribution: c.retained,
    overCapacity: students !== null && students > p.capacity,
  };
}
export type Batch = {
  id: string;
  name: string;
  events: number;
  days: number;
  students: number;
  price: number;
  lecturers: number;
  assistants: number;
  extra: number;
};
export type Month = {
  month: number;
  weekends: number;
  rooms: number;
  personDays: number;
  batches: Batch[];
};
export const distribution = [1, 1, 0, 0, 1, 0, 2, 2, 0, 1, 0, 0];
export function makeBatch(p: Params, id: string, events = 1): Batch {
  return {
    id,
    name: "科學實作營",
    events,
    days: p.days,
    students: p.students,
    price: p.price,
    lecturers: p.lecturers,
    assistants: p.assistants,
    extra: 0,
  };
}
export function makeSchedule(p: Params): Month[] {
  const allocation = distribute(p.events);
  return allocation.map((events, i) => ({
    month: i + 1,
    weekends: 4,
    rooms: 1,
    personDays: 24,
    batches: events ? [makeBatch(p, `initial-${i}`, events)] : [],
  }));
}
export function distribute(events: number) {
  const a = distribution.map((n) => Math.floor((events * n) / 8));
  let left = events - a.reduce((s, n) => s + n, 0);
  const order = [6, 7, 0, 1, 4, 9];
  for (let i = 0; left > 0; i++, left--) a[order[i % order.length]]++;
  return a;
}
export function monthResult(m: Month, p: Params) {
  const fixed = money(p.monthlyFixed);
  const result = {
    month: `${m.month}月`,
    events: 0,
    students: 0,
    days: 0,
    personDays: 0,
    revenue: 0,
    direct: 0,
    planning: 0,
    reserve: 0,
    cost: fixed,
    operating: money(-fixed),
    retained: money(-fixed),
    fixed,
  };
  for (const b of m.batches) {
    const c = camp({ ...p, ...b }, b.extra);
    result.events += b.events;
    result.students += b.students * b.events;
    result.days += b.days * b.events;
    result.personDays += (b.lecturers + b.assistants) * b.days * b.events;
    for (const k of [
      "revenue",
      "direct",
      "planning",
      "reserve",
      "cost",
      "operating",
      "retained",
    ] as const)
      result[k] = money(result[k] + c[k] * b.events);
  }
  return {
    ...result,
    capacityWarning:
      result.days > m.weekends * 2 * m.rooms ||
      result.personDays > m.personDays ||
      m.batches.some((b) => b.students > p.capacity),
    classroomDays: m.weekends * 2 * m.rooms,
  };
}
export function scheduleResult(months: Month[], p: Params) {
  let cumulative = 0;
  const monthly = months.map((m) => {
    const r = monthResult(m, p);
    cumulative = money(cumulative + r.retained);
    return { ...r, cumulative };
  });
  const total = monthly.reduce(
    (a, r) => {
      for (const k of Object.keys(a) as (keyof typeof a)[])
        a[k] = money(a[k] + r[k]);
      return a;
    },
    {
      revenue: 0,
      direct: 0,
      planning: 0,
      reserve: 0,
      cost: 0,
      operating: 0,
      retained: 0,
      fixed: 0,
      events: 0,
      students: 0,
      days: 0,
    },
  );
  return { monthly, total };
}
export type Actual = {
  id: string;
  name: string;
  date: string;
  registered: number;
  paid: number;
  price: number;
  materials: number;
  staff: number;
  venue: number;
  other: number;
  hours: number;
  refund: number;
  satisfaction: number;
  returnRate: number;
  expected: Params;
};
export function actualResult(a: Actual) {
  const revenue = money(a.paid * money(a.price) - money(a.refund)),
    cost = money(
      money(a.materials) + money(a.staff) + money(a.venue) + money(a.other),
    );
  const expected = camp(a.expected);
  return {
    revenue,
    cost,
    contribution: money(revenue - cost),
    budgetVariance: money(cost - expected.cost),
    contributionVariance: money(revenue - cost - expected.operating),
    enrollment:
      a.expected.students > 0 ? (a.paid / a.expected.students) * 100 : null,
  };
}
export type Company = {
  employees: number;
  salary: number;
  burden: number;
  rent: number;
  admin: number;
  depreciation: number;
  events: number;
  target: number;
};
export const companyDefaults: Company = {
  employees: 3,
  salary: 35000,
  burden: 10,
  rent: 5000,
  admin: 3500,
  depreciation: 1000,
  events: 24,
  target: 100000,
};
export function companyResult(p: Params, c: Company) {
  const monthly = money(
    c.employees * c.salary * (1 + c.burden / 100) +
      c.rent +
      c.admin +
      c.depreciation,
  );
  const model = {
    ...p,
    monthlyFixed: monthly,
    planningInSalary: c.employees * c.salary > 0,
    events: c.events,
    target: c.target,
  };
  const result = annual(model);
  const be = breakEven(model);
  const unit = be.unit;
  return {
    monthly,
    model,
    result,
    be,
    gap: money(Math.max(0, c.target - result.retained)),
    extraStudents:
      unit > 0
        ? minimumInteger((n) => money(result.retained + n * unit) >= c.target)
        : null,
  };
}
