import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { StorageService } from '../../services/storage';
import './Home.css';

const Home = ({ onCameraSelect, onFileSelect }) => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [recentSessions, setRecentSessions] = useState([]);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);

  useEffect(() => {
    // 学習統計を取得
    const learningStats = StorageService.getLearningStats();
    setStats(learningStats);

    // 最近のセッションを取得
    const sessions = StorageService.getSessions().slice(0, 3);
    setRecentSessions(sessions);

    // 初回訪問チェック
    const hasVisited = localStorage.getItem('learning_support_has_visited');
    if (!hasVisited) {
      setShowWelcomeModal(true);
      localStorage.setItem('learning_support_has_visited', 'true');
    }
  }, []);

  const handleCameraClick = () => {
    navigate('/camera');
  };

  const handleFileUploadClick = () => {
    navigate('/upload');
  };

  const handleSessionClick = (sessionId) => {
    navigate(`/history?session=${sessionId}`);
  };

  const closeWelcomeModal = () => {
    setShowWelcomeModal(false);
  };

  const formatAccuracy = (accuracy) => {
    return `${Math.round(accuracy * 100)}%`;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return '昨日';
    if (diffDays <= 7) return `${diffDays}日前`;
    return date.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="home">
      {/* ヘッダーセクション */}
      <div className="home-header">
        <div className="welcome-section">
          <h1>学習サポートアプリ</h1>
          <p>AI が教材の写真から自動で問題を生成します</p>
        </div>
        
        {stats && stats.overview.totalQuizzes > 0 && (
          <div className="quick-stats">
            <div className="stat-item">
              <span className="stat-number">{stats.overview.totalQuizzes}</span>
              <span className="stat-label">学習回数</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">{formatAccuracy(stats.overview.accuracy)}</span>
              <span className="stat-label">平均正答率</span>
            </div>
          </div>
        )}
      </div>

      {/* メインアクション */}
      <div className="main-actions">
        <div className="action-cards">
          <div className="action-card camera-card" onClick={handleCameraClick}>
            <div className="card-icon">📷</div>
            <h3>カメラで撮影</h3>
            <p>スマホのカメラでテキストを直接撮影して問題を作成</p>
            <div className="card-features">
              <span className="feature">✓ リアルタイム撮影</span>
              <span className="feature">✓ 手軽で簡単</span>
            </div>
          </div>

          <div className="action-card upload-card" onClick={handleFileUploadClick}>
            <div className="card-icon">📁</div>
            <h3>ファイルアップロード</h3>
            <p>保存済みの画像ファイルから問題を作成</p>
            <div className="card-features">
              <span className="feature">✓ 高画質対応</span>
              <span className="feature">✓ 複数形式対応</span>
            </div>
          </div>
        </div>
      </div>

      {/* 機能紹介 */}
      <div className="features-section">
        <h2>🚀 主な機能</h2>
        <div className="features-grid">
          <div className="feature-item">
            <div className="feature-icon">🤖</div>
            <h4>AI自動生成</h4>
          </div>
          <div className="feature-item">
            <div className="feature-icon">📚</div>
            <h4>幅広い分野対応</h4>
            <p>資格試験、ビジネス、学術、実用スキルまで</p>
          </div>
          <div className="feature-item">
            <div className="feature-icon">🎯</div>
            <h4>難易度調整</h4>
            <p>基礎から発展まで4段階の難易度設定</p>
          </div>
          <div className="feature-item">
            <div className="feature-icon">📊</div>
            <h4>学習履歴管理</h4>
            <p>進捗や正答率を可視化して効率的な学習</p>
          </div>
        </div>
      </div>

      {/* 最近の学習履歴 */}
      {recentSessions.length > 0 && (
        <div className="recent-section">
          <div className="section-header">
            <h2>📖 最近の学習</h2>
            <button 
              className="btn btn-outline"
              onClick={() => navigate('/history')}
            >
              すべて見る
            </button>
          </div>
          
          <div className="recent-sessions">
            {recentSessions.map((session) => (
              <div 
                key={session.id} 
                className="session-card"
                onClick={() => handleSessionClick(session.id)}
              >
                <div className="session-info">
                  <div className="session-subject">
                    {session.subject || '自動判定'}
                  </div>
                  <div className="session-date">
                    {formatDate(session.timestamp)}
                  </div>
                </div>
                <div className="session-stats">
                  <span className="question-count">
                    {session.questions?.length || 0}問
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 対応分野 */}
      <div className="subjects-section">
        <h2>📋 対応分野</h2>
        <div className="subjects-grid">
          <div className="subject-card">
            <div className="subject-icon">📜</div>
            <h4>資格試験</h4>
            <ul>
              <li>IT系（情報処理、ベンダー資格）</li>
              <li>金融系（FP、簿記、証券）</li>
              <li>法律系（宅建、行政書士）</li>
              <li>語学系（TOEIC、英検）</li>
            </ul>
          </div>
          
          <div className="subject-card">
            <div className="subject-icon">💼</div>
            <h4>ビジネス</h4>
            <ul>
              <li>マーケティング戦略・分析</li>
              <li>経営・組織マネジメント</li>
              <li>人事・労務管理</li>
              <li>業務プロセス改善</li>
            </ul>
          </div>
          
          <div className="subject-card">
            <div className="subject-icon">🎓</div>
            <h4>学術</h4>
            <ul>
              <li>大学受験対策</li>
              <li>専門科目学習</li>
              <li>語学学習</li>
              <li>論文・レポート対策</li>
            </ul>
          </div>
          
          <div className="subject-card">
            <div className="subject-icon">🛠</div>
            <h4>実用スキル</h4>
            <ul>
              <li>プログラミング・技術習得</li>
              <li>時間管理・生産性向上</li>
              <li>健康・ライフスタイル</li>
              <li>趣味・教養</li>
            </ul>
          </div>
        </div>
      </div>

      {/* クイックアクション */}
      <div className="quick-actions">
        <h2>⚡ クイックスタート</h2>
        <div className="quick-buttons">
          <button 
            className="btn btn-primary"
            onClick={handleCameraClick}
          >
            📷 今すぐ撮影
          </button>
          <button 
            className="btn btn-secondary"
            onClick={() => navigate('/settings')}
          >
            ⚙️ 設定
          </button>
          <button 
            className="btn btn-secondary"
            onClick={() => navigate('/history')}
          >
            📊 履歴
          </button>
        </div>
      </div>

      {/* 初回訪問モーダル */}
      {showWelcomeModal && (
        <div className="modal-backdrop" onClick={closeWelcomeModal}>
          <div className="modal welcome-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>🎉 学習サポートアプリへようこそ！</h2>
              <button 
                className="close-btn"
                onClick={closeWelcomeModal}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <div className="welcome-content">
                <p>
                  このアプリは、教材の写真から自動でテスト問題を生成する
                  AI学習支援ツールです。
                </p>
                
                <div className="welcome-steps">
                  <div className="welcome-step">
                    <span className="step-number">1</span>
                    <div className="step-content">
                      <h4>📷 撮影・アップロード</h4>
                      <p>学習したいテキストを撮影またはファイルでアップロード</p>
                    </div>
                  </div>
                  
                  <div className="welcome-step">
                    <span className="step-number">2</span>
                    <div className="step-content">
                      <h4>🤖 AI処理</h4>
                      <p>AIがテキストを認識し、10問の選択問題を自動生成</p>
                    </div>
                  </div>
                  
                  <div className="welcome-step">
                    <span className="step-number">3</span>
                    <div className="step-content">
                      <h4>📝 学習・復習</h4>
                      <p>問題に挑戦し、解説を確認して理解を深める</p>
                    </div>
                  </div>
                </div>

                <div className="welcome-tips">
                  <h4>💡 効果的な使い方</h4>
                  <ul>
                    <li>明るい場所で撮影すると精度が向上します</li>
                    <li>分野や難易度は自動判定または手動設定可能</li>
                    <li>学習履歴は自動保存され、復習に活用できます</li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button 
                className="btn btn-primary"
                onClick={closeWelcomeModal}
              >
                📷 早速始める
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;