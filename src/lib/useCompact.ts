"use client";

import { useEffect, useState } from "react";

/** 和 globals.css 里的手机断点保持一致 */
const QUERY = "(max-width: 700px)";

/**
 * 窄屏（手机）判定。
 * 纯样式的差异都交给 CSS，这个 hook 只用在必须改行为的地方：
 * 窄屏下格子里放不下输入框，长按也该留给页面滚动。
 */
export function useCompact(): boolean {
  const [compact, setCompact] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(QUERY);
    const sync = () => setCompact(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  return compact;
}
