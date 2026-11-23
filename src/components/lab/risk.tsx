"use client";
import { type RiskSettings } from "@/lib/state";
import { Panel, Note, NumberField, Stat } from "./common";
import { FieldGroup } from "@/components/ui/field";
import { MoneyChart } from "./charts";
import { annual, camp, nt, money, type Params } from "@/lib/finance";
export function Risk({
  p,
  value,
  onChange,
}: {
  p: Params;
  value: RiskSettings;
  onChange: (r: RiskSettings) => void;
}) {
  const {
    price,
    students,
    discount,
    venueRise,
    materialRise,
    assistants,
    cancelled,
    sunk,
    replacement,
    missing,
  } = value;
  const setter = (key: keyof RiskSettings) => (n: number) =>
    onChange({ ...value, [key]: n });
  const setPrice = setter("price"),
    setStudents = setter("students"),
    setDiscount = setter("discount"),
    setVenueRise = setter("venueRise"),
    setMaterialRise = setter("materialRise"),
    setAssistants = setter("assistants"),
    setCancelled = setter("cancelled"),
    setSunk = setter("sunk"),
    setReplacement = setter("replacement"),
    setMissing = setter("missing");
  const base = annual(p),
    preview = annual({ ...p, price, students });
  const prices = Array.from({ length: 7 }, (_, i) =>
    Math.max(0, money(price + (i - 3) * 200)),
  );
  const counts = Array.from({ length: 7 }, (_, i) =>
    Math.max(0, students + (i - 3) * 3),
  );
  const occupancy = [50, 60, 70, 80, 90, 100].map((rate) => {
    const paid = Math.floor((p.capacity * rate) / 100);
    return { rate: `${rate}%`, paid, ...annual({ ...p, students: paid }) };
  });
  const scenarios = [
    {
      name: "招生不足（容量 50%）",
      value: annual({ ...p, students: Math.floor(p.capacity * 0.5) }).retained,
      detail: `實際付費 ${Math.floor(p.capacity * 0.5)} 人／場`,
    },
    {
      name: "早鳥優惠",
      value: annual({ ...p, price: money(p.price * (1 - discount / 100)) })
        .retained,
      detail: `平均實收減少 ${discount}%`,
    },
    {
      name: "場地費增加",
      value: annual({ ...p, venue: money(p.venue * (1 + venueRise / 100)) })
        .retained,
      detail: `場地成本增加 ${venueRise}%`,
    },
    {
      name: "材料費增加",
      value: annual({
        ...p,
        variable: money(p.variable * (1 + materialRise / 100)),
      }).retained,
      detail: `學生每日變動成本增加 ${materialRise}%`,
    },
    {
      name: "助教需求增加",
      value: annual({ ...p, assistants: p.assistants + assistants }).retained,
      detail: `每場增加 ${assistants} 位助教`,
    },
    {
      name: "取消或全額退費",
      value: money(
        annual({ ...p, events: Math.max(0, p.events - cancelled) }).retained -
          Math.min(cancelled, p.events) * sunk,
      ),
      detail: `取消 ${Math.min(cancelled, p.events)} 場；每場不可回收成本 ${nt(sunk)}`,
    },
    {
      name: "核心成員無法出席",
      value: money(base.retained - replacement * p.events),
      detail: `每場替補額外成本 ${nt(replacement)}`,
    },
    {
      name: "淡季場數不足",
      value: annual({ ...p, events: Math.max(0, p.events - missing) }).retained,
      detail: `減少 ${Math.min(missing, p.events)} 場，不計額外取消損失`,
    },
  ];
  return (
    <>
      <Note>
        以下均為假設模型，不是市場實測數據。招生率以「教室容量 {p.capacity}{" "}
        人」為上限，付費人數向下取整；各風險單獨發生，不直接相加。
      </Note>
      <div className="two-col">
        <Panel
          title="收費 × 招生人數"
          description="調整中心值，檢查周圍條件的年度留存"
        >
          <FieldGroup className="parameter-grid">
            <NumberField
              slider
              label="熱力圖中心收費"
              value={price}
              max={20000}
              step={100}
              unit="NT$"
              onChange={setPrice}
            />
            <NumberField
              slider
              label="熱力圖中心人數"
              value={students}
              max={100}
              unit="人"
              onChange={setStudents}
            />
          </FieldGroup>
          <div className="metrics-grid mt-6">
            <Stat
              label="目前組合年度留存"
              value={nt(preview.retained)}
              positive
              negative={preview.retained < 0}
            />
            <Stat
              label="目前組合單場貢獻"
              value={nt(camp({ ...p, price, students }).retained)}
            />
          </div>
          {students > p.capacity && (
            <Note warning>目前人數超過教室容量，僅供財務試算。</Note>
          )}
        </Panel>
        <Panel
          title="損益熱力圖"
          description="每格為年度留存；＋為正、−為負，＊表示超過容量。"
        >
          <div className="table-wrap heatmap">
            <table>
              <thead>
                <tr>
                  <th>人數＼收費</th>
                  {prices.map((v, i) => (
                    <th key={i}>{v.toLocaleString()}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {counts.map((n, i) => (
                  <tr key={i}>
                    <th>
                      {n} 人{n > p.capacity ? "＊" : ""}
                    </th>
                    {prices.map((v, j) => {
                      const r = annual({
                        ...p,
                        students: n,
                        price: v,
                      }).retained;
                      return (
                        <td
                          key={j}
                          className={r >= 0 ? "heat-positive" : "heat-negative"}
                          title={nt(r)}
                        >
                          {r >= 0 ? "+" : ""}
                          {Math.round(r / 1000)}k
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="muted mt-3">
            k = 千元；完整金額可見下方敏感度表。固定支出與風險準備均已納入。
          </p>
        </Panel>
      </div>
      <Panel title="招生率敏感度" description="招生上限與實際付費人數分開呈現">
        <MoneyChart
          data={occupancy}
          x="rate"
          series={[
            { key: "revenue", name: "營收", color: "#163b5a" },
            { key: "retained", name: "年度留存", color: "#159c8f" },
          ]}
        />
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>假設招生率</th>
                <th>容量</th>
                <th>付費人數／場</th>
                <th>年度營收</th>
                <th>年度留存</th>
              </tr>
            </thead>
            <tbody>
              {occupancy.map((v) => (
                <tr key={v.rate}>
                  <td>{v.rate}</td>
                  <td>{p.capacity}</td>
                  <td>{v.paid}</td>
                  <td>{nt(v.revenue)}</td>
                  <td className={v.retained < 0 ? "negative" : "positive"}>
                    {nt(v.retained)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
      <Panel
        title="風險壓力測試"
        description="調整衝擊幅度，與基本參數下的年度留存比較"
      >
        <FieldGroup className="risk-fields">
          <NumberField
            label="平均收費折扣"
            value={discount}
            max={100}
            unit="%"
            onChange={setDiscount}
          />
          <NumberField
            label="場地費增幅"
            value={venueRise}
            max={500}
            unit="%"
            onChange={setVenueRise}
          />
          <NumberField
            label="學生變動成本增幅"
            value={materialRise}
            max={500}
            unit="%"
            onChange={setMaterialRise}
          />
          <NumberField
            label="每場增加助教"
            value={assistants}
            max={20}
            unit="人"
            onChange={setAssistants}
          />
          <NumberField
            label="取消場數"
            value={cancelled}
            max={10000}
            unit="場"
            onChange={setCancelled}
          />
          <NumberField
            label="取消後每場不可回收成本"
            value={sunk}
            unit="NT$"
            onChange={setSunk}
          />
          <NumberField
            label="每場替補成本"
            value={replacement}
            unit="NT$"
            onChange={setReplacement}
          />
          <NumberField
            label="淡季減少場數"
            value={missing}
            max={10000}
            unit="場"
            onChange={setMissing}
          />
        </FieldGroup>
        <div className="table-wrap mt-6">
          <table>
            <thead>
              <tr>
                <th>風險</th>
                <th>假設</th>
                <th>年度留存</th>
                <th>與原模型差異</th>
              </tr>
            </thead>
            <tbody>
              {scenarios.map((s) => (
                <tr key={s.name}>
                  <th>{s.name}</th>
                  <td>{s.detail}</td>
                  <td className={s.value < 0 ? "negative" : ""}>
                    {nt(s.value)}
                  </td>
                  <td>{nt(money(s.value - base.retained))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="muted mt-4">
          材料費以「教材、餐費與保險」合計變動成本做代理。取消情境假設全額退費、未發生的成本可避免，只保留指定的不可回收成本；部分退費請在實際紀錄輸入。
        </p>
      </Panel>
    </>
  );
}
