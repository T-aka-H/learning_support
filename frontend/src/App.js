import React from 'react';

function App() {
  return (
    <div style={{ 
      padding: '20px', 
      textAlign: 'center',
      fontFamily: 'Arial, sans-serif',
      maxWidth: '600px',
      margin: '0 auto'
    }}>
      <h1 style={{ color: '#2c3e50' }}>🎓 学習サポートアプリ</h1>
      
      <div style={{ 
        background: '#e8f5e8', 
        padding: '20px', 
        borderRadius: '10px', 
        margin: '20px 0',
        border: '2px solid #27ae60'
      }}>
        <h2 style={{ color: '#27ae60', margin: '0 0 10px 0' }}>✅ デプロイ成功！</h2>
        <p style={{ margin: '0' }}>フロントエンドが正常に動作しています</p>
      </div>
      
      <div style={{ 
        background: '#f0f8ff', 
        padding: '15px', 
        borderRadius: '8px',
        marginTop: '20px',
        border: '1px solid #b6d7ff'
      }}>
        <h3 style={{ color: '#1e3a8a' }}>🚀 実装予定機能</h3>
        <ul style={{ 
          textAlign: 'left', 
          maxWidth: '400px', 
          margin: '10px auto 0',
          color: '#374151'
        }}>
          <li>📷 画像アップロード（OCR機能）</li>
          <li>🤖 AI問題生成（Gemini AI）</li>
          <li>📚 分野別学習（数学・国語・理科・社会・英語）</li>
          <li>🎯 難易度調整（基礎・標準・応用）</li>
          <li>📊 学習履歴管理</li>
          <li>📱 PWA対応（オフライン学習）</li>
        </ul>
      </div>
      
      <div style={{ 
        background: '#fff3cd', 
        padding: '15px', 
        borderRadius: '8px',
        marginTop: '20px',
        border: '1px solid #ffeaa7'
      }}>
        <h3 style={{ color: '#856404' }}>🔗 API連携状況</h3>
        <p style={{ color: '#856404', margin: '10px 0 0' }}>
          バックエンドAPI: 
          <a 
            href="https://learning-support-app-api.onrender.com" 
            target="_blank" 
            rel="noopener noreferrer"
            style={{ color: '#0066cc', textDecoration: 'none', marginLeft: '5px' }}
          >
            learning-support-app-api.onrender.com
          </a>
        </p>
      </div>
      
      <footer style={{ 
        marginTop: '40px', 
        paddingTop: '20px', 
        borderTop: '1px solid #eee',
        fontSize: '14px', 
        color: '#999' 
      }}>
        <p>学習サポートアプリ v1.0.0</p>
        <p>開発者: T-aka-H | GitHub: learning_support</p>
        <p>最終更新: {new Date().toLocaleString('ja-JP')}</p>
      </footer>
    </div>
  );
}

export default App;
