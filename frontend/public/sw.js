// Service Worker for Learning Support App
// Version 1.0.0

const CACHE_NAME = 'learning-support-v1.0.0';
const API_CACHE_NAME = 'learning-support-api-v1.0.0';

// キャッシュするリソース
const STATIC_RESOURCES = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json',
  '/favicon.ico',
  // アイコンファイル
  '/logo192.png',
  '/logo512.png',
  // フォント（もしあれば）
  // オフライン用ページ
  '/offline.html'
];

// API エンドポイント（キャッシュ対象）
const CACHEABLE_API_ENDPOINTS = [
  '/api/questions/config',
  '/api/questions/sample/'
];

// インストール時の処理
self.addEventListener('install', (event) => {
  console.log('[SW] Installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching static resources');
        return cache.addAll(STATIC_RESOURCES.filter(url => url !== '/offline.html'));
      })
      .then(() => {
        // オフラインページを個別にキャッシュ
        return caches.open(CACHE_NAME)
          .then(cache => {
            return cache.add('/offline.html').catch(() => {
              // オフラインページがない場合はスキップ
              console.log('[SW] Offline page not found, skipping...');
            });
          });
      })
      .then(() => {
        console.log('[SW] Installation complete');
        // 新しいService Workerをすぐにアクティブにする
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[SW] Installation failed:', error);
      })
  );
});

// アクティベート時の処理
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        // 古いキャッシュを削除
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME && cacheName !== API_CACHE_NAME) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('[SW] Activation complete');
        // すべてのクライアントを制御下に置く
        return self.clients.claim();
      })
      .catch((error) => {
        console.error('[SW] Activation failed:', error);
      })
  );
});

// フェッチイベントの処理
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // 同一オリジンのリクエストのみ処理
  if (url.origin !== location.origin) {
    return;
  }

  // GET リクエストのみキャッシュ対象
  if (request.method !== 'GET') {
    return;
  }

  event.respondWith(
    handleFetch(request)
  );
});

// フェッチ処理の実装
async function handleFetch(request) {
  const url = new URL(request.url);
  
  try {
    // API リクエストの処理
    if (url.pathname.startsWith('/api/')) {
      return await handleApiRequest(request);
    }
    
    // 静的リソースの処理
    return await handleStaticRequest(request);
    
  } catch (error) {
    console.error('[SW] Fetch error:', error);
    return await handleOfflineResponse(request);
  }
}

// API リクエストの処理
async function handleApiRequest(request) {
  const url = new URL(request.url);
  
  // 設定やサンプルAPIはキャッシュ優先
  if (isCacheableApi(url.pathname)) {
    return await cacheFirst(request, API_CACHE_NAME);
  }
  
  // その他のAPIはネットワーク優先
  return await networkFirst(request, API_CACHE_NAME);
}

// 静的リソースの処理
async function handleStaticRequest(request) {
  // ナビゲーションリクエスト（ページ遷移）
  if (request.mode === 'navigate') {
    return await handleNavigation(request);
  }
  
  // その他の静的リソース
  return await cacheFirst(request, CACHE_NAME);
}

// ナビゲーション処理
async function handleNavigation(request) {
  try {
    // ネットワークを優先
    const networkResponse = await fetch(request);
    
    // 成功した場合はキャッシュに保存
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
    
  } catch (error) {
    // ネットワークエラーの場合はキャッシュから取得
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // キャッシュにもない場合はインデックスページ
    const indexResponse = await caches.match('/');
    if (indexResponse) {
      return indexResponse;
    }
    
    // 最後の手段：オフラインページ
    return await caches.match('/offline.html') || new Response('Offline', { 
      status: 503, 
      statusText: 'Service Unavailable' 
    });
  }
}

// キャッシュ優先戦略
async function cacheFirst(request, cacheName) {
  // キャッシュから確認
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    console.log('[SW] Cache hit:', request.url);
    return cachedResponse;
  }
  
  // キャッシュにない場合はネットワークから取得
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
      console.log('[SW] Cached new resource:', request.url);
    }
    
    return networkResponse;
    
  } catch (error) {
    console.error('[SW] Network error:', error);
    throw error;
  }
}

// ネットワーク優先戦略
async function networkFirst(request, cacheName) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // 成功した場合はキャッシュに保存
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
      console.log('[SW] Updated cache:', request.url);
    }
    
    return networkResponse;
    
  } catch (error) {
    console.log('[SW] Network failed, trying cache:', request.url);
    
    // ネットワークエラーの場合はキャッシュから取得
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      console.log('[SW] Serving from cache:', request.url);
      return cachedResponse;
    }
    
    throw error;
  }
}

