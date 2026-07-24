import React, { useEffect } from 'react';
import { useStore } from './store';
import { getToken } from './utils/api';
import { LoginPage } from './components/LoginPage';
import { Sidebar } from './components/Sidebar';
import { Toolbar } from './components/Toolbar';
import { Breadcrumb } from './components/Breadcrumb';
import { FileList } from './components/FileList';
import { AddStorageModal } from './components/AddStorageModal';
import { SettingsModal } from './components/SettingsModal';
import { PreviewModal } from './components/PreviewModal';
import './styles/global.css';

const App: React.FC = () => {
  const { isLoggedIn, login, loadStorages } = useStore();

  useEffect(() => {
    // 检查本地 token 自动登录
    if (getToken()) {
      login('admin');
      loadStorages();
    }
  }, []);

  useEffect(() => {
    if (isLoggedIn) {
      loadStorages();
    }
  }, [isLoggedIn]);

  if (!isLoggedIn) {
    return <LoginPage onLogin={(username) => {
      login(username);
    }} />;
  }

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