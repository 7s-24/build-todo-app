export function Chevron({ dir }: { dir: "left" | "right" }) {
  return (
    <svg width="7" height="12" viewBox="0 0 7 12" fill="none" aria-hidden>
      <path
        d={dir === "left" ? "M6 1 1 6l5 5" : "M1 1l5 5-5 5"}
        stroke="currentColor"
        strokeWidth="1.4"
      />
    </svg>
  );
}

/** 日历开关：开 = 顶栏实心，关 = 全空心。状态靠填充表达，不靠文字 */
export function CalIcon({ on }: { on: boolean }) {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
      <rect x="0.7" y="1.7" width="12.6" height="11.6" stroke="currentColor" />
      <rect
        x="0.7"
        y="1.7"
        width="12.6"
        height="3"
        fill={on ? "currentColor" : "none"}
        stroke="currentColor"
      />
      <path d="M3.6 0.5v2M10.4 0.5v2" stroke="currentColor" />
    </svg>
  );
}

export function GearIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
      <circle cx="7" cy="7" r="2.4" stroke="currentColor" />
      <path
        d="M7 0.6v2M7 11.4v2M0.6 7h2M11.4 7h2M2.5 2.5l1.4 1.4M10.1 10.1l1.4 1.4M11.5 2.5l-1.4 1.4M3.9 10.1l-1.4 1.4"
        stroke="currentColor"
      />
    </svg>
  );
}

export function XIcon() {
  return (
    <svg width="9" height="9" viewBox="0 0 9 9" fill="none" aria-hidden>
      <path d="M1 1l7 7M8 1l-7 7" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}
