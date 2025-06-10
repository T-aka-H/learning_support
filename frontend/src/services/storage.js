// localStorage管理サービス
export class StorageService {
    static KEYS = {
      SETTINGS: 'learning_support_settings',
      SESSIONS: 'learning_support_sessions',
      LEARNING_DATA: 'learning_support_learning_data',
      QUIZ_RESULTS: 'learning_support_quiz_results'
    };
  
    // データ圧縮（簡易版）
    static compress(data) {
      try {
        return btoa(JSON.stringify(data));
      } catch (error) {
        console.warn('Compression failed, using raw data:', error);
        return JSON.stringify(data);
      }
    }
  
    // データ展開
    static decompress(compressedData) {
      try {
        if (compressedData.startsWith('{') || compressedData.startsWith('[')) {
          // 非圧縮データの場合
          return JSON.parse(compressedData);
        }
        return JSON.parse(atob(compressedData));
      } catch (error) {
        console.warn('Decompression failed:', error);
        return null;
      }
    }
  
    // 安全にデータを取得
    static safeGetItem(key) {
      try {
        const item = localStorage.getItem(key);
        return item ? this.decompress(item) : null;
      } catch (error) {
        console.error(`Error getting item ${key}:`, error);
        return null;
      }
    }
  
    // 安全にデータを保存
    static safeSetItem(key, data) {
      try {
        const compressed = this.compress(data);
        localStorage.setItem(key, compressed);
        return true;
      } catch (error) {
        console.error(`Error setting item ${key}:`, error);
        
        // ストレージが満杯の場合、古いデータを削除
        if (error.name === 'QuotaExceededError') {
          this.cleanupOldData();
          try {
            localStorage.setItem(key, this.compress(data));
            return true;
          } catch (retryError) {
            console.error('Retry failed:', retryError);
          }
        }
        return false;
      }
    }
  
    // 設定の取得
    static getSettings() {
      return this.safeGetItem(this.KEYS.SETTINGS) || {
        subject: 'auto',
        difficulty: 'standard',
        theme: 'light',
        autoSave: true,
        showExplanations: true
      };
    }
  
    // 設定の保存
    static saveSettings(settings) {
      return this.safeSetItem(this.KEYS.SETTINGS, settings);
    }
  
    // 学習セッションの保存
    static saveSession(session) {
      const sessions = this.getSessions();
      sessions.unshift({
        ...session,
        id: session.id || Date.now()
      });
  
      // 最新20件のみ保持
      const limitedSessions = sessions.slice(0, 20);
      return this.safeSetItem(this.KEYS.SESSIONS, limitedSessions);
    }
  
    // 学習セッション一覧の取得
    static getSessions() {
      return this.safeGetItem(this.KEYS.SESSIONS) || [];
    }
  
    // 特定セッションの取得
    static getSession(sessionId) {
      const sessions = this.getSessions();
      return sessions.find(session => session.id === sessionId);
    }
  
    // セッションの削除
    static deleteSession(sessionId) {
      const sessions = this.getSessions();
      const filteredSessions = sessions.filter(session => session.id !== sessionId);
      return this.safeSetItem(this.KEYS.SESSIONS, filteredSessions);
    }
  
    // クイズ結果の保存
    static saveQuizResults(sessionId, results) {
      const allResults = this.getQuizResults();
      
      const resultData = {
        sessionId,
        timestamp: new Date().toISOString(),
        score: results.score,
        totalQuestions: results.totalQuestions,
        correctAnswers: results.correctAnswers,
        timeSpent: results.timeSpent,
        answers: results.answers,
        accuracy: results.score / results.totalQuestions
      };
  
      allResults.unshift(resultData);
      
      // 最新50件のみ保持
      const limitedResults = allResults.slice(0, 50);
      return this.safeSetItem(this.KEYS.QUIZ_RESULTS, limitedResults);
    }
  
    // クイズ結果一覧の取得
    static getQuizResults() {
      return this.safeGetItem(this.KEYS.QUIZ_RESULTS) || [];
    }
  
    // 学習データの更新
    static updateLearningData(quizResults) {
      const learningData = this.getLearningData();
      
      // 統計データの更新
      learningData.totalQuizzes = (learningData.totalQuizzes || 0) + 1;
      learningData.totalQuestions = (learningData.totalQuestions || 0) + quizResults.totalQuestions;
      learningData.totalCorrect = (learningData.totalCorrect || 0) + quizResults.correctAnswers;
      learningData.totalTimeSpent = (learningData.totalTimeSpent || 0) + (quizResults.timeSpent || 0);
      
      // 科目別統計
      if (!learningData.subjectStats) {
        learningData.subjectStats = {};
      }
      
      const subject = quizResults.subject || 'unknown';
      if (!learningData.subjectStats[subject]) {
        learningData.subjectStats[subject] = {
          totalQuestions: 0,
          correctAnswers: 0,
          averageTime: 0,
          quizCount: 0
        };
      }
      
      const subjectStat = learningData.subjectStats[subject];
      subjectStat.totalQuestions += quizResults.totalQuestions;
      subjectStat.correctAnswers += quizResults.correctAnswers;
      subjectStat.quizCount += 1;
      
      // 難易度別統計
      if (!learningData.difficultyStats) {
        learningData.difficultyStats = {};
      }
      
      const difficulty = quizResults.difficulty || 'standard';
      if (!learningData.difficultyStats[difficulty]) {
        learningData.difficultyStats[difficulty] = {
          totalQuestions: 0,
          correctAnswers: 0,
          quizCount: 0
        };
      }
      
      const difficultyStat = learningData.difficultyStats[difficulty];
      difficultyStat.totalQuestions += quizResults.totalQuestions;
      difficultyStat.correctAnswers += quizResults.correctAnswers;
      difficultyStat.quizCount += 1;
      
      // 最終更新日時
      learningData.lastUpdated = new Date().toISOString();
      
      return this.safeSetItem(this.KEYS.LEARNING_DATA, learningData);
    }
  
