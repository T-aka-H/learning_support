import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Service Worker の登録
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('SW registered: ', registration);
        
        // 更新があった場合の処理
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed') {
              if (navigator.serviceWorker.controller) {
                // 新しいバージョンが利用可能
                showUpdateAvailableNotification();
              } else {
                // 初回インストール完了
                showInstallSuccessNotification();
              }
            }
          });
        });
      })
      .catch((registrationError) => {
        console.log('SW registration failed: ', registrationError);
      });
  });
}

// アップデート通知を表示
function showUpdateAvailableNotification() {
  // 更新通知のスナックバーを表示
  const notification = document.createElement('div');
  notification.className = 'update-notification';
  notification.innerHTML = `
    <div class="notification-content">
      <span>🆕 新しいバージョンが利用可能です</span>
      <button onclick="updateApp()" class="update-btn">更新</button>
      <button onclick="dismissNotification()" class="dismiss-btn">後で</button>
    </div>
  `;
  
  // スタイルを追加
  if (!document.getElementById('notification-styles')) {
    const styles = document.createElement('style');
    styles.id = 'notification-styles';
    styles.textContent = `
      .update-notification {
        position: fixed;
        bottom: 20px;
        left: 20px;
        right: 20px;
        background-color: #007bff;
        color: white;
        padding: 16px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        z-index: 10000;
        animation: slideUp 0.3s ease;
      }
      
      .notification-content {
        display: flex;
        align-items: center;
        gap: 12px;
        flex-wrap: wrap;
      }
      
      .notification-content span {
        flex: 1;
        min-width: 200px;
      }
      
      .update-btn, .dismiss-btn {
        padding: 8px 16px;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-weight: 500;
      }
      
      .update-btn {
        background-color: white;
        color: #007bff;
      }
      
      .dismiss-btn {
        background-color: rgba(255, 255, 255, 0.2);
        color: white;
      }
      
      @keyframes slideUp {
        from {
          transform: translateY(100%);
          opacity: 0;
        }
        to {
          transform: translateY(0);
          opacity: 1;
        }
      }
      
      @media (max-width: 600px) {
        .update-notification {
          left: 10px;
          right: 10px;
          bottom: 10px;
        }
        
        .notification-content {
          flex-direction: column;
          align-items: stretch;
          text-align: center;
        }
        
        .notification-content span {
          min-width: auto;
          margin-bottom: 8px;
        }
      }
    `;
    document.head.appendChild(styles);
  }
  
  document.body.appendChild(notification);
  
  // グローバル関数として追加
  window.updateApp = () => {
    // Service Worker に更新を通知
    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ type: 'SKIP_WAITING' });
    }
    
    // ページをリロード
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };
  
  window.dismissNotification = () => {
    notification.remove();
  };
  
  // 10秒後に自動で非表示
  setTimeout(() => {
    if (document.body.contains(notification)) {
      notification.remove();
    }
  }, 10000);
}

// インストール成功通知
function showInstallSuccessNotification() {
  console.log('学習サポートアプリがオフライン対応になりました！');
  
  // 初回インストール時のみ簡単な通知
  const notification = document.createElement('div');
  notification.className = 'install-notification';
  notification.innerHTML = `
    <div class="notification-content">
      <span>✅ オフライン対応が有効になりました</span>
      <button onclick="this.parentElement.parentElement.remove()" class="dismiss-btn">OK</button>
    </div>
  `;
  
  // インストール通知用のスタイル
  if (!document.getElementById('install-notification-styles')) {
    const styles = document.createElement('style');
    styles.id = 'install-notification-styles';
    styles.textContent = `
      .install-notification {
        position: fixed;
        top: 20px;
        right: 20px;
        background-color: #28a745;
        color: white;
        padding: 12px 16px;
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
        z-index: 10000;
        animation: slideDown 0.3s ease;
        max-width: 300px;
      }
      
      .install-notification .notification-content {
        display: flex;
        align-items: center;
        gap: 12px;
        font-size: 14px;
      }
      
      .install-notification .dismiss-btn {
        padding: 4px 8px;
        border: none;
        border-radius: 4px;
        background-color: rgba(255, 255, 255, 0.2);
        color: white;
        cursor: pointer;
        font-size: 12px;
      }
      
      @keyframes slideDown {
        from {
          transform: translateY(-100%);
          opacity: 0;
        }
        to {
          transform: translateY(0);
          opacity: 1;
        }
      }
    `;
    document.head.appendChild(styles);
  }
  
  document.body.appendChild(notification);
  
  // 5秒後に自動で非表示
  setTimeout(() => {
    if (document.body.contains(notification)) {
      notification.remove();
    }
  }, 5000);
}

// PWA インストールプロンプトの処理
let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
  console.log('PWA install prompt available');
  
  // デフォルトのプロンプトを防ぐ
  e.preventDefault();
  
  // 後で使用するためにイベントを保存
  deferredPrompt = e;
  
  // カスタムインストールボタンを表示
  showCustomInstallButton();
});

