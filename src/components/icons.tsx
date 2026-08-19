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

/** 他人日历开关：两张叠起来的日历，开 = 前面那张顶栏实心 */
export function SharedCalIcon({ on }: { on: boolean }) {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
      <rect x="4.2" y="1.2" width="9.1" height="8.6" stroke="currentColor" />
      <rect
        x="0.7"
        y="4.2"
        width="9.1"
        height="9.1"
        fill="var(--bg)"
        stroke="currentColor"
      />
      <rect
        x="0.7"
        y="4.2"
        width="9.1"
        height="2.5"
        fill={on ? "currentColor" : "var(--bg)"}
        stroke="currentColor"
      />
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

/** 队列 tab */
export function ListIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
      <path d="M0.5 2.5h13M0.5 7h13M0.5 11.5h13" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  );
}

/** 月视图 tab —— 和 favicon 同一个九格图案 */
export function GridIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
      <g fill="currentColor">
        <rect x="0" y="0" width="3.6" height="3.6" />
        <rect x="5.2" y="0" width="3.6" height="3.6" />
        <rect x="10.4" y="0" width="3.6" height="3.6" />
        <rect x="0" y="5.2" width="3.6" height="3.6" />
        <rect x="5.2" y="5.2" width="3.6" height="3.6" />
        <rect x="10.4" y="5.2" width="3.6" height="3.6" />
        <rect x="0" y="10.4" width="3.6" height="3.6" />
        <rect x="5.2" y="10.4" width="3.6" height="3.6" />
        <rect x="10.4" y="10.4" width="3.6" height="3.6" />
      </g>
    </svg>
  );
}

/** 项目面板 tab */
export function FlagIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
      <path d="M2.2 0.6v12.8" stroke="currentColor" strokeWidth="1.3" />
      <path d="M2.2 1.4h9.6v5.4H2.2z" fill="currentColor" />
    </svg>
  );
}

/**
 * 顶层导航的两个图标。
 * 各自取自那一页自己的视觉语言：日程是任务的方框加勾，
 * 账簿是长短不一的条 —— 排行和收入构成里用的就是这种条。
 * 两个轮廓差别足够大，不会和顶栏里其他方块图标混起来。
 */
export function TaskIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
      <rect x="0.7" y="0.7" width="12.6" height="12.6" stroke="currentColor" />
      <path d="M3.6 7.2l2.4 2.4 4.6-5" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}

export function BarsIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
      <g fill="currentColor">
        <rect x="0" y="9.2" width="3.4" height="4.8" />
        <rect x="5.3" y="4.6" width="3.4" height="9.4" />
        <rect x="10.6" y="0.6" width="3.4" height="13.4" />
      </g>
    </svg>
  );
}

/** 导入：箭头往上，底下一条线 —— 从文件送进来 */
export function UploadIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
      <path d="M7 10V1.6M3.4 5.2L7 1.5l3.6 3.7" stroke="currentColor" strokeWidth="1.3" />
      <path d="M0.7 12.4h12.6" stroke="currentColor" strokeWidth="1.3" />
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
