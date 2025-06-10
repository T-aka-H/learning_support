import React, { useState, useRef, useCallback } from 'react';
import './FileUpload.css';

const FileUpload = ({ onTextExtracted, onError, isLoading, setIsLoading }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  // ファイル選択処理
  const handleFileSelect = useCallback((file) => {
    if (!file) {
      onError('ファイルが選択されていません。');
      return;
    }

    // ファイルタイプチェック
    if (!file.type.startsWith('image/')) {
      onError('画像ファイルのみアップロード可能です。');
      return;
    }

    // ファイルサイズチェック（5MB制限）
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      onError('ファイルサイズが大きすぎます。5MB以下のファイルを選択してください。');
      return;
    }

    setSelectedFile(file);

    // プレビュー画像作成
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target.result);
    };
    reader.onerror = () => {
      onError('ファイルの読み込みに失敗しました。');
    };
    reader.readAsDataURL(file);
  }, [onError]);

  // ファイル入力変更時の処理
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    handleFileSelect(file);
  };

  // ドラッグ&ドロップ処理
  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // ドロップエリアから完全に出た時のみfalseにする
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setIsDragging(false);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  // ファイル選択ダイアログを開く
  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  // ファイルをアップロードしてOCR処理
  const uploadFile = async () => {
    if (!selectedFile) {
      onError('アップロードするファイルが選択されていません。');
      return;
    }

    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append('image', selectedFile);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'アップロードに失敗しました');
      }

      const result = await response.json();

      if (result.success && result.extractedText) {
        onTextExtracted(result.extractedText);
      } else {
        throw new Error('テキストの抽出に失敗しました');
      }

    } catch (error) {
      console.error('Upload error:', error);
      onError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // ファイル選択をリセット
  const resetSelection = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // ファイル情報を表示用にフォーマット
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="file-upload">
      {!selectedFile ? (
        <>
          {/* ドラッグ&ドロップエリア */}
          <div
            className={`drop-zone ${isDragging ? 'dragging' : ''}`}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={openFileDialog}
          >
            <div className="drop-zone-content">
              <div className="upload-icon">📁</div>
              <h3>画像ファイルをアップロード</h3>
              <p>
                ファイルをここにドラッグ&ドロップするか、<br />
                クリックしてファイルを選択してください
              </p>
              <div className="supported-formats">
                <strong>対応形式:</strong> JPG, PNG, GIF, BMP, WebP
              </div>
              <div className="file-size-limit">
                <strong>最大ファイルサイズ:</strong> 5MB
              </div>
            </div>

            {/* ドラッグ中のオーバーレイ */}
            {isDragging && (
              <div className="drag-overlay">
                <div className="drag-message">
                  📁 ファイルをここにドロップ
                </div>
              </div>
            )}
          </div>

          {/* ファイル選択ボタン */}
          <div className="upload-actions">
            <button 
              className="btn btn-primary btn-large"
              onClick={openFileDialog}
              disabled={isLoading}
            >
              📁 ファイルを選択
            </button>
          </div>

          {/* 隠しファイル入力 */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden-file-input"
            disabled={isLoading}
          />

          {/* 使用方法 */}
          <div className="usage-guide">
            <h4>📝 アップロードのコツ</h4>
            <ul>
              <li>文字がはっきり見える高画質な画像を使用</li>
              <li>明るい場所で撮影された画像が最適</li>
              <li>テキスト全体が画像内に収まっていることを確認</li>
              <li>手書き文字よりも印刷された文字の方が精度良好</li>
              <li>傾きや歪みが少ない画像を選択</li>
            </ul>
          </div>
        </>
      ) : (
        <>
          {/* ファイルプレビュー */}
          <div className="file-preview">
            <div className="preview-header">
              <h3>📄 選択されたファイル</h3>
              <button 
                className="btn btn-secondary btn-small"
                onClick={resetSelection}
                disabled={isLoading}
              >
                ✕ 選択解除
              </button>
            </div>

            {/* 画像プレビュー */}
            <div className="image-preview">
              <img 
                src={previewUrl} 
                alt="アップロード予定の画像" 
                className="preview-image"
              />
            </div>

            {/* ファイル情報 */}
            <div className="file-info">
              <div className="file-details">
                <div className="file-detail">
                  <span className="label">ファイル名:</span>
                  <span className="value">{selectedFile.name}</span>
                </div>
                <div className="file-detail">
                  <span className="label">ファイルサイズ:</span>
                  <span className="value">{formatFileSize(selectedFile.size)}</span>
                </div>
                <div className="file-detail">
                  <span className="label">ファイル形式:</span>
                  <span className="value">{selectedFile.type}</span>
                </div>
                <div className="file-detail">
                  <span className="label">最終更新:</span>
                  <span className="value">
                    {new Date(selectedFile.lastModified).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* アップロードボタン */}
            <div className="upload-controls">
              <button 
                className="btn btn-secondary"
                onClick={resetSelection}
                disabled={isLoading}
              >
                🔄 別のファイルを選択
              </button>
              
              <button 
                className="btn btn-primary"
                onClick={uploadFile}
                disabled={isLoading}
              >
                {isLoading ? '処理中...' : '🚀 アップロード開始'}
              </button>
            </div>

            {/* 処理中の説明 */}
            {isLoading && (
              <div className="processing-info">
                <div className="processing-steps">
                  <div className="step active">
                    <span className="step-number">1</span>
                    <span className="step-text">ファイルアップロード中...</span>
                  </div>
                  <div className="step">
                    <span className="step-number">2</span>
                    <span className="step-text">画像からテキストを抽出中...</span>
                  </div>
                  <div className="step">
                    <span className="step-number">3</span>
                    <span className="step-text">問題生成準備中...</span>
                  </div>
                </div>
                <p className="processing-note">
                  処理には30秒程度かかる場合があります
                </p>
              </div>
            )}
          </div>
        </>
      )}

      {/* ファイル形式ヘルプ */}
      <div className="format-help">
        <details>
          <summary>📋 対応ファイル形式について</summary>
          <div className="format-details">
            <h5>推奨形式</h5>
            <ul>
              <li><strong>JPEG (.jpg, .jpeg)</strong> - 一般的な写真形式、高い互換性</li>
              <li><strong>PNG (.png)</strong> - 高品質、透明度対応</li>
            </ul>
            
            <h5>その他対応形式</h5>
            <ul>
              <li><strong>GIF (.gif)</strong> - 動画は非対応、静止画のみ</li>
              <li><strong>BMP (.bmp)</strong> - 無圧縮形式</li>
              <li><strong>WebP (.webp)</strong> - 次世代画像形式</li>
            </ul>

            <h5>最適化のヒント</h5>
            <ul>
              <li>解像度: 1024×768以上推奨</li>
              <li>圧縮: 品質80%以上推奨</li>
              <li>色空間: RGB推奨</li>
            </ul>
          </div>
        </details>
      </div>
    </div>
  );
};

export default FileUpload;