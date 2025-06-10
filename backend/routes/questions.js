const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const router = express.Router();

// Gemini AI初期化
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// 分野定義
const SUBJECTS = {
  'math': { name: '数学', icon: '🔢', keywords: ['計算', '数式', '図形', '方程式'] },
  'japanese': { name: '国語', icon: '📚', keywords: ['文章', '漢字', '語彙', '読解'] },
  'science': { name: '理科', icon: '🔬', keywords: ['実験', '化学', '物理', '生物'] },
  'social': { name: '社会', icon: '🌍', keywords: ['歴史', '地理', '政治'] },
  'english': { name: '英語', icon: '🇺🇸', keywords: ['英語', 'English', '文法'] }
};

// 難易度定義
const DIFFICULTIES = {
  'basic': { name: '基礎', level: '小学生〜中学1年' },
  'standard': { name: '標準', level: '中学生レベル' },
  'advanced': { name: '応用', level: '高校生レベル' }
};

// 設定情報取得
router.get('/config', (req, res) => {
  res.json({
    subjects: Object.entries(SUBJECTS).map(([id, info]) => ({
      id, ...info
    })),
    difficulties: Object.entries(DIFFICULTIES).map(([id, info]) => ({
      id, ...info
    })),
    questionTypes: [
      { id: 'multiple_choice', name: '選択肢問題' },
      { id: 'short_answer', name: '記述問題' },
      { id: 'calculation', name: '計算問題' }
    ]
  });
});

// 分野自動判定
function detectSubject(text) {
  const scores = {};
  
  Object.entries(SUBJECTS).forEach(([id, subject]) => {
    scores[id] = 0;
    subject.keywords.forEach(keyword => {
      if (text.includes(keyword)) {
        scores[id]++;
      }
    });
  });
  
  // 最高スコアの分野を返す
  const maxScore = Math.max(...Object.values(scores));
  return maxScore > 0 
    ? Object.keys(scores).find(key => scores[key] === maxScore)
    : 'japanese';
}

// 問題生成メイン機能
router.post('/generate', async (req, res) => {
  try {
    const {
      text,
      subject = 'auto',
      difficulty = 'standard',
      questionType = 'multiple_choice',
      questionCount = 3
    } = req.body;

    // 入力検証
    if (!text || text.length < 20) {
      return res.status(400).json({
        error: 'テキストは20文字以上である必要があります'
      });
    }

    // 分野自動判定
    const detectedSubject = subject === 'auto' ? detectSubject(text) : subject;
    const subjectInfo = SUBJECTS[detectedSubject] || SUBJECTS['japanese'];
    const difficultyInfo = DIFFICULTIES[difficulty] || DIFFICULTIES['standard'];

    console.log(`Generating questions: ${detectedSubject}, ${difficulty}, ${questionType}`);

    // ★ 重要：JSON強制設定
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      generationConfig: {
        response_mime_type: "application/json"
      }
    });

    // プロンプト構築
    const prompt = buildQuestionPrompt(text, subjectInfo, difficultyInfo, questionType, questionCount);

    console.log('Sending request to Gemini with JSON enforcement...');

    // Gemini AIで問題生成
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const generatedText = response.text();

    console.log('Gemini JSON response received:', generatedText.substring(0, 200));

    // JSONパース（今度は確実にJSONが返ってくる）
    let questionsData;
    try {
      questionsData = JSON.parse(generatedText);
    } catch (parseError) {
      console.error('JSON parse failed even with mime type enforcement:', parseError);
      console.error('Raw response:', generatedText);
      
      return res.status(500).json({
        error: 'JSON解析エラー',
        message: 'AIからの応答が正しいJSON形式ではありませんでした',
        rawResponse: generatedText.substring(0, 500)
      });
    }

    // questionsの配列を取得
    let questions = questionsData.questions || [questionsData];
    
    // questionsが配列でない場合の対応
    if (!Array.isArray(questions)) {
      questions = [questions];
    }

    // レスポンス整形
    const responseData = {
      success: true,
      timestamp: new Date().toISOString(),
      sourceTextLength: text.length,
      detectedSubject: detectedSubject,
      subjectName: subjectInfo.name,
      difficulty: difficulty,
      questionType: questionType,
      questions: questions.slice(0, questionCount).map((q, index) => ({
        id: `q_${Date.now()}_${index}`,
        ...q,
        subject: detectedSubject,
        difficulty: difficulty
      }))
    };

    console.log(`Generated ${responseData.questions.length} questions successfully`);
    console.log('Sample question:', responseData.questions[0]);

    res.json(responseData);

  } catch (error) {
    console.error('Question generation error:', error);
    
    res.status(500).json({
      error: '問題生成中にエラーが発生しました',
      message: process.env.NODE_ENV === 'development' ? error.message : '再試行してください',
      timestamp: new Date().toISOString()
    });
  }
});

// プロンプト構築関数（JSON強制版）
function buildQuestionPrompt(text, subjectInfo, difficultyInfo, questionType, questionCount) {
  let basePrompt = `
以下のテキストから、${subjectInfo.name}の${questionType === 'multiple_choice' ? '選択肢問題' : '記述問題'}を${questionCount}問作成してください。

【対象テキスト】
${text}

【条件】
- 分野: ${subjectInfo.name} ${subjectInfo.icon}
- 難易度: ${difficultyInfo.name} (${difficultyInfo.level})
- 問題数: ${questionCount}問
- 必ず指定されたJSON形式で回答してください

`;

  if (questionType === 'multiple_choice') {
    basePrompt += `
【選択肢問題のJSON形式】
{
  "questions": [
    {
      "question": "問題文をここに記述",
      "options": [
        "選択肢1",
        "選択肢2", 
        "選択肢3",
        "選択肢4"
      ],
      "correctAnswer": 0,
      "explanation": "なぜこの選択肢が正解なのかの解説"
    }
  ]
}

【重要なルール】
1. optionsには必ず4つの選択肢を含める
2. correctAnswerは正解の選択肢番号（0, 1, 2, 3のいずれか）
3. questionは明確で理解しやすい問題文にする
4. explanationには詳しい解説を含める
5. 必ずJSON形式で回答する（他の形式は禁止）`;

  } else {
    basePrompt += `
【記述問題のJSON形式】
{
  "questions": [
    {
      "question": "問題文をここに記述",
      "correctAnswer": "模範解答をここに記述",
      "explanation": "解答のポイントと解説",
      "keywords": ["重要キーワード1", "重要キーワード2"]
    }
  ]
}

【重要なルール】
1. questionは明確で具体的な問題文にする
2. correctAnswerには適切な模範解答を記述
3. explanationには詳しい解説を含める
4. keywordsには解答に含むべき重要な語句を列挙
5. 必ずJSON形式で回答する（他の形式は禁止）`;
  }

  basePrompt += `

【絶対遵守事項】
- レスポンスは必ず上記のJSON形式のみで回答
- JSON以外のテキスト（説明、コメント等）は一切含めない
- 文字化けや特殊文字は使用しない
- 日本語で問題を作成する`;

  return basePrompt;
}

module.exports = router;