function showCustomInstallButton() {
  // 既存のボタンがあれば削除
  const existingButton = document.getElementById('pwa-install-button');
  if (existingButton) {
    existingButton.remove();
  }
  
  // ローカルストレージでインストールプロンプトの表示状態をチェック
  const installDismissed = localStorage.getItem('pwa-install-dismissed');
  const installCount = parseInt(localStorage.getItem('pwa-install-prompt-count') || '0');
  
  // 3回以上表示している、または明示的に拒否されている場合はスキップ
  if (installDismissed === 'true' || installCount >= 3) {
    return;
  }
  
  const installButton = document.createElement('div');
  installButton.id = 'pwa-install-button';
  installButton.className = 'pwa-install-prompt';
  installButton.innerHTML = `
    <div class="install-content">
      <div class="install-info">
        <strong>📱 アプリとして追加</strong>
        <p>ホーム画面に追加してより便利に学習できます</p>
      </div>
      <div class="install-actions">
        <button onclick="installPWA()" class="install-btn">追加</button>
        <button onclick="dismissInstallPrompt()" class="dismiss-btn">後で</button>
      </div>
    </div>
  `;
  
  // インストールプロンプト用のスタイル
  if (!document.getElementById('pwa-install-styles')) {
    const styles = document.createElement('style');
    styles.id = 'pwa-install-styles';
    styles.textContent = `
      .pwa-install-prompt {
        position: fixed;
        bottom: 80px;
        left: 20px;
        right: 20px;
        background-color: white;
        border: 1px solid #ddd;
        border-radius: 12px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
        z-index: 1000;
        animation: slideUp 0.4s ease;
        max-width: 400px;
        margin: 0 auto;
      }
      
      .install-content {
        padding: 20px;
      }
      
      .install-info {
        margin-bottom: 16px;
      }
      
      .install-info strong {
        color: #333;
        font-size: 16px;
      }
      
      .install-info p {
        margin: 4px 0 0 0;
        color: #666;
        font-size: 14px;
        line-height: 1.4;
      }
      
      .install-actions {
        display: flex;
        gap: 12px;
      }
      
      .install-btn {
        flex: 1;
        padding: 12px;
        background-color: #007bff;
        color: white;
        border: none;
        border-radius: 6px;
        font-weight: 500;
        cursor: pointer;
      }
      
      .install-btn:hover {
        background-color: #0056b3;
      }
      
      .dismiss-btn {
        flex: 1;
        padding: 12px;
        background-color: #f8f9fa;
        color: #666;
        border: 1px solid #ddd;
        border-radius: 6px;
        cursor: pointer;
      }
      
      .dismiss-btn:hover {
        background-color: #e9ecef;
      }
      
      .dark-theme .pwa-install-prompt {
        background-color: #2d2d2d;
        border-color: #495057;
      }
      
      .dark-theme .install-info strong {
        color: #fff;
      }
      
      .dark-theme .install-info p {
        color: #adb5bd;
      }
      
      .dark-theme .dismiss-btn {
        background-color: #495057;
        color: #adb5bd;
        border-color: #6c757d;
      }
    `;
    document.head.appendChild(styles);
  }
  
  document.body.appendChild(installButton);
  
  // プロンプト表示回数をカウント
  localStorage.setItem('pwa-install-prompt-count', (installCount + 1).toString());
  
  // グローバル関数として追加
  window.installPWA = async () => {
    if (deferredPrompt) {
      // インストールプロンプトを表示
      deferredPrompt.prompt();
      
      // ユーザーの選択を待つ
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('PWA install accepted');
      } else {
        console.log('PWA install dismissed');
      }
      
      // プロンプトをクリア
      deferredPrompt = null;
    }
    
    // ボタンを削除
    document.getElementById('pwa-install-button')?.remove();
  };
  
  window.dismissInstallPrompt = () => {
    // 明示的に拒否された場合は記録
    localStorage.setItem('pwa-install-dismissed', 'true');
    document.getElementById('pwa-install-button')?.remove();
  };
  
  // 30秒後に自動で非表示（ただし拒否としては記録しない）
  setTimeout(() => {
    const button = document.getElementById('pwa-install-button');
    if (button) {
      button.style.animation = 'slideDown 0.3s ease forwards';
      setTimeout(() => button.remove(), 300);
    }
  }, 30000);
}

// PWA がインストールされた後の処理
window.addEventListener('appinstalled', (evt) => {
  console.log('PWA was installed');
  
  // インストール完了通知
  showInstallSuccessNotification();
  
  // インストールプロンプトを非表示
  const installButton = document.getElementById('pwa-install-button');
  if (installButton) {
    installButton.remove();
  }
  
  // 設定をクリア
  localStorage.removeItem('pwa-install-dismissed');
  localStorage.removeItem('pwa-install-prompt-count');
});

// オンライン/オフライン状態の監視
window.addEventListener('online', () => {
  console.log('Online');
  showConnectionStatus('online');
});

window.addEventListener('offline', () => {
  console.log('Offline');
  showConnectionStatus('offline');
});

