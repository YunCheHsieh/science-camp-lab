"use client";
import { fields } from "@/lib/state";
import { camp, annual, breakEven, count, nt, type Params } from "@/lib/finance";
import {
  Panel,
  ParamFields,
  PlanningSwitch,
  Note,
  Stat,
  FinanceTable,
} from "./common";
export function Parameters({
  p,
  onChange,
}: {
  p: Params;
  onChange: (p: Params) => void;
}) {
  const c = camp(p);
  return (
    <>
      <Note>
        每個數值都可用滑桿或輸入框調整。基本參數用於快速模擬與新增方案；年度排程、三組情境保留各自設定。
      </Note>
      <div className="two-col">
        {Array.from(new Set(fields.map((f) => f.group))).map((group) => (
          <Panel key={group} title={group}>
            <ParamFields
              p={p}
              onChange={onChange}
              keys={fields.filter((f) => f.group === group).map((f) => f.key)}
            />
            {group === "酬勞與準備金" && (
              <PlanningSwitch p={p} onChange={onChange} />
            )}
          </Panel>
        ))}
        <Panel title="單場成本試算" description="所有模組共用相同純函式">
          <FinanceTable
            rows={[
              ["講師成本", nt(c.lecturer)],
              ["助教成本", nt(c.assistant)],
              ["學生變動成本", nt(c.students)],
              ["直接成本合計", nt(c.direct)],
              ["另付規劃酬勞", nt(c.planning)],
              ["風險準備金", nt(c.reserve)],
              ["單場預估留存", nt(c.retained)],
            ]}
          />
        </Panel>
      </div>
      {(p.students > p.capacity ||
        p.ideal > p.capacity ||
        p.minimum > p.capacity) && (
        <Note warning>
          招生設定超過教室容量 {p.capacity} 人，請調整招生人數或場地容量。
        </Note>
      )}
      {p.students < p.minimum && (
        <Note warning>
          目前招生 {p.students} 人低於設定的最低開班人數 {p.minimum} 人。
        </Note>
      )}
    </>
  );
}
export function BreakEven({
  p,
  onChange,
}: {
  p: Params;
  onChange: (p: Params) => void;
}) {
  const b = breakEven(p),
    t = annual(p);
  return (
    <>
      <Note>
        以下損益兩平採「扣除風險準備後的留存」為基準，包含規劃酬勞與全年固定支出。學生需求將全年固定支出平均分攤至{" "}
        {p.events} 場；場數需求則重新分攤全年固定支出。
      </Note>
      <div className="metrics-grid">
        <Stat
          label="每場最低損益兩平人數"
          value={count(b.students, "人")}
          note="向上取整 · 含固定成本分攤"
        />
        <Stat
          label="最低每人收費"
          value={b.price === null ? "無法達成" : nt(b.price)}
          note={`每場 ${p.students} 人 · 價格向上取到分`}
        />
        <Stat
          label="全年最低辦理場數"
          value={count(b.events)}
          note="固定支出為 0 時，0 場即為不虧損"
        />
        <Stat
          label="指定場數的平均招生需求"
          value={count(b.annualStudents, "人")}
          note={`依年度 ${p.events} 場計算`}
        />
        <Stat
          label="達成目標所需場數"
          value={count(b.targetEvents)}
          note={`目標留存 ${nt(p.target)}`}
        />
        <Stat
          label="每增加一場的貢獻"
          value={nt(b.contribution)}
          positive
          negative={b.contribution <= 0}
          note="扣除單場成本、酬勞及風險準備"
        />
      </div>
      {b.contribution <= 0 && (
        <Note warning>
          目前定價與成本結構無法透過增加場數達成損益兩平。請提高平均實收、改善招生或降低單場成本。
        </Note>
      )}
      {b.overCapacity && (
        <Note warning>
          最低招生需求 {b.students} 人超過教室容量 {p.capacity}{" "}
          人，此方案目前無法執行。
        </Note>
      )}
      {p.events === 0 && (
        <Note warning>
          年度場數為 0 時，無法分攤有固定支出的年度成本；請先設定辦理場數。
        </Note>
      )}
      <div className="two-col">
        <Panel title="調整招生與年度目標">
          <ParamFields
            p={p}
            onChange={onChange}
            keys={[
              "events",
              "price",
              "students",
              "minimum",
              "ideal",
              "capacity",
              "target",
            ]}
          />
        </Panel>
        <Panel title="把數字轉成開班決策">
          <div className="decision">
            <h3>先確認可以開，再確認值得開。</h3>
            <p>
              設定最低開班 {p.minimum} 人、理想招生 {p.ideal}{" "}
              人。建議以模型需求與最低開班人數中的較高者作為開班門檻。
            </p>
            <strong>
              {b.students === null
                ? "目前條件無可行開班門檻"
                : `建議至少 ${Math.max(b.students, p.minimum)} 人`}
            </strong>
            <p>
              目前年度預估留存 {nt(t.retained)}。
              {t.retained >= p.target
                ? "已達設定的年度留存目標。"
                : `距離年度目標仍差 ${nt(p.target - t.retained)}。`}
            </p>
            <p>
              0 場損益兩平只代表沒有固定成本負擔，不代表不辦營隊也能創造收入。
            </p>
          </div>
        </Panel>
      </div>
    </>
  );
}
