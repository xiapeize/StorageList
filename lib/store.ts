interface StoreData {
  users: Record<string, string>
  storages: unknown[]
}

const DEFAULT_DATA: StoreData = {
  users: { admin: 'p@ssw0rd' },
  storages: [],
}

// 内存缓存
let cache: StoreData | null = null

// Cloudflare Workers 兼容的纯内存存储
function createMemoryStore() {
  return {
    async load(): Promise<StoreData> {
      if (cache) return cache
      cache = { ...DEFAULT_DATA }
      return cache
    },
    async save(data: StoreData): Promise<void> {
      cache = data
    },
  }
}

// Node.js 文件存储
function createFileStore() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { readFileSync, writeFileSync, existsSync, mkdirSync } = require('fs')
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { join } = require('path')

  const DATA_DIR = join(process.cwd(), 'data')
  const DATA_FILE = join(DATA_DIR, 'data.json')

  return {
    async load(): Promise<StoreData> {
      if (cache) return cache
      try {
        if (!existsSync(DATA_DIR)) {
          mkdirSync(DATA_DIR, { recursive: true })
        }
        if (existsSync(DATA_FILE)) {
          const raw = readFileSync(DATA_FILE, 'utf-8')
          cache = JSON.parse(raw)
          if (!cache!.users) cache!.users = { ...DEFAULT_DATA.users }
          return cache!
        }
      } catch { /* ignore */ }
      cache = { ...DEFAULT_DATA }
      return cache
    },
    async save(data: StoreData): Promise<void> {
      cache = data
      try {
        if (!existsSync(DATA_DIR)) {
          mkdirSync(DATA_DIR, { recursive: true })
        }
        writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8')
      } catch (e) {
        console.error('Failed to save data:', e)
      }
    },
  }
}

let storeInstance: ReturnType<typeof createMemoryStore> | null = null

export function getStore() {
  if (storeInstance) return storeInstance

  // 检测环境：Cloudflare Workers 没有 process.cwd
  if (typeof process === 'undefined' || !process.cwd) {
    storeInstance = createMemoryStore()
  } else {
    try {
      storeInstance = createFileStore()
    } catch {
      storeInstance = createMemoryStore()
    }
  }
  return storeInstance
}