export const COOKIE = "mn_auth";

/**
 * 单用户口令。没设 APP_PASSWORD 就等于不开鉴权（本地开发用）。
 * cookie 里存的是摘要，不是明文口令。
 */
export async function tokenFor(password: string): Promise<string> {
  const data = new TextEncoder().encode(`mn:${password}`);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function authDisabled(): boolean {
  return !process.env.APP_PASSWORD;
}
