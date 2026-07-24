import React, { useEffect } from 'react';
import { useStore } from './store';
import { Sidebar } from './components/Sidebar';
import { Toolbar } from './components/Toolbar';
import { Breadcrumb } from './components/Breadcrumb';
import { FileList } from './components/FileList';
import { AddStorageModal } from './components/AddStorageModal';
import { SettingsModal } from './components/SettingsModal';
import { PreviewModal } from './components/PreviewModal';
import './styles/global.css';

const App: React.FC = () => {
  const loadStorages = useStore(s => s.loadStorages);

  useEffect(() => {
    loadStorages();
  }, []);

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <Toolbar />
        <Breadcrumb />
        <FileList />
      </main>
      <AddStorageModal />
      <SettingsModal />
      <PreviewModal />
    </div>
  );
};

export default App;