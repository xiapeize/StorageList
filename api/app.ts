import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { authMiddleware, loginHandler, changePasswordHandler } from '../lib/auth'
import { configHandler, saveConfigHandler } from '../lib/config'

const app = new Hono()

app.use('/*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}))

// 公开路由
app.post('/api/auth/login', loginHandler)

// 需要认证的路由
app.get('/api/config', authMiddleware, configHandler)
app.post('/api/config', authMiddleware, saveConfigHandler)
app.put('/api/auth/password', authMiddleware, changePasswordHandler)

// 健康检查
app.get('/api/health', (c) => c.json({ ok: true }))

// 全局错误处理
app.onError((err, c) => {
  console.error('Unhandled error:', err)
  return c.json({ error: err.message || '服务器内部错误' }, 500)
})

export default app