const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const router = express.Router();

// Gemini AI初期化
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// 科目別プロンプトテンプレート
const subjectPrompts = {
  auto: `
あなたは中学受験専門の教育者です。提供されたテキストから科目を自動判定し、適切な10問の選択問題を作成してください。

【科目判定基準】
- 国語: 文章読解、漢字、語彙、文法
- 算数: 計算、図形、文章題、特殊算
- 理科: 実験、生物、物理、化学、地学
- 社会: 歴史、地理、公民、時事

【問題作成ルール】
1. 4択問題を10問作成
2. 各問題に詳細な解説を付与
3. 難易度を段階的に調整（基礎→標準→応用）
4. 中学受験頻出ポイントを重視

【出力形式JSON】
{
  "subject": "判定した科目",
  "difficulty": "判定した難易度",
  "questions": [
    {
      "id": 1,
      "question": "問題文",
      "choices": ["選択肢A", "選択肢B", "選択肢C", "選択肢D"],
      "correctAnswer": 0,
      "explanation": "詳細な解説",
      "difficulty": "基礎|標準|応用",
      "category": "分野"
    }
  ]
}
`,

  japanese: `
あなたは中学受験国語の専門講師です。提供されたテキストから10問の選択問題を作成してください。

【問題種別】
- 漢字読み・書き
- 語彙・慣用句・四字熟語
- 文法・敬語
- 読解問題

【作成ルール】
1. 小学6年生レベル
2. 4択問題形式
3. 難しい漢字には読み仮名
4. 実際の入試問題レベル

【出力形式JSON】
{
  "subject": "国語",
  "questions": [問題配列]
}
`,

  math: `
あなたは中学受験算数の専門講師です。提供されたテキストから10問の選択問題を作成してください。

【問題種別】
- 計算問題（四則演算、分数、小数）
- 文章題（割合、比、速さ）
- 図形問題（面積、体積、角度）
- 特殊算（つるかめ算、旅人算など）

【作成ルール】
1. 段階的難易度設定
2. 解法の手順を詳説
3. 計算ミスしやすいポイント指摘
4. 図やグラフがある場合は言葉で説明

【出力形式JSON】
{
  "subject": "算数",
  "questions": [問題配列]
}
`,

  science: `
あなたは中学受験理科の専門講師です。提供されたテキストから10問の選択問題を作成してください。

【分野】
- 生物: 動物、植物、人体
- 物理: 力、電気、光、音
- 化学: 物質の性質、化学変化
- 地学: 天体、気象、地質

【作成ルール】
1. 実験・観察重視
2. 現象の理由を問う
3. 日常生活との関連
4. 図表の読み取り

【出力形式JSON】
{
  "subject": "理科",
  "questions": [問題配列]
}
`,

  social: `
あなたは中学受験社会の専門講師です。提供されたテキストから10問の選択問題を作成してください。

【分野】
- 歴史: 各時代の特徴、人物、文化
- 地理: 地形、気候、産業、都市
- 公民: 政治、経済、国際関係

【作成ルール】
1. 時事問題との関連
2. 地図・グラフの読み取り
3. 因果関係の理解
4. 複数資料の比較

【出力形式JSON】
{
  "subject": "社会",
  "questions": [問題配列]
}
`
};

// 難易度レベル定義
const difficultyLevels = {
  basic: { name: '基礎', targetAccuracy: 0.8 },
  standard: { name: '標準', targetAccuracy: 0.6 },
  advanced: { name: '応用', targetAccuracy: 0.4 },
  challenge: { name: '発展', targetAccuracy: 0.2 }
};

