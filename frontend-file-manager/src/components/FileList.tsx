import React, { useEffect, useCallback, useState, useRef } from 'react';
import { useStore } from '../store';
import { FileItem } from './FileItem';
import type { FileItem as FileItemType } from '../drivers/types';

export const FileList: React.FC = () => {
  const {
    activeStorageId, currentPath, files, loading, error,
    viewMode, sortBy, sortOrder,
    selectedFiles, toggleSelect, selectAll, clearSelection,
    navigateTo, refreshFiles, setPreviewFile,
    getActiveDriver,
  } = useStore();

  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; item: FileItemType } | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activeStorageId) {
      refreshFiles();
    }
  }, [activeStorageId, currentPath]);

  useEffect(() => {
    const handler = () => setContextMenu(null);
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

  // 排序
  const sortedFiles = [...files].sort((a, b) => {
    if (a.isDir !== b.isDir) return a.isDir ? -1 : 1;
    let cmp = 0;
    if (sortBy === 'name') cmp = a.name.localeCompare(b.name);
    else if (sortBy === 'size') cmp = a.size - b.size;
    else if (sortBy === 'modified') cmp = new Date(a.modified).getTime() - new Date(b.modified).getTime();
    return sortOrder === 'asc' ? cmp : -cmp;
  });

  const handleDoubleClick = useCallback((item: FileItemType) => {
    if (item.isDir) {
      navigateTo(item.path);
    } else {
      const mime = item.mimeType || '';
      if (mime.startsWith('image/') || mime.startsWith('video/') || mime.startsWith('audio/')) {
        setPreviewFile(item);
      } else {
        handleDownload(item);
      }
    }
  }, [navigateTo, setPreviewFile]);

  const handleSelect = useCallback((id: string, e: React.MouseEvent) => {
    if (e.ctrlKey || e.metaKey) {
      toggleSelect(id);
    } else if (e.shiftKey) {
      // 简化 shift 选择
      toggleSelect(id);
    } else {
      clearSelection();
      toggleSelect(id);
    }
  }, [toggleSelect, clearSelection]);

  const handleContextMenu = useCallback((e: React.MouseEvent, item: FileItemType) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, item });
  }, []);

  const handleDownload = async (item: FileItemType) => {
    const driver = getActiveDriver();
    if (!driver) return;
    try {
      const url = await driver.getDownloadUrl(item);
      window.open(url, '_blank');
    } catch (e) {
      alert('下载失败: ' + (e instanceof Error ? e.message : '未知错误'));
    }
  };

  const handleDelete = async (item: FileItemType) => {
    const driver = getActiveDriver();
    if (!driver) return;
    if (!confirm(`确定删除 ${item.name}？`)) return;
    try {
      await driver.deleteItem(item);
      refreshFiles();
    } catch (e) {
      alert('删除失败: ' + (e instanceof Error ? e.message : '未知错误'));
    }
  };

  const handleRename = async (item: FileItemType) => {
    const driver = getActiveDriver();
    if (!driver) return;
    const newName = prompt('新名称:', item.name);
    if (!newName || newName === item.name) return;
    try {
      await driver.rename(item, newName);
      refreshFiles();
    } catch (e) {
      alert('重命名失败: ' + (e instanceof Error ? e.message : '未知错误'));
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const driver = getActiveDriver();
    if (!driver) return;
    const files = Array.from(e.dataTransfer.files);
    for (const file of files) {
      try {
        await driver.uploadFile(currentPath, file);
      } catch (err) {
        console.error('Upload failed:', err);
      }
    }
    refreshFiles();
  };

  if (!activeStorageId) {
    return (
      <div className="file-area">
        <div className="empty-state">
          <div className="empty-icon">📂</div>
          <div className="empty-text">未选择存储</div>
          <div className="empty-sub">请在左侧添加并选择一个存储挂载</div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="file-area"
      ref={containerRef}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
    >
      {error && (
        <div className="error-banner">
          ⚠ {error}
          <span className="retry-btn" onClick={refreshFiles}>重试</span>
        </div>
      )}

      {dragOver && <div className="drop-zone">释放文件以上传</div>}

      {loading ? (
        <div className="loading-overlay">
          <div className="spinner" />
          加载中...
        </div>
      ) : sortedFiles.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📭</div>
          <div className="empty-text">此目录为空</div>
          <div className="empty-sub">拖拽文件到此处上传，或点击"新建"创建文件夹</div>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="file-grid">
          {sortedFiles.map(f => (
            <FileItem
              key={f.id}
              item={f}
              viewMode="grid"
              selected={selectedFiles.has(f.id)}
              onSelect={handleSelect}
              onContextMenu={handleContextMenu}
              onDoubleClick={handleDoubleClick}
            />
          ))}
        </div>
      ) : (
        <div className="file-list">
          <div className="file-list-header">
            <span>
              <input
                type="checkbox"
                onChange={() => selectedFiles.size === sortedFiles.length ? clearSelection() : selectAll()}
                checked={selectedFiles.size === sortedFiles.length && sortedFiles.length > 0}
              />
            </span>
            <span onClick={() => useStore.getState().setSortBy('name')}>文件名 {sortBy === 'name' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}</span>
            <span onClick={() => useStore.getState().setSortBy('size')}>大小 {sortBy === 'size' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}</span>
            <span onClick={() => useStore.getState().setSortBy('modified')}>修改时间 {sortBy === 'modified' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}</span>
          </div>
          {sortedFiles.map(f => (
            <FileItem
              key={f.id}
              item={f}
              viewMode="list"
              selected={selectedFiles.has(f.id)}
              onSelect={handleSelect}
              onContextMenu={handleContextMenu}
              onDoubleClick={handleDoubleClick}
            />
          ))}
        </div>
      )}

      {/* Context Menu */}
      {contextMenu && (
        <div
          className="context-menu"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="context-menu-item" onClick={() => { handleDownload(contextMenu.item); setContextMenu(null); }}>
            ⬇ 下载
          </div>
          <div className="context-menu-item" onClick={() => { handleRename(contextMenu.item); setContextMenu(null); }}>
            ✏ 重命名
          </div>
          <div className="context-menu-sep" />
          <div className="context-menu-item danger" onClick={() => { handleDelete(contextMenu.item); setContextMenu(null); }}>
            🗑 删除
          </div>
        </div>
      )}
    </div>
  );
};