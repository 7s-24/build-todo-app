import { cookies, headers } from "next/headers";
import type { Metadata, Viewport } from "next";
import { LangProvider } from "@/lib/i18n";
import { LANG_COOKIE, type Lang } from "@/lib/lang";
import "./globals.css";

/**
 * 没选过语言就跟系统走 —— 服务端直接读 Accept-Language，
 * 这样首屏就是对的，不会先渲染一种语言再跳成另一种。
 */
async function resolveLang(): Promise<Lang> {
  const jar = await cookies();
  const saved = jar.get(LANG_COOKIE)?.value;
  if (saved === "en" || saved === "zh") return saved;
  const accept = (await headers()).get("accept-language") ?? "";
  return /^\s*zh/i.test(accept) ? "zh" : "en";
}

export async function generateMetadata(): Promise<Metadata> {
  const lang = await resolveLang();
  const title = lang === "zh" ? "日程" : "Schedule";
  return {
    title,
    description: lang === "zh" ? "每日待办与月视图" : "Daily tasks and a month view",
    // 加到主屏后按独立 app 打开，不带 Safari 的地址栏
    appleWebApp: { capable: true, title, statusBarStyle: "default" },
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // 铺到刘海和home indicator底下，安全区由 CSS 的 env() 自己让开
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // 语言在服务端就定下来 —— 用 localStorage 会先闪一下另一种语言
  const lang = await resolveLang();

  return (
    <html lang={lang} data-theme="mono">
      <body>
        <LangProvider initial={lang}>{children}</LangProvider>
      </body>
    </html>
  );
}