// 問題生成関数
async function generateQuestions(text, subject = 'auto', difficulty = 'standard', retries = 3) {
  const model = genAI.getGenerativeModel({ 
    model: "gemini-1.5-flash",
    generationConfig: {
      temperature: 0.7,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 4096,
    }
  });

  const basePrompt = subjectPrompts[subject] || subjectPrompts.auto;
  
  const fullPrompt = `
${basePrompt}

【難易度設定】
${difficultyLevels[difficulty].name}レベル（目標正答率: ${difficultyLevels[difficulty].targetAccuracy * 100}%）

【入力テキスト】
${text}

必ずJSON形式で回答してください。JSONの前後に余計な文字は含めないでください。
`;

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const response = await model.generateContent(fullPrompt);
      const responseText = response.response.text().trim();
      
      // JSON抽出
      let jsonText = responseText;
      if (responseText.includes('```json')) {
        const match = responseText.match(/```json\n?(.*?)\n?```/s);
        if (match) {
          jsonText = match[1];
        }
      }
      
      const questions = JSON.parse(jsonText);
      
      // 基本的な検証
      if (!questions.questions || !Array.isArray(questions.questions) || questions.questions.length === 0) {
        throw new Error('問題が生成されませんでした');
      }
      
      // 各問題の検証と補完
      const validatedQuestions = questions.questions.map((q, index) => ({
        id: q.id || index + 1,
        question: q.question || '',
        choices: Array.isArray(q.choices) && q.choices.length === 4 ? q.choices : ['選択肢A', '選択肢B', '選択肢C', '選択肢D'],
        correctAnswer: typeof q.correctAnswer === 'number' && q.correctAnswer >= 0 && q.correctAnswer <= 3 ? q.correctAnswer : 0,
        explanation: q.explanation || '解説なし',
        difficulty: q.difficulty || difficulty,
        category: q.category || '一般'
      }));

      return {
        success: true,
        subject: questions.subject || subject,
        difficulty: difficulty,
        questions: validatedQuestions,
        metadata: {
          generatedAt: new Date().toISOString(),
          textLength: text.length,
          questionCount: validatedQuestions.length
        }
      };

    } catch (error) {
      console.error(`Question generation attempt ${attempt + 1} failed:`, error.message);
      
      if (attempt < retries - 1) {
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        continue;
      }
      
      return {
        success: false,
        error: error.message,
        questions: []
      };
    }
  }
}

// 問題生成エンドポイント
router.post('/generate', async (req, res) => {
  try {
    const { text, subject = 'auto', difficulty = 'standard' } = req.body;
    
    // 入力検証
    if (!text || typeof text !== 'string') {
      return res.status(400).json({
        error: 'テキストが提供されていません'
      });
    }
    
    if (text.length < 20) {
      return res.status(400).json({
        error: 'テキストが短すぎます（20文字以上必要）'
      });
    }
    
    if (text.length > 10000) {
      return res.status(400).json({
        error: 'テキストが長すぎます（10000文字以下にしてください）'
      });
    }
    
    if (!Object.keys(subjectPrompts).includes(subject)) {
      return res.status(400).json({
        error: '無効な科目が指定されました'
      });
    }
    
    if (!Object.keys(difficultyLevels).includes(difficulty)) {
      return res.status(400).json({
        error: '無効な難易度が指定されました'
      });
    }

    console.log(`Generating questions: subject=${subject}, difficulty=${difficulty}, textLength=${text.length}`);

    // 問題生成実行
    const result = await generateQuestions(text, subject, difficulty);
    
    if (!result.success) {
      return res.status(500).json({
        error: '問題生成に失敗しました',
        details: result.error
      });
    }

    res.json(result);

  } catch (error) {
    console.error('Question generation error:', error);
    
    res.status(500).json({
      error: '問題生成中にエラーが発生しました',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// サンプル問題生成エンドポイント（テスト用）
router.get('/sample/:subject', async (req, res) => {
  try {
    const { subject } = req.params;
    const { difficulty = 'standard' } = req.query;
    
    // サンプルテキスト
    const sampleTexts = {
      japanese: '桜の花が咲く春になりました。美しい花びらが風に舞っています。古来より日本人は桜を愛し、花見の文化が根付いています。',
      math: '太郎くんは家から学校まで歩いて20分かかります。歩く速さを毎分60mとすると、家から学校までの距離は何mでしょうか。',
      science: '植物は光合成によって酸素を作り出します。葉の緑色の部分にある葉緑体が、太陽の光と二酸化炭素、水を使って酸素とデンプンを作ります。',
      social: '江戸時代は1603年に始まり、徳川家康が江戸幕府を開きました。約260年間続いたこの時代は、平和で文化が発達した時代でした。'
    };
    
    const sampleText = sampleTexts[subject] || sampleTexts.japanese;
    
    const result = await generateQuestions(sampleText, subject, difficulty);
    
    if (!result.success) {
      return res.status(500).json({
        error: 'サンプル問題生成に失敗しました',
        details: result.error
      });
    }
    
    res.json({
      ...result,
      sampleMode: true,
      inputText: sampleText
    });

  } catch (error) {
    console.error('Sample question generation error:', error);
    
    res.status(500).json({
      error: 'サンプル問題生成中にエラーが発生しました'
    });
  }
});

// 利用可能な設定情報取得
router.get('/config', (req, res) => {
  res.json({
    subjects: {
      auto: '自動判定',
      japanese: '国語',
      math: '算数',
      science: '理科',
      social: '社会'
    },
    difficulties: Object.fromEntries(
      Object.entries(difficultyLevels).map(([key, value]) => [key, value.name])
    )
  });
});

module.exports = router;