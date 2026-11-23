"use client";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Panel, Note, ParamFields, KPIs, FinanceTable } from "./common";
import { MoneyChart, Allocation } from "./charts";
import {
  annual,
  camp,
  makeSchedule,
  scheduleResult,
  nt,
  type Params,
} from "@/lib/finance";
import { stages, type AppState } from "@/lib/state";
export function Dashboard({
  state,
  updateParams,
  toggleTask,
  navigate,
}: {
  state: AppState;
  updateParams: (p: Params) => void;
  toggleTask: (id: string, v: boolean) => void;
  navigate: (id: string) => void;
}) {
  const p = state.params,
    c = camp(p),
    s = scheduleResult(
      state.source === "schedule" ? state.months : makeSchedule(p),
      p,
    ),
    t = state.source === "schedule" ? s.total : annual(p);
  const completed = Object.values(state.tasks).filter(Boolean).length;
  return (
    <>
      <KPIs p={p} total={t} />
      <div className="dashboard-charts">
        <Panel
          title="年度營運預測"
          description={
            state.source === "schedule"
              ? "依每月方案逐筆加總 · 單位 NT$"
              : "依基本參數分配場數的示意預測 · 單位 NT$"
          }
          action={
            <Button variant="ghost" onClick={() => navigate("schedule")}>
              編輯排程
            </Button>
          }
        >
          <MoneyChart data={s.monthly} />
        </Panel>
        <Panel title="每一筆收入的去向" description="基本參數的單場收入配置">
          <Allocation
            total={c.revenue}
            data={[
              { name: "直接成本", value: c.direct },
              { name: "規劃酬勞", value: c.planning },
              { name: "風險準備", value: c.reserve },
              { name: "預估留存", value: Math.max(0, c.retained) },
            ]}
          />
          {c.retained < 0 && (
            <p className="negative">單場資金缺口 {nt(-c.retained)}</p>
          )}
        </Panel>
      </div>
      <Note>
        風險準備金是預留資金，不是已發生的費用。未扣準備金的年度營運結餘為{" "}
        <strong>{nt(t.operating)}</strong>。
      </Note>
      <div className="two-col">
        <Panel
          title="快速模擬"
          description="調整參數，立即查看營運變化"
          action={
            <Button variant="ghost" onClick={() => navigate("params")}>
              完整設定
            </Button>
          }
        >
          {state.source === "schedule" && (
            <p className="muted mb-4">
              目前總覽採年度排程；此處修改基本參數，不會覆寫各月份方案。
            </p>
          )}
          <ParamFields
            p={p}
            onChange={updateParams}
            keys={["students", "price", "events"]}
          />
        </Panel>
        <Panel
          title="下一步，讓計畫發生"
          description={`試營運準備 ${completed} / 21 項完成`}
          action={
            <Button variant="ghost" onClick={() => navigate("roadmap")}>
              查看路線圖
            </Button>
          }
        >
          <Progress value={(completed / 21) * 100} aria-label="試營運總進度" />
          {stages[0].tasks.map((task, i) => (
            <label className="check-row" key={task}>
              <Checkbox
                checked={!!state.tasks[`0-${i}`]}
                onCheckedChange={(v) => toggleTask(`0-${i}`, v)}
              />
              <span>{task}</span>
            </label>
          ))}
        </Panel>
      </div>
      <Panel
        title="年度財務摘要"
        description="以同一套計算規則，拆解收入、費用與資金預留"
      >
        <FinanceTable
          rows={[
            [
              "年度營收",
              nt(t.revenue),
              `${t.events} 場 · ${t.students} 付費人次`,
            ],
            [
              "年度直接成本",
              nt(t.direct),
              "講師、助教、場地、器材、行政、學生變動成本",
            ],
            [
              "年度規劃酬勞",
              nt(t.planning),
              "已排除包含在固定薪資內的規劃工作",
            ],
            ["年度公司固定支出", nt(t.fixed), "每月固定支出 × 12"],
            ["未扣準備金的營運結餘", nt(t.operating), "營收 − 實際預算成本"],
            ["風險準備金", nt(t.reserve), "資金預留，不列為會計費用"],
            ["年度預估留存", nt(t.retained), "營運結餘 − 風險準備金"],
          ]}
        />
      </Panel>
    </>
  );
}
