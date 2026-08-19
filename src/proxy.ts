import { NextResponse, type NextRequest } from "next/server";
import { COOKIE, tokenFor } from "@/lib/auth";

export default async function proxy(req: NextRequest) {
  const password = process.env.APP_PASSWORD;
  if (!password) return NextResponse.next(); // 没设口令 = 不开鉴权

  const expected = await tokenFor(password);
  if (req.cookies.get(COOKIE)?.value === expected) return NextResponse.next();

  if (req.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "未授权" }, { status: 401 });
  }
  return NextResponse.redirect(new URL("/login", req.url));
}

export const config = {
  matcher: ["/((?!login|api/login|_next/static|_next/image|favicon.ico).*)"],
};
