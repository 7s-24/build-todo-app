"use client";

import { useState } from "react";

/**
 * 折叠区块。标题行本身就是开关，左边那个方块实心 = 展开 ——
 * 和格子锁定、档位色块、tab 用的是同一套说法。
 */
export default function Collapse({
  title,
  defaultOpen = false,
  children,
}: {
  title: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="collapse">
      <button className="collapse-head" onClick={() => setOpen((v) => !v)}>
        <span className={`collapse-mark${open ? " is-on" : ""}`} />
        <h2>{title}</h2>
      </button>
      {open && <div className="collapse-body">{children}</div>}
    </section>
  );
}
