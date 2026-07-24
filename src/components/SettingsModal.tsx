import React, { useState } from 'react';
import { useStore } from '../store';
import { api } from '../utils/api';

export const SettingsModal: React.FC = () => {
  const { showSettings, setShowSettings, storages, removeStorage, username, logout } = useStore();
  const [showPassword, setShowPassword] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState('');
  const [pwLoading, setPwLoading] = useState(false);

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
          await api.saveConfig(configs);
          alert('配置已导入，请刷新页面');
          window.location.reload();
        }
      } catch {
        alert('导入失败：无效的配置文件');
      }
    };
    input.click();
  };

  const handleClearAll = async () => {
    if (confirm('确定要清除所有配置？此操作不可恢复！')) {
      try {
        await api.saveConfig([]);
        window.location.reload();
      } catch {
        alert('清除失败');
      }
    }
  };

  const handleChangePassword = async () => {
    if (!oldPassword || !newPassword) {
      setPwError('请填写所有字段');
      return;
    }
    setPwLoading(true);
    setPwError('');
    setPwSuccess('');
    try {
      await api.changePassword(oldPassword, newPassword);
      setPwSuccess('密码修改成功');
      setOldPassword('');
      setNewPassword('');
    } catch (e) {
      setPwError(e instanceof Error ? e.message : '修改失败');
    } finally {
      setPwLoading(false);
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
          {/* 账户信息 */}
          <div style={{ marginBottom: 20, padding: 12, background: 'var(--bg)', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontWeight: 500 }}>当前账户：</span>
                <span style={{ color: 'var(--primary)' }}>{username}</span>
              </div>
              <button className="btn btn-sm" onClick={logout}>退出登录</button>
            </div>
            {!showPassword ? (
              <button
                className="btn btn-sm"
                style={{ marginTop: 8 }}
                onClick={() => setShowPassword(true)}
              >
                修改密码
              </button>
            ) : (
              <div style={{ marginTop: 12 }}>
                <div className="form-group">
                  <label>旧密码</label>
                  <input
                    className="form-input"
                    type="password"
                    value={oldPassword}
                    onChange={e => setOldPassword(e.target.value)}
                    placeholder="当前密码"
                  />
                </div>
                <div className="form-group">
                  <label>新密码</label>
                  <input
                    className="form-input"
                    type="password"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="新密码（至少4位）"
                  />
                </div>
                {pwError && <div style={{ color: 'var(--danger)', fontSize: 12, marginBottom: 8 }}>{pwError}</div>}
                {pwSuccess && <div style={{ color: 'var(--success)', fontSize: 12, marginBottom: 8 }}>{pwSuccess}</div>}
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-sm" onClick={() => { setShowPassword(false); setPwError(''); setPwSuccess(''); }}>
                    取消
                  </button>
                  <button className="btn btn-sm btn-primary" onClick={handleChangePassword} disabled={pwLoading}>
                    {pwLoading ? '修改中...' : '确认修改'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 存储管理 */}
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

          {/* 数据管理 */}
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
            <p>• 所有配置保存在服务端，多设备自动同步</p>
            <p>• 部署到 Vercel (含 API) 或 Cloudflare Pages 即可使用</p>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-primary" onClick={() => setShowSettings(false)}>关闭</button>
        </div>
      </div>
    </div>
  );
};