import React, { useState } from 'react';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://learning-support-app-api.onrender.com';

// 問題カードコンポーネント
const QuestionCard = ({ question, questionNumber }) => {
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);

  const handleAnswerSelect = (answerIndex) => {
    setSelectedAnswer(answerIndex);
  };

  const handleSubmitAnswer = () => {
    setShowResult(true);
  };

  const handleShowExplanation = () => {
    setShowExplanation(true);
  };

  const resetQuestion = () => {
    setSelectedAnswer(null);
    setShowResult(false);
    setShowExplanation(false);
  };

  return (
    <div style={{
      border: '1px solid #e9ecef',
      borderRadius: '8px',
      padding: '20px',
      marginBottom: '20px',
      backgroundColor: '#f8f9fa'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
        <h4 style={{ color: '#495057', margin: 0 }}>
          問題 {questionNumber}
        </h4>
        
        {(showResult || showExplanation) && (
          <button
            onClick={resetQuestion}
            style={{
              padding: '4px 8px',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            🔄 リセット
          </button>
        )}
      </div>
      
      <p style={{ 
        fontSize: '16px', 
        lineHeight: '1.6',
        marginBottom: '20px'
      }}>
        {question.question}
      </p>

      {/* 選択肢問題の場合 */}
      {question.options && (
        <div style={{ marginBottom: '20px' }}>
          {question.options.map((option, optionIndex) => {
            let backgroundColor = '#fff';
            let borderColor = '#ddd';
            let icon = '';

            if (selectedAnswer === optionIndex) {
              backgroundColor = '#e3f2fd';
              borderColor = '#2196f3';
            }

            if (showResult) {
              if (optionIndex === question.correctAnswer) {
                backgroundColor = '#d1ecf1';
                borderColor = '#007bff';
                icon = ' ✅';
              } else if (selectedAnswer === optionIndex && optionIndex !== question.correctAnswer) {
                backgroundColor = '#f8d7da';
                borderColor = '#dc3545';
                icon = ' ❌';
              }
            }

            return (
              <div 
                key={optionIndex} 
                onClick={() => !showResult && handleAnswerSelect(optionIndex)}
                style={{
                  padding: '12px 15px',
                  margin: '8px 0',
                  backgroundColor: backgroundColor,
                  border: `2px solid ${borderColor}`,
                  borderRadius: '6px',
                  cursor: showResult ? 'default' : 'pointer',
                  transition: 'all 0.2s ease',
                  userSelect: 'none'
                }}
              >
                <strong>{String.fromCharCode(65 + optionIndex)}.</strong> {option}{icon}
              </div>
            );
          })}
          
          {/* 解答ボタン */}
          {!showResult && selectedAnswer !== null && (
            <button
              onClick={handleSubmitAnswer}
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '16px',
                cursor: 'pointer',
                marginTop: '15px'
              }}
            >
              📝 解答する
            </button>
          )}

          {/* 結果表示 */}
          {showResult && (
            <div style={{
              marginTop: '15px',
              padding: '15px',
              borderRadius: '8px',
              backgroundColor: selectedAnswer === question.correctAnswer ? '#d1ecf1' : '#f8d7da',
              border: `1px solid ${selectedAnswer === question.correctAnswer ? '#bee5eb' : '#f5c6cb'}`
            }}>
              <h5 style={{ margin: '0 0 10px 0' }}>
                {selectedAnswer === question.correctAnswer ? '🎉 正解！' : '😞 不正解'}
              </h5>
              <p style={{ margin: 0 }}>
                正解: <strong>{String.fromCharCode(65 + question.correctAnswer)}. {question.options[question.correctAnswer]}</strong>
              </p>
            </div>
          )}
        </div>
      )}

      {/* 記述・計算問題の場合 */}
      {question.correctAnswer && !question.options && (
        <div>
          <textarea
            placeholder="ここに解答を入力してください..."
            style={{
              width: '100%',
              minHeight: '100px',
              padding: '10px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              marginBottom: '10px',
              resize: 'vertical'
            }}
          />
          
          {!showResult && (
            <button
              onClick={handleSubmitAnswer}
              style={{
                padding: '10px 20px',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              📝 解答確認
            </button>
          )}

          {showResult && (
            <div style={{
              backgroundColor: '#d1ecf1',
              padding: '15px',
              borderRadius: '4px',
              marginTop: '10px'
            }}>
              <strong>💡 模範解答:</strong> {question.correctAnswer}
            </div>
          )}
        </div>
      )}

      {/* 解説表示ボタンと解説 */}
      {question.explanation && (
        <div style={{ marginTop: '15px' }}>
          {!showExplanation && (showResult || !question.options) && (
            <button
              onClick={handleShowExplanation}
              style={{
                padding: '8px 16px',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              📚 解説を見る
            </button>
          )}

          {showExplanation && (
            <div style={{
              backgroundColor: '#e2e3e5',
              padding: '15px',
              borderRadius: '4px',
              fontSize: '14px',
              marginTop: '10px',
              lineHeight: '1.5'
            }}>
              <strong>📝 解説:</strong><br />
              {question.explanation}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

function App() {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [extractedText, setExtractedText] = useState('');
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('upload');
  const [error, setError] = useState('');
  const [uploadMode, setUploadMode] = useState('single'); // 'single' or 'multiple'
  const [imageDetails, setImageDetails] = useState([]);

  // ファイル選択処理（複数対応）
  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files);
    if (files.length > 0) {
      setSelectedFiles(files);
      setError('');
    }
  };

  // OCR処理（単一・複数対応）
  const handleOCR = async () => {
    if (selectedFiles.length === 0) {
      setError('画像ファイルを選択してください');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      
      if (uploadMode === 'single' || selectedFiles.length === 1) {
        // 単一ファイルアップロード
        formData.append('image', selectedFiles[0]);
        
        const response = await fetch(`${API_BASE_URL}/api/upload`, {
          method: 'POST',
          body: formData
        });

        const data = await response.json();

        if (data.success) {
          setExtractedText(data.extractedText);
          setImageDetails([{
            filename: selectedFiles[0].name,
            content: data.extractedText,
            confidence: data.confidence
          }]);
          setActiveTab('text');
        } else {
          setError(data.error || 'OCR処理に失敗しました');
        }
      } else {
        // 複数ファイルアップロード
        selectedFiles.forEach(file => {
          formData.append('images', file);
        });

        const endpoint = selectedFiles.length <= 10 ? '/api/upload/multiple' : '/api/upload/batch';
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
          method: 'POST',
          body: formData
        });

        const data = await response.json();

        if (data.success) {
          setExtractedText(data.extractedText);
          setImageDetails(data.imageDetails || []);
          setActiveTab('text');
        } else {
          setError(data.error || '複数画像OCR処理に失敗しました');
        }
      }
    } catch (error) {
      console.error('OCR Error:', error);
      setError('OCR処理中にエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  // 問題生成処理
  const handleGenerateQuestions = async () => {
    if (!extractedText) {
      setError('まずテキストを抽出してください');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE_URL}/api/questions/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text: extractedText,
          questionType: 'multiple_choice',
          questionCount: 3,
          difficulty: 'standard'
        })
      });

      const data = await response.json();

      if (data.success) {
        setQuestions(data.questions);
        setActiveTab('questions');
      } else {
        setError(data.error || '問題生成に失敗しました');
      }
    } catch (error) {
      console.error('Question Generation Error:', error);
      setError('問題生成中にエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  // API接続テスト
  const testAPIConnection = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/health`);
      const data = await response.json();
      
      if (data.status === 'OK') {
        alert('✅ APIの接続に成功しました！');
      } else {
        alert('❌ APIの接続に問題があります');
      }
    } catch (error) {
      alert('❌ API接続エラー: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      padding: '20px', 
      maxWidth: '800px', 
      margin: '0 auto',
      fontFamily: 'Arial, sans-serif'
    }}>
      {/* ヘッダー */}
      <header style={{ textAlign: 'center', marginBottom: '30px' }}>
        <h1 style={{ color: '#2c3e50' }}>🎓 学習サポートアプリ</h1>
        <p style={{ color: '#666' }}>複数画像対応 AI学習支援システム</p>
        
        <button 
          onClick={testAPIConnection}
          style={{
            padding: '8px 16px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
          disabled={loading}
        >
          🔗 API接続テスト
        </button>
      </header>

      {/* エラー表示 */}
      {error && (
        <div style={{
          backgroundColor: '#f8d7da',
          color: '#721c24',
          padding: '15px',
          borderRadius: '8px',
          margin: '20px 0',
          border: '1px solid #f5c6cb'
        }}>
          ❌ {error}
        </div>
      )}

      {/* タブメニュー */}
      <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'center' }}>
        {[
          { id: 'upload', label: '画像アップロード' },
          { id: 'text', label: '抽出テキスト' },
          { id: 'questions', label: '生成問題' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '10px 20px',
              margin: '0 5px',
              backgroundColor: activeTab === tab.id ? '#007bff' : '#f8f9fa',
              color: activeTab === tab.id ? 'white' : '#333',
              border: '1px solid #ddd',
              borderRadius: '8px',
              cursor: 'pointer',
              minWidth: '120px'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* コンテンツエリア */}
      <div style={{
        border: '1px solid #ddd',
        borderRadius: '8px',
        padding: '20px',
        backgroundColor: '#fff',
        minHeight: '400px'
      }}>
        
        {/* 画像アップロードタブ */}
        {activeTab === 'upload' && (
          <div>
            <h3>画像アップロード</h3>
            
            {/* アップロードモード選択 */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ marginRight: '20px' }}>
                <input
                  type="radio"
                  value="single"
                  checked={uploadMode === 'single'}
                  onChange={(e) => setUploadMode(e.target.value)}
                  style={{ marginRight: '5px' }}
                />
                単一画像
              </label>
              <label>
                <input
                  type="radio"
                  value="multiple"
                  checked={uploadMode === 'multiple'}
                  onChange={(e) => setUploadMode(e.target.value)}
                  style={{ marginRight: '5px' }}
                />
                複数画像（最大20枚）
              </label>
            </div>
            
            <div style={{
              border: '2px dashed #ddd',
              borderRadius: '8px',
              padding: '40px',
              textAlign: 'center',
              marginBottom: '20px'
            }}>
              <input
                type="file"
                accept="image/*"
                multiple={uploadMode === 'multiple'}
                onChange={handleFileSelect}
                style={{ display: 'none' }}
                id="file-input"
              />
              <label htmlFor="file-input" style={{
                cursor: 'pointer',
                color: '#007bff',
                fontSize: '16px'
              }}>
                {uploadMode === 'single' 
                  ? '📁 画像ファイルを選択してください' 
                  : '📁 複数の画像ファイルを選択してください'
                }
              </label>
              
              {selectedFiles.length > 0 && (
                <div style={{ marginTop: '15px' }}>
                  <div style={{ color: '#28a745', marginBottom: '10px' }}>
                    ✅ {selectedFiles.length}枚の画像を選択済み
                  </div>
                  <div style={{ 
                    maxHeight: '150px', 
                    overflowY: 'auto', 
                    fontSize: '14px',
                    textAlign: 'left',
                    backgroundColor: '#f8f9fa',
                    padding: '10px',
                    borderRadius: '4px'
                  }}>
                    {selectedFiles.map((file, index) => (
                      <div key={index} style={{ 
                        padding: '2px 0',
                        borderBottom: index < selectedFiles.length - 1 ? '1px solid #ddd' : 'none'
                      }}>
                        📄 {file.name} ({(file.size / 1024 / 1024).toFixed(2)}MB)
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={handleOCR}
              disabled={selectedFiles.length === 0 || loading}
              style={{
                width: '100%',
                padding: '15px',
                backgroundColor: loading ? '#6c757d' : '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              {loading 
                ? '🔄 処理中...' 
                : uploadMode === 'single' 
                  ? '🚀 テキスト抽出開始' 
                  : `🚀 ${selectedFiles.length}枚の画像からテキスト抽出`
              }
            </button>

            <div style={{ marginTop: '20px', fontSize: '14px', color: '#666' }}>
              <h4>📋 複数画像対応機能</h4>
              <ul style={{ textAlign: 'left' }}>
                <li><strong>単一画像:</strong> 1枚の画像から高精度テキスト抽出</li>
                <li><strong>複数画像:</strong> 最大20枚の画像を一括処理</li>
                <li><strong>自動統合:</strong> 関連する内容を自動で結合</li>
                <li><strong>バッチ処理:</strong> 大量画像は5枚ずつ分割処理</li>
                <li><strong>対応形式:</strong> JPEG, PNG, WebP（各5MB以内）</li>
              </ul>
              
              <div style={{ 
                marginTop: '15px', 
                padding: '10px', 
                backgroundColor: '#e7f3ff', 
                borderRadius: '4px',
                border: '1px solid #b3d9ff'
              }}>
                <strong>💡 使用例:</strong>
                <ul style={{ margin: '5px 0', paddingLeft: '20px' }}>
                  <li>問題集の連続ページ</li>
                  <li>ノートの複数ページ</li>
                  <li>問題と解答が別ページ</li>
                  <li>教科書の章全体</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* 抽出テキストタブ */}
        {activeTab === 'text' && (
          <div>
            <h3>抽出されたテキスト</h3>
            
            {extractedText ? (
              <div>
                {/* 画像詳細情報 */}
                {imageDetails.length > 1 && (
                  <div style={{ 
                    marginBottom: '20px',
                    padding: '15px',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '8px',
                    border: '1px solid #e9ecef'
                  }}>
                    <h4 style={{ margin: '0 0 10px 0', color: '#495057' }}>
                      📊 処理結果詳細（{imageDetails.length}枚の画像）
                    </h4>
                    <div style={{ 
                      maxHeight: '120px', 
                      overflowY: 'auto',
                      fontSize: '13px'
                    }}>
                      {imageDetails.map((detail, index) => (
                        <div key={index} style={{ 
                          padding: '5px 0',
                          borderBottom: index < imageDetails.length - 1 ? '1px solid #ddd' : 'none'
                        }}>
                          <strong>画像{index + 1}:</strong> {detail.filename} 
                          <span style={{ color: '#666', marginLeft: '10px' }}>
                            (信頼度: {(detail.confidence * 100).toFixed(1)}%)
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <textarea
                  value={extractedText}
                  onChange={(e) => setExtractedText(e.target.value)}
                  style={{
                    width: '100%',
                    minHeight: '300px',
                    padding: '15px',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    fontSize: '14px',
                    lineHeight: '1.5',
                    resize: 'vertical'
                  }}
                />
                
                <div style={{ 
                  marginTop: '15px', 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span style={{ color: '#666', fontSize: '14px' }}>
                    📊 文字数: {extractedText.length} | 画像数: {imageDetails.length}枚
                  </span>
                  
                  <button
                    onClick={handleGenerateQuestions}
                    disabled={loading || !extractedText}
                    style={{
                      padding: '10px 20px',
                      backgroundColor: loading ? '#6c757d' : '#007bff',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      fontWeight: 'bold'
                    }}
                  >
                    {loading ? '🔄 生成中...' : '🤖 問題生成'}
                  </button>
                </div>
              </div>
            ) : (
              <div style={{
                textAlign: 'center',
                padding: '60px',
                color: '#999'
              }}>
                📷 まず画像をアップロードしてテキストを抽出してください
              </div>
            )}
          </div>
        )}

        {/* 生成問題タブ */}
        {activeTab === 'questions' && (
          <div>
            <h3>生成された問題</h3>
            
            {questions.length > 0 ? (
              <div>
                {questions.map((question, index) => (
                  <QuestionCard 
                    key={question.id || index} 
                    question={question} 
                    questionNumber={index + 1} 
                  />
                ))}
                
                <button
                  onClick={handleGenerateQuestions}
                  disabled={loading}
                  style={{
                    width: '100%',
                    padding: '12px',
                    backgroundColor: '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer'
                  }}
                >
                  🔄 新しい問題を生成
                </button>
              </div>
            ) : (
              <div style={{
                textAlign: 'center',
                padding: '60px',
                color: '#999'
              }}>
                🤖 テキストから問題を生成してください
              </div>
            )}
          </div>
        )}
      </div>

      {/* ローディング状態 */}
      {loading && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '10px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '15px' }}>
              {selectedFiles.length > 1 ? '📚' : '🤖'}
            </div>
            <div style={{ fontSize: '18px', color: '#333' }}>
              {selectedFiles.length > 1 
                ? `${selectedFiles.length}枚の画像を処理中...` 
                : 'AI処理中...'
              }
            </div>
            <div style={{ fontSize: '14px', color: '#666', marginTop: '5px' }}>
              {selectedFiles.length > 10 
                ? 'バッチ処理のため時間がかかります' 
                : 'しばらくお待ちください'
              }
            </div>
          </div>
        </div>
      )}

      {/* フッター */}
      <footer style={{
        marginTop: '40px',
        textAlign: 'center',
        padding: '20px',
        borderTop: '1px solid #eee',
        color: '#666',
        fontSize: '14px'
      }}>
        <p>🎓 学習サポートアプリ v2.0.0 - 複数画像対応版</p>
        <p>Powered by Gemini AI | 開発者: T-aka-H</p>
        <p>API: <a href={API_BASE_URL} target="_blank" rel="noopener noreferrer">{API_BASE_URL}</a></p>
        <p style={{ fontSize: '12px', marginTop: '10px' }}>
          📚 複数画像同時処理 | 🔄 バッチ処理対応 | 📊 詳細解析結果表示
        </p>
      </footer>
    </div>
  );
}

export default App;
