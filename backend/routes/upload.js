const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const router = express.Router();

// Gemini AI初期化
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Multer設定（複数ファイル対応）
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB per file
    files: 10 // 最大10枚まで
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
async function preprocessImage(buffer, filename) {
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
    console.error(`Image preprocessing error for ${filename}:`, error);
    return buffer; // フォールバック
  }
}

// 複数画像OCR処理関数
async function performMultiImageOCR(imageBuffers, filenames, retries = 2) {
  const model = genAI.getGenerativeModel({ 
    model: "gemini-1.5-flash",
    generationConfig: {
      response_mime_type: "application/json"
    }
  });
  
  // 複数画像用のプロンプト
  const ocrPrompt = `
あなたは学習教材のOCR専門家です。以下の${imageBuffers.length}枚の画像からテキストを抽出し、統合してください。

【抽出ルール】
1. 各画像の内容を順番に解析
2. 関連する内容は統合し、独立した内容は分離
3. 数式、図表、特殊記号も正確に認識
4. 画像間の連続性を考慮（問題の続き、解答と問題など）
5. ページ番号や章番号がある場合は構造を維持

【JSON出力形式】
{
  "totalImages": ${imageBuffers.length},
  "extractedText": "統合されたテキスト全体",
  "imageDetails": [
    {
      "imageIndex": 1,
      "filename": "ファイル名",
      "content": "この画像から抽出されたテキスト",
      "contentType": "問題|解答|説明|図表",
      "confidence": 0.95
    }
  ],
  "combinedAnalysis": {
    "detectedSubjects": ["数学", "理科"],
    "hasMultipleTopics": true,
    "suggestedOrder": [1, 2, 3],
    "relationshipType": "連続|独立|問題と解答"
  }
}

【重要】
- 必ずJSON形式で回答
- 画像の順序を考慮して内容を整理
- 不明瞭な部分は [不明] と記載
- 各画像の信頼度も評価`;

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      // 複数の画像データを準備
      const imageParts = imageBuffers.map((buffer, index) => ({
        inlineData: {
          data: buffer.toString('base64'),
          mimeType: 'image/jpeg'
        }
      }));

      // プロンプトと画像を結合
      const requestParts = [ocrPrompt, ...imageParts];

      console.log(`Sending ${imageBuffers.length} images to Gemini (attempt ${attempt + 1})`);

      const response = await model.generateContent(requestParts);
      const result = response.response.text();
      
      // JSON解析
      let parsedResult;
      try {
        parsedResult = JSON.parse(result);
      } catch (parseError) {
        throw new Error(`JSON parse failed: ${parseError.message}`);
      }

      // ファイル名を追加
      if (parsedResult.imageDetails) {
        parsedResult.imageDetails.forEach((detail, index) => {
          detail.filename = filenames[index] || `image_${index + 1}`;
        });
      }

      return {
        success: true,
        data: parsedResult,
        rawResponse: result
      };
      
    } catch (error) {
      console.error(`Multi-image OCR attempt ${attempt + 1} failed:`, error.message);
      
      if (attempt < retries - 1) {
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        continue;
      }
      
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
  }
}

// メモリクリーンアップミドルウェア
const cleanupMemory = (req, res, next) => {
  res.on('finish', () => {
    if (req.files) {
      req.files.forEach(file => {
        if (file.buffer) {
          file.buffer = null;
        }
      });
    }
    
    if (global.gc && process.env.NODE_ENV === 'production') {
      global.gc();
    }
  });
  next();
};

