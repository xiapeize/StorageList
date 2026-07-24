// Cloudflare Workers 缺少 btoa/atob 的 polyfill
// 必须在导入 Hono 之前设置，因为 Hono 内部使用了 btoa/atob
if (typeof btoa === 'undefined') {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
  // @ts-ignore
  globalThis.btoa = function (str: string): string {
    const bytes = new TextEncoder().encode(str)
    let result = ''
    for (let i = 0; i < bytes.length; i += 3) {
      const a = bytes[i]
      const b = i + 1 < bytes.length ? bytes[i + 1] : 0
      const c = i + 2 < bytes.length ? bytes[i + 2] : 0
      result += chars[a >> 2]
      result += chars[((a & 3) << 4) | (b >> 4)]
      result += i + 1 < bytes.length ? chars[((b & 15) << 2) | (c >> 6)] : '='
      result += i + 2 < bytes.length ? chars[c & 63] : '='
    }
    return result
  }
}
if (typeof atob === 'undefined') {
  // @ts-ignore
  globalThis.atob = function (str: string): string {
    str = str.replace(/[^A-Za-z0-9+/=]/g, '')
    let result = ''
    for (let i = 0; i < str.length; i += 4) {
      const a = str.charCodeAt(i) >= 0 ? 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'.indexOf(str[i]) : -1
      const b = str.charCodeAt(i + 1) >= 0 ? 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'.indexOf(str[i + 1]) : -1
      const c = str[i + 2] !== '=' ? 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'.indexOf(str[i + 2]) : 0
      const d = str[i + 3] !== '=' ? 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'.indexOf(str[i + 3]) : 0
      result += String.fromCharCode((a << 2) | (b >> 4))
      if (str[i + 2] !== '=') result += String.fromCharCode(((b & 15) << 4) | (c >> 2))
      if (str[i + 3] !== '=') result += String.fromCharCode(((c & 3) << 6) | d)
    }
    return result
  }
}

import app from './api/app'

export default app