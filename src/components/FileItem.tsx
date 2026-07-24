import React from 'react';
import type { FileItem as FileItemType } from '../drivers/types';
import { formatFileSize, formatDate, getFileIcon } from '../utils/format';
import { iconEmoji } from './icons';

interface Props {
  item: FileItemType;
  viewMode: 'list' | 'grid';
  selected: boolean;
  onSelect: (id: string, e: React.MouseEvent) => void;
  onContextMenu: (e: React.MouseEvent, item: FileItemType) => void;
  onDoubleClick: (item: FileItemType) => void;
}

export const FileItem: React.FC<Props> = React.memo(({
  item, viewMode, selected, onSelect, onContextMenu, onDoubleClick
}) => {
  const iconKey = getFileIcon(item.name, item.isDir);

  if (viewMode === 'grid') {
    return (
      <div
        className={`file-card ${selected ? 'selected' : ''}`}
        onClick={(e) => onSelect(item.id, e)}
        onContextMenu={(e) => onContextMenu(e, item)}
        onDoubleClick={() => onDoubleClick(item)}
      >
        <div className={`card-icon ${iconKey}`}>{iconEmoji(iconKey)}</div>
        <div className="card-name">{item.name}</div>
      </div>
    );
  }

  return (
    <div
      className={`file-row ${selected ? 'selected' : ''}`}
      onClick={(e) => onSelect(item.id, e)}
      onContextMenu={(e) => onContextMenu(e, item)}
      onDoubleClick={() => onDoubleClick(item)}
    >
      <div className="file-check">
        <input
          type="checkbox"
          checked={selected}
          onChange={() => {}}
          onClick={(e) => e.stopPropagation()}
        />
      </div>
      <div className="file-icon">
        <span className={`icon ${iconKey}`}>{iconEmoji(iconKey)}</span>
        <span className="file-name">{item.name}</span>
      </div>
      <div className="file-size">{item.isDir ? '-' : formatFileSize(item.size)}</div>
      <div className="file-date">{formatDate(item.modified)}</div>
    </div>
  );
});