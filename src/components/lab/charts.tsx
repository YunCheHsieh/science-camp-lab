"use client";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
  AreaChart,
  Area,
  ReferenceLine,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { nt } from "@/lib/finance";
const colors = [
  "#163b5a",
  "#159c8f",
  "#96d3cf",
  "#8595a8",
  "#b9cfdf",
  "#d8e4ed",
];
const tick = { fontSize: 12, fill: "#64748b" };
const format = (v: unknown) => nt(Number(v));
type Datum = { [key: string]: string | number | boolean };
export function MoneyChart({
  data,
  kind = "bar",
  series = [
    { key: "revenue", name: "營收", color: colors[0] },
    { key: "cost", name: "成本", color: colors[2] },
  ],
  x = "month",
}: {
  data: Datum[];
  kind?: "bar" | "line" | "area";
  series?: { key: string; name: string; color: string }[];
  x?: string;
}) {
  const axes = (
    <>
      <CartesianGrid strokeDasharray="3 4" vertical={false} stroke="#e7edf3" />
      <XAxis
        dataKey={x}
        tick={tick}
        axisLine={false}
        tickLine={false}
        minTickGap={8}
      />
      <YAxis
        tick={tick}
        axisLine={false}
        tickLine={false}
        width={56}
        tickFormatter={(n) =>
          Math.abs(n) >= 1000 ? `${Number((n / 1000).toFixed(1))}k` : String(n)
        }
      />
      <Tooltip
        formatter={format}
        contentStyle={{
          border: "1px solid #dce4ed",
          borderRadius: 10,
          fontSize: 13,
        }}
      />
      <Legend wrapperStyle={{ fontSize: 13, paddingTop: 12 }} />
      <ReferenceLine y={0} stroke="#b9c8d6" />
    </>
  );
  return (
    <div
      className="chart"
      role="img"
      aria-label={`${series.map((s) => s.name).join("、")}圖表，單位新臺幣`}
    >
      <ResponsiveContainer width="100%" height="100%">
        {kind === "bar" ? (
          <BarChart
            data={data}
            margin={{ top: 12, right: 8, left: 0, bottom: 0 }}
          >
            {axes}
            {series.map((s) => (
              <Bar
                key={s.key}
                dataKey={s.key}
                name={s.name}
                fill={s.color}
                radius={[4, 4, 0, 0]}
                maxBarSize={34}
                isAnimationActive={false}
              />
            ))}
          </BarChart>
        ) : kind === "line" ? (
          <LineChart data={data}>
            {axes}
            {series.map((s) => (
              <Line
                key={s.key}
                type="monotone"
                dataKey={s.key}
                name={s.name}
                stroke={s.color}
                strokeWidth={2.5}
                dot={{ r: 3 }}
                isAnimationActive={false}
              />
            ))}
          </LineChart>
        ) : (
          <AreaChart data={data}>
            {axes}
            {series.map((s) => (
              <Area
                key={s.key}
                type="monotone"
                dataKey={s.key}
                name={s.name}
                stroke={s.color}
                fill={s.color}
                fillOpacity={0.1}
                strokeWidth={2.5}
                isAnimationActive={false}
              />
            ))}
          </AreaChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}
export function Allocation({
  data,
  total,
}: {
  data: { name: string; value: number }[];
  total: number;
}) {
  return (
    <div className="allocation">
      <div className="donut">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data.filter((d) => d.value > 0)}
              dataKey="value"
              innerRadius="68%"
              outerRadius="92%"
              startAngle={90}
              endAngle={-270}
              strokeWidth={3}
              isAnimationActive={false}
            >
              {data
                .filter((d) => d.value > 0)
                .map((d, i) => (
                  <Cell key={d.name} fill={colors[i % colors.length]} />
                ))}
            </Pie>
            <Tooltip formatter={format} />
          </PieChart>
        </ResponsiveContainer>
        <div className="donut-center">
          <small>單場營收</small>
          <strong>{nt(total)}</strong>
        </div>
      </div>
      <div className="chart-legend">
        {data.map((d, i) => (
          <div key={d.name}>
            <span>
              <i style={{ background: colors[i % colors.length] }} />
              {d.name}
            </span>
            <b>{nt(d.value)}</b>
          </div>
        ))}
      </div>
    </div>
  );
}