    // 学習データの取得
    static getLearningData() {
      return this.safeGetItem(this.KEYS.LEARNING_DATA) || {
        totalQuizzes: 0,
        totalQuestions: 0,
        totalCorrect: 0,
        totalTimeSpent: 0,
        subjectStats: {},
        difficultyStats: {},
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString()
      };
    }
  
    // 学習統計の取得（計算済み）
    static getLearningStats() {
      const data = this.getLearningData();
      const results = this.getQuizResults();
      
      return {
        overview: {
          totalQuizzes: data.totalQuizzes,
          totalQuestions: data.totalQuestions,
          accuracy: data.totalQuestions > 0 ? (data.totalCorrect / data.totalQuestions) : 0,
          averageTimePerQuestion: data.totalQuestions > 0 ? (data.totalTimeSpent / data.totalQuestions) : 0
        },
        subjects: Object.entries(data.subjectStats || {}).map(([subject, stats]) => ({
          subject,
          accuracy: stats.totalQuestions > 0 ? (stats.correctAnswers / stats.totalQuestions) : 0,
          questionCount: stats.totalQuestions,
          quizCount: stats.quizCount
        })),
        difficulties: Object.entries(data.difficultyStats || {}).map(([difficulty, stats]) => ({
          difficulty,
          accuracy: stats.totalQuestions > 0 ? (stats.correctAnswers / stats.totalQuestions) : 0,
          questionCount: stats.totalQuestions,
          quizCount: stats.quizCount
        })),
        recentActivity: results.slice(0, 10).map(result => ({
          date: new Date(result.timestamp).toLocaleDateString(),
          accuracy: result.accuracy,
          questionsCount: result.totalQuestions
        }))
      };
    }
  
    // 古いデータのクリーンアップ
    static cleanupOldData() {
      try {
        // 30日以上古いセッションを削除
        const sessions = this.getSessions();
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - 30);
        
        const recentSessions = sessions.filter(session => 
          new Date(session.timestamp) > cutoffDate
        );
        
        this.safeSetItem(this.KEYS.SESSIONS, recentSessions);
        
        // 古いクイズ結果も削除
        const results = this.getQuizResults();
        const recentResults = results.filter(result => 
          new Date(result.timestamp) > cutoffDate
        );
        
        this.safeSetItem(this.KEYS.QUIZ_RESULTS, recentResults);
        
        console.log('Old data cleaned up successfully');
      } catch (error) {
        console.error('Error during cleanup:', error);
      }
    }
  
    // 全データのエクスポート
    static exportAllData() {
      try {
        const allData = {
          settings: this.getSettings(),
          sessions: this.getSessions(),
          quizResults: this.getQuizResults(),
          learningData: this.getLearningData(),
          exportedAt: new Date().toISOString()
        };
        
        return JSON.stringify(allData, null, 2);
      } catch (error) {
        console.error('Export failed:', error);
        return null;
      }
    }
  
    // データのインポート
    static importData(jsonData) {
      try {
        const data = JSON.parse(jsonData);
        
        if (data.settings) this.saveSettings(data.settings);
        if (data.sessions) this.safeSetItem(this.KEYS.SESSIONS, data.sessions);
        if (data.quizResults) this.safeSetItem(this.KEYS.QUIZ_RESULTS, data.quizResults);
        if (data.learningData) this.safeSetItem(this.KEYS.LEARNING_DATA, data.learningData);
        
        return true;
      } catch (error) {
        console.error('Import failed:', error);
        return false;
      }
    }
  
    // 全データの削除
    static clearAllData() {
      try {
        Object.values(this.KEYS).forEach(key => {
          localStorage.removeItem(key);
        });
        return true;
      } catch (error) {
        console.error('Clear all data failed:', error);
        return false;
      }
    }
  
    // ストレージ使用量の確認
    static getStorageUsage() {
      try {
        let totalSize = 0;
        const usage = {};
        
        Object.entries(this.KEYS).forEach(([name, key]) => {
          const item = localStorage.getItem(key);
          const size = item ? new Blob([item]).size : 0;
          usage[name] = {
            size,
            sizeFormatted: this.formatBytes(size)
          };
          totalSize += size;
        });
        
        return {
          total: {
            size: totalSize,
            sizeFormatted: this.formatBytes(totalSize)
          },
          breakdown: usage
        };
      } catch (error) {
        console.error('Error calculating storage usage:', error);
        return null;
      }
    }
  
    // バイト数のフォーマット
    static formatBytes(bytes) {
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
  }