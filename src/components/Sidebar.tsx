import React from 'react';
import { useStore } from '../store';
import { iconEmoji } from './icons';

export const Sidebar: React.FC = () => {
  const { storages, activeStorageId, setActiveStorage, setShowAddStorage, setShowSettings } = useStore();

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo">S</div>
        <span className="sidebar-title">StorageList</span>
      </div>
      <nav className="sidebar-nav">
        <div className="sidebar-section">存储挂载</div>
        {storages.map(s => (
          <div
            key={s.id}
            className={`sidebar-item ${activeStorageId === s.id ? 'active' : ''}`}
            onClick={() => setActiveStorage(s.id)}
          >
            <span className="icon">{iconEmoji(s.type === 's3' ? 'storage' : 'globe')}</span>
            <span className="name">{s.name}</span>
          </div>
        ))}
        {storages.length === 0 && (
          <div style={{ padding: '12px 16px', color: 'var(--text-muted)', fontSize: '13px' }}>
            暂无存储，点击下方按钮添加
          </div>
        )}
      </nav>
      <div className="sidebar-footer">
        <button className="btn btn-primary" onClick={() => setShowAddStorage(true)}>
          + 添加存储
        </button>
        <button
          className="btn"
          style={{ marginTop: 8, width: '100%' }}
          onClick={() => setShowSettings(true)}
        >
          ⚙ 设置
        </button>
      </div>
    </aside>
  );
};