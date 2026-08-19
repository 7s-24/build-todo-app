import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "日程",
  description: "每日待办与月视图",
  // 加到主屏后按独立 app 打开，不带 Safari 的地址栏
  appleWebApp: {
    capable: true,
    title: "日程",
    statusBarStyle: "default",
  },
};

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

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh" data-theme="mono">
      <body>{children}</body>
    </html>
  );
}