function showConnectionStatus(status) {
  // 既存の通知があれば削除
  const existingNotification = document.getElementById('connection-status');
  if (existingNotification) {
    existingNotification.remove();
  }
  
  const notification = document.createElement('div');
  notification.id = 'connection-status';
  notification.className = `connection-notification ${status}`;
  notification.innerHTML = `
    <div class="connection-content">
      ${status === 'online' ? '🌐 オンライン' : '📱 オフライン'}
      <span>${status === 'online' ? '接続が復旧しました' : 'オフラインモードで動作中'}</span>
    </div>
  `;
  
  // 接続ステータス通知用のスタイル
  if (!document.getElementById('connection-status-styles')) {
    const styles = document.createElement('style');
    styles.id = 'connection-status-styles';
    styles.textContent = `
      .connection-notification {
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        padding: 12px 20px;
        border-radius: 20px;
        color: white;
        font-weight: 500;
        z-index: 10000;
        animation: slideDown 0.3s ease;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
      }
      
      .connection-notification.online {
        background-color: #28a745;
      }
      
      .connection-notification.offline {
        background-color: #ffc107;
        color: #212529;
      }
      
      .connection-content {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 14px;
      }
      
      @keyframes slideDown {
        from {
          transform: translateX(-50%) translateY(-100%);
          opacity: 0;
        }
        to {
          transform: translateX(-50%) translateY(0);
          opacity: 1;
        }
      }
      
      @keyframes slideUp {
        from {
          transform: translateX(-50%) translateY(0);
          opacity: 1;
        }
        to {
          transform: translateX(-50%) translateY(-100%);
          opacity: 0;
        }
      }
    `;
    document.head.appendChild(styles);
  }
  
  document.body.appendChild(notification);
  
  // 3秒後に自動で非表示
  setTimeout(() => {
    if (document.body.contains(notification)) {
      notification.style.animation = 'slideUp 0.3s ease forwards';
      setTimeout(() => notification.remove(), 300);
    }
  }, 3000);
}

// パフォーマンス測定
if (typeof reportWebVitals === 'function') {
  reportWebVitals((metric) => {
    // Web Vitals の測定結果をコンソールに出力
    console.log(metric);
    
    // 必要に応じてアナリティクスに送信
    // sendToAnalytics(metric);
  });
}

// デバッグ用の関数（開発時のみ）
if (process.env.NODE_ENV === 'development') {
  window.clearAllCaches = async () => {
    try {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(name => caches.delete(name)));
      console.log('All caches cleared');
      
      if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({ type: 'CLEAR_CACHE' });
      }
    } catch (error) {
      console.error('Error clearing caches:', error);
    }
  };
  
  window.getSWVersion = () => {
    if (navigator.serviceWorker.controller) {
      const channel = new MessageChannel();
      channel.port1.onmessage = (event) => {
        console.log('SW Version:', event.data.version);
      };
      navigator.serviceWorker.controller.postMessage(
        { type: 'GET_VERSION' }, 
        [channel.port2]
      );
    }
  };
  
  window.testNotification = () => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('テスト通知', {
        body: '学習サポートアプリからのテスト通知です',
        icon: '/logo192.png',
        tag: 'test-notification'
      });
    } else {
      console.log('通知が許可されていません');
    }
  };
}

// エラーハンドリング
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
  
  // 重要なエラーの場合はユーザーに通知
  if (event.error && event.error.name === 'ChunkLoadError') {
    showChunkLoadErrorNotification();
  }
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  
  // Promise の拒否を防ぐ
  event.preventDefault();
});

function showChunkLoadErrorNotification() {
  const notification = document.createElement('div');
  notification.className = 'error-notification';
  notification.innerHTML = `
    <div class="error-content">
      <strong>⚠️ 読み込みエラー</strong>
      <p>アプリの更新中にエラーが発生しました。ページを再読み込みしてください。</p>
      <button onclick="window.location.reload()" class="reload-btn">🔄 再読み込み</button>
    </div>
  `;
  
  // エラー通知用のスタイル
  if (!document.getElementById('error-notification-styles')) {
    const styles = document.createElement('style');
    styles.id = 'error-notification-styles';
    styles.textContent = `
      .error-notification {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background-color: #dc3545;
        color: white;
        padding: 24px;
        border-radius: 12px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        z-index: 10001;
        max-width: 400px;
        text-align: center;
      }
      
      .error-content strong {
        display: block;
        margin-bottom: 8px;
        font-size: 16px;
      }
      
      .error-content p {
        margin: 0 0 16px 0;
        font-size: 14px;
        line-height: 1.5;
      }
      
      .reload-btn {
        background-color: white;
        color: #dc3545;
        border: none;
        padding: 10px 20px;
        border-radius: 6px;
        font-weight: 500;
        cursor: pointer;
      }
      
      .reload-btn:hover {
        background-color: #f8f9fa;
      }
    `;
    document.head.appendChild(styles);
  }
  
  document.body.appendChild(notification);
}

// ページの可視性変更を監視（バックグラウンド同期用）
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') {
    console.log('Page became visible');
    // ページが再び表示された時の処理
  } else {
    console.log('Page became hidden');
    // ページが非表示になった時の処理
  }
});

console.log('学習サポートアプリが正常に起動しました');