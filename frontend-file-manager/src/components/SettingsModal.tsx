import React from 'react';
import { useStore } from '../store';

export const SettingsModal: React.FC = () => {
  const { showSettings, setShowSettings, storages, removeStorage } = useStore();

  if (!showSettings) return null;

  const handleExport = () => {
    const data = JSON.stringify(storages, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'filemanager-config.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const configs = JSON.parse(text);
        if (Array.isArray(configs)) {
          localStorage.setItem('fm_storages', JSON.stringify(configs));
          alert('配置已导入，请刷新页面');
          window.location.reload();
        }
      } catch {
        alert('导入失败：无效的配置文件');
      }
    };
    input.click();
  };

  const handleClearAll = () => {
    if (confirm('确定要清除所有配置？此操作不可恢复！')) {
      localStorage.removeItem('fm_storages');
      window.location.reload();
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowSettings(false); }}>
      <div className="modal">
        <div className="modal-header">
          <h3>设置</h3>
          <button className="modal-close" onClick={() => setShowSettings(false)}>×</button>
        </div>
        <div className="modal-body">
          <div style={{ marginBottom: 20 }}>
            <h4 style={{ marginBottom: 8, fontSize: 14 }}>已挂载存储 ({storages.length})</h4>
            {storages.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>暂无存储</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {storages.map(s => (
                  <div key={s.id} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '8px 12px', background: 'var(--bg)', borderRadius: 'var(--radius-sm)',
                    fontSize: 13
                  }}>
                    <span>{s.type === 's3' ? '☁️' : '🌐'} {s.name}</span>
                    <button
                      className="btn btn-sm btn-danger"
                      onClick={() => { if (confirm('确定删除此存储？')) removeStorage(s.id); }}
                    >
                      删除
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <h4 style={{ fontSize: 14, marginBottom: 4 }}>数据管理</h4>
            <button className="btn" onClick={handleExport}>📤 导出配置</button>
            <button className="btn" onClick={handleImport}>📥 导入配置</button>
            <button className="btn btn-danger" onClick={handleClearAll}>🗑 清除所有配置</button>
          </div>

          <div style={{ marginTop: 20, padding: 12, background: 'var(--bg)', borderRadius: 'var(--radius-sm)', fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6 }}>
            <p><strong>提示：</strong></p>
            <p>• S3 存储需要 Bucket 配置 CORS 允许跨域访问</p>
            <p>• WebDAV 存储需要服务端允许 CORS 请求</p>
            <p>• 所有配置保存在浏览器本地存储中</p>
            <p>• 部署到 Cloudflare Pages / Vercel 即可使用</p>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-primary" onClick={() => setShowSettings(false)}>关闭</button>
        </div>
      </div>
    </div>
  );
};