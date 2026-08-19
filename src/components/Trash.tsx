"use client";

import { useCallback, useEffect, useState } from "react";
import Hint from "./Hint";
import { RestoreIcon } from "./icons";
import { useT } from "@/lib/i18n";

interface Item {
  kind: "task" | "project";
  id: number;
  title: string;
  meta: string;
  deletedAt: string;
}

/**
 * 回收站。删除一律是软删除，这里是唯一能把东西捞回来的地方。
 *
 * 放在设置面板里：它不该占日常视线，但误删之后要找得到。
 */
export default function Trash({ onRestored }: { onRestored: () => void }) {
  const t = useT();
  const [items, setItems] = useState<Item[] | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/trash");
    setItems(res.ok ? ((await res.json()).items ?? []) : []);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function restore(item: Item) {
    setItems((prev) => prev?.filter((i) => !(i.kind === item.kind && i.id === item.id)) ?? null);
    await fetch("/api/trash", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: item.kind, id: item.id }),
    });
    onRestored();
  }

  return (
    <div className="field">
      <label>
        {t("settings", "trash")}
        <Hint>{t("settings", "trashHint")}</Hint>
      </label>
      <div className="trash">
        {items?.length === 0 && <div className="trash-empty">{t("settings", "trashEmpty")}</div>}
        {items?.map((i) => (
          <div className="trash-row" key={`${i.kind}-${i.id}`}>
            {/* 方块空心 = 任务，实心 = 项目。不写"任务""项目"两个词 */}
            <span className={`trash-kind${i.kind === "project" ? " is-project" : ""}`} />
            <span className="trash-title">{i.title}</span>
            <span className="trash-meta">{i.meta}</span>
            <button className="trash-restore" onClick={() => restore(i)}>
              <RestoreIcon />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