// 単一ファイルアップロード（既存機能との互換性）
router.post('/', upload.single('image'), cleanupMemory, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: '画像ファイルがアップロードされていません'
      });
    }

    console.log(`Processing single image: ${req.file.originalname}`);

    const processedBuffer = await preprocessImage(req.file.buffer, req.file.originalname);
    const ocrResult = await performMultiImageOCR([processedBuffer], [req.file.originalname]);
    
    if (!ocrResult.success) {
      return res.status(500).json({
        error: 'OCR処理に失敗しました',
        details: ocrResult.error
      });
    }

    const data = ocrResult.data;
    
    res.json({
      success: true,
      extractedText: data.extractedText,
      confidence: data.imageDetails[0]?.confidence || 0.8,
      metadata: {
        originalSize: req.file.size,
        processedSize: processedBuffer.length,
        textLength: data.extractedText.length,
        imageCount: 1
      }
    });

  } catch (error) {
    console.error('Single image processing error:', error);
    res.status(500).json({
      error: 'ファイル処理中にエラーが発生しました',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// 複数ファイルアップロード（新機能）
router.post('/multiple', upload.array('images', 10), cleanupMemory, async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        error: '画像ファイルがアップロードされていません'
      });
    }

    if (req.files.length > 10) {
      return res.status(400).json({
        error: '一度にアップロードできる画像は10枚までです'
      });
    }

    console.log(`Processing ${req.files.length} images:`, req.files.map(f => f.originalname));

    // 全ての画像を前処理
    const processedImages = await Promise.all(
      req.files.map(async (file) => {
        const processed = await preprocessImage(file.buffer, file.originalname);
        return {
          buffer: processed,
          originalName: file.originalname,
          originalSize: file.size,
          processedSize: processed.length
        };
      })
    );

    // 複数画像OCR実行
    const ocrResult = await performMultiImageOCR(
      processedImages.map(img => img.buffer),
      processedImages.map(img => img.originalName)
    );
    
    if (!ocrResult.success) {
      return res.status(500).json({
        error: '複数画像OCR処理に失敗しました',
        details: ocrResult.error
      });
    }

    const data = ocrResult.data;

    // テキストの最低品質チェック
    if (data.extractedText.length < 10) {
      return res.status(400).json({
        error: '抽出されたテキストが短すぎます。より鮮明な画像をアップロードしてください。'
      });
    }

    res.json({
      success: true,
      extractedText: data.extractedText,
      imageCount: req.files.length,
      imageDetails: data.imageDetails,
      combinedAnalysis: data.combinedAnalysis,
      metadata: {
        totalOriginalSize: processedImages.reduce((sum, img) => sum + img.originalSize, 0),
        totalProcessedSize: processedImages.reduce((sum, img) => sum + img.processedSize, 0),
        textLength: data.extractedText.length,
        averageConfidence: data.imageDetails.reduce((sum, detail) => sum + detail.confidence, 0) / data.imageDetails.length
      },
      files: processedImages.map(img => ({
        originalName: img.originalName,
        originalSize: img.originalSize,
        processedSize: img.processedSize
      }))
    });

  } catch (error) {
    console.error('Multiple image processing error:', error);
    
    res.status(500).json({
      error: '複数画像処理中にエラーが発生しました',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// バッチ処理（大量画像用）
router.post('/batch', upload.array('images', 20), cleanupMemory, async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        error: '画像ファイルがアップロードされていません'
      });
    }

    const batchSize = 5; // 5枚ずつ処理
    const batches = [];
    
    for (let i = 0; i < req.files.length; i += batchSize) {
      batches.push(req.files.slice(i, i + batchSize));
    }

    console.log(`Processing ${req.files.length} images in ${batches.length} batches`);

    const allResults = [];
    let combinedText = '';

    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = batches[batchIndex];
      
      console.log(`Processing batch ${batchIndex + 1}/${batches.length} (${batch.length} images)`);

      // バッチ内の画像を前処理
      const processedBatch = await Promise.all(
        batch.map(async (file) => {
          const processed = await preprocessImage(file.buffer, file.originalname);
          return {
            buffer: processed,
            originalName: file.originalname,
            originalSize: file.size
          };
        })
      );

      // バッチOCR実行
      const batchResult = await performMultiImageOCR(
        processedBatch.map(img => img.buffer),
        processedBatch.map(img => img.originalName)
      );

      if (batchResult.success) {
        allResults.push({
          batchIndex: batchIndex + 1,
          ...batchResult.data
        });
        combinedText += batchResult.data.extractedText + '\n\n';
      } else {
        console.error(`Batch ${batchIndex + 1} failed:`, batchResult.error);
      }

      // バッチ間で少し待機（API制限対策）
      if (batchIndex < batches.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    res.json({
      success: true,
      extractedText: combinedText.trim(),
      totalImages: req.files.length,
      processedBatches: batches.length,
      batchResults: allResults,
      metadata: {
        processingTime: Date.now(),
        successfulBatches: allResults.length,
        failedBatches: batches.length - allResults.length
      }
    });

  } catch (error) {
    console.error('Batch processing error:', error);
    
    res.status(500).json({
      error: 'バッチ処理中にエラーが発生しました',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// アップロード状況確認エンドポイント
router.get('/status', (req, res) => {
  res.json({
    service: 'Multi-Image OCR Upload Service',
    status: 'operational',
    version: '2.0.0',
    features: {
      singleImage: 'POST /api/upload',
      multipleImages: 'POST /api/upload/multiple (up to 10 images)',
      batchProcessing: 'POST /api/upload/batch (up to 20 images)',
      supportedFormats: ['image/jpeg', 'image/png', 'image/webp'],
      maxFileSize: '5MB per image',
      aiModel: 'Gemini 1.5 Flash'
    },
    limits: {
      singleUpload: 1,
      multipleUpload: 10,
      batchUpload: 20,
      maxFileSize: 5485760
    }
  });
});

module.exports = router;
