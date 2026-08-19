"use client";

import { useState } from "react";
import { XIcon } from "./icons";
import type { ProjectDTO, ProjectKind } from "@/lib/types";

/** 分组名是专有名词，不是状态标签，该写就写 */
const GROUPS: { kind: ProjectKind; label: string }[] = [
  { kind: "funded", label: "Funded Project" },
  { kind: "personal", label: "Personal Project" },
  { kind: "idea", label: "Idea" },
];

/**
 * 右侧常驻的科研面板。
 *
 * 和左边的队列刻意不同：这里没有日期、没有档位、没有完成态 ——
 * 它只回答「现在手上有哪些项目」。做完了就删掉。
 */
export default function Projects({
  projects,
  onAdd,
  onRename,
  onMove,
  onDelete,
}: {
  projects: ProjectDTO[];
  onAdd: (title: string, kind: ProjectKind) => void;
  onRename: (project: ProjectDTO, title: string) => void;
  onMove: (project: ProjectDTO, kind: ProjectKind) => void;
  onDelete: (project: ProjectDTO) => void;
}) {
  const [editing, setEditing] = useState<number | null>(null);
  const [draft, setDraft] = useState("");
  const [adding, setAdding] = useState<ProjectKind | null>(null);
  const [newTitle, setNewTitle] = useState("");

  function commitRename(p: ProjectDTO) {
    const title = draft.trim();
    if (title && title !== p.title) onRename(p, title);
    setEditing(null);
  }

  function commitAdd(kind: ProjectKind) {
    const title = newTitle.trim();
    if (title) onAdd(title, kind);
    setNewTitle("");
    setAdding(null);
  }

  return (
    <aside className="projects">
      {GROUPS.map(({ kind, label }) => {
        const rows = projects.filter((p) => p.kind === kind);
        return (
          <section className="pgroup" key={kind}>
            <div className="pgroup-head">
              <span>{label}</span>
              <button className="pgroup-add" onClick={() => setAdding(kind)}>
                ＋
              </button>
            </div>

            {rows.map((p) => (
              <div className="prow" key={p.id}>
                {editing === p.id ? (
                  <input
                    className="prow-input"
                    autoFocus
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onBlur={() => commitRename(p)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.nativeEvent.isComposing) commitRename(p);
                      if (e.key === "Escape") setEditing(null);
                    }}
                  />
                ) : (
                  <div
                    className="prow-text"
                    onClick={() => {
                      setDraft(p.title);
                      setEditing(p.id);
                    }}
                  >
                    {p.title}
                  </div>
                )}

                {/* 换组用一个 select，比拖来拖去省事，也不占地方 */}
                <select
                  className="prow-kind"
                  value={p.kind}
                  onChange={(e) => onMove(p, e.target.value as ProjectKind)}
                >
                  {GROUPS.map((g) => (
                    <option key={g.kind} value={g.kind}>
                      {g.label}
                    </option>
                  ))}
                </select>

                <button className="prow-x" onClick={() => onDelete(p)}>
                  <XIcon />
                </button>
              </div>
            ))}

            {adding === kind && (
              <input
                className="prow-input is-new"
                autoFocus
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                onBlur={() => commitAdd(kind)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.nativeEvent.isComposing) commitAdd(kind);
                  if (e.key === "Escape") {
                    setNewTitle("");
                    setAdding(null);
                  }
                }}
              />
            )}
          </section>
        );
      })}
    </aside>
  );
}
