"use client";
import { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import {
  FlaskConical,
  LayoutDashboard,
  SlidersHorizontal,
  ChartNoAxesCombined,
  CalendarDays,
  Layers,
  TriangleAlert,
  Route,
  ClipboardList,
  Building2,
  FileText,
  Menu,
  CheckCircle2,
  Download,
  Upload,
  RotateCcw,
  ChevronRight,
  GraduationCap,
} from "lucide-react";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Note } from "./common";
import { Dashboard } from "./dashboard";
import { Parameters, BreakEven } from "./parameters";
import { initialState, fullStateSchema, type AppState } from "@/lib/state";
import { useStore } from "@/lib/use-store";
import { download } from "@/lib/csv";
import { type Params } from "@/lib/finance";
const Schedule = dynamic(() => import("./schedule").then((m) => m.Schedule));
const Comparison = dynamic(() =>
  import("./comparison").then((m) => m.Comparison),
);
const Roadmap = dynamic(() => import("./roadmap").then((m) => m.Roadmap));
const Risk = dynamic(() => import("./risk").then((m) => m.Risk));
const Records = dynamic(() => import("./records").then((m) => m.Records));
const CompanyView = dynamic(() =>
  import("./company").then((m) => m.CompanyView),
);
const Report = dynamic(() => import("./report").then((m) => m.Report));
const pages = [
  {
    id: "overview",
    label: "營運總覽",
    icon: LayoutDashboard,
    description: "從第一場營隊，開始驗證你的想法。",
  },
  {
    id: "params",
    label: "營隊參數",
    icon: SlidersHorizontal,
    description: "把營隊的每一個假設，變成可以調整的數字。",
  },
  {
    id: "breakeven",
    label: "損益兩平",
    icon: ChartNoAxesCombined,
    description: "需要多少學生、多少場次，才能讓計畫持續？",
  },
  {
    id: "schedule",
    label: "年度排程",
    icon: CalendarDays,
    description: "安排每一場科學探索，也為團隊保留足夠的空間。",
  },
  {
    id: "comparison",
    label: "情境比較",
    icon: Layers,
    description: "把保守、基準與積極的可能性，放在同一張桌上。",
  },
  {
    id: "risk",
    label: "風險分析",
    icon: TriangleAlert,
    description: "在投入之前，先看看事情不如預期時會發生什麼。",
  },
  {
    id: "roadmap",
    label: "試營運路線圖",
    icon: Route,
    description: "把創業想法，拆成今天就能完成的小步驟。",
  },
  {
    id: "records",
    label: "實際紀錄",
    icon: ClipboardList,
    description: "記下真實的收入與回饋，讓下一次決策更有依據。",
  },
  {
    id: "company",
    label: "公司化評估",
    icon: Building2,
    description: "從學生團隊到正式營運，還需要跨過哪些門檻？",
  },
  {
    id: "report",
    label: "結果報告",
    icon: FileText,
    description: "整理你的假設與結果，帶到下一次團隊討論。",
  },
];
export default function Lab() {
  const { state, setState, ready, storageError } = useStore();
  const [page, setPage] = useState("overview"),
    [open, setOpen] = useState(false);
  const restore = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const sync = () => {
      const h = location.hash.slice(1);
      if (pages.some((p) => p.id === h)) setPage(h);
    };
    sync();
    window.addEventListener("hashchange", sync);
    window.addEventListener("popstate", sync);
    return () => {
      window.removeEventListener("hashchange", sync);
      window.removeEventListener("popstate", sync);
    };
  }, []);
  const navigate = (id: string) => {
    setPage(id);
    window.history.pushState(null, "", `#${id}`);
    setOpen(false);
    window.scrollTo({ top: 0, behavior: "instant" });
  };
  const updateParams = (params: Params) => setState((s) => ({ ...s, params }));
  const toggleTask = (id: string, v: boolean) =>
    setState((s) => ({ ...s, tasks: { ...s.tasks, [id]: v } }));
  const mode = (v: string[]) => {
    const m = v[0];
    if (m !== "student" && m !== "company") return;
    setState((s) => ({
      ...s,
      mode: m,
      params: {
        ...s.params,
        monthlyFixed: m === "company" ? 125000 : 0,
        planningInSalary: m === "company",
      },
    }));
    toast.success(
      m === "company" ? "已套用公司固定支出與薪資設定" : "已套用學生試營運設定",
    );
  };
  const current = pages.find((p) => p.id === page)!;
  const nav = (
    <nav aria-label="主要功能">
      {pages.map((p) => (
        <a
          key={p.id}
          href={`#${p.id}`}
          className={page === p.id ? "nav-item selected" : "nav-item"}
          aria-current={page === p.id ? "page" : undefined}
          onClick={(e) => {
            e.preventDefault();
            navigate(p.id);
          }}
        >
          <p.icon strokeWidth={1.8} />
          <span>{p.label}</span>
        </a>
      ))}
    </nav>
  );
  const backup = (
    <div className="backup-actions">
      <Button
        variant="ghost"
        onClick={() =>
          download("science-camp-backup.json", JSON.stringify(state, null, 2))
        }
      >
        <Download data-icon="inline-start" />
        備份
      </Button>
      <Button variant="ghost" onClick={() => restore.current?.click()}>
        <Upload data-icon="inline-start" />
        還原
      </Button>
      <Button
        variant="ghost"
        aria-label="重設所有資料"
        onClick={() => {
          if (
            window.confirm(
              "將重設所有參數、排程、情境、路線圖與實際紀錄。建議先下載備份，確定重設？",
            )
          ) {
            setState(initialState());
            toast.success("已恢復預設值");
          }
        }}
      >
        <RotateCcw />
      </Button>
    </div>
  );
  return (
    <>
      <a className="skip-link" href="#main">
        跳到主要內容
      </a>
      <aside className="sidebar no-print">
        <div className="brand">
          <div className="brand-icon">
            <FlaskConical />
          </div>
          <div>
            <strong>Science Camp Lab</strong>
            <span>科普營隊營運模擬平台</span>
          </div>
        </div>
        <div className="workspace-label">團隊工作空間</div>
        {nav}
        <div className="sidebar-bottom">
          <div className="brand-note">
            <GraduationCap />
            <p>
              把科學熱情，
              <br />
              變成可持續的營運。
            </p>
            <small>從學生試營運開始</small>
          </div>
          {backup}
        </div>
      </aside>
      <div className="workspace">
        <header className="topbar no-print">
          <div className="breadcrumb">
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon"
                    className="mobile-menu"
                    aria-label="開啟導覽選單"
                  />
                }
              >
                <Menu />
              </SheetTrigger>
              <SheetContent side="left">
                <SheetHeader>
                  <SheetTitle>Science Camp Lab</SheetTitle>
                  <SheetDescription>科普營隊營運模擬平台</SheetDescription>
                </SheetHeader>
                {nav}
                {backup}
              </SheetContent>
            </Sheet>
            <span>工作空間</span>
            <ChevronRight />
            <strong>{current.label}</strong>
          </div>
          <span className={`save-status ${storageError ? "negative" : ""}`}>
            <CheckCircle2 />
            {!ready
              ? "載入設定中"
              : storageError
                ? "請手動備份"
                : "本機自動儲存"}
          </span>
        </header>
        <main id="main">
          <div className="page-heading no-print">
            <div>
              <h1>{current.label}</h1>
              <p>{current.description}</p>
            </div>
            <div className="heading-actions">
              <ToggleGroup
                value={[state.mode]}
                onValueChange={mode}
                spacing={0}
                variant="outline"
                aria-label="營運模式"
              >
                <ToggleGroupItem value="student">學生試營運</ToggleGroupItem>
                <ToggleGroupItem value="company">正式公司</ToggleGroupItem>
              </ToggleGroup>
              <Button variant="outline" onClick={() => navigate("report")}>
                <Download data-icon="inline-start" />
                匯出報告
              </Button>
            </div>
          </div>
          <div className="source-row no-print">
            <label htmlFor="data-source">總覽／報告來源</label>
            <select
              id="data-source"
              value={state.source}
              onChange={(e) =>
                setState((s) => ({
                  ...s,
                  source: e.target.value as AppState["source"],
                }))
              }
            >
              <option value="simulator">基本參數模擬</option>
              <option value="schedule">年度排程加總</option>
            </select>
            <span>所有結果皆為假設模型</span>
          </div>
          {storageError && <Note warning>{storageError}</Note>}
          {ready ? (
            <div className="page-content">
              {page === "overview" && (
                <Dashboard
                  state={state}
                  updateParams={updateParams}
                  toggleTask={toggleTask}
                  navigate={navigate}
                />
              )}{" "}
              {page === "params" && (
                <Parameters p={state.params} onChange={updateParams} />
              )}{" "}
              {page === "breakeven" && (
                <BreakEven p={state.params} onChange={updateParams} />
              )}{" "}
              {page === "schedule" && (
                <Schedule
                  p={state.params}
                  months={state.months}
                  onChange={(months) => setState((s) => ({ ...s, months }))}
                />
              )}{" "}
              {page === "comparison" && (
                <Comparison
                  scenarios={state.scenarios}
                  onChange={(scenarios) =>
                    setState((s) => ({ ...s, scenarios }))
                  }
                />
              )}{" "}
              {page === "risk" && (
                <Risk
                  p={state.params}
                  value={state.risk}
                  onChange={(risk) => setState((s) => ({ ...s, risk }))}
                />
              )}{" "}
              {page === "roadmap" && (
                <Roadmap tasks={state.tasks} onChange={toggleTask} />
              )}{" "}
              {page === "records" && (
                <Records
                  p={state.params}
                  records={state.actuals}
                  onChange={(actuals) => setState((s) => ({ ...s, actuals }))}
                />
              )}{" "}
              {page === "company" && (
                <CompanyView
                  p={state.params}
                  value={state.company}
                  onChange={(company) => setState((s) => ({ ...s, company }))}
                />
              )}{" "}
              {page === "report" && <Report state={state} />}
            </div>
          ) : (
            <div className="loading-state" role="status">
              正在準備你的營隊工作空間…
            </div>
          )}
          <footer className="footer no-print">
            <span>Science Camp Lab · 為科學教育的下一步而設計</span>
            <span>資料僅儲存於此瀏覽器，請定期下載備份。</span>
          </footer>
        </main>
      </div>
      <input
        ref={restore}
        type="file"
        accept=".json,application/json"
        className="sr-only"
        aria-label="選擇備份檔案"
        onChange={async (e) => {
          const f = e.target.files?.[0];
          if (f) {
            try {
              if (f.size > 20 * 1024 * 1024) throw Error("備份檔案過大");
              const parsed = fullStateSchema.safeParse(
                JSON.parse(await f.text()),
              );
              if (!parsed.success) throw Error("備份格式不符或數值不合法");
              if (
                window.confirm(
                  "備份驗證成功。還原將取代目前所有資料，確定繼續？",
                )
              ) {
                setState(parsed.data);
                toast.success("已還原備份");
              }
            } catch (err) {
              toast.error(err instanceof Error ? err.message : "無法還原備份");
            }
          }
          e.target.value = "";
        }}
      />
      <Toaster theme="light" position="bottom-right" richColors />
    </>
  );
}
