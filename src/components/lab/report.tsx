"use client";
import { Printer, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Panel, Note, FinanceTable, KPIs } from "./common";
import {
  annual,
  camp,
  scheduleResult,
  breakEven,
  count,
  nt,
} from "@/lib/finance";
import { fields, type AppState } from "@/lib/state";
import { download } from "@/lib/csv";
export function Report({ state }: { state: AppState }) {
  const p = state.params,
    t =
      state.source === "schedule"
        ? scheduleResult(state.months, p).total
        : annual(p),
    b = breakEven(p),
    c = camp(p),
    date = new Date().toLocaleString("zh-TW");
  const warnings = [
    ...(b.contribution <= 0
      ? ["單場貢獻小於或等於零，增加場數無法改善年度虧損。"]
      : []),
    ...(b.overCapacity ? ["損益兩平招生需求超過教室容量。"] : []),
    ...(t.retained < p.target
      ? ["年度預估留存未達目標，須重新評估場次、定價或成本。"]
      : []),
    "招生與平均實收仍需透過付費試營運驗證。",
    "場地、人力、材料成本與取消退費皆可能影響結果。",
  ];
  return (
    <div className="report-content">
      <div className="toolbar no-print">
        <Note>
          選擇「列印／另存 PDF」，在瀏覽器列印視窗將目的地設為「另存為
          PDF」。手機的 PDF 功能依瀏覽器與作業系統提供。
        </Note>
        <div className="button-row">
          <Button onClick={() => window.print()}>
            <Printer data-icon="inline-start" />
            列印／另存 PDF
          </Button>
          <Button
            variant="outline"
            onClick={() =>
              download(
                "science-camp-report.json",
                JSON.stringify(
                  {
                    generatedAt: new Date().toISOString(),
                    currency: "TWD",
                    assumptionModel: true,
                    source: state.source,
                    params: p,
                    months: state.months,
                    result: t,
                    breakEven: b,
                    warnings,
                  },
                  null,
                  2,
                ),
              )
            }
          >
            <Download data-icon="inline-start" />
            下載報告資料
          </Button>
        </div>
      </div>
      <div className="report-title">
        <span>Science Camp Lab</span>
        <h2>科普營隊營運模擬報告</h2>
        <p>產生日期：{date}　｜　幣別：新臺幣（NT$／TWD）</p>
        <p>
          資料來源：
          {state.source === "schedule" ? "年度排程逐月加總" : "基本參數模擬"}
          　｜　假設模型・未經市場驗證
        </p>
      </div>
      <KPIs p={p} total={t} />
      <Panel title="營收與成本結構">
        <FinanceTable
          rows={[
            ["年度營收", nt(t.revenue)],
            ["年度直接成本", nt(t.direct)],
            ["年度規劃酬勞", nt(t.planning)],
            ["年度固定支出", nt(t.fixed)],
            ["年度總成本", nt(t.cost), "不含風險準備金"],
            ["未扣準備金的營運結餘", nt(t.operating)],
            ["風險準備金", nt(t.reserve), "資金預留，不是已發生費用"],
            ["年度預估留存", nt(t.retained)],
          ]}
        />
      </Panel>
      <Panel
        title="損益兩平與年度需求"
        description="以下統一以基本參數計算；混合排程的各方案可能有不同損益兩平點。"
      >
        <FinanceTable
          rows={[
            ["最低開班損益兩平人數", count(b.students, "人")],
            ["最低每人收費", b.price === null ? "無法達成" : nt(b.price)],
            ["年度損益兩平場數", count(b.events)],
            ["年度目標留存", nt(p.target)],
            ["達標所需年度場數", count(b.targetEvents)],
            ["單場貢獻", nt(c.retained)],
            ["理想招生／教室容量", `${p.ideal} / ${p.capacity} 人`],
          ]}
        />
      </Panel>
      <Panel title="模擬參數">
        <FinanceTable
          rows={fields.map((f) => [
            f.label,
            `${p[f.key].toLocaleString()} ${f.unit}`,
          ])}
        />
        <p className="mt-4">
          規劃工作包含於固定薪資：
          {p.planningInSalary
            ? "是；有固定支出時不另計規劃酬勞"
            : "否；另計規劃酬勞"}
        </p>
      </Panel>
      {state.source === "schedule" && (
        <Panel title="年度排程方案">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>月份／課程</th>
                  <th>場數／天數</th>
                  <th>人數／收費</th>
                  <th>師資</th>
                  <th>每場額外成本</th>
                </tr>
              </thead>
              <tbody>
                {state.months.flatMap((m) =>
                  m.batches.map((batch) => (
                    <tr key={batch.id}>
                      <td>
                        {m.month}月 {batch.name}
                      </td>
                      <td>
                        {batch.events} 場 / {batch.days} 天
                      </td>
                      <td>
                        {batch.students} 人 / {nt(batch.price)}
                      </td>
                      <td>
                        {batch.lecturers} 講師 / {batch.assistants} 助教
                      </td>
                      <td>{nt(batch.extra)}</td>
                    </tr>
                  )),
                )}
              </tbody>
            </table>
          </div>
        </Panel>
      )}
      <div className="two-col">
        <Panel title="主要風險">
          <ul className="prose-list">
            {warnings.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        </Panel>
        <Panel title="試營運建議">
          <ol className="prose-list">
            <li>先完成兩套課程、教材清單、安全流程與定價。</li>
            <li>
              以至少{" "}
              {b.students === null
                ? p.minimum
                : Math.max(p.minimum, b.students)}{" "}
              位付費學生作為待驗證的開班門檻，並確認容量可行。
            </li>
            <li>先辦一場付費測試，記錄實收、工作時數與所有支出。</li>
            <li>用真實招生來源、家長回饋與單場貢獻，再決定擴大速度。</li>
          </ol>
        </Panel>
      </div>
      <Panel title="重要假設與計算口徑">
        <p>
          金額以分為精度，單場各成本先四捨五入後加總，年度為各場次加總。風險準備不是會計費用。公司固定支出按全年
          12
          個月計入；未模擬稅務、資本支出、融資、付款時差與營運資金。教室、人力容量採總量檢查，未驗證具體日期衝突。
        </p>
        <p className="mt-3">
          這份報告用於團隊討論與試營運規劃；所有招生、費率及市場需求皆為可調整假設，不代表已驗證的獲利能力。
        </p>
      </Panel>
    </div>
  );
}
