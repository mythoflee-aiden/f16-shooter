// F16 스카이 스트라이커 · 서비스워커 (오프라인 실행 지원)
const CACHE = 'f16-shooter-v2';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable-192.png',
  './icon-maskable-512.png'
];

// 설치: 핵심 파일 캐싱
self.addEventListener('install', e=>{
  e.waitUntil(
    caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting())
  );
});

// 활성화: 옛 캐시 정리
self.addEventListener('activate', e=>{
  e.waitUntil(
    caches.keys().then(keys=>Promise.all(
      keys.filter(k=>k!==CACHE).map(k=>caches.delete(k))
    )).then(()=>self.clients.claim())
  );
});

// 요청 처리: 캐시 우선, 없으면 네트워크 (Firebase 등 외부는 네트워크 통과)
self.addEventListener('fetch', e=>{
  const url = e.request.url;
  // 외부 도메인(Firebase, gstatic 등)은 그대로 네트워크로
  if(!url.startsWith(self.location.origin)){
    return; // 브라우저 기본 처리
  }
  e.respondWith(
    caches.match(e.request).then(cached=>{
      if(cached) return cached;
      return fetch(e.request).then(res=>{
        // 성공한 동일 출처 요청은 캐시에 추가
        if(res && res.status===200){
          const clone = res.clone();
          caches.open(CACHE).then(c=>c.put(e.request, clone));
        }
        return res;
      }).catch(()=>caches.match('./index.html'));
    })
  );
});
