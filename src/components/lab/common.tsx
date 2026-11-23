"use client";
import { useId, useState, type ReactNode } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Field, FieldLabel, FieldGroup } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info, TriangleAlert } from "lucide-react";
import { fields } from "@/lib/state";
import {
  nt,
  money,
  annual,
  breakEven,
  count,
  type Params,
} from "@/lib/finance";
import { Checkbox } from "@/components/ui/checkbox";
export function Panel({
  title,
  description,
  children,
  action,
  className = "",
}: {
  title: string;
  description?: string;
  children: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <Card className={`panel ${className}`}>
      <CardHeader>
        <div className="panel-heading">
          <CardTitle>{title}</CardTitle>
          {action}
        </div>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
export function Note({
  children,
  warning = false,
}: {
  children: ReactNode;
  warning?: boolean;
}) {
  return (
    <Alert className={warning ? "note warning" : "note"}>
      {warning ? <TriangleAlert /> : <Info />}
      <AlertDescription>{children}</AlertDescription>
    </Alert>
  );
}
export function NumberField({
  label,
  value,
  onChange,
  unit = "",
  max = 100000000,
  step = 1,
  slider = false,
  min = 0,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  unit?: string;
  max?: number;
  step?: number;
  slider?: boolean;
  min?: number;
}) {
  const id = useId();
  const [draft, setDraft] = useState<string | null>(null);
  const invalid =
    draft !== null &&
    (draft === "" ||
      !Number.isFinite(Number(draft)) ||
      Number(draft) < min ||
      Number(draft) > max ||
      (step === 1 && !Number.isInteger(Number(draft))));
  return (
    <Field className="number-field" data-invalid={invalid}>
      <div className="field-top">
        <FieldLabel htmlFor={id}>{label}</FieldLabel>
        <span className="unit">{unit}</span>
      </div>
      <div className={slider ? "slider-input" : "single-input"}>
        {slider && (
          <Slider
            aria-label={`${label}滑桿`}
            min={min}
            max={Math.max(max, value)}
            step={step}
            value={[value]}
            onValueChange={(v) => {
              setDraft(null);
              onChange(Array.isArray(v) ? v[0] : v);
            }}
          />
        )}
        <Input
          id={id}
          type="number"
          inputMode={step === 1 ? "numeric" : "decimal"}
          min={min}
          max={max}
          step={step === 1 ? 1 : "any"}
          value={draft ?? value}
          aria-invalid={invalid}
          onChange={(e) => {
            const raw = e.target.value;
            setDraft(raw);
            const n = Number(raw);
            if (
              raw !== "" &&
              Number.isFinite(n) &&
              n >= min &&
              n <= max &&
              (step !== 1 || Number.isInteger(n))
            )
              onChange(unit === "NT$" ? money(n) : n);
          }}
          onBlur={() => setDraft(null)}
        />
      </div>
      {invalid && (
        <span className="field-error">
          請輸入 {min}–{max.toLocaleString()}{" "}
          {step === 1 ? "的整數" : "之間的數值"}；離開欄位會恢復有效值。
        </span>
      )}
    </Field>
  );
}
export function ParamFields({
  p,
  onChange,
  keys,
}: {
  p: Params;
  onChange: (p: Params) => void;
  keys?: string[];
}) {
  return (
    <FieldGroup className="parameter-grid">
      {fields
        .filter((f) => !keys || keys.includes(f.key))
        .map((f) => (
          <NumberField
            key={f.key}
            label={f.label}
            value={p[f.key]}
            unit={f.unit}
            max={Math.max(f.max, p[f.key])}
            step={f.step}
            slider
            onChange={(v) => onChange({ ...p, [f.key]: v })}
          />
        ))}
    </FieldGroup>
  );
}
export function PlanningSwitch({
  p,
  onChange,
}: {
  p: Params;
  onChange: (p: Params) => void;
}) {
  return (
    <label className="check-row">
      <Checkbox
        checked={p.planningInSalary}
        onCheckedChange={(v) => onChange({ ...p, planningInSalary: v })}
      />
      <span>
        規劃工作已包含於固定薪資，不再另付規劃酬勞
        <small>固定支出大於 0 時生效；若另付外部人員費用，取消勾選。</small>
      </span>
    </label>
  );
}
export function Stat({
  label,
  value,
  note,
  positive = false,
  negative = false,
}: {
  label: string;
  value: ReactNode;
  note?: string;
  positive?: boolean;
  negative?: boolean;
}) {
  return (
    <div className="stat">
      <div className="stat-label">{label}</div>
      <strong className={negative ? "negative" : positive ? "positive" : ""}>
        {value}
      </strong>
      {note && <small>{note}</small>}
    </div>
  );
}
export function KPIs({
  p,
  total,
}: {
  p: Params;
  total?: ReturnType<typeof annual>;
}) {
  const t = total ?? annual(p),
    be = breakEven(p);
  return (
    <div className="kpi-grid">
      <Stat
        label="年度營收"
        value={nt(t.revenue)}
        note={`${t.events} 場營隊 · ${t.students} 付費人次`}
      />
      <Stat
        label="年度總成本"
        value={nt(t.cost)}
        note="直接成本、規劃酬勞與固定支出"
      />
      <Stat
        label="預估留存"
        value={nt(t.retained)}
        note={`已預留 ${nt(t.reserve)} 風險準備`}
        positive
        negative={t.retained < 0}
      />
      <Stat
        label="損益兩平場數"
        value={count(be.events)}
        note="依基本參數 · 扣除風險準備"
      />
      <Stat
        label="平均每場招生"
        value={`${t.events ? Number((t.students / t.events).toFixed(1)) : 0} 人`}
        note={`教室容量 ${p.capacity} 人`}
      />
    </div>
  );
}
export function FinanceTable({
  rows,
}: {
  rows: [string, ReactNode, string?][];
}) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>項目</th>
            <th className="numeric">金額／數量</th>
            <th>說明</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([label, value, description]) => (
            <tr key={label}>
              <th scope="row">{label}</th>
              <td className="numeric">{value}</td>
              <td className="muted">{description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
