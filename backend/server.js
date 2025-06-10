const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// セキュリティミドルウェア
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

// 圧縮
app.use(compression());

// CORS設定
app.use(cors({
  origin: process.env.FRONTEND_URL || [
    'http://localhost:3000',
    'https://learning-support-app.onrender.com'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// JSON解析（大きなファイル対応）
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// リクエストログ
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`${timestamp} - ${req.method} ${req.path} - ${req.ip}`);
  next();
});

// ヘルスチェックエンドポイント（Render用）
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'learning-support-api',
    version: '1.0.0',
    uptime: Math.floor(process.uptime()),
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + 'MB',
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + 'MB'
    },
    environment: process.env.NODE_ENV || 'development'
  });
});

// ルートエンドポイント
app.get('/', (req, res) => {
  res.json({
    message: '🎓 学習サポートアプリ API',
    version: '1.0.0',
    status: 'running',
    description: 'AI学習支援アプリのバックエンドAPI - Gemini AIを使用した問題生成システム',
    features: [
      '📷 OCR による画像テキスト抽出',
      '🤖 Gemini AI による問題生成',
      '📚 分野別問題カスタマイズ',
      '🎯 難易度調整機能',
      '📊 学習履歴管理'
    ],
    endpoints: {
      health: 'GET /health',
      api_info: 'GET /api',
      upload: 'POST /api/upload',
      questions: 'POST /api/questions/generate',
      config: 'GET /api/questions/config'
    }
  });
});

// API情報エンドポイント
app.get('/api', (req, res) => {
  res.json({
    name: 'Learning Support API',
    version: '1.0.0',
    description: 'AI学習支援アプリのバックエンドAPI',
    author: 'T-aka-H',
    repository: 'https://github.com/T-aka-H/learning_support',
    ai_provider: 'Google Gemini 1.5 Flash',
    supported_formats: ['jpeg', 'jpg', 'png', 'webp'],
    max_file_size: '10MB',
    features: {
      ocr: 'Gemini AI による高精度テキスト抽出',
      question_generation: '自動問題生成（選択肢・記述・計算問題）',
      subject_detection: '分野自動判定（数学・国語・理科・社会・英語）',
      difficulty_adjustment: '3段階難易度調整（基礎・標準・応用）',
      learning_history: '学習履歴の保存と分析'
    }
  });
});

// 動的ルート読み込み
try {
  const uploadRoutes = require('./routes/upload');
  app.use('/api/upload', uploadRoutes);
  console.log('✅ Upload routes loaded successfully');
} catch (error) {
  console.log('⚠️ Upload routes not found, using fallback endpoint');
  
  // フォールバック：基本的なアップロードエンドポイント
  app.post('/api/upload', (req, res) => {
    res.status(503).json({
      error: 'Upload service temporarily unavailable',
      message: 'OCR機能は現在実装中です。しばらくお待ちください。',
      status: 'coming_soon',
      expected_features: [
        '画像からのテキスト抽出',
        '手書き文字認識',
        '表・図の認識',
        'PDF対応'
      ]
    });
  });
}

try {
  const questionRoutes = require('./routes/questions');
  app.use('/api/questions', questionRoutes);
  console.log('✅ Question routes loaded successfully');
} catch (error) {
  console.log('⚠️ Question routes not found, using fallback endpoints');
  
  // フォールバック：基本的な問題生成エンドポイント
  app.get('/api/questions/config', (req, res) => {
    res.json({
      subjects: [
        { id: 'math', name: '数学', icon: '🔢' },
        { id: 'japanese', name: '国語', icon: '📚' },
        { id: 'science', name: '理科', icon: '🔬' },
        { id: 'social', name: '社会', icon: '🌍' },
        { id: 'english', name: '英語', icon: '🇺🇸' }
      ],
      difficulties: [
        { id: 'basic', name: '基礎', description: '基本的な問題' },
        { id: 'standard', name: '標準', description: '標準的な問題' },
        { id: 'advanced', name: '応用', description: '応用・発展問題' }
      ],
      question_types: [
        { id: 'multiple_choice', name: '選択肢問題' },
        { id: 'short_answer', name: '記述問題' },
        { id: 'calculation', name: '計算問題' }
      ],
      status: 'service_initializing',
      ai_status: 'gemini_api_ready'
    });
  });
  
  app.post('/api/questions/generate', (req, res) => {
    res.status(503).json({
      error: 'Question generation service temporarily unavailable',
      message: 'AI問題生成機能は現在実装中です。しばらくお待ちください。',
      status: 'coming_soon',
      estimated_completion: '近日中',
      planned_features: [
        'テキスト内容の自動分析',
        '適切な問題レベルの判定',
        '多様な問題形式の生成',
        '解説付き問題の作成'
      ]
    });
  });
}

// 404エラーハンドラー
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    message: `${req.method} ${req.originalUrl} は存在しません`,
    suggestion: 'API仕様を確認してください',
    available_endpoints: [
      'GET /',
      'GET /health',
      'GET /api',
      'POST /api/upload',
      'POST /api/questions/generate',
      'GET /api/questions/config'
    ],
    documentation: 'https://github.com/T-aka-H/learning_support#api-documentation'
  });
});

// グローバルエラーハンドラー
app.use((err, req, res, next) => {
  console.error('🚨 Server Error:', {
    message: err.message,
    stack: err.stack,
    timestamp: new Date().toISOString(),
    url: req.url,
    method: req.method
  });
  
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' 
      ? err.message 
      : 'サーバーエラーが発生しました。しばらく時間をおいて再試行してください。',
    timestamp: new Date().toISOString(),
    support: process.env.NODE_ENV === 'development' 
      ? 'Check server logs for details'
      : 'サポートが必要な場合は管理者に連絡してください'
  });
});

// プロセス終了時の処理
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully');
  process.exit(0);
});

// 未処理のPromise拒否をキャッチ
process.on('unhandledRejection', (reason, promise) => {
  console.error('🚨 Unhandled Rejection at:', promise, 'reason:', reason);
});

// サーバー起動
const server = app.listen(PORT, () => {
  console.log(`
🚀 学習サポートアプリ API サーバー起動完了
📍 Port: ${PORT}
🌍 Environment: ${process.env.NODE_ENV || 'development'}
🔗 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}
🆔 Process ID: ${process.pid}
⏰ Started at: ${new Date().toISOString()}
📊 Memory usage: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB

🎯 Available endpoints:
   GET  /          - API情報
   GET  /health    - ヘルスチェック
   GET  /api       - API詳細情報
   POST /api/upload - 画像アップロード（実装中）
   POST /api/questions/generate - 問題生成（実装中）
   GET  /api/questions/config - 設定情報

Ready to accept connections! 🎉
  `);
});

// Render 無料枠スリープ対策（本番環境のみ）
if (process.env.NODE_ENV === 'production') {
  const cron = require('node-cron');
  
  // 14分ごとに自分自身にリクエストを送ってスリープを防ぐ
  cron.schedule('*/14 * * * *', async () => {
    try {
      const https = require('https');
      const url = process.env.RENDER_EXTERNAL_URL || 'https://learning-support-app-api.onrender.com';
      
      https.get(`${url}/health`, (res) => {
        console.log(`⏰ Keep-alive ping: ${res.statusCode} - ${new Date().toISOString()}`);
      }).on('error', (err) => {
        console.log('❌ Keep-alive ping failed:', err.message);
      });
    } catch (error) {
      console.log('❌ Keep-alive cron error:', error.message);
    }
  });
  
  console.log('⏰ Keep-alive cron job started (14-minute intervals)');
}

module.exports = app;