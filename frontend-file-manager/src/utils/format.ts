export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 2)} ${units[i]}`;
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return `今天 ${d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`;
  if (days === 1) return `昨天 ${d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`;
  return d.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' }) + ' ' +
    d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
}

export function getFileIcon(name: string, isDir: boolean): string {
  if (isDir) return 'folder';
  const ext = name.split('.').pop()?.toLowerCase() || '';
  const iconMap: Record<string, string> = {
    // 图片
    jpg: 'image', jpeg: 'image', png: 'image', gif: 'image', webp: 'image', svg: 'image', bmp: 'image', ico: 'image',
    // 视频
    mp4: 'video', mkv: 'video', avi: 'video', mov: 'video', wmv: 'video', flv: 'video', webm: 'video',
    // 音频
    mp3: 'audio', wav: 'audio', flac: 'audio', aac: 'audio', ogg: 'audio', wma: 'audio',
    // 文档
    pdf: 'pdf', doc: 'word', docx: 'word', xls: 'excel', xlsx: 'excel', ppt: 'ppt', pptx: 'ppt',
    txt: 'text', md: 'text', csv: 'text', json: 'code', xml: 'code', html: 'code', css: 'code',
    js: 'code', ts: 'code', jsx: 'code', tsx: 'code', py: 'code', java: 'code', go: 'code', rs: 'code',
    c: 'code', cpp: 'code', h: 'code', php: 'code', rb: 'code', swift: 'code', kt: 'code',
    // 压缩
    zip: 'archive', rar: 'archive', '7z': 'archive', tar: 'archive', gz: 'archive', bz2: 'archive', xz: 'archive',
    // 可执行
    exe: 'exe', msi: 'exe', apk: 'exe', dmg: 'exe', appimage: 'exe',
    // 其他
    iso: 'iso', torrent: 'torrent',
  };
  return iconMap[ext] || 'file';
}

export function getMimeType(name: string): string {
  const ext = name.split('.').pop()?.toLowerCase() || '';
  const mimeMap: Record<string, string> = {
    jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif', webp: 'image/webp',
    svg: 'image/svg+xml', bmp: 'image/bmp',
    mp4: 'video/mp4', mkv: 'video/x-matroska', webm: 'video/webm',
    mp3: 'audio/mpeg', wav: 'audio/wav', flac: 'audio/flac', ogg: 'audio/ogg',
    pdf: 'application/pdf',
    doc: 'application/msword', docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xls: 'application/vnd.ms-excel', xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ppt: 'application/vnd.ms-powerpoint', pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    txt: 'text/plain', md: 'text/markdown', csv: 'text/csv', json: 'application/json',
    html: 'text/html', css: 'text/css', js: 'application/javascript', xml: 'application/xml',
    zip: 'application/zip', rar: 'application/x-rar-compressed', '7z': 'application/x-7z-compressed',
    tar: 'application/x-tar', gz: 'application/gzip',
  };
  return mimeMap[ext] || 'application/octet-stream';
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
}

export function joinPath(...parts: string[]): string {
  return parts
    .map(p => p.replace(/^\/+|\/+$/g, ''))
    .filter(Boolean)
    .join('/');
}

export function parentPath(path: string): string {
  const parts = path.replace(/\/+$/, '').split('/');
  parts.pop();
  return parts.join('/') || '/';
}

export function fileName(path: string): string {
  return path.replace(/\/+$/, '').split('/').pop() || '';
}