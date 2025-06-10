import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './Navigation.css';

const Navigation = ({ currentStep }) => {
  const navigate = useNavigate();
  const location = useLocation();

  // ナビゲーションアイテムの定義
  const navItems = [
    {
      id: 'home',
      label: 'ホーム',
      icon: '🏠',
      path: '/',
      description: 'メインページ'
    },
    {
      id: 'camera',
      label: 'カメラ',
      icon: '📷',
      path: '/camera',
      description: 'カメラで撮影'
    },
    {
      id: 'upload',
      label: 'アップロード',
      icon: '📁',
      path: '/upload',
      description: 'ファイルをアップロード'
    },
    {
      id: 'history',
      label: '履歴',
      icon: '📊',
      path: '/history',
      description: '学習履歴を確認'
    },
    {
      id: 'settings',
      label: '設定',
      icon: '⚙️',
      path: '/settings',
      description: 'アプリ設定'
    }
  ];

  // アクティブ状態の判定
  const isActive = (path) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  // ナビゲーション処理
  const handleNavigation = (path) => {
    // クイズ中の場合は確認ダイアログ
    if (location.pathname === '/quiz' && path !== '/quiz') {
      if (window.confirm('クイズを中断しますか？進行中のデータは失われます。')) {
        navigate(path);
      }
      return;
    }
    
    navigate(path);
  };

  // クイズ画面では非表示
  if (location.pathname === '/quiz') {
    return null;
  }

  return (
    <nav className="bottom-navigation">
      <div className="nav-container">
        {navItems.map((item) => (
          <button
            key={item.id}
            className={`nav-item ${isActive(item.path) ? 'active' : ''}`}
            onClick={() => handleNavigation(item.path)}
            aria-label={item.description}
            title={item.description}
          >
            <div className="nav-icon">
              {item.icon}
              {isActive(item.path) && <div className="active-indicator"></div>}
            </div>
            <span className="nav-label">{item.label}</span>
          </button>
        ))}
      </div>
      
      {/* 進行状況インジケーター（プロセス中のみ） */}
      {(currentStep === 'quiz-generation' || currentStep === 'processing') && (
        <div className="process-indicator">
          <div className="process-bar">
            <div className="process-fill"></div>
          </div>
          <span className="process-text">
            {currentStep === 'quiz-generation' ? '問題生成中...' : '処理中...'}
          </span>
        </div>
      )}
    </nav>
  );
};

export default Navigation;