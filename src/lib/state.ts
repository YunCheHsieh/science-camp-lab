import { z } from "zod";
import {
  defaults,
  makeSchedule,
  companyDefaults,
  type Params,
  type Actual,
} from "./finance";

const num = (max = 100000000) => z.number().finite().min(0).max(max);
const integer = (max = 10000) => num(max).int();
export const riskDefaults = {
  price: 3200,
  students: 20,
  discount: 10,
  venueRise: 20,
  materialRise: 20,
  assistants: 1,
  cancelled: 1,
  sunk: 5000,
  replacement: 3000,
  missing: 2,
};
const riskSchema = z.object({
  price: num(),
  students: integer(),
  discount: num(100),
  venueRise: num(500),
  materialRise: num(500),
  assistants: integer(20),
  cancelled: integer(),
  sunk: num(),
  replacement: num(),
  missing: integer(),
});
export type RiskSettings = z.infer<typeof riskSchema>;
export const paramsSchema = z.object({
  events: integer(),
  days: integer(365),
  students: integer(),
  price: num(),
  lecturers: integer(1000),
  assistants: integer(1000),
  hours: num(24),
  lecturerRate: num(),
  assistantRate: num(),
  venue: num(),
  equipment: num(),
  admin: num(),
  variable: num(),
  planning: num(),
  reserve: num(100),
  monthlyFixed: num(),
  planningInSalary: z.boolean(),
  minimum: integer(),
  ideal: integer(),
  capacity: integer(),
  target: num(),
});
const batchSchema = z.object({
  id: z.string(),
  name: z.string().max(100),
  events: integer(),
  days: integer(365),
  students: integer(),
  price: num(),
  lecturers: integer(1000),
  assistants: integer(1000),
  extra: num(),
});
const monthSchema = z.object({
  month: integer(12).min(1),
  weekends: integer(5),
  rooms: integer(100),
  personDays: integer(100000),
  batches: z.array(batchSchema).max(200),
});
export const actualSchema = z
  .object({
    id: z.string(),
    name: z.string().min(1).max(100),
    date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .refine(
        (s) =>
          !Number.isNaN(Date.parse(s)) &&
          new Date(s).toISOString().slice(0, 10) === s,
      ),
    registered: integer(),
    paid: integer(),
    price: num(),
    materials: num(),
    staff: num(),
    venue: num(),
    other: num(),
    hours: num(100000),
    refund: num(),
    satisfaction: num(5),
    returnRate: num(100),
    expected: paramsSchema,
  })
  .refine((a) => a.paid <= a.registered, {
    message: "付費人數不可超過報名人數",
  })
  .refine((a) => a.refund <= a.paid * a.price, {
    message: "退費不可超過實收總額",
  });
