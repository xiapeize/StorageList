import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { join } from 'path'

interface StoreData {
  users: Record<string, string>
  storages: unknown[]
}

const DATA_DIR = join(process.cwd(), 'data')
const DATA_FILE = join(DATA_DIR, 'data.json')

const DEFAULT_DATA: StoreData = {
  users: { admin: 'p@ssw0rd' },
  storages: [],
}

// 内存缓存，避免每次请求都读文件
let cache: StoreData | null = null

export function getStore() {
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
          // 确保 users 存在
          if (!cache!.users) cache!.users = { ...DEFAULT_DATA.users }
          return cache!
        }
      } catch {
        // 文件损坏或不存在，用默认数据
      }
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