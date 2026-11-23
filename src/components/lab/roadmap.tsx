"use client";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Panel, Note } from "./common";
import { stages } from "@/lib/state";
export function Roadmap({
  tasks,
  onChange,
}: {
  tasks: Record<string, boolean>;
  onChange: (id: string, v: boolean) => void;
}) {
  const done = stages.reduce(
    (n, s, i) => n + s.tasks.filter((_, j) => tasks[`${i}-${j}`]).length,
    0,
  );
  return (
    <>
      <Panel
        title="從想法到第一場付費營隊"
        description={`整體完成 ${done} / 21 項 · ${Math.round((done / 21) * 100)}%`}
      >
        <Progress value={(done / 21) * 100} aria-label="整體完成進度" />
      </Panel>
      <div className="two-col">
        {stages.map((stage, i) => {
          const total = stage.tasks.filter((_, j) => tasks[`${i}-${j}`]).length;
          return (
            <Panel
              key={stage.title}
              title={`${i + 1}. ${stage.title}`}
              description={stage.description}
              action={
                <Badge variant="secondary">
                  {Math.round((total / stage.tasks.length) * 100)}%
                </Badge>
              }
            >
              <Progress
                value={(total / stage.tasks.length) * 100}
                aria-label={`${stage.title}進度`}
              />
              {stage.tasks.map((task, j) => (
                <label
                  key={task}
                  className={`check-row ${tasks[`${i}-${j}`] ? "done" : ""}`}
                >
                  <Checkbox
                    checked={!!tasks[`${i}-${j}`]}
                    onCheckedChange={(v) => onChange(`${i}-${j}`, v)}
                  />
                  <span>{task}</span>
                </label>
              ))}
            </Panel>
          );
        })}
      </div>
      <Note>
        勾選代表團隊自行確認完成。學校收費、場地、保險與收款方式，請向所屬學校及相關單位確認實際適用規定。
      </Note>
    </>
  );
}
