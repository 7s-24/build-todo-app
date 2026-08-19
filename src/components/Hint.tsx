"use client";

import { useEffect, useRef, useState } from "react";

/**
 * 一个「?」，点开才有说明。
 *
 * 设计规矩是「能用样式说明的不用文字」——但有些东西样式确实说不了
 * （为什么用中位数、RA 为什么拆不出来）。那就别把它摊在页面上，
 * 收进来，需要的时候查。
 */
export default function Hint({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <span className="hintwrap" ref={ref}>
      <button
        className={`hint-btn${open ? " is-on" : ""}`}
        onClick={() => setOpen((v) => !v)}
      >
        ?
      </button>
      {open && <span className="hint-pop">{children}</span>}
    </span>
  );
}
