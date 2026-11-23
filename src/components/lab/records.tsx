"use client";
import { useRef, useState } from "react";
import { Plus, Download, Upload, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldLabel, FieldGroup } from "@/components/ui/field";
import { Panel, Note, NumberField, Stat, ParamFields } from "./common";
import { actualResult, nt, type Params, type Actual } from "@/lib/finance";
import { blankActual, actualSchema } from "@/lib/state";
import { exportCSV, importCSV, download } from "@/lib/csv";
const actualFields = [
  ["registered", "實際報名人數", "人", 10000],
  ["paid", "實際付費人數", "人", 10000],
  ["price", "實際平均收費", "NT$", 100000000],
  ["materials", "實際材料費", "NT$", 100000000],
  ["staff", "實際人事費", "NT$", 100000000],
  ["venue", "實際場地費", "NT$", 100000000],
  ["other", "實際其他成本", "NT$", 100000000],
  ["hours", "實際工作時數", "小時", 100000],
  ["refund", "實際退費", "NT$", 100000000],
  ["satisfaction", "家長滿意度", "分／5", 5],
  ["returnRate", "願意再次報名比例", "%", 100],
] as const;
export function Records({
  p,
  records,
  onChange,
}: {
  p: Params;
  records: Actual[];
  onChange: (r: Actual[]) => void;
}) {
  const [draft, setDraft] = useState<Actual | null>(null),
    [error, setError] = useState(""),
    [pending, setPending] = useState<Actual[] | null>(null);
  const file = useRef<HTMLInputElement>(null);
  const save = () => {
    if (!draft) return;
    const v = actualSchema.safeParse(draft);
    if (!v.success) {
      setError(v.error.issues.map((e) => e.message).join("；"));
      return;
    }
    onChange(
      records.some((r) => r.id === draft.id)
        ? records.map((r) => (r.id === draft.id ? v.data : r))
        : [...records, v.data],
    );
    setDraft(null);
    setError("");
    toast.success("實際紀錄已儲存");
  };
  const totals = records.reduce(
    (s, r) => {
      const a = actualResult(r);
      return {
        revenue: s.revenue + a.revenue,
        cost: s.cost + a.cost,
        paid: s.paid + r.paid,
      };
    },
    { revenue: 0, cost: 0, paid: 0 },
  );
  return (
    <>
      <Note>
        每場紀錄保存獨立的預算快照，日後改動基本參數不會改寫歷史預算。實際貢獻以收入扣退費及實際支出計算，不扣假設準備金；人事費請包含實付規劃酬勞，餐費與保險可列入其他成本。
      </Note>
      <div className="toolbar">
        <div className="button-row">
          <Button
            onClick={() => {
              setDraft(blankActual(p));
              setError("");
            }}
          >
            <Plus data-icon="inline-start" />
            新增活動紀錄
          </Button>
          <Button variant="outline" onClick={() => file.current?.click()}>
            <Upload data-icon="inline-start" />
            匯入 CSV
          </Button>
          <Button
            variant="outline"
            onClick={() =>
              download(
                "science-camp-actuals.csv",
                exportCSV(records),
                "text/csv;charset=utf-8",
              )
            }
            disabled={!records.length}
          >
            <Download data-icon="inline-start" />
            匯出 CSV
          </Button>
        </div>
        <Button
          variant="ghost"
          onClick={() =>
            download(
              "science-camp-template.csv",
              exportCSV([
                {
                  ...blankActual(p),
                  name: "範例活動（請修改）",
                  registered: 20,
                  paid: 20,
                },
              ]),
              "text/csv;charset=utf-8",
            )
          }
        >
          下載 CSV 範本
        </Button>
        <input
          ref={file}
          type="file"
          accept=".csv,text/csv"
          className="sr-only"
          aria-label="選擇營運 CSV"
          onChange={async (e) => {
            const f = e.target.files?.[0];
            if (f) {
              try {
                if (f.size > 10 * 1024 * 1024) throw Error("檔案請小於 10 MB");
                setPending(importCSV(await f.text()));
                setError("");
              } catch (err) {
                setError(err instanceof Error ? err.message : "匯入失敗");
              }
            }
            e.target.value = "";
          }}
        />
      </div>
      {error && <Note warning>{error}</Note>}
      {pending && (
        <Panel
          title="確認匯入資料"
          description={`${pending.length} 筆通過欄位驗證；相同 ID 更新現有紀錄，其餘新增。`}
        >
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>活動</th>
                  <th>日期</th>
                  <th>付費人數</th>
                  <th>處理方式</th>
                </tr>
              </thead>
              <tbody>
                {pending.slice(0, 10).map((r) => (
                  <tr key={r.id}>
                    <td>{r.name}</td>
                    <td>{r.date}</td>
                    <td>{r.paid}</td>
                    <td>
                      {records.some((v) => v.id === r.id) ? "更新" : "新增"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {pending.length > 10 && <p>預覽前 10 筆，共 {pending.length} 筆。</p>}
          <div className="button-row mt-4">
            <Button
              onClick={() => {
                const map = new Map(records.map((r) => [r.id, r]));
                pending.forEach((r) => map.set(r.id, r));
                if (map.size > 5000) {
                  setError("合併後最多可保存 5,000 筆");
                  return;
                }
                onChange([...map.values()]);
                setPending(null);
                toast.success("CSV 匯入完成");
              }}
            >
              確認匯入
            </Button>
            <Button variant="outline" onClick={() => setPending(null)}>
              取消
            </Button>
          </div>
        </Panel>
      )}
      {draft && (
        <Panel
          title={
            records.some((r) => r.id === draft.id)
              ? "編輯活動紀錄"
              : "新增活動紀錄"
          }
          description="所有成本輸入整場總額，滿意度 0 代表未填寫。"
        >
          <FieldGroup className="record-fields">
            <Field>
              <FieldLabel htmlFor="record-name">活動名稱</FieldLabel>
              <Input
                id="record-name"
                value={draft.name}
                maxLength={100}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="record-date">活動日期</FieldLabel>
              <Input
                id="record-date"
                type="date"
                value={draft.date}
                onChange={(e) => setDraft({ ...draft, date: e.target.value })}
              />
            </Field>
            {actualFields.map(([key, label, unit, max]) => (
              <NumberField
                key={key}
                label={label}
                unit={unit}
                value={draft[key]}
                max={max}
                step={
                  ["satisfaction", "hours", "price"].includes(key) ? 0.1 : 1
                }
                onChange={(v) => setDraft({ ...draft, [key]: v })}
              />
            ))}
          </FieldGroup>
          <details className="settings-details">
            <summary>檢視／修改此活動的預算快照</summary>
            <ParamFields
              p={draft.expected}
              onChange={(v) => setDraft({ ...draft, expected: v })}
              keys={[
                "days",
                "students",
                "price",
                "lecturers",
                "assistants",
                "hours",
                "lecturerRate",
                "assistantRate",
                "venue",
                "equipment",
                "admin",
                "variable",
                "planning",
              ]}
            />
          </details>
          <div className="button-row mt-4">
            <Button onClick={save}>儲存紀錄</Button>
            <Button
              variant="outline"
              onClick={() => {
                setDraft(null);
                setError("");
              }}
            >
              取消
            </Button>
          </div>
        </Panel>
      )}
      <div className="metrics-grid four">
        <Stat label="已記錄活動" value={`${records.length} 場`} />
        <Stat label="實際淨收入" value={nt(totals.revenue)} />
        <Stat label="實際總成本" value={nt(totals.cost)} />
        <Stat
          label="實際活動貢獻"
          value={nt(totals.revenue - totals.cost)}
          positive
          negative={totals.revenue < totals.cost}
        />
      </div>
      <Panel
        title="活動紀錄與預算差異"
        description="預算差異 = 實際成本 − 預算成本；正值表示超支。活動貢獻不含年度公司固定支出。"
      >
        {records.length === 0 ? (
          <div className="empty-state">
            <h3>等待第一場真實的科學實驗</h3>
            <p>新增付費測試的紀錄，開始把假設與實際成果放在一起比較。</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>活動／日期</th>
                  <th>報名／付費</th>
                  <th>淨收入</th>
                  <th>實際貢獻</th>
                  <th>預算差異</th>
                  <th>貢獻差異</th>
                  <th>招生達成率</th>
                  <th>滿意度／再報名</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r) => {
                  const a = actualResult(r);
                  return (
                    <tr key={r.id}>
                      <th>
                        {r.name}
                        <small className="block muted">{r.date}</small>
                      </th>
                      <td>
                        {r.registered} / {r.paid}
                      </td>
                      <td>{nt(a.revenue)}</td>
                      <td
                        className={a.contribution < 0 ? "negative" : "positive"}
                      >
                        {nt(a.contribution)}
                      </td>
                      <td className={a.budgetVariance > 0 ? "negative" : ""}>
                        {nt(a.budgetVariance)}
                      </td>
                      <td>{nt(a.contributionVariance)}</td>
                      <td>
                        {a.enrollment === null
                          ? "未設定預估人數"
                          : `${a.enrollment.toFixed(1)}%`}
                      </td>
                      <td>
                        {r.satisfaction || "未填"} / {r.returnRate}%
                      </td>
                      <td>
                        <div className="button-row">
                          <Button
                            variant="ghost"
                            aria-label={`編輯 ${r.name}`}
                            onClick={() => {
                              setDraft({ ...r, expected: { ...r.expected } });
                              setError("");
                            }}
                          >
                            <Pencil />
                          </Button>
                          <Button
                            variant="ghost"
                            aria-label={`刪除 ${r.name}`}
                            onClick={() => {
                              if (window.confirm(`刪除「${r.name}」的紀錄？`))
                                onChange(records.filter((v) => v.id !== r.id));
                            }}
                          >
                            <Trash2 />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </>
  );
}
