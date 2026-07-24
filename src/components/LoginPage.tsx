import React, { useState } from 'react';
import { api, setToken } from '../utils/api';

interface Props {
  onLogin: (username: string) => void;
}

export const LoginPage: React.FC<Props> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) return;

    setLoading(true);
    setError('');
    try {
      const res = await api.login(username.trim(), password);
      setToken(res.token);
      onLogin(res.username);
    } catch (err) {
      setError(err instanceof Error ? err.message : '登录失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      height: '100vh', background: 'var(--bg)',
    }}>
      <div style={{
        background: 'var(--bg-white)', borderRadius: 12,
        boxShadow: 'var(--shadow-lg)', padding: '32px 36px',
        width: 380, maxWidth: '90vw',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{
            width: 48, height: 48, background: 'var(--primary)',
            borderRadius: 10, display: 'inline-flex', alignItems: 'center',
            justifyContent: 'center', color: 'white', fontSize: 24, fontWeight: 700,
          }}>
            F
          </div>
          <h2 style={{ marginTop: 12, fontSize: 20, fontWeight: 600 }}>FileManager</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>
            登录以管理你的存储
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>用户名</label>
            <input
              className="form-input"
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="admin"
              autoFocus
            />
          </div>
          <div className="form-group">
            <label>密码</label>
            <input
              className="form-input"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="p@ssw0rd"
            />
          </div>

          {error && (
            <div style={{
              color: 'var(--danger)', fontSize: 13, marginBottom: 12,
              padding: '8px 12px', background: '#fef2f2', borderRadius: 6,
            }}>
              {error}
            </div>
          )}

          <button
            className="btn btn-primary"
            type="submit"
            disabled={loading || !username.trim() || !password}
            style={{ width: '100%', padding: '10px 0', fontSize: 14 }}
          >
            {loading ? '登录中...' : '登 录'}
          </button>
        </form>
      </div>
    </div>
  );
};