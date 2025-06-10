import React, { useState, useEffect } from 'react';
import { StorageService } from '../../services/storage';
import './Settings.css';

const Settings = ({ settings, onSettingsChange }) => {
  const [localSettings, setLocalSettings] = useState(settings);
  const [activeSection, setActiveSection] = useState('general');
  const [showResetModal, setShowResetModal] = useState(false);
  const [apiConfig, setApiConfig] = useState(null);

  useEffect(() => {
    setLocalSettings(settings);
    loadApiConfig();
  }, [settings]);

  const loadApiConfig = async () => {
    try {
      const response = await fetch('/api/questions/config');
      if (response.ok) {
        const config = await response.json();
        setApiConfig(config);
      }
    } catch (error) {
      console.error('Failed to load API config:', error);
    }
  };

  const handleSettingChange = (key, value) => {
    const newSettings = { ...localSettings, [key]: value };
    setLocalSettings(newSettings);
    onSettingsChange(newSettings);
  };

  const handleResetSettings = () => {
    const defaultSettings = {
      subject: 'auto',
      difficulty: 'standard',
      theme: 'light',
      autoSave: true,
      showExplanations: true
    };
    setLocalSettings(defaultSettings);
    onSettingsChange(defaultSettings);
    setShowResetModal(false);
  };

  const testApiConnection = async () => {
    try {
      const response = await fetch('/api/questions/sample/certification?difficulty=basic');
      if (response.ok) {
        alert('✅ API接続テストが成功しました！');
      } else {
        alert('❌ API接続テストが失敗しました。');
      }
    } catch (error) {
      alert('❌ API接続エラーが発生しました。');
    }
  };

  const getStorageInfo = () => {
    const usage = StorageService.getStorageUsage();
    return usage || { total: { sizeFormatted: '不明' } };
  };

  return (
    <div className="settings">
      <div className="settings-header">
        <h1>⚙️ 設定</h1>
        <button 
          className="btn btn-outline"
          onClick={() => setShowResetModal(true)}
        >
          🔄 設定をリセット
        </button>
      </div>

      {/* セクションナビゲーション */}
      <div className="section-navigation">
        <button 
          className={`section-btn ${activeSection === 'general' ? 'active' : ''}`}
          onClick={() => setActiveSection('general')}
        >
          🎛️ 一般設定
        </button>
        <button 
          className={`section-btn ${activeSection === 'learning' ? 'active' : ''}`}
          onClick={() => setActiveSection('learning')}
        >
          📚 学習設定
        </button>
        <button 
          className={`section-btn ${activeSection === 'appearance' ? 'active' : ''}`}
          onClick={() => setActiveSection('appearance')}
        >
          🎨 外観設定
        </button>
        <button 
          className={`section-btn ${activeSection === 'advanced' ? 'active' : ''}`}
          onClick={() => setActiveSection('advanced')}
        >
          🔧 詳細設定
        </button>
      </div>

      {/* 一般設定 */}
      {activeSection === 'general' && (
        <div className="settings-section">
          <div className="setting-group">
            <h3>🎯 デフォルト学習設定</h3>
            <p>新しい学習セッションで使用される初期設定です。</p>
            
            <div className="setting-item">
              <label className="setting-label">
                <span className="label-text">デフォルト分野</span>
                <span className="label-description">
                  問題生成時に使用される分野の初期値
                </span>
              </label>
              <select
                value={localSettings.subject}
                onChange={(e) => handleSettingChange('subject', e.target.value)}
                className="setting-select"
              >
                {apiConfig?.subjects && Object.entries(apiConfig.subjects).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>

            <div className="setting-item">
              <label className="setting-label">
                <span className="label-text">デフォルト難易度</span>
                <span className="label-description">
                  問題生成時に使用される難易度の初期値
                </span>
              </label>
              <select
                value={localSettings.difficulty}
                onChange={(e) => handleSettingChange('difficulty', e.target.value)}
                className="setting-select"
              >
                {apiConfig?.difficulties && Object.entries(apiConfig.difficulties).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="setting-group">
            <h3>💾 データ設定</h3>
            <p>学習データの保存と管理に関する設定です。</p>
            
            <div className="setting-item">
              <label className="setting-label">
                <span className="label-text">自動保存</span>
                <span className="label-description">
                  学習結果を自動的に履歴に保存する
                </span>
              </label>
                  type="checkbox"
                  id="showExplanations"
                  checked={localSettings.showExplanations}
                  onChange={(e) => handleSettingChange('showExplanations', e.target.checked)}
                />
                <label htmlFor="showExplanations" className="toggle-label">
                  <span className="toggle-slider"></span>
                </label>
              </div>
            </div>

            <div className="setting-item">
              <label className="setting-label">
                <span className="label-text">キーボードショートカット</span>
                <span className="label-description">
                  クイズでのキーボード操作を有効にする
                </span>
              </label>
              <div className="toggle-switch">
                <input
                  type="checkbox"
                  id="keyboardShortcuts"
                  checked={localSettings.keyboardShortcuts !== false}
                  onChange={(e) => handleSettingChange('keyboardShortcuts', e.target.checked)}
                />
                <label htmlFor="keyboardShortcuts" className="toggle-label">
                  <span className="toggle-slider"></span>
                </label>
              </div>
            </div>
          </div>

          <div className="setting-group">
            <h3>📊 学習統計</h3>
            <p>学習記録と統計の表示に関する設定です。</p>
            
            <div className="setting-item">
              <label className="setting-label">
                <span className="label-text">詳細統計の収集</span>
                <span className="label-description">
                  回答時間や正答率などの詳細データを記録する
                </span>
              </label>
              <div className="toggle-switch">
                <input
                  type="checkbox"
                  id="collectDetailedStats"
                  checked={localSettings.collectDetailedStats !== false}
                  onChange={(e) => handleSettingChange('collectDetailedStats', e.target.checked)}
                />
                <label htmlFor="collectDetailedStats" className="toggle-label">
                  <span className="toggle-slider"></span>
                </label>
              </div>
            </div>

            <div className="setting-item">
              <label className="setting-label">
                <span className="label-text">学習リマインダー</span>
                <span className="label-description">
                  定期的な学習の促進通知（ブラウザ通知）
                </span>
              </label>
              <div className="toggle-switch">
                <input
                  type="checkbox"
                  id="learningReminders"
                  checked={localSettings.learningReminders === true}
                  onChange={(e) => handleSettingChange('learningReminders', e.target.checked)}
                />
                <label htmlFor="learningReminders" className="toggle-label">
                  <span className="toggle-slider"></span>
                </label>
              </div>
            </div>
          </div>

          <div className="setting-group">
            <h3>⌨️ キーボードショートカット一覧</h3>
            <div className="shortcuts-list">
              <div className="shortcut-item">
                <kbd>1</kbd><kbd>2</kbd><kbd>3</kbd><kbd>4</kbd>
                <span>選択肢を選択</span>
              </div>
              <div className="shortcut-item">
                <kbd>Enter</kbd><kbd>Space</kbd>
                <span>次の問題へ進む</span>
              </div>
              <div className="shortcut-item">
                <kbd>E</kbd>
                <span>解説の表示切り替え</span>
              </div>
              <div className="shortcut-item">
                <kbd>←</kbd><kbd>→</kbd>
                <span>前後の問題に移動</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 外観設定 */}
      {activeSection === 'appearance' && (
        <div className="settings-section">
          <div className="setting-group">
            <h3>🎨 テーマ設定</h3>
            <p>アプリの外観とテーマに関する設定です。</p>
            
            <div className="setting-item">
              <label className="setting-label">
                <span className="label-text">カラーテーマ</span>
                <span className="label-description">
                  アプリ全体の色合いを設定する
                </span>
              </label>
              <div className="theme-selector">
                <div className="theme-options">
                  <label className={`theme-option ${localSettings.theme === 'light' ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      name="theme"
                      value="light"
                      checked={localSettings.theme === 'light'}
                      onChange={(e) => handleSettingChange('theme', e.target.value)}
                    />
                    <div className="theme-preview light-preview">
                      <div className="preview-header"></div>
                      <div className="preview-content"></div>
                    </div>
                    <span className="theme-name">🌞 ライト</span>
                  </label>
                  
                  <label className={`theme-option ${localSettings.theme === 'dark' ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      name="theme"
                      value="dark"
                      checked={localSettings.theme === 'dark'}
                      onChange={(e) => handleSettingChange('theme', e.target.value)}
                    />
                    <div className="theme-preview dark-preview">
                      <div className="preview-header"></div>
                      <div className="preview-content"></div>
                    </div>
                    <span className="theme-name">🌙 ダーク</span>
                  </label>
                  
                  <label className={`theme-option ${localSettings.theme === 'auto' ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      name="theme"
                      value="auto"
                      checked={localSettings.theme === 'auto'}
                      onChange={(e) => handleSettingChange('theme', e.target.value)}
                    />
                    <div className="theme-preview auto-preview">
                      <div className="preview-header"></div>
                      <div className="preview-content"></div>
                    </div>
                    <span className="theme-name">🔄 自動</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="setting-item">
              <label className="setting-label">
                <span className="label-text">アニメーション</span>
                <span className="label-description">
                  画面遷移やエフェクトのアニメーション
                </span>
              </label>
              <div className="toggle-switch">
                <input
                  type="checkbox"
                  id="animations"
                  checked={localSettings.animations !== false}
                  onChange={(e) => handleSettingChange('animations', e.target.checked)}
                />
                <label htmlFor="animations" className="toggle-label">
                  <span className="toggle-slider"></span>
                </label>
              </div>
            </div>

            <div className="setting-item">
              <label className="setting-label">
                <span className="label-text">フォントサイズ</span>
                <span className="label-description">
                  テキストの読みやすさを調整
                </span>
              </label>
              <select
                value={localSettings.fontSize || 'medium'}
                onChange={(e) => handleSettingChange('fontSize', e.target.value)}
                className="setting-select"
              >
                <option value="small">小</option>
                <option value="medium">中（標準）</option>
                <option value="large">大</option>
                <option value="extra-large">特大</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* 詳細設定 */}
      {activeSection === 'advanced' && (
        <div className="settings-section">
          <div className="setting-group">
            <h3>🔧 システム設定</h3>
            <p>アプリのパフォーマンスと動作に関する詳細設定です。</p>
            
            <div className="setting-item">
              <label className="setting-label">
                <span className="label-text">デバッグモード</span>
                <span className="label-description">
                  開発者向けの詳細ログとエラー情報を表示
                </span>
              </label>
              <div className="toggle-switch">
                <input
                  type="checkbox"
                  id="debugMode"
                  checked={localSettings.debugMode === true}
                  onChange={(e) => handleSettingChange('debugMode', e.target.checked)}
                />
                <label htmlFor="debugMode" className="toggle-label">
                  <span className="toggle-slider"></span>
                </label>
              </div>
            </div>

            <div className="setting-item">
              <label className="setting-label">
                <span className="label-text">API接続テスト</span>
                <span className="label-description">
                  バックエンドAPIとの接続状況を確認
                </span>
              </label>
              <button 
                className="btn btn-outline"
                onClick={testApiConnection}
              >
                🔗 接続テスト実行
              </button>
            </div>

            <div className="setting-item">
              <label className="setting-label">
                <span className="label-text">キャッシュクリア</span>
                <span className="label-description">
                  ブラウザキャッシュとテンポラリデータを削除
                </span>
              </label>
              <button 
                className="btn btn-outline"
                onClick={() => {
                  if (window.confirm('キャッシュをクリアしますか？')) {
                    window.location.reload(true);
                  }
                }}
              >
                🧹 キャッシュクリア
              </button>
            </div>
          </div>

          <div className="setting-group">
            <h3>📱 PWA設定</h3>
            <p>プログレッシブウェブアプリとしての機能設定です。</p>
            
            <div className="setting-item">
              <label className="setting-label">
                <span className="label-text">オフライン機能</span>
                <span className="label-description">
                  Service Workerによるオフライン対応
                </span>
              </label>
              <div className="pwa-status">
                <span className={`status-indicator ${navigator.serviceWorker ? 'active' : 'inactive'}`}>
                  {navigator.serviceWorker ? '有効' : '無効'}
                </span>
                {navigator.serviceWorker && (
                  <button 
                    className="btn btn-small btn-outline"
                    onClick={() => {
                      navigator.serviceWorker.getRegistrations().then(registrations => {
                        registrations.forEach(registration => registration.unregister());
                        alert('Service Workerを無効にしました。ページを再読み込みしてください。');
                      });
                    }}
                  >
                    無効にする
                  </button>
                )}
              </div>
            </div>

            <div className="setting-item">
              <label className="setting-label">
                <span className="label-text">プッシュ通知</span>
                <span className="label-description">
                  学習リマインダーなどの通知機能
                </span>
              </label>
              <div className="notification-status">
                <span className={`status-indicator ${Notification?.permission === 'granted' ? 'active' : 'inactive'}`}>
                  {Notification?.permission === 'granted' ? '許可済み' : 
                   Notification?.permission === 'denied' ? '拒否済み' : '未設定'}
                </span>
                {Notification?.permission !== 'granted' && (
                  <button 
                    className="btn btn-small btn-outline"
                    onClick={() => {
                      Notification.requestPermission().then(permission => {
                        if (permission === 'granted') {
                          alert('通知が許可されました。');
                        }
                      });
                    }}
                  >
                    許可する
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="setting-group">
            <h3>ℹ️ アプリ情報</h3>
            <div className="app-info">
              <div className="info-item">
                <span className="info-label">バージョン:</span>
                <span className="info-value">1.0.0</span>
              </div>
              <div className="info-item">
                <span className="info-label">ビルド日:</span>
                <span className="info-value">{new Date().toLocaleDateString()}</span>
              </div>
              <div className="info-item">
                <span className="info-label">ブラウザ:</span>
                <span className="info-value">{navigator.userAgent.split(' ')[0]}</span>
              </div>
              <div className="info-item">
                <span className="info-label">画面サイズ:</span>
                <span className="info-value">{window.innerWidth} × {window.innerHeight}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* リセット確認モーダル */}
      {showResetModal && (
        <div className="modal-backdrop" onClick={() => setShowResetModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>🔄 設定をリセット</h3>
              <button 
                className="close-btn"
                onClick={() => setShowResetModal(false)}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <p>
                すべての設定を初期値に戻します。
                学習データや履歴は削除されません。
              </p>
              <div className="reset-info">
                <h4>リセットされる設定:</h4>
                <ul>
                  <li>デフォルト分野・難易度</li>
                  <li>テーマ設定</li>
                  <li>表示オプション</li>
                  <li>学習設定</li>
                </ul>
              </div>
            </div>
            <div className="modal-footer">
              <button 
                className="btn btn-secondary"
                onClick={() => setShowResetModal(false)}
              >
                キャンセル
              </button>
              <button 
                className="btn btn-danger"
                onClick={handleResetSettings}
              >
                🔄 リセット実行
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
                  type="checkbox"
                  id="autoSave"
                  checked={localSettings.autoSave}
                  onChange={(e) => handleSettingChange('autoSave', e.target.checked)}
                />
                <label htmlFor="autoSave" className="toggle-label">
                  <span className="toggle-slider"></span>
                </label>
              </div>
            </div>

            <div className="setting-item">
              <label className="setting-label">
                <span className="label-text">ストレージ使用量</span>
                <span className="label-description">
                  現在のローカルストレージ使用状況
                </span>
              </label>
              <div className="storage-info">
                <span className="storage-size">{getStorageInfo().total.sizeFormatted}</span>
                <button 
                  className="btn btn-small btn-outline"
                  onClick={() => window.location.href = '/history?tab=settings'}
                >
                  詳細を見る
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 学習設定 */}
      {activeSection === 'learning' && (
        <div className="settings-section">
          <div className="setting-group">
            <h3>📖 学習体験</h3>
            <p>クイズの表示方法や学習フローに関する設定です。</p>
            
            <div className="setting-item">
              <label className="setting-label">
                <span className="label-text">解説の自動表示</span>
                <span className="label-description">
                  回答後に自動的に解説を表示する
                </span>
              </label>
              <div className="toggle-switch">
                <input