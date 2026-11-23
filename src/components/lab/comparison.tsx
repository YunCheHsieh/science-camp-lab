"use client";
import { Input } from "@/components/ui/input";
import { Field, FieldLabel } from "@/components/ui/field";
import {
  Panel,
  ParamFields,
  PlanningSwitch,
  Note,
  FinanceTable,
} from "./common";
import { MoneyChart } from "./charts";
import { annual, breakEven, camp, count, nt } from "@/lib/finance";
import { type AppState } from "@/lib/state";
export function Comparison({
  scenarios,
  onChange,
}: {
  scenarios: AppState["scenarios"];
  onChange: (s: AppState["scenarios"]) => void;
}) {
  const data = scenarios.map((s, i) => ({
    name: `${i + 1}. ${s.name}`,
    ...annual(s.params),
  }));
  return (
    <>
      <Note>
        三組情境各自保存完整參數，成本計算規則完全相同。修改基本參數不會覆寫情境；每組都可獨立調整師資、場地與固定支出。
      </Note>
      <Panel
        title="三種可能，一起比較"
        description="年度營收、成本與預估留存 · 新臺幣"
      >
        <MoneyChart
          data={data}
          x="name"
          series={[
            { key: "revenue", name: "營收", color: "#163b5a" },
            { key: "cost", name: "總成本", color: "#a4bacb" },
            { key: "retained", name: "預估留存", color: "#159c8f" },
          ]}
        />
      </Panel>
      <div className="scenario-grid">
        {scenarios.map((s, i) => {
          const t = annual(s.params),
            b = breakEven(s.params);
          return (
            <Panel
              key={i}
              title={s.name || `情境 ${i + 1}`}
              description={`${s.params.events} 場 × ${s.params.students} 人 × ${nt(s.params.price)}`}
            >
              <Field>
                <FieldLabel htmlFor={`scenario-${i}`}>情境名稱</FieldLabel>
                <Input
                  id={`scenario-${i}`}
                  maxLength={60}
                  value={s.name}
                  onChange={(e) =>
                    onChange(
                      scenarios.map((v, n) =>
                        n === i ? { ...s, name: e.target.value } : v,
                      ),
                    )
                  }
                />
              </Field>
              <div className="scenario-retained">
                <small>年度預估留存</small>
                <strong className={t.retained < 0 ? "negative" : "positive"}>
                  {nt(t.retained)}
                </strong>
              </div>
              <FinanceTable
                rows={[
                  ["年度營收", nt(t.revenue)],
                  ["年度成本", nt(t.cost)],
                  ["每場貢獻", nt(camp(s.params).retained)],
                  ["所需教學日", `${t.days} 天`],
                  ["損益兩平人數", count(b.students, "人")],
                  ["損益兩平場數", count(b.events)],
                ]}
              />
              <details className="settings-details">
                <summary>調整情境參數</summary>
                <ParamFields
                  p={s.params}
                  onChange={(p) =>
                    onChange(
                      scenarios.map((v, n) =>
                        n === i ? { ...s, params: p } : v,
                      ),
                    )
                  }
                />
                <PlanningSwitch
                  p={s.params}
                  onChange={(p) =>
                    onChange(
                      scenarios.map((v, n) =>
                        n === i ? { ...s, params: p } : v,
                      ),
                    )
                  }
                />
              </details>
              {b.overCapacity && (
                <Note warning>最低招生需求超過此情境的教室容量。</Note>
              )}
            </Panel>
          );
        })}
      </div>
    </>
  );
}
