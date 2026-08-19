"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/** 两个页面的名字，写字是对的 —— 这是导航，不是状态 */
const PAGES = [
  { href: "/", label: "日程" },
  { href: "/ledger", label: "账簿" },
];

export default function AppSwitch() {
  const path = usePathname();
  return (
    <nav className="appswitch">
      {PAGES.map((p) => (
        <Link
          key={p.href}
          href={p.href}
          className={`appswitch-btn${path === p.href ? " is-on" : ""}`}
        >
          {p.label}
        </Link>
      ))}
    </nav>
  );
}
