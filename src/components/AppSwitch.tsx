"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarsIcon, TaskIcon } from "./icons";
import { useT } from "@/lib/i18n";

/**
 * 顶层导航。名字不写在界面上 —— 留在 title / aria-label 里，
 * 悬停能看到，读屏能读到，但不占视觉。选中的那个反白。
 */
export default function AppSwitch() {
  const path = usePathname();
  const t = useT();
  const pages = [
    { href: "/", label: t("nav", "schedule"), icon: <TaskIcon /> },
    { href: "/ledger", label: t("nav", "ledger"), icon: <BarsIcon /> },
  ];
  return (
    <nav className="appswitch">
      {pages.map((p) => (
        <Link
          key={p.href}
          href={p.href}
          className={`appswitch-btn${path === p.href ? " is-on" : ""}`}
          title={p.label}
          aria-label={p.label}
        >
          {p.icon}
        </Link>
      ))}
    </nav>
  );
}
