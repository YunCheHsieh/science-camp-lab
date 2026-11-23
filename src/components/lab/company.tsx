"use client";
import { Panel, Note, NumberField, Stat, FinanceTable } from "./common";
import { FieldGroup } from "@/components/ui/field";
import { MoneyChart } from "./charts";
import {
  annual,
  companyResult,
  breakEven,
  nt,
  count,
  type Company,
  type Params,
} from "@/lib/finance";
export function CompanyView({
  p,
  value,
  onChange,
}: {
  p: Params;
  value: Company;
  onChange: (c: Company) => void;
}) {
  const c = companyResult(p, value),
    studentP = {
      ...p,
      events: value.events,
      monthlyFixed: 0,
      planningInSalary: false,
    },
    s = annual(studentP),
    studentBE = breakEven({ ...studentP, target: value.target }),
    targetStudents = breakEven({
      ...c.model,
      monthlyFixed: c.monthly + value.target / 12,
    }).annualStudents;
  return (
    <>
      <Note>
        公司化評估是「假設模型」，不能代表已驗證的市場獲利能力。兩種模式使用相同場數、招生與收費；公司模式將規劃工作包含在固定薪資，避免重複計算。
      </Note>
      <div className="two-col">
        <Panel title="正式營運需要多少固定支出？">
          <FieldGroup className="parameter-grid">
            {(
              [
                ["employees", "正職員工人數", "人", 20],
                ["salary", "每人月薪", "NT$", 200000],
                ["burden", "雇主負擔與相關人事成本", "%", 100],
                ["rent", "每月辦公室租金", "NT$", 200000],
                ["admin", "每月行政及軟體費用", "NT$", 100000],
                ["depreciation", "每月設備折舊", "NT$", 100000],
                ["events", "每年預期營隊場數", "場", 300],
                ["target", "目標年度留存", "NT$", 5000000],
              ] as const
            ).map(([key, label, unit, max]) => (
              <NumberField
                key={key}
                slider
                label={label}
                value={value[key]}
                max={Math.max(max, value[key])}
                unit={unit}
                step={unit === "NT$" ? 100 : 1}
                onChange={(v) => onChange({ ...value, [key]: v })}
              />
            ))}
          </FieldGroup>
          <p className="muted mt-4">
            雇主負擔比例由團隊自行設定，並非法律費率。折舊屬非現金成本，因此此頁留存是保守資金指標，並非嚴格現金流量表。
          </p>
        </Panel>
        <Panel
          title="轉型後的年度試算"
          description={`公司每月固定支出 ${nt(c.monthly)}`}
        >
          <MoneyChart
            x="name"
            data={[
              { name: "學生試營運", ...s },
              { name: "正式公司", ...c.result },
            ]}
            series={[
              { key: "revenue", name: "營收", color: "#163b5a" },
              { key: "cost", name: "成本", color: "#a4bacb" },
              { key: "retained", name: "留存", color: "#159c8f" },
            ]}
          />
          <FinanceTable
            rows={[
              ["學生試營運年度留存", nt(s.retained), "仍計入每場規劃酬勞"],
              [
                "公司化年度留存",
                nt(c.result.retained),
                "規劃工作已包含固定薪資",
              ],
              ["公司化年度固定支出", nt(c.monthly * 12), "包括設定的折舊假設"],
            ]}
          />
        </Panel>
      </div>
      <div className="metrics-grid">
        <Stat label="公司達目標所需場數" value={count(c.be.targetEvents)} />
        <Stat
          label="較目前計畫須增加"
          value={
            c.be.targetEvents === null
              ? "無法達成"
              : `${Math.max(0, c.be.targetEvents - value.events)} 場`
          }
          note={`目前公司計畫 ${value.events} 場`}
        />
        <Stat
          label="較學生達標所需場數增加"
          value={
            c.be.targetEvents === null || studentBE.targetEvents === null
              ? "無法比較"
              : `${Math.max(0, c.be.targetEvents - studentBE.targetEvents)} 場`
          }
        />
        <Stat
          label="維持場數的每場招生需求"
          value={count(targetStudents, "人")}
          note="含目標年度留存"
        />
        <Stat
          label="需增加的付費學生人次"
          value={count(c.extraStudents, "人次")}
          note="全年度合計；仍須符合每場容量"
        />
        <Stat
          label="所需額外委託淨貢獻"
          value={nt(c.gap)}
          note="委託收入扣除其直接成本後的淨額"
        />
      </div>
      {targetStudents !== null && targetStudents > p.capacity && (
        <Note warning>
          每場需 {targetStudents} 人才能達到目標，超過目前容量 {p.capacity}{" "}
          人。應增加場次、改善單場貢獻，或發展委託教學收入。
        </Note>
      )}
      <Note>
        額外委託「收入」會產生成本；此處顯示的是需要補足的淨貢獻。若委託淨貢獻率為
        50%，所需委託收入約為 {nt(c.gap * 2)}，此比例只是示例假設。
      </Note>
    </>
  );
}