// オフライン時のレスポンス
async function handleOfflineResponse(request) {
  const url = new URL(request.url);
  
  // ナビゲーションリクエストの場合
  if (request.mode === 'navigate') {
    const offlinePage = await caches.match('/offline.html');
    if (offlinePage) {
      return offlinePage;
    }
    
    // オフラインページがない場合は簡易レスポンス
    return new Response(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>オフライン - 学習サポートアプリ</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { 
              font-family: sans-serif; 
              text-align: center; 
              padding: 50px;
              background: #f5f5f5;
            }
            .container {
              max-width: 400px;
              margin: 0 auto;
              background: white;
              padding: 40px;
              border-radius: 8px;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            h1 { color: #333; }
            p { color: #666; line-height: 1.6; }
            button {
              background: #007bff;
              color: white;
              border: none;
              padding: 12px 24px;
              border-radius: 6px;
              cursor: pointer;
              margin-top: 20px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>📚 オフラインモード</h1>
            <p>インターネット接続が利用できません。<br>
            キャッシュされた学習データは引き続き利用できます。</p>
            <button onclick="window.location.reload()">🔄 再試行</button>
          </div>
        </body>
      </html>
    `, {
      headers: { 'Content-Type': 'text/html' }
    });
  }
  
  // API リクエストの場合
  if (url.pathname.startsWith('/api/')) {
    return new Response(JSON.stringify({
      error: 'オフラインのため利用できません',
      offline: true
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  // その他のリソース
  return new Response('リソースが利用できません', { 
    status: 503, 
    statusText: 'Service Unavailable' 
  });
}

// キャッシュ可能なAPIかどうかを判定
function isCacheableApi(pathname) {
  return CACHEABLE_API_ENDPOINTS.some(endpoint => pathname.startsWith(endpoint));
}

// バックグラウンド同期（将来の機能拡張用）
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag);
  
  if (event.tag === 'background-sync') {
    event.waitUntil(
      // バックグラウンド同期の処理
      handleBackgroundSync()
    );
  }
});

async function handleBackgroundSync() {
  try {
    // 未送信データの同期など
    console.log('[SW] Background sync completed');
  } catch (error) {
    console.error('[SW] Background sync failed:', error);
  }
}

// プッシュ通知の処理
self.addEventListener('push', (event) => {
  console.log('[SW] Push received');
  
  const options = {
    body: event.data ? event.data.text() : '新しい学習コンテンツが利用可能です',
    icon: '/logo192.png',
    badge: '/logo192.png',
    tag: 'learning-notification',
    data: {
      url: '/'
    },
    actions: [
      {
        action: 'open',
        title: '開く'
      },
      {
        action: 'close',
        title: '閉じる'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('学習サポートアプリ', options)
  );
});

// 通知クリック時の処理
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked');
  
  event.notification.close();
  
  if (event.action === 'open' || !event.action) {
    event.waitUntil(
      clients.openWindow(event.notification.data?.url || '/')
    );
  }
});

// メッセージ処理（クライアントとの通信）
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME });
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => caches.delete(cacheName))
        );
      }).then(() => {
        event.ports[0].postMessage({ success: true });
      })
    );
  }
});

// エラーハンドリング
self.addEventListener('error', (event) => {
  console.error('[SW] Error:', event.error);
});

self.addEventListener('unhandledrejection', (event) => {
  console.error('[SW] Unhandled rejection:', event.reason);
  event.preventDefault();
});

// 定期的なキャッシュクリーンアップ（24時間ごと）
setInterval(async () => {
  try {
    const cache = await caches.open(API_CACHE_NAME);
    const requests = await cache.keys();
    
    // 24時間以上古いAPIキャッシュを削除
    for (const request of requests) {
      const response = await cache.match(request);
      if (response) {
        const cacheTime = response.headers.get('sw-cache-time');
        if (cacheTime && Date.now() - parseInt(cacheTime) > 24 * 60 * 60 * 1000) {
          await cache.delete(request);
          console.log('[SW] Cleaned old cache:', request.url);
        }
      }
    }
  } catch (error) {
    console.error('[SW] Cache cleanup error:', error);
  }
}, 60 * 60 * 1000); // 1時間ごとにチェック

console.log('[SW] Service Worker loaded successfully');