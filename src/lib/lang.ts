/**
 * 语言的常量放在这里，不带 "use client"。
 *
 * 放进 i18n.tsx 会出事：那是个 client 模块，服务端组件从里面 import
 * 拿到的是「客户端引用」而不是字符串本身，cookies().get(它) 永远查不到。
 */
export type Lang = "zh" | "en";
export const LANG_COOKIE = "mn_lang";
