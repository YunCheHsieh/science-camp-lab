import Papa from "papaparse";
import { actualSchema } from "./state";
import { type Actual } from "./finance";
const columns = [
  "id",
  "name",
  "date",
  "registered",
  "paid",
  "price",
  "materials",
  "staff",
  "venue",
  "other",
  "hours",
  "refund",
  "satisfaction",
  "returnRate",
  "expected",
] as const;
export function exportCSV(records: Actual[]) {
  return (
    "\uFEFF" +
    Papa.unparse(
      records.map((r) => ({ ...r, expected: JSON.stringify(r.expected) })),
      { columns: [...columns], escapeFormulae: true },
    )
  );
}
export function importCSV(text: string): Actual[] {
  const parsed = Papa.parse<Record<string, string>>(
    text.replace(/^\uFEFF/, ""),
    { header: true, skipEmptyLines: "greedy" },
  );
  if (parsed.errors.length)
    throw Error(`CSV 格式錯誤：${parsed.errors[0].message}`);
  if (!columns.every((c) => parsed.meta.fields?.includes(c)))
    throw Error("欄位不完整，請使用「下載 CSV 範本」的格式。");
  if (parsed.data.length === 0) throw Error("CSV 沒有資料列。");
  if (parsed.data.length > 5000) throw Error("單次最多匯入 5,000 筆。");
  const ids = new Set<string>();
  return parsed.data.map((row, i) => {
    try {
      const value: Record<string, unknown> = { ...row };
      for (const c of columns)
        if (!["id", "name", "date", "expected"].includes(c)) {
          if (row[c].trim() === "") throw Error("數值欄位不可留白");
          value[c] = Number(row[c]);
        }
      if (row.name.startsWith("'") && /^[=+\-@\t\r]/.test(row.name.slice(1)))
        value.name = row.name.slice(1);
      value.expected = JSON.parse(row.expected);
      value.id = row.id || crypto.randomUUID();
      const valid = actualSchema.parse(value);
      if (ids.has(valid.id)) throw Error("檔案內有重複 ID");
      ids.add(valid.id);
      return valid;
    } catch (e) {
      throw Error(
        `第 ${i + 2} 列無法匯入：${e instanceof Error ? e.message : "資料格式不符"}`,
      );
    }
  });
}
export function download(
  name: string,
  content: string,
  type = "application/json;charset=utf-8",
) {
  const a = document.createElement("a");
  const url = URL.createObjectURL(new Blob([content], { type }));
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
