import React from 'react';
import { useStore } from '../store';

export const Toolbar: React.FC = () => {
  const {
    viewMode, setViewMode,
    navigateUp, refreshFiles, selectedFiles, clearSelection, loading,
    setShowAddStorage
  } = useStore();

  const hasSelection = selectedFiles.size > 0;

  return (
    <div className="toolbar">
      <div className="toolbar-left">
        <button className="btn-icon" onClick={navigateUp} title="返回上级">
          ⬆
        </button>
        <button className="btn-icon" onClick={refreshFiles} title="刷新" disabled={loading}>
          {loading ? '⏳' : '🔄'}
        </button>
        {hasSelection && (
          <>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)', marginLeft: 8 }}>
              已选 {selectedFiles.size} 项
            </span>
            <button className="btn btn-sm" onClick={clearSelection}>取消选择</button>
          </>
        )}
      </div>
      <div className="toolbar-right">
        <button className={`btn-icon ${viewMode === 'list' ? 'active' : ''}`} onClick={() => setViewMode('list')} title="列表视图">
          ☰
        </button>
        <button className={`btn-icon ${viewMode === 'grid' ? 'active' : ''}`} onClick={() => setViewMode('grid')} title="网格视图">
          ⊞
        </button>
        <button className="btn btn-sm" onClick={() => setShowAddStorage(true)}>
          + 新建
        </button>
      </div>
    </div>
  );
};