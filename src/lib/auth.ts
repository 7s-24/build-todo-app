export const COOKIE = "mn_auth";

/**
 * 单用户口令的摘要。cookie 里存的是它，不是明文口令。
 * 换了 APP_PASSWORD 摘要就变，所有旧 cookie 自动失效。
 */
export async function tokenFor(password: string): Promise<string> {
  const data = new TextEncoder().encode(`mn:${password}`);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
