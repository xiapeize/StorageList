import { create } from 'zustand';
import type { StorageConfig, StorageDriver, FileItem, StorageType } from '../drivers/types';
import { createDriver, STORAGE_TYPES } from '../drivers/registry';
import { generateId, parentPath } from '../utils/format';

interface AppState {
  // 存储挂载
  storages: StorageConfig[];
  activeStorageId: string | null;
  drivers: Map<string, StorageDriver>;

  // 当前目录
  currentPath: string;
  files: FileItem[];
  loading: boolean;
  error: string | null;

  // 视图模式
  viewMode: 'list' | 'grid';
  sortBy: 'name' | 'size' | 'modified';
  sortOrder: 'asc' | 'desc';

  // 选中文件
  selectedFiles: Set<string>;
  lastSelected: string | null;

  // 剪贴板
  clipboard: { items: FileItem[]; action: 'copy' | 'move' } | null;

  // 模态框
  showAddStorage: boolean;
  showSettings: boolean;
  previewFile: FileItem | null;

  // 操作
  loadStorages: () => void;
  addStorage: (config: Omit<StorageConfig, 'id'>) => void;
  removeStorage: (id: string) => void;
  setActiveStorage: (id: string | null) => void;
  refreshFiles: () => Promise<void>;
  navigateTo: (path: string) => void;
  navigateUp: () => void;
  setViewMode: (mode: 'list' | 'grid') => void;
  setSortBy: (by: 'name' | 'size' | 'modified') => void;
  toggleSortOrder: () => void;
  toggleSelect: (id: string) => void;
  selectAll: () => void;
  clearSelection: () => void;
  setClipboard: (items: FileItem[], action: 'copy' | 'move') => void;
  clearClipboard: () => void;
  setShowAddStorage: (v: boolean) => void;
  setShowSettings: (v: boolean) => void;
  setPreviewFile: (f: FileItem | null) => void;
  getActiveDriver: () => StorageDriver | null;
  getStorageTypeInfo: (type: StorageType) => StorageTypeInfo | undefined;
}

interface StorageTypeInfo {
  type: StorageType;
  label: string;
  icon: string;
  fields: { key: string; label: string; type: string; required: boolean; placeholder?: string; options?: { label: string; value: string }[] }[];
  description: string;
}

export const useStore = create<AppState>((set, get) => ({
  storages: [],
  activeStorageId: null,
  drivers: new Map(),
  currentPath: '/',
  files: [],
  loading: false,
  error: null,
  viewMode: 'list',
  sortBy: 'name',
  sortOrder: 'asc',
  selectedFiles: new Set(),
  lastSelected: null,
  clipboard: null,
  showAddStorage: false,
  showSettings: false,
  previewFile: null,

  loadStorages: () => {
    try {
      const raw = localStorage.getItem('fm_storages');
      if (raw) {
        const storages: StorageConfig[] = JSON.parse(raw);
        const drivers = new Map<string, StorageDriver>();
        storages.forEach(s => {
          try { drivers.set(s.id, createDriver(s)); } catch { /* skip invalid */ }
        });
        set({ storages, drivers });
        // 自动激活第一个
        if (storages.length > 0 && !get().activeStorageId) {
          set({ activeStorageId: storages[0].id });
        }
      }
    } catch { /* ignore */ }
  },

  addStorage: (config) => {
    const id = generateId();
    const newConfig: StorageConfig = { ...config, id };
    const driver = createDriver(newConfig);
    const { storages, drivers } = get();
    const newStorages = [...storages, newConfig];
    drivers.set(id, driver);
    localStorage.setItem('fm_storages', JSON.stringify(newStorages));
    set({ storages: newStorages, drivers: new Map(drivers), activeStorageId: id, currentPath: '/', files: [] });
  },

  removeStorage: (id) => {
    const { storages, drivers, activeStorageId } = get();
    drivers.delete(id);
    const newStorages = storages.filter(s => s.id !== id);
    localStorage.setItem('fm_storages', JSON.stringify(newStorages));
    set({
      storages: newStorages,
      drivers: new Map(drivers),
      activeStorageId: activeStorageId === id ? (newStorages[0]?.id || null) : activeStorageId,
      currentPath: '/',
      files: [],
    });
  },

  setActiveStorage: (id) => {
    set({ activeStorageId: id, currentPath: '/', files: [], error: null });
  },

  refreshFiles: async () => {
    const { activeStorageId, drivers, currentPath } = get();
    if (!activeStorageId) return;
    const driver = drivers.get(activeStorageId);
    if (!driver) return;

    set({ loading: true, error: null });
    try {
      const files = await driver.listFiles(currentPath);
      set({ files, loading: false });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '加载失败';
      set({ error: msg, loading: false });
    }
  },

  navigateTo: (path) => {
    set({ currentPath: path, selectedFiles: new Set(), lastSelected: null });
  },

  navigateUp: () => {
    set(state => ({
      currentPath: parentPath(state.currentPath),
      selectedFiles: new Set(),
      lastSelected: null,
    }));
  },

  setViewMode: (mode) => set({ viewMode: mode }),
  setSortBy: (by) => set({ sortBy: by }),
  toggleSortOrder: () => set(s => ({ sortOrder: s.sortOrder === 'asc' ? 'desc' : 'asc' })),

  toggleSelect: (id) => {
    set(state => {
      const next = new Set(state.selectedFiles);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return { selectedFiles: next, lastSelected: id };
    });
  },

  selectAll: () => {
    set(state => {
      const all = new Set(state.files.map(f => f.id));
      return { selectedFiles: all };
    });
  },

  clearSelection: () => set({ selectedFiles: new Set(), lastSelected: null }),

  setClipboard: (items, action) => set({ clipboard: { items, action } }),
  clearClipboard: () => set({ clipboard: null }),

  setShowAddStorage: (v) => set({ showAddStorage: v }),
  setShowSettings: (v) => set({ showSettings: v }),
  setPreviewFile: (f) => set({ previewFile: f }),

  getActiveDriver: () => {
    const { activeStorageId, drivers } = get();
    if (!activeStorageId) return null;
    return drivers.get(activeStorageId) || null;
  },

  getStorageTypeInfo: (type) => STORAGE_TYPES.find(t => t.type === type),
}));