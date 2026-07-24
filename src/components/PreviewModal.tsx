import React, { useEffect, useState } from 'react';
import { useStore } from '../store';
import { getMimeType } from '../utils/format';

export const PreviewModal: React.FC = () => {
  const { previewFile, setPreviewFile, getActiveDriver } = useStore();
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!previewFile) {
      setUrl(null);
      return;
    }

    const driver = getActiveDriver();
    if (!driver) return;

    setLoading(true);
    driver.getDownloadUrl(previewFile)
      .then(setUrl)
      .catch(() => setUrl(null))
      .finally(() => setLoading(false));
  }, [previewFile]);

  if (!previewFile) return null;

  const mime = previewFile.mimeType || getMimeType(previewFile.name);
  const isImage = mime.startsWith('image/');
  const isVideo = mime.startsWith('video/');
  const isAudio = mime.startsWith('audio/');
  const isPDF = mime === 'application/pdf';

  const handleBackdrop = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) setPreviewFile(null);
  };

  return (
    <div className="preview-overlay" onClick={handleBackdrop}>
      <button className="preview-close" onClick={() => setPreviewFile(null)}>×</button>
      <div className="preview-content" onClick={e => e.stopPropagation()}>
        {loading && <div className="loading-overlay"><div className="spinner" />加载中...</div>}
        {url && isImage && <img src={url} alt={previewFile.name} />}
        {url && isVideo && (
          <video controls autoPlay style={{ maxWidth: '90vw', maxHeight: '85vh' }}>
            <source src={url} type={mime} />
          </video>
        )}
        {url && isAudio && (
          <audio controls autoPlay style={{ minWidth: 300 }}>
            <source src={url} type={mime} />
          </audio>
        )}
        {url && isPDF && (
          <iframe src={url} style={{ width: '80vw', height: '85vh', border: 'none', borderRadius: 4 }} />
        )}
        {url && !isImage && !isVideo && !isAudio && !isPDF && (
          <div style={{ color: 'white', textAlign: 'center' }}>
            <p style={{ fontSize: 18, marginBottom: 12 }}>{previewFile.name}</p>
            <p style={{ color: '#aaa' }}>不支持预览此文件类型</p>
            <a href={url} target="_blank" className="btn btn-primary" style={{ marginTop: 16, display: 'inline-flex' }}>
              下载文件
            </a>
          </div>
        )}
      </div>
    </div>
  );
};