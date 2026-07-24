import type { Context } from 'hono'
import { getStore } from './store'

export async function configHandler(c: Context) {
  const store = getStore()
  const data = await store.load()
  return c.json({ storages: data.storages || [] })
}

export async function saveConfigHandler(c: Context) {
  const body = await c.req.json<{ storages: unknown[] }>()
  const store = getStore()
  const data = await store.load()
  data.storages = body.storages || []
  await store.save(data)
  return c.json({ ok: true })
}