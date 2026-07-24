import type { Context, Next } from 'hono'
import { getStore } from './store'

const JWT_SECRET = 'fm-secret-key-change-in-production'

interface JWTPayload {
  username: string
  iat: number
  exp: number
}

// 纯 JavaScript base64 编解码，不依赖 btoa/atob（Cloudflare Workers 兼容）
const BASE64_TABLE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'

function toBase64(bytes: Uint8Array): string {
  let result = ''
  const len = bytes.length
  for (let i = 0; i < len; i += 3) {
    const a = bytes[i]
    const b = i + 1 < len ? bytes[i + 1] : 0
    const c = i + 2 < len ? bytes[i + 2] : 0
    result += BASE64_TABLE[a >> 2]
    result += BASE64_TABLE[((a & 3) << 4) | (b >> 4)]
    result += i + 1 < len ? BASE64_TABLE[((b & 15) << 2) | (c >> 6)] : '='
    result += i + 2 < len ? BASE64_TABLE[c & 63] : '='
  }
  return result
}

function fromBase64(str: string): Uint8Array {
  str = str.replace(/[^A-Za-z0-9+/=]/g, '')
  const bytes = new Uint8Array((str.length * 3) / 4)
  let pos = 0
  for (let i = 0; i < str.length; i += 4) {
    const a = BASE64_TABLE.indexOf(str[i])
    const b = BASE64_TABLE.indexOf(str[i + 1])
    const c = str[i + 2] !== '=' ? BASE64_TABLE.indexOf(str[i + 2]) : 0
    const d = str[i + 3] !== '=' ? BASE64_TABLE.indexOf(str[i + 3]) : 0
    bytes[pos++] = (a << 2) | (b >> 4)
    if (str[i + 2] !== '=') bytes[pos++] = ((b & 15) << 4) | (c >> 2)
    if (str[i + 3] !== '=') bytes[pos++] = ((c & 3) << 6) | d
  }
  return bytes.slice(0, pos)
}

function base64url(str: string): string {
  const bytes = new TextEncoder().encode(str)
  return toBase64(bytes).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function base64urlFromBytes(bytes: Uint8Array): string {
  return toBase64(bytes).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function base64urlDecode(str: string): string {
  str = str.replace(/-/g, '+').replace(/_/g, '/')
  while (str.length % 4) str += '='
  const bytes = fromBase64(str)
  return new TextDecoder().decode(bytes)
}

async function hmacSign(data: string, secret: string): Promise<string> {
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(data))
  return base64urlFromBytes(new Uint8Array(sig))
}

export function createToken(username: string): Promise<string> {
  const header = base64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const payload = base64url(JSON.stringify({
    username,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 86400 * 7,
  }))
  return hmacSign(`${header}.${payload}`, JWT_SECRET).then(sig => `${header}.${payload}.${sig}`)
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    const expectedSig = await hmacSign(`${parts[0]}.${parts[1]}`, JWT_SECRET)
    if (expectedSig !== parts[2]) return null
    const payload: JWTPayload = JSON.parse(base64urlDecode(parts[1]))
    if (payload.exp < Math.floor(Date.now() / 1000)) return null
    return payload
  } catch {
    return null
  }
}

export async function authMiddleware(c: Context, next: Next) {
  const authHeader = c.req.header('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ error: '未授权' }, 401)
  }
  const token = authHeader.slice(7)
  const payload = await verifyToken(token)
  if (!payload) {
    return c.json({ error: 'Token 无效或已过期' }, 401)
  }
  c.set('user', payload)
  await next()
}

export async function loginHandler(c: Context) {
  const body = await c.req.json<{ username: string; password: string }>()
  const store = getStore()
  const data = await store.load()

  const users = data.users || { admin: 'p@ssw0rd' }

  if (!body?.username || !body?.password) {
    return c.json({ error: '请输入用户名和密码' }, 400)
  }

  const storedPassword = users[body.username]
  if (!storedPassword || storedPassword !== body.password) {
    return c.json({ error: '用户名或密码错误' }, 401)
  }

  const token = await createToken(body.username)
  return c.json({ token, username: body.username })
}

export async function changePasswordHandler(c: Context) {
  const body = await c.req.json<{ oldPassword: string; newPassword: string }>()
  const user = c.get('user') as JWTPayload

  if (!body?.oldPassword || !body?.newPassword) {
    return c.json({ error: '请输入旧密码和新密码' }, 400)
  }
  if (body.newPassword.length < 4) {
    return c.json({ error: '新密码至少4位' }, 400)
  }

  const store = getStore()
  const data = await store.load()
  const users = data.users || { admin: 'p@ssw0rd' }

  if (users[user.username] !== body.oldPassword) {
    return c.json({ error: '旧密码错误' }, 401)
  }

  users[user.username] = body.newPassword
  data.users = users
  await store.save(data)

  return c.json({ ok: true })
}