"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useT } from "@/lib/i18n";

export default function AppSwitch() {
  const path = usePathname();
  const t = useT();
  // 两个页面的名字，写字是对的 —— 这是导航，不是状态
  const pages = [
    { href: "/", label: t("nav", "schedule") },
    { href: "/ledger", label: t("nav", "ledger") },
  ];
  return (
    <nav className="appswitch">
      {pages.map((p) => (
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
