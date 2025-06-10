import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { StorageService } from '../../services/storage';
import './History.css';

const History = () => {
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('overview');
  const [sessions, setSessions] = useState([]);
  const [quizResults, setQuizResults] = useState([]);
  const [stats, setStats] = useState(null);
  const [selectedSession, setSelectedSession] = useState(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSubject, setFilterSubject] = useState('all');
  const [filterDifficulty, setFilterDifficulty] = useState('all');

  useEffect(() => {
    loadData();
    
    // URLパラメータでセッション指定があれば選択
    const sessionId = searchParams.get('session');
    if (sessionId) {
      const session = StorageService.getSession(parseInt(sessionId));
      if (session) {
        setSelectedSession(session);
        setActiveTab('sessions');
      }
    }
  }, [searchParams]);

  const loadData = () => {
    const allSessions = StorageService.getSessions();
    const allResults = StorageService.getQuizResults();
    const learningStats = StorageService.getLearningStats();
    
    setSessions(allSessions);
    setQuizResults(allResults);
    setStats(learningStats);
  };

  // フィルタリング関数
  const getFilteredSessions = () => {
    return sessions.filter(session => {
      const matchesSearch = !searchTerm || 
        session.extractedText?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        session.subject?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesSubject = filterSubject === 'all' || session.subject === filterSubject;
      const matchesDifficulty = filterDifficulty === 'all' || session.difficulty === filterDifficulty;
      
      return matchesSearch && matchesSubject && matchesDifficulty;
    });
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatAccuracy = (accuracy) => {
    return `${Math.round(accuracy * 100)}%`;
  };

  const getSubjectIcon = (subject) => {
    const icons = {
      'certification': '📜',
      'business': '💼',
      'academic': '🎓',
      'practical': '🛠',
      'auto': '🤖'
    };
    return icons[subject] || '📚';
  };

  const getDifficultyColor = (difficulty) => {
    const colors = {
      'basic': '#28a745',
      'standard': '#007bff',
      'advanced': '#fd7e14',
      'challenge': '#dc3545'
    };
    return colors[difficulty] || '#6c757d';
  };

  const handleSessionClick = (session) => {
    setSelectedSession(session);
  };

  const handleDeleteSession = (sessionId) => {
    if (window.confirm('この学習セッションを削除しますか？')) {
      StorageService.deleteSession(sessionId);
      loadData();
      if (selectedSession?.id === sessionId) {
        setSelectedSession(null);
      }
    }
  };

  const handleExportData = () => {
    const data = StorageService.exportAllData();
    if (data) {
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `learning-data-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setShowExportModal(false);
    }
  };

  const handleImportData = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const success = StorageService.importData(e.target.result);
          if (success) {
            alert('データのインポートが完了しました。');
            loadData();
            setShowImportModal(false);
          } else {
            alert('データのインポートに失敗しました。');
          }
        } catch (error) {
          alert('無効なファイル形式です。');
        }
      };
      reader.readAsText(file);
    }
  };

  const handleClearAllData = () => {
    if (window.confirm('すべての学習データを削除しますか？この操作は取り消せません。')) {
      if (window.confirm('本当によろしいですか？すべての履歴と統計が失われます。')) {
        StorageService.clearAllData();
        loadData();
        setSelectedSession(null);
        alert('すべてのデータが削除されました。');
      }
    }
  };

  return (
    <div className="history">
      <div className="history-header">
        <h1>📊 学習履歴</h1>
        <div className="header-actions">
          <button 
            className="btn btn-outline"
            onClick={() => setShowExportModal(true)}
          >
            📤 エクスポート
          </button>
          <button 
            className="btn btn-outline"
            onClick={() => setShowImportModal(true)}
          >
            📥 インポート
          </button>
        </div>
      </div>

      {/* タブナビゲーション */}
      <div className="tab-navigation">
        <button 
          className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          📈 統計
        </button>
        <button 
          className={`tab-btn ${activeTab === 'sessions' ? 'active' : ''}`}
          onClick={() => setActiveTab('sessions')}
        >
          📚 セッション
        </button>
        <button 
          className={`tab-btn ${activeTab === 'results' ? 'active' : ''}`}
          onClick={() => setActiveTab('results')}
        >
          🎯 結果
        </button>
        <button 
          className={`tab-btn ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          ⚙️ データ管理
        </button>
      </div>

      {/* 統計タブ */}
      {activeTab === 'overview' && stats && (
        <div className="tab-content">
          <div className="overview-stats">
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon">📚</div>
                <div className="stat-content">
                  <div className="stat-value">{stats.overview.totalQuizzes}</div>
                  <div className="stat-label">学習回数</div>
                </div>
              </div>
              
              <div className="stat-card">
                <div className="stat-icon">❓</div>
                <div className="stat-content">
                  <div className="stat-value">{stats.overview.totalQuestions}</div>
                  <div className="stat-label">総問題数</div>
                </div>
              </div>
              
              <div className="stat-card">
                <div className="stat-icon">🎯</div>
                <div className="stat-content">
                  <div className="stat-value">{formatAccuracy(stats.overview.accuracy)}</div>
                  <div className="stat-label">平均正答率</div>
                </div>
              </div>
              
              <div className="stat-card">
                <div className="stat-icon">⏱️</div>
                <div className="stat-content">
                  <div className="stat-value">
                    {Math.round(stats.overview.averageTimePerQuestion)}秒
                  </div>
                  <div className="stat-label">平均回答時間</div>
                </div>
              </div>
            </div>

            {/* 分野別統計 */}
            {stats.subjects.length > 0 && (
              <div className="subjects-stats">
                <h3>📋 分野別成績</h3>
                <div className="subjects-grid">
                  {stats.subjects.map((subject, index) => (
                    <div key={index} className="subject-stat-card">
                      <div className="subject-header">
                        <span className="subject-icon">
                          {getSubjectIcon(subject.subject)}
                        </span>
                        <span className="subject-name">{subject.subject}</span>
                      </div>
                      <div className="subject-metrics">
                        <div className="metric">
                          <span className="metric-label">正答率</span>
                          <span className="metric-value">
                            {formatAccuracy(subject.accuracy)}
                          </span>
                        </div>
                        <div className="metric">
                          <span className="metric-label">問題数</span>
                          <span className="metric-value">{subject.questionCount}</span>
                        </div>
                        <div className="metric">
                          <span className="metric-label">回数</span>
                          <span className="metric-value">{subject.quizCount}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 難易度別統計 */}
            {stats.difficulties.length > 0 && (
              <div className="difficulties-stats">
                <h3>🎯 難易度別成績</h3>
                <div className="difficulties-grid">
                  {stats.difficulties.map((difficulty, index) => (
                    <div key={index} className="difficulty-stat-card">
                      <div className="difficulty-header">
                        <span 
                          className="difficulty-badge"
                          style={{ backgroundColor: getDifficultyColor(difficulty.difficulty) }}
                        >
                          {difficulty.difficulty}
                        </span>
                      </div>
                      <div className="difficulty-metrics">
                        <div className="metric">
                          <span className="metric-label">正答率</span>
                          <span className="metric-value">
                            {formatAccuracy(difficulty.accuracy)}
                          </span>
                        </div>
                        <div className="metric">
                          <span className="metric-label">問題数</span>
                          <span className="metric-value">{difficulty.questionCount}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 最近の活動 */}
            {stats.recentActivity.length > 0 && (
              <div className="recent-activity">
                <h3>📅 最近の活動</h3>
                <div className="activity-list">
                  {stats.recentActivity.map((activity, index) => (
                    <div key={index} className="activity-item">
                      <div className="activity-date">{activity.date}</div>
                      <div className="activity-stats">
                        <span className="activity-accuracy">
                          正答率: {formatAccuracy(activity.accuracy)}
                        </span>
                        <span className="activity-questions">
                          {activity.questionsCount}問
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* セッションタブ */}
      {activeTab === 'sessions' && (
        <div className="tab-content">
          {/* フィルター */}
          <div className="filters">
            <div className="search-filter">
              <input
                type="text"
                placeholder="テキストで検索..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
            <div className="select-filters">
              <select
                value={filterSubject}
                onChange={(e) => setFilterSubject(e.target.value)}
                className="filter-select"
              >
                <option value="all">すべての分野</option>
                <option value="certification">資格試験</option>
                <option value="business">ビジネス</option>
                <option value="academic">学術</option>
                <option value="practical">実用スキル</option>
                <option value="auto">自動判定</option>
              </select>
              <select
                value={filterDifficulty}
                onChange={(e) => setFilterDifficulty(e.target.value)}
                className="filter-select"
              >
                <option value="all">すべての難易度</option>
                <option value="basic">基礎</option>
                <option value="standard">標準</option>
                <option value="advanced">応用</option>
                <option value="challenge">発展</option>
              </select>
            </div>
          </div>

          <div className="sessions-container">
            <div className="sessions-list">
              {getFilteredSessions().length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">📚</div>
                  <h3>学習セッションがありません</h3>
                  <p>写真をアップロードして最初の学習を始めましょう</p>
                </div>
              ) : (
                getFilteredSessions().map((session) => (
                  <div 
                    key={session.id} 
                    className={`session-item ${selectedSession?.id === session.id ? 'selected' : ''}`}
                    onClick={() => handleSessionClick(session)}
                  >
                    <div className="session-main">
                      <div className="session-header">
                        <span className="session-subject">
                          {getSubjectIcon(session.subject)} {session.subject || '自動判定'}
                        </span>
                        <span className="session-date">
                          {formatDate(session.timestamp)}
                        </span>
                      </div>
                      <div className="session-preview">
                        {session.extractedText?.substring(0, 100)}...
                      </div>
                      <div className="session-stats">
                        <span className="question-count">
                          {session.questions?.length || 0}問
                        </span>
                        {session.difficulty && (
                          <span 
                            className="difficulty-tag"
                            style={{ backgroundColor: getDifficultyColor(session.difficulty) }}
                          >
                            {session.difficulty}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="session-actions">
                      <button 
                        className="btn btn-small btn-danger"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteSession(session.id);
                        }}
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* セッション詳細 */}
            {selectedSession && (
              <div className="session-detail">
                <div className="detail-header">
                  <h3>📄 セッション詳細</h3>
                  <button 
                    className="btn btn-outline"
                    onClick={() => setSelectedSession(null)}
                  >
                    ✕ 閉じる
                  </button>
                </div>
                
                <div className="detail-content">
                  <div className="detail-section">
                    <h4>📋 基本情報</h4>
                    <div className="detail-info">
                      <div className="info-item">
                        <span className="info-label">分野:</span>
                        <span className="info-value">
                          {getSubjectIcon(selectedSession.subject)} {selectedSession.subject || '自動判定'}
                        </span>
                      </div>
                      <div className="info-item">
                        <span className="info-label">難易度:</span>
                        <span 
                          className="info-value difficulty-badge"
                          style={{ backgroundColor: getDifficultyColor(selectedSession.difficulty) }}
                        >
                          {selectedSession.difficulty || '標準'}
                        </span>
                      </div>
                      <div className="info-item">
                        <span className="info-label">作成日時:</span>
                        <span className="info-value">{formatDate(selectedSession.timestamp)}</span>
                      </div>
                      <div className="info-item">
                        <span className="info-label">問題数:</span>
                        <span className="info-value">{selectedSession.questions?.length || 0}問</span>
                      </div>
                    </div>
                  </div>

                  <div className="detail-section">
                    <h4>📝 抽出されたテキスト</h4>
                    <div className="extracted-text">
                      {selectedSession.extractedText}
                    </div>
                  </div>

                  {selectedSession.questions && selectedSession.questions.length > 0 && (
                    <div className="detail-section">
                      <h4>❓ 生成された問題</h4>
                      <div className="questions-list">
                        {selectedSession.questions.map((question, index) => (
                          <div key={index} className="question-item">
                            <div className="question-number">問題 {index + 1}</div>
                            <div className="question-text">{question.question}</div>
                            <div className="question-choices">
                              {question.choices.map((choice, choiceIndex) => (
                                <div 
                                  key={choiceIndex} 
                                  className={`choice ${choiceIndex === question.correctAnswer ? 'correct' : ''}`}
                                >
                                  <span className="choice-letter">
                                    {String.fromCharCode(65 + choiceIndex)}
                                  </span>
                                  <span className="choice-text">{choice}</span>
                                  {choiceIndex === question.correctAnswer && (
                                    <span className="correct-mark">✓</span>
                                  )}
                                </div>
                              ))}
                            </div>
                            {question.explanation && (
                              <div className="question-explanation">
                                <strong>解説:</strong> {question.explanation}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}