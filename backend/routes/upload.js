const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const router = express.Router();

// Gemini AI初期化
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Multer設定（メモリストレージ）
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 1
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('画像ファイルのみアップロード可能です'), false);
    }
  }
});

// 画像前処理関数
async function preprocessImage(buffer) {
  try {
    return await sharp(buffer)
      .resize(2048, 2048, { 
        fit: 'inside',
        withoutEnlargement: true 
      })
      .jpeg({ 
        quality: 85,
        progressive: true 
      })
      .toBuffer();
  } catch (error) {
    console.error('Image preprocessing error:', error);
    return buffer; // フォールバック
  }
}

// OCR処理関数
async function performOCR(imageBuffer, retries = 3) {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  
  const ocrPrompt = `
あなたは中学受験教材の OCR 専門家です。画像内のテキストを正確に抽出してください。

【抽出ルール】
1. 文字の配置や段落構造を維持
2. 数字、記号、特殊文字も正確に認識
3. 難しい漢字には読み仮名を併記
4. 図表やグラフの説明も含める
5. 文脈を考慮して誤認識を修正

【出力形式】
- 純粋なテキストのみ
- 改行や段落は維持
- 装飾や余計な説明は不要

抽出したテキスト:
`;

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const response = await model.generateContent([
        ocrPrompt,
        {
          inlineData: {
            data: imageBuffer.toString('base64'),
            mimeType: 'image/jpeg'
          }
        }
      ]);

      const text = response.response.text().trim();
      
      if (text && text.length > 10) {
        return {
          success: true,
          text: text,
          confidence: calculateConfidence(text)
        };
      }
      
      throw new Error('OCR結果が短すぎます');
      
    } catch (error) {
      console.error(`OCR attempt ${attempt + 1} failed:`, error.message);
      
      if (attempt < retries - 1) {
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        continue;
      }
      
      return {
        success: false,
        error: error.message,
        text: ''
      };
    }
  }
}

// テキスト信頼度計算
function calculateConfidence(text) {
  let score = 0.5; // 基準点
  
  // 日本語文字の比率
  const japaneseChars = text.match(/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/g);
  if (japaneseChars) {
    score += (japaneseChars.length / text.length) * 0.3;
  }
  
  // 文の構造
  if (text.includes('。') || text.includes('、')) score += 0.1;
  if (text.match(/\d+/)) score += 0.1; // 数字が含まれる
  
  return Math.min(Math.max(score, 0), 1);
}

// メモリクリーンアップミドルウェア
const cleanupMemory = (req, res, next) => {
  res.on('finish', () => {
    if (req.file?.buffer) {
      req.file.buffer = null;
    }
    
    // 強制ガベージコレクション（本番環境では注意）
    if (global.gc && process.env.NODE_ENV === 'production') {
      global.gc();
    }
  });
  next();
};

// ファイルアップロード&OCR処理エンドポイント
router.post('/', upload.single('image'), cleanupMemory, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: '画像ファイルがアップロードされていません'
      });
    }

    console.log(`Processing image: ${req.file.originalname}, size: ${req.file.size} bytes`);

    // 画像前処理
    const processedBuffer = await preprocessImage(req.file.buffer);
    
    // OCR実行
    const ocrResult = await performOCR(processedBuffer);
    
    if (!ocrResult.success) {
      return res.status(500).json({
        error: 'OCR処理に失敗しました',
        details: ocrResult.error
      });
    }

    // テキストの最低品質チェック
    if (ocrResult.text.length < 20) {
      return res.status(400).json({
        error: '抽出されたテキストが短すぎます。より鮮明な画像をアップロードしてください。'
      });
    }

    res.json({
      success: true,
      extractedText: ocrResult.text,
      confidence: ocrResult.confidence,
      metadata: {
        originalSize: req.file.size,
        processedSize: processedBuffer.length,
        textLength: ocrResult.text.length
      }
    });

  } catch (error) {
    console.error('Upload processing error:', error);
    
    res.status(500).json({
      error: 'ファイル処理中にエラーが発生しました',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// テスト用エンドポイント
router.post('/test-ocr', express.json(), async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text) {
      return res.status(400).json({
        error: 'テストテキストが提供されていません'
      });
    }

    res.json({
      success: true,
      extractedText: text,
      confidence: 1.0,
      metadata: {
        textLength: text.length,
        testMode: true
      }
    });

  } catch (error) {
    console.error('Test OCR error:', error);
    res.status(500).json({
      error: 'テストOCR処理中にエラーが発生しました'
    });
  }
});

module.exports = router;