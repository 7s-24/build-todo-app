import { COOKIE, tokenFor } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const password = process.env.APP_PASSWORD;
  const body = await req.json().catch(() => ({}));

  if (!password || String(body.password ?? "") !== password) {
    return Response.json({ error: "口令不正确" }, { status: 401 });
  }

  const res = Response.json({ ok: true });
  res.headers.set(
    "Set-Cookie",
    `${COOKIE}=${await tokenFor(password)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=31536000${
      process.env.NODE_ENV === "production" ? "; Secure" : ""
    }`,
  );
  return res;
}
