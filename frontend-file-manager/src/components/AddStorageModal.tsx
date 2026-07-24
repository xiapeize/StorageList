import React, { useState } from 'react';
import { useStore } from '../store';
import { STORAGE_TYPES } from '../drivers/registry';
import type { StorageType } from '../drivers/types';

export const AddStorageModal: React.FC = () => {
  const { showAddStorage, setShowAddStorage, addStorage } = useStore();
  const [step, setStep] = useState<'type' | 'config'>('type');
  const [selectedType, setSelectedType] = useState<StorageType>('s3');
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [name, setName] = useState('');

  if (!showAddStorage) return null;

  const typeInfo = STORAGE_TYPES.find(t => t.type === selectedType);

  const handleSubmit = () => {
    if (!name.trim()) return;
    addStorage({
      name: name.trim(),
      type: selectedType,
      config: formData,
      mountPath: '/',
    });
    // 重置
    setStep('type');
    setFormData({});
    setName('');
  };

  const handleBackdrop = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setShowAddStorage(false);
      setStep('type');
    }
  };

  return (
    <div className="modal-overlay" onClick={handleBackdrop}>
      <div className="modal">
        <div className="modal-header">
          <h3>添加存储</h3>
          <button className="modal-close" onClick={() => { setShowAddStorage(false); setStep('type'); }}>×</button>
        </div>
        <div className="modal-body">
          {step === 'type' ? (
            <>
              <div className="form-group">
                <label>挂载名称 <span className="required">*</span></label>
                <input
                  className="form-input"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="例如：我的 S3 存储"
                />
              </div>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>存储类型</label>
              <div className="storage-type-grid">
                {STORAGE_TYPES.map(t => (
                  <div
                    key={t.type}
                    className={`storage-type-card ${selectedType === t.type ? 'selected' : ''}`}
                    onClick={() => setSelectedType(t.type)}
                  >
                    <div className="type-icon">{t.type === 's3' ? '☁️' : '🌐'}</div>
                    <div className="type-label">{t.label}</div>
                    <div className="type-desc">{t.description}</div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <>
              <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <button className="btn btn-sm" onClick={() => setStep('type')}>← 返回</button>
                <span style={{ fontWeight: 500 }}>{typeInfo?.label}</span>
              </div>
              {typeInfo?.fields.map(field => (
                <div className="form-group" key={field.key}>
                  <label>
                    {field.label}
                    {field.required && <span className="required">*</span>}
                  </label>
                  {field.type === 'select' ? (
                    <select
                      className="form-select"
                      value={formData[field.key] || ''}
                      onChange={e => setFormData(prev => ({ ...prev, [field.key]: e.target.value }))}
                    >
                      {field.options?.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      className="form-input"
                      type={field.type}
                      value={formData[field.key] || ''}
                      onChange={e => setFormData(prev => ({ ...prev, [field.key]: e.target.value }))}
                      placeholder={field.placeholder}
                    />
                  )}
                </div>
              ))}
            </>
          )}
        </div>
        <div className="modal-footer">
          {step === 'type' ? (
            <>
              <button className="btn" onClick={() => setShowAddStorage(false)}>取消</button>
              <button className="btn btn-primary" onClick={() => setStep('config')} disabled={!name.trim()}>
                下一步
              </button>
            </>
          ) : (
            <>
              <button className="btn" onClick={() => setStep('type')}>上一步</button>
              <button className="btn btn-primary" onClick={handleSubmit}>添加</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};