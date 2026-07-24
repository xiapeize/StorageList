const ICON_MAP: Record<string, string> = {
  folder: '📁', image: '🖼️', video: '🎬', audio: '🎵',
  pdf: '📄', word: '📝', excel: '📊', ppt: '📽️',
  code: '💻', archive: '📦', text: '📃', file: '📄',
  exe: '⚙️', iso: '💿', torrent: '🔗', storage: '☁️', globe: '🌐'
};

export const iconEmoji = (key: string) => ICON_MAP[key] || '📄';