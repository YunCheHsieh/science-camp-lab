"use client";
import { useState } from "react";
import { Plus, Trash2, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldLabel, FieldGroup } from "@/components/ui/field";
import { Badge } from "@/components/ui/badge";
import { Panel, NumberField, Note, Stat } from "./common";
import { MoneyChart } from "./charts";
import {
  makeBatch,
  monthResult,
  scheduleResult,
  nt,
  type Params,
  type Month,
  type Batch,
} from "@/lib/finance";
export function Schedule({
  p,
  months,
  onChange,
}: {
  p: Params;
  months: Month[];
  onChange: (m: Month[]) => void;
}) {
  const [selected, setSelected] = useState(0);
  const m = months[selected],
    r = monthResult(m, p),
    all = scheduleResult(months, p);
  const update = (next: Month) =>
    onChange(months.map((v, i) => (i === selected ? next : v)));
  const edit = (id: string, patch: Partial<Batch>) =>
    update({
      ...m,
      batches: m.batches.map((b) => (b.id === id ? { ...b, ...patch } : b)),
    });
  return (
    <>
      <div className="metrics-grid four">
        <Stat
          label="年度總場數"
          value={`${all.total.events} 場`}
          note={`${all.total.days} 個教室使用日`}
        />
        <Stat label="年度營收" value={nt(all.total.revenue)} />
        <Stat label="年度總成本" value={nt(all.total.cost)} />
        <Stat
          label="年度預估留存"
          value={nt(all.total.retained)}
          positive
          negative={all.total.retained < 0}
        />
      </div>
      <Note>
        各月可新增不同方案與梯次，所有年度數值由月份加總。寒暑假只是季節標示，不代表滿班。每筆方案的「場數」代表相同設定的重複梯次；需不同設定時請拆成新方案。
      </Note>
      <div className="month-strip" aria-label="選擇月份">
        {months.map((month, i) => {
          const mr = monthResult(month, p);
          return (
            <button
              key={i}
              className={selected === i ? "month active" : "month"}
              aria-pressed={selected === i}
              onClick={() => setSelected(i)}
            >
              <strong>{i + 1} 月</strong>
              <span>{mr.events} 場</span>
              {mr.capacityWarning && <span className="negative">超出容量</span>}
            </button>
          );
        })}
      </div>
      <Panel
        title={`${m.month} 月營隊計畫`}
        description={
          m.month <= 2
            ? "寒假旺季 · 可自由調整"
            : m.month === 7 || m.month === 8
              ? "暑假旺季 · 可自由調整"
              : "學期間 · 可自由調整"
        }
        action={
          <Button
            onClick={() =>
              update({
                ...m,
                batches: [...m.batches, makeBatch(p, crypto.randomUUID())],
              })
            }
          >
            <Plus data-icon="inline-start" />
            新增方案
          </Button>
        }
      >
        <div className="batch-list">
          {m.batches.length === 0 && (
            <div className="empty-state">
              <h3>這個月還沒有安排營隊</h3>
              <p>新增方案，設定課程與梯次。沒有開班的月份仍會計入固定支出。</p>
            </div>
          )}
          {m.batches.map((b, i) => (
            <section className="batch" key={b.id}>
              <div className="batch-heading">
                <Badge variant="secondary">方案 {i + 1}</Badge>
                <div className="button-row">
                  <Button
                    variant="ghost"
                    aria-label={`複製方案 ${i + 1}`}
                    onClick={() =>
                      update({
                        ...m,
                        batches: [
                          ...m.batches,
                          {
                            ...b,
                            id: crypto.randomUUID(),
                            name: b.name + "（複製）",
                          },
                        ],
                      })
                    }
                  >
                    <Copy />
                  </Button>
                  <Button
                    variant="ghost"
                    aria-label={`刪除方案 ${i + 1}`}
                    onClick={() =>
                      update({
                        ...m,
                        batches: m.batches.filter((v) => v.id !== b.id),
                      })
                    }
                  >
                    <Trash2 />
                  </Button>
                </div>
              </div>
              <FieldGroup className="batch-fields">
                <Field>
                  <FieldLabel htmlFor={`batch-${b.id}`}>
                    課程／梯次名稱
                  </FieldLabel>
                  <Input
                    id={`batch-${b.id}`}
                    value={b.name}
                    maxLength={100}
                    onChange={(e) => edit(b.id, { name: e.target.value })}
                  />
                </Field>
                {(
                  [
                    ["events", "場數", "場", 100],
                    ["days", "每場天數", "天", 365],
                    ["students", "每場學生", "人", 10000],
                    ["price", "每人收費", "NT$", 1000000],
                    ["lecturers", "講師", "人", 100],
                    ["assistants", "助教", "人", 100],
                    ["extra", "每場額外支出", "NT$", 10000000],
                  ] as const
                ).map(([key, label, unit, max]) => (
                  <NumberField
                    key={key}
                    label={label}
                    unit={unit}
                    max={max}
                    value={b[key]}
                    onChange={(v) => edit(b.id, { [key]: v })}
                  />
                ))}
              </FieldGroup>
              <p className="muted">
                {b.events === 0
                  ? "此方案暫不開班"
                  : `${b.events} 梯次 · 每梯 ${b.days} 天 · ${b.lecturers + b.assistants} 位教學人員`}
                {b.students > p.capacity && (
                  <span className="negative">
                    {" "}
                    · 招生超過容量 {p.capacity} 人
                  </span>
                )}
              </p>
            </section>
          ))}
        </div>
      </Panel>
      <div className="two-col">
        <Panel
          title="本月執行容量"
          description="採保守估算：每個可用週末提供 2 個教室日；人力以可投入的總人日計算。"
        >
          <FieldGroup className="parameter-grid">
            <NumberField
              label="可用週末"
              value={m.weekends}
              max={5}
              unit="個"
              onChange={(v) => update({ ...m, weekends: v })}
            />
            <NumberField
              label="可用教室"
              value={m.rooms}
              max={100}
              unit="間"
              onChange={(v) => update({ ...m, rooms: v })}
            />
            <NumberField
              label="團隊可用總人日"
              value={m.personDays}
              max={100000}
              unit="人日"
              onChange={(v) => update({ ...m, personDays: v })}
            />
          </FieldGroup>
          <p className="muted mt-4">
            需求：{r.days} / {r.classroomDays} 教室日，{r.personDays} /{" "}
            {m.personDays} 人日。此為總量檢查，未驗證具體日期的師資衝突。
          </p>
          {r.capacityWarning && (
            <Note warning>
              本月超出教室、人力或招生容量。請減少梯次或增加可用資源。
            </Note>
          )}
        </Panel>
        <Panel title={`${m.month} 月財務預測`}>
          <div className="metrics-grid">
            <Stat label="營收" value={nt(r.revenue)} />
            <Stat label="成本（含月固定支出）" value={nt(r.cost)} />
            <Stat label="未扣準備金的營運結餘" value={nt(r.operating)} />
            <Stat
              label="預估留存"
              value={nt(r.retained)}
              positive
              negative={r.retained < 0}
            />
          </div>
        </Panel>
      </div>
      <Panel title="月營收與成本">
        <MoneyChart data={all.monthly} />
      </Panel>
      <div className="two-col">
        <Panel title="月結餘走勢">
          <MoneyChart
            kind="line"
            data={all.monthly}
            series={[
              { key: "operating", name: "營運結餘", color: "#163b5a" },
              { key: "retained", name: "預估留存", color: "#159c8f" },
            ]}
          />
        </Panel>
        <Panel
          title="年度累積可動用現金流"
          description="期初為 0；假設當月收付款，扣除準備金。未模擬預收款或付款時差。"
        >
          <MoneyChart
            kind="area"
            data={all.monthly}
            series={[{ key: "cumulative", name: "累積留存", color: "#159c8f" }]}
          />
        </Panel>
      </div>
      <Panel title="全年逐月明細">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>月份</th>
                <th>場數</th>
                <th>營收</th>
                <th>成本</th>
                <th>營運結餘</th>
                <th>準備金</th>
                <th>留存</th>
              </tr>
            </thead>
            <tbody>
              {all.monthly.map((v) => (
                <tr key={v.month}>
                  <th>{v.month}</th>
                  <td>{v.events}</td>
                  {(
                    [
                      "revenue",
                      "cost",
                      "operating",
                      "reserve",
                      "retained",
                    ] as const
                  ).map((k) => (
                    <td key={k} className="numeric">
                      {nt(v[k])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </>
  );
}
