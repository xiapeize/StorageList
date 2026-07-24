import type { Context, Next } from 'hono'
import { getStore } from './store'

const JWT_SECRET = 'fm-secret-key-change-in-production'

interface JWTPayload {
  username: string
  iat: number
  exp: number
}

function base64url(str: string): string {
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function base64urlDecode(str: string): string {
  str = str.replace(/-/g, '+').replace(/_/g, '/')
  while (str.length % 4) str += '='
  return atob(str)
}

async function hmacSign(data: string, secret: string): Promise<string> {
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(data))
  return base64url(String.fromCharCode(...new Uint8Array(sig)))
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