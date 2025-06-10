import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './Header.css';

const Header = ({ currentStep, onBackToHome }) => {
  const navigate = useNavigate();
  const location = useLocation();

  // パスに基づいてタイトルを決定
  const getPageTitle = () => {
    switch (location.pathname) {
      case '/':
        return '学習サポートアプリ';
      case '/camera':
        return 'カメラ撮影';
      case '/upload':
        return 'ファイルアップロード';
      case '/quiz':
        return 'クイズ';
      case '/history':
        return '学習履歴';
      case '/settings':
        return '設定';
      default:
        return '学習サポートアプリ';
    }
  };

  // 戻るボタンの表示判定
  const showBackButton = () => {
    return location.pathname !== '/';
  };

  // 戻る処理
  const handleBack = () => {
    if (location.pathname === '/quiz') {
      // クイズ中の場合は確認ダイアログ
      if (window.confirm('クイズを中断しますか？進行中のデータは失われます。')) {
        onBackToHome();
        navigate('/');
      }
    } else {
      navigate(-1);
    }
  };

  // ホームボタン処理
  const handleHome = () => {
    if (location.pathname === '/quiz') {
      // クイズ中の場合は確認ダイアログ
      if (window.confirm('クイズを中断しますか？進行中のデータは失われます。')) {
        onBackToHome();
        navigate('/');
      }
    } else {
      navigate('/');
    }
  };

  // 進行状況インジケーター
  const getProgressIndicator = () => {
    if (currentStep === 'camera' || location.pathname === '/camera') {
      return (
        <div className="progress-indicator">
          <div className="step active">撮影</div>
          <div className="step">処理</div>
          <div className="step">クイズ</div>
        </div>
      );
    } else if (currentStep === 'file-upload' || location.pathname === '/upload') {
      return (
        <div className="progress-indicator">
          <div className="step active">アップロード</div>
          <div className="step">処理</div>
          <div className="step">クイズ</div>
        </div>
      );
    } else if (currentStep === 'quiz-generation' || currentStep === 'quiz') {
      return (
        <div className="progress-indicator">
          <div className="step completed">準備完了</div>
          <div className="step active">
            {currentStep === 'quiz-generation' ? '処理中' : 'クイズ'}
          </div>
          <div className="step">完了</div>
        </div>
      );
    }
    return null;
  };

  return (
    <header className="app-header">
      <div className="header-content">
        {/* 左側: 戻るボタン / ホームボタン */}
        <div className="header-left">
          {showBackButton() ? (
            <button 
              className="nav-btn back-btn"
              onClick={handleBack}
              aria-label="戻る"
            >
              ← 戻る
            </button>
          ) : (
            <div className="logo-section">
              <span className="app-icon">📚</span>
            </div>
          )}
        </div>

        {/* 中央: タイトル */}
        <div className="header-center">
          <h1 className="page-title">{getPageTitle()}</h1>
          {getProgressIndicator()}
        </div>

        {/* 右側: ホームボタン / メニューボタン */}
        <div className="header-right">
          {showBackButton() ? (
            <button 
              className="nav-btn home-btn"
              onClick={handleHome}
              aria-label="ホーム"
            >
              🏠
            </button>
          ) : (
            <button 
              className="nav-btn menu-btn"
              onClick={() => navigate('/settings')}
              aria-label="設定"
            >
              ⚙️
            </button>
          )}
        </div>
      </div>

      {/* サブヘッダー（必要に応じて） */}
      {location.pathname === '/quiz' && (
        <div className="sub-header">
          <div className="quiz-info">
            <span className="quiz-subject">問題に挑戦中</span>
            <span className="quiz-hint">キーボードショートカット利用可能</span>
          </div>
        </div>
      )}

      {currentStep === 'quiz-generation' && (
        <div className="sub-header processing">
          <div className="processing-message">
            <span className="processing-text">AIが問題を生成中です...</span>
            <div className="processing-dots">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;