export const stateSchema = z.object({
  version: z.literal(1),
  params: paramsSchema,
  mode: z.enum(["student", "company"]),
  source: z.enum(["simulator", "schedule"]),
  months: z
    .array(monthSchema)
    .length(12)
    .refine((ms) => new Set(ms.map((m) => m.month)).size === 12),
  scenarios: z
    .array(z.object({ name: z.string().max(60), params: paramsSchema }))
    .length(3),
  tasks: z.record(z.string(), z.boolean()),
  actuals: z.array(actualSchema).max(5000),
  company: z.object({
    employees: integer(1000),
    salary: num(),
    burden: num(100),
    rent: num(),
    admin: num(),
    depreciation: num(),
    events: integer(),
    target: num(),
  }),
});
export const fullStateSchema = stateSchema.extend({
  risk: riskSchema.default(riskDefaults),
});
export type AppState = z.infer<typeof fullStateSchema>;
export const initialState = (): AppState => ({
  version: 1,
  risk: { ...riskDefaults },
  params: { ...defaults },
  mode: "student",
  source: "simulator",
  months: makeSchedule(defaults),
  scenarios: [
    { name: "保守情境", params: { ...defaults, events: 4, students: 15 } },
    { name: "基準情境", params: { ...defaults } },
    {
      name: "積極情境",
      params: { ...defaults, events: 12, students: 25, price: 3600 },
    },
  ],
  tasks: {},
  actuals: [],
  company: { ...companyDefaults },
});
export const stages = [
  {
    title: "課程商品化",
    description: "把教學經驗，整理成可以交付的課程。",
    tasks: [
      "選擇兩套科學實作課程",
      "完成教案及教材清單",
      "計算材料成本",
      "設計安全操作流程",
      "完成課程定價",
    ],
  },
  {
    title: "營運準備",
    description: "先確認收費、場地與團隊的合作方式。",
    tasks: [
      "確認學校與社團收費規範",
      "確認場地使用許可",
      "確認保險、收款及憑證方式",
      "建立家長同意與退費規則",
      "確認工作人員職責與酬勞",
    ],
  },
  {
    title: "第一場付費測試",
    description: "用真實收入、成本與回饋驗證假設。",
    tasks: [
      "設定最低開班人數",
      "開放報名",
      "記錄招生來源",
      "執行兩日營隊",
      "統計實際收入與支出",
      "蒐集家長及學生回饋",
    ],
  },
  {
    title: "擴大營運",
    description: "先改良，再複製；用數據決定下一步。",
    tasks: [
      "分析第一場成果",
      "改良課程",
      "培訓講師與助教",
      "複製成功課程",
      "評估年度開班能力",
    ],
  },
];
export type FieldSpec = {
  key: keyof Omit<Params, "planningInSalary">;
  label: string;
  unit: string;
  max: number;
  step?: number;
  group: string;
};
export const fields: FieldSpec[] = [
  {
    key: "events",
    label: "年度營隊場數",
    unit: "場",
    max: 100,
    group: "營隊規模",
  },
  { key: "days", label: "每場天數", unit: "天", max: 14, group: "營隊規模" },
  {
    key: "students",
    label: "每場學生人數",
    unit: "人",
    max: 100,
    group: "營隊規模",
  },
  {
    key: "price",
    label: "每人營隊收費",
    unit: "NT$",
    max: 20000,
    step: 100,
    group: "營隊規模",
  },
  {
    key: "lecturers",
    label: "每場講師",
    unit: "人",
    max: 10,
    group: "師資與教學",
  },
  {
    key: "assistants",
    label: "每場助教",
    unit: "人",
    max: 20,
    group: "師資與教學",
  },
  {
    key: "hours",
    label: "每日教學時數",
    unit: "小時",
    max: 24,
    step: 0.5,
    group: "師資與教學",
  },
  {
    key: "lecturerRate",
    label: "講師時薪",
    unit: "NT$",
    max: 3000,
    step: 10,
    group: "師資與教學",
  },
  {
    key: "assistantRate",
    label: "助教時薪",
    unit: "NT$",
    max: 2000,
    step: 10,
    group: "師資與教學",
  },
  {
    key: "venue",
    label: "每場場地成本",
    unit: "NT$",
    max: 50000,
    step: 100,
    group: "直接成本",
  },
  {
    key: "equipment",
    label: "每場器材運輸與耗損",
    unit: "NT$",
    max: 20000,
    step: 100,
    group: "直接成本",
  },
  {
    key: "admin",
    label: "每場招生與行政成本",
    unit: "NT$",
    max: 20000,
    step: 100,
    group: "直接成本",
  },
  {
    key: "variable",
    label: "每人每日教材、餐費與保險",
    unit: "NT$",
    max: 3000,
    step: 10,
    group: "直接成本",
  },
  {
    key: "planning",
    label: "每場核心團隊規劃酬勞",
    unit: "NT$",
    max: 50000,
    step: 100,
    group: "酬勞與準備金",
  },
  {
    key: "reserve",
    label: "營收風險準備比例",
    unit: "%",
    max: 100,
    step: 0.5,
    group: "酬勞與準備金",
  },
  {
    key: "monthlyFixed",
    label: "每月公司固定支出",
    unit: "NT$",
    max: 500000,
    step: 1000,
    group: "酬勞與準備金",
  },
  {
    key: "minimum",
    label: "最低開班人數",
    unit: "人",
    max: 100,
    group: "招生與目標",
  },
  {
    key: "ideal",
    label: "理想招生人數",
    unit: "人",
    max: 100,
    group: "招生與目標",
  },
  {
    key: "capacity",
    label: "教室容量",
    unit: "人",
    max: 100,
    group: "招生與目標",
  },
  {
    key: "target",
    label: "目標年度留存",
    unit: "NT$",
    max: 2000000,
    step: 10000,
    group: "招生與目標",
  },
];
export const blankActual = (p: Params): Actual => ({
  id: crypto.randomUUID(),
  name: "",
  date: new Date().toLocaleDateString("sv-SE"),
  registered: 0,
  paid: 0,
  price: p.price,
  materials: 0,
  staff: 0,
  venue: 0,
  other: 0,
  hours: 0,
  refund: 0,
  satisfaction: 0,
  returnRate: 0,
  expected: { ...p, events: 1 },
});
