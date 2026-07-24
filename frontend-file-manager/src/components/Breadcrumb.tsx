import React from 'react';
import { useStore } from '../store';

export const Breadcrumb: React.FC = () => {
  const { currentPath, navigateTo } = useStore();

  const parts = currentPath === '/' ? [] : currentPath.split('/').filter(Boolean);

  return (
    <div className="breadcrumb">
      <span
        className={`breadcrumb-item ${currentPath === '/' ? 'current' : ''}`}
        onClick={() => navigateTo('/')}
      >
        🏠 根目录
      </span>
      {parts.map((part, i) => {
        const path = '/' + parts.slice(0, i + 1).join('/');
        const isLast = i === parts.length - 1;
        return (
          <React.Fragment key={path}>
            <span className="breadcrumb-sep">/</span>
            <span
              className={`breadcrumb-item ${isLast ? 'current' : ''}`}
              onClick={() => navigateTo(path)}
            >
              {part}
            </span>
          </React.Fragment>
        );
      })}
    </div>
  );
};