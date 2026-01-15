# 글로벌 비즈니스 허브 - 실제 구현 가능 HTML 목업

이 문서는 Genspark에서 스크린샷 없이 실제 UI를 렌더링할 수 있는 **완전한 HTML 템플릿**을 제공합니다.
각 목업은 Tailwind CSS CDN을 사용하여 독립적으로 실행 가능합니다.

---

## 1. 메인 대시보드 (전체 페이지)

```html
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Global Business Hub - Dashboard</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Pretendard:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    * { font-family: 'Pretendard', sans-serif; }
    .gradient-orange { background: linear-gradient(135deg, #F78C3A 0%, #E67729 100%); }
    .shadow-orange { box-shadow: 0 4px 14px rgba(247, 140, 58, 0.25); }
    @keyframes pulse-ring { 0% { transform: scale(0.8); opacity: 1; } 100% { transform: scale(1.4); opacity: 0; } }
    .pulse-ring::before { content: ''; position: absolute; inset: -4px; border-radius: 50%; background: #EF4444; animation: pulse-ring 1.5s infinite; }
  </style>
</head>
<body class="bg-gray-50 min-h-screen">
  <!-- 상단 헤더 -->
  <header class="bg-white border-b sticky top-0 z-50">
    <div class="flex items-center justify-between px-6 h-16">
      <div class="flex items-center gap-3">
        <div class="w-8 h-8 gradient-orange rounded-lg flex items-center justify-center">
          <span class="text-white font-bold text-sm">GB</span>
        </div>
        <span class="font-bold text-gray-800">Global Business Hub</span>
      </div>
      <div class="flex items-center gap-4">
        <button class="p-2 hover:bg-gray-100 rounded-lg relative">
          <svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
          </svg>
          <span class="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>
        <div class="flex items-center gap-2">
          <div class="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
            <span class="text-orange-600 font-medium text-sm">김</span>
          </div>
        </div>
      </div>
    </div>
  </header>

  <div class="flex">
    <!-- 사이드바 -->
    <aside class="w-64 bg-white border-r min-h-[calc(100vh-64px)] p-4">
      <nav class="space-y-1">
        <a href="#" class="flex items-center gap-3 px-3 py-2.5 bg-orange-50 text-orange-600 rounded-lg font-medium">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
          </svg>
          대시보드
        </a>
        <a href="#" class="flex items-center gap-3 px-3 py-2.5 text-gray-600 hover:bg-gray-50 rounded-lg">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
          </svg>
          물류 관제
          <span class="ml-auto px-2 py-0.5 bg-red-100 text-red-600 text-xs rounded-full font-medium">12</span>
        </a>
        <a href="#" class="flex items-center gap-3 px-3 py-2.5 text-gray-600 hover:bg-gray-50 rounded-lg">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
          </svg>
          성과 분석
        </a>
        <a href="#" class="flex items-center gap-3 px-3 py-2.5 text-gray-600 hover:bg-gray-50 rounded-lg">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
          </svg>
          고객 분석
        </a>
        <a href="#" class="flex items-center gap-3 px-3 py-2.5 text-gray-600 hover:bg-gray-50 rounded-lg">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
          통합 검색
        </a>
      </nav>
    </aside>

    <!-- 메인 콘텐츠 -->
    <main class="flex-1 p-6">
      <!-- 페이지 헤더 -->
      <div class="gradient-orange rounded-2xl p-6 mb-6 text-white relative overflow-hidden">
        <div class="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
        <div class="relative">
          <h1 class="text-2xl font-bold mb-1">메인 대시보드</h1>
          <p class="text-white/80">2026년 1월 14일 화요일 · 실시간 현황</p>
        </div>
      </div>

      <!-- KPI 카드 -->
      <div class="grid grid-cols-6 gap-4 mb-6">
        <!-- GMV -->
        <div class="bg-white rounded-xl p-5 border border-gray-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
          <div class="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 to-orange-300"></div>
          <div class="flex items-start justify-between mb-3">
            <div class="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <span class="text-lg">💰</span>
            </div>
            <span class="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full font-medium">+15.2%</span>
          </div>
          <p class="text-sm text-gray-500 mb-1">GMV</p>
          <p class="text-2xl font-bold text-gray-900">₩123.4M</p>
          <p class="text-xs text-gray-400 mt-1">전월 대비</p>
        </div>

        <!-- 주문 건수 -->
        <div class="bg-white rounded-xl p-5 border border-gray-100 shadow-sm relative overflow-hidden">
          <div class="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-blue-300"></div>
          <div class="flex items-start justify-between mb-3">
            <div class="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <span class="text-lg">📦</span>
            </div>
            <span class="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full font-medium">+8.3%</span>
          </div>
          <p class="text-sm text-gray-500 mb-1">주문 건수</p>
          <p class="text-2xl font-bold text-gray-900">1,234건</p>
          <p class="text-xs text-gray-400 mt-1">전월 대비</p>
        </div>

        <!-- AOV -->
        <div class="bg-white rounded-xl p-5 border border-gray-100 shadow-sm relative overflow-hidden">
          <div class="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-purple-300"></div>
          <div class="flex items-start justify-between mb-3">
            <div class="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <span class="text-lg">🎯</span>
            </div>
            <span class="text-xs text-red-600 bg-red-50 px-2 py-1 rounded-full font-medium">-2.1%</span>
          </div>
          <p class="text-sm text-gray-500 mb-1">AOV</p>
          <p class="text-2xl font-bold text-gray-900">₩85,000</p>
          <p class="text-xs text-gray-400 mt-1">평균 주문 금액</p>
        </div>

        <!-- 신규 고객 -->
        <div class="bg-white rounded-xl p-5 border border-gray-100 shadow-sm relative overflow-hidden">
          <div class="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-500 to-green-300"></div>
          <div class="flex items-start justify-between mb-3">
            <div class="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <span class="text-lg">👤</span>
            </div>
            <span class="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full font-medium">+23.5%</span>
          </div>
          <p class="text-sm text-gray-500 mb-1">신규 고객</p>
          <p class="text-2xl font-bold text-gray-900">456명</p>
          <p class="text-xs text-gray-400 mt-1">이번 달</p>
        </div>

        <!-- 재구매율 -->
        <div class="bg-white rounded-xl p-5 border border-gray-100 shadow-sm relative overflow-hidden">
          <div class="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 to-cyan-300"></div>
          <div class="flex items-start justify-between mb-3">
            <div class="w-10 h-10 bg-cyan-100 rounded-lg flex items-center justify-center">
              <span class="text-lg">🔄</span>
            </div>
            <span class="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full font-medium">+5.2%</span>
          </div>
          <p class="text-sm text-gray-500 mb-1">재구매율</p>
          <p class="text-2xl font-bold text-gray-900">34.5%</p>
          <p class="text-xs text-gray-400 mt-1">전월 대비</p>
        </div>

        <!-- VIP 고객 -->
        <div class="bg-white rounded-xl p-5 border border-gray-100 shadow-sm relative overflow-hidden">
          <div class="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-amber-300"></div>
          <div class="flex items-start justify-between mb-3">
            <div class="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
              <span class="text-lg">👑</span>
            </div>
            <span class="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full font-medium">+2</span>
          </div>
          <p class="text-sm text-gray-500 mb-1">VIP 고객</p>
          <p class="text-2xl font-bold text-gray-900">234명</p>
          <p class="text-xs text-gray-400 mt-1">상위 10%</p>
        </div>
      </div>

      <!-- 차트 영역 -->
      <div class="grid grid-cols-3 gap-6 mb-6">
        <!-- GMV 추세 차트 -->
        <div class="col-span-2 bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
          <div class="flex items-center justify-between mb-6">
            <div>
              <h3 class="font-bold text-gray-900">GMV & 주문 추세</h3>
              <p class="text-sm text-gray-500">최근 7개월</p>
            </div>
            <div class="flex gap-2">
              <button class="px-3 py-1.5 bg-orange-500 text-white rounded-lg text-sm font-medium">월별</button>
              <button class="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-sm">주별</button>
              <button class="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-sm">일별</button>
            </div>
          </div>
          
          <!-- SVG 차트 -->
          <div class="relative h-48">
            <svg viewBox="0 0 600 180" class="w-full h-full">
              <!-- 그리드 라인 -->
              <line x1="50" y1="20" x2="580" y2="20" stroke="#E5E7EB" stroke-dasharray="4"/>
              <line x1="50" y1="60" x2="580" y2="60" stroke="#E5E7EB" stroke-dasharray="4"/>
              <line x1="50" y1="100" x2="580" y2="100" stroke="#E5E7EB" stroke-dasharray="4"/>
              <line x1="50" y1="140" x2="580" y2="140" stroke="#E5E7EB" stroke-dasharray="4"/>
              
              <!-- GMV 라인 -->
              <path d="M80,120 L155,100 L230,110 L305,80 L380,70 L455,50 L530,30" 
                    fill="none" stroke="#F78C3A" stroke-width="3" stroke-linecap="round"/>
              
              <!-- 주문수 라인 -->
              <path d="M80,130 L155,115 L230,120 L305,95 L380,90 L455,75 L530,55" 
                    fill="none" stroke="#3B82F6" stroke-width="3" stroke-linecap="round" stroke-dasharray="8,4"/>
              
              <!-- 데이터 포인트 -->
              <circle cx="530" cy="30" r="6" fill="#F78C3A"/>
              <circle cx="530" cy="55" r="6" fill="#3B82F6"/>
              
              <!-- Y축 레이블 -->
              <text x="40" y="25" text-anchor="end" class="text-xs fill-gray-400">150M</text>
              <text x="40" y="65" text-anchor="end" class="text-xs fill-gray-400">100M</text>
              <text x="40" y="105" text-anchor="end" class="text-xs fill-gray-400">50M</text>
              <text x="40" y="145" text-anchor="end" class="text-xs fill-gray-400">0</text>
              
              <!-- X축 레이블 -->
              <text x="80" y="165" text-anchor="middle" class="text-xs fill-gray-400">7월</text>
              <text x="155" y="165" text-anchor="middle" class="text-xs fill-gray-400">8월</text>
              <text x="230" y="165" text-anchor="middle" class="text-xs fill-gray-400">9월</text>
              <text x="305" y="165" text-anchor="middle" class="text-xs fill-gray-400">10월</text>
              <text x="380" y="165" text-anchor="middle" class="text-xs fill-gray-400">11월</text>
              <text x="455" y="165" text-anchor="middle" class="text-xs fill-gray-400">12월</text>
              <text x="530" y="165" text-anchor="middle" class="text-xs fill-gray-400">1월</text>
            </svg>
          </div>
          
          <!-- 범례 -->
          <div class="flex justify-center gap-6 mt-4">
            <div class="flex items-center gap-2">
              <div class="w-3 h-3 bg-orange-500 rounded"></div>
              <span class="text-sm text-gray-600">GMV</span>
            </div>
            <div class="flex items-center gap-2">
              <div class="w-3 h-3 bg-blue-500 rounded"></div>
              <span class="text-sm text-gray-600">주문수</span>
            </div>
          </div>
        </div>

        <!-- 국가별 매출 -->
        <div class="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
          <h3 class="font-bold text-gray-900 mb-4">국가별 매출</h3>
          
          <!-- 도넛 차트 -->
          <div class="flex justify-center mb-4">
            <div class="relative w-32 h-32">
              <svg viewBox="0 0 100 100" class="w-full h-full -rotate-90">
                <circle cx="50" cy="50" r="40" fill="none" stroke="#E5E7EB" stroke-width="20"/>
                <circle cx="50" cy="50" r="40" fill="none" stroke="#3B82F6" stroke-width="20" 
                        stroke-dasharray="150.8 251.2" stroke-linecap="round"/>
                <circle cx="50" cy="50" r="40" fill="none" stroke="#10B981" stroke-width="20" 
                        stroke-dasharray="60.3 251.2" stroke-dashoffset="-150.8" stroke-linecap="round"/>
                <circle cx="50" cy="50" r="40" fill="none" stroke="#8B5CF6" stroke-width="20" 
                        stroke-dasharray="40.2 251.2" stroke-dashoffset="-211.1" stroke-linecap="round"/>
              </svg>
              <div class="absolute inset-0 flex items-center justify-center">
                <div class="text-center">
                  <p class="text-xl font-bold">₩123M</p>
                  <p class="text-xs text-gray-400">Total</p>
                </div>
              </div>
            </div>
          </div>
          
          <!-- 국가별 상세 -->
          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span class="text-lg">🇯🇵</span>
                <span class="text-sm text-gray-700">Japan</span>
              </div>
              <div class="text-right">
                <p class="font-bold">₩74.0M</p>
                <p class="text-xs text-gray-400">60%</p>
              </div>
            </div>
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span class="text-lg">🇺🇸</span>
                <span class="text-sm text-gray-700">USA</span>
              </div>
              <div class="text-right">
                <p class="font-bold">₩29.6M</p>
                <p class="text-xs text-gray-400">24%</p>
              </div>
            </div>
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span class="text-lg">🌏</span>
                <span class="text-sm text-gray-700">Others</span>
              </div>
              <div class="text-right">
                <p class="font-bold">₩19.7M</p>
                <p class="text-xs text-gray-400">16%</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 물류 파이프라인 미니 -->
      <div class="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
        <div class="flex items-center justify-between mb-6">
          <div>
            <h3 class="font-bold text-gray-900">물류 현황</h3>
            <p class="text-sm text-gray-500">실시간 파이프라인</p>
          </div>
          <a href="#" class="text-sm text-orange-500 font-medium hover:underline">상세 보기 →</a>
        </div>
        
        <div class="flex items-center justify-between">
          <!-- 미입고 -->
          <div class="text-center flex-1 p-4 bg-red-50 rounded-xl border border-red-100 relative">
            <span class="absolute -top-2 -right-2 px-2 py-0.5 bg-red-500 text-white text-xs rounded-full font-medium">병목</span>
            <div class="w-12 h-12 mx-auto bg-red-100 rounded-xl flex items-center justify-center mb-2">
              <span class="text-xl">📦</span>
            </div>
            <p class="text-2xl font-bold text-red-600">45</p>
            <p class="text-xs text-gray-500">미입고</p>
            <p class="text-xs text-red-500 mt-1">🔴 위험 12건</p>
          </div>
          
          <div class="text-gray-300 text-xl px-2">→</div>
          
          <!-- 국내배송 -->
          <div class="text-center flex-1 p-4">
            <div class="w-12 h-12 mx-auto bg-yellow-100 rounded-xl flex items-center justify-center mb-2">
              <span class="text-xl">🚚</span>
            </div>
            <p class="text-2xl font-bold">23</p>
            <p class="text-xs text-gray-500">국내배송</p>
            <p class="text-xs text-yellow-600 mt-1">🟡 5건</p>
          </div>
          
          <div class="text-gray-300 text-xl px-2">→</div>
          
          <!-- 검수대기 -->
          <div class="text-center flex-1 p-4">
            <div class="w-12 h-12 mx-auto bg-blue-100 rounded-xl flex items-center justify-center mb-2">
              <span class="text-xl">🔍</span>
            </div>
            <p class="text-2xl font-bold">18</p>
            <p class="text-xs text-gray-500">검수대기</p>
            <p class="text-xs text-green-600 mt-1">🟢 정상</p>
          </div>
          
          <div class="text-gray-300 text-xl px-2">→</div>
          
          <!-- 포장/출고 -->
          <div class="text-center flex-1 p-4">
            <div class="w-12 h-12 mx-auto bg-purple-100 rounded-xl flex items-center justify-center mb-2">
              <span class="text-xl">📤</span>
            </div>
            <p class="text-2xl font-bold">31</p>
            <p class="text-xs text-gray-500">포장/출고</p>
            <p class="text-xs text-green-600 mt-1">🟢 정상</p>
          </div>
          
          <div class="text-gray-300 text-xl px-2">→</div>
          
          <!-- 국제배송 -->
          <div class="text-center flex-1 p-4">
            <div class="w-12 h-12 mx-auto bg-green-100 rounded-xl flex items-center justify-center mb-2">
              <span class="text-xl">✈️</span>
            </div>
            <p class="text-2xl font-bold">67</p>
            <p class="text-xs text-gray-500">국제배송</p>
            <p class="text-xs text-green-600 mt-1">🟢 정상</p>
          </div>
        </div>
      </div>
    </main>
  </div>
</body>
</html>
```

---

## 2. 물류 관제 센터 (전체 페이지)

```html
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>물류 관제 센터</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    * { font-family: 'Pretendard', -apple-system, sans-serif; }
    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
    .animate-pulse-slow { animation: pulse 2s infinite; }
    @keyframes slideIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
    .animate-slide-in { animation: slideIn 0.3s ease-out; }
  </style>
</head>
<body class="bg-gray-50 min-h-screen">
  <div class="p-6 max-w-7xl mx-auto">
    <!-- 알림 배너 -->
    <div class="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-center justify-between animate-slide-in">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
          <span class="text-xl animate-pulse-slow">⚠️</span>
        </div>
        <div>
          <p class="font-bold text-red-700">병목 감지: 미입고 단계</p>
          <p class="text-sm text-red-600">12건이 7일 이상 체류 중 · 즉시 대응 필요</p>
        </div>
      </div>
      <div class="flex gap-2">
        <button class="px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition">
          작가 안내 발송
        </button>
        <button class="px-4 py-2 bg-white border border-red-200 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 transition">
          상세 보기
        </button>
      </div>
    </div>

    <!-- 요약 통계 -->
    <div class="grid grid-cols-5 gap-4 mb-6">
      <div class="bg-white rounded-xl p-4 border shadow-sm">
        <p class="text-sm text-gray-500">전체 처리중</p>
        <p class="text-3xl font-bold mt-1">184<span class="text-lg text-gray-400">건</span></p>
      </div>
      <div class="bg-white rounded-xl p-4 border shadow-sm border-l-4 border-l-red-500">
        <p class="text-sm text-gray-500">위험 (7일+)</p>
        <p class="text-3xl font-bold mt-1 text-red-600">12<span class="text-lg text-gray-400">건</span></p>
      </div>
      <div class="bg-white rounded-xl p-4 border shadow-sm border-l-4 border-l-yellow-500">
        <p class="text-sm text-gray-500">주의 (3-7일)</p>
        <p class="text-3xl font-bold mt-1 text-yellow-600">23<span class="text-lg text-gray-400">건</span></p>
      </div>
      <div class="bg-white rounded-xl p-4 border shadow-sm border-l-4 border-l-green-500">
        <p class="text-sm text-gray-500">정상 (3일-)</p>
        <p class="text-3xl font-bold mt-1 text-green-600">149<span class="text-lg text-gray-400">건</span></p>
      </div>
      <div class="bg-white rounded-xl p-4 border shadow-sm">
        <p class="text-sm text-gray-500">오늘 출고</p>
        <p class="text-3xl font-bold mt-1">28<span class="text-lg text-gray-400">건</span></p>
      </div>
    </div>

    <!-- 파이프라인 -->
    <div class="bg-white rounded-xl p-6 shadow-sm border mb-6">
      <h2 class="font-bold text-lg mb-6 flex items-center gap-2">
        <span>📊</span> 물류 파이프라인
        <span class="text-xs text-gray-400 font-normal ml-2">실시간 업데이트</span>
      </h2>
      
      <div class="flex items-stretch gap-4">
        <!-- 미입고 -->
        <div class="flex-1 bg-gradient-to-b from-red-50 to-red-100/50 rounded-2xl p-5 border-2 border-red-200 relative group hover:shadow-lg transition-all">
          <div class="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-red-500 text-white text-xs rounded-full font-bold shadow">
            ⚠️ 병목
          </div>
          
          <div class="text-center">
            <div class="w-16 h-16 mx-auto bg-white rounded-2xl shadow-sm flex items-center justify-center mb-3">
              <span class="text-3xl">📦</span>
            </div>
            <p class="text-4xl font-bold text-red-600 mb-1">45</p>
            <p class="text-sm font-medium text-gray-700 mb-3">미입고</p>
            
            <div class="bg-white rounded-lg p-3 space-y-2">
              <div class="flex justify-between text-xs">
                <span class="text-red-600 font-medium">🔴 위험</span>
                <span class="font-bold">12건</span>
              </div>
              <div class="flex justify-between text-xs">
                <span class="text-yellow-600 font-medium">🟡 주의</span>
                <span class="font-bold">18건</span>
              </div>
              <div class="flex justify-between text-xs">
                <span class="text-green-600 font-medium">🟢 정상</span>
                <span class="font-bold">15건</span>
              </div>
              <div class="pt-2 border-t mt-2">
                <p class="text-xs text-gray-500">평균 체류</p>
                <p class="font-bold text-red-600">8.3일</p>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 화살표 -->
        <div class="flex items-center">
          <div class="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
            <span class="text-gray-400">→</span>
          </div>
        </div>
        
        <!-- 국내배송 -->
        <div class="flex-1 bg-gradient-to-b from-yellow-50 to-yellow-100/30 rounded-2xl p-5 border border-yellow-200 hover:shadow-lg transition-all">
          <div class="text-center">
            <div class="w-16 h-16 mx-auto bg-white rounded-2xl shadow-sm flex items-center justify-center mb-3">
              <span class="text-3xl">🚚</span>
            </div>
            <p class="text-4xl font-bold text-gray-800 mb-1">23</p>
            <p class="text-sm font-medium text-gray-700 mb-3">국내배송</p>
            
            <div class="bg-white rounded-lg p-3 space-y-2">
              <div class="flex justify-between text-xs">
                <span class="text-yellow-600 font-medium">🟡 주의</span>
                <span class="font-bold">5건</span>
              </div>
              <div class="flex justify-between text-xs">
                <span class="text-green-600 font-medium">🟢 정상</span>
                <span class="font-bold">18건</span>
              </div>
              <div class="pt-2 border-t mt-2">
                <p class="text-xs text-gray-500">평균 체류</p>
                <p class="font-bold text-gray-700">2.1일</p>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 화살표 -->
        <div class="flex items-center">
          <div class="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
            <span class="text-gray-400">→</span>
          </div>
        </div>
        
        <!-- 검수대기 -->
        <div class="flex-1 bg-gradient-to-b from-blue-50 to-blue-100/30 rounded-2xl p-5 border border-blue-200 hover:shadow-lg transition-all">
          <div class="text-center">
            <div class="w-16 h-16 mx-auto bg-white rounded-2xl shadow-sm flex items-center justify-center mb-3">
              <span class="text-3xl">🔍</span>
            </div>
            <p class="text-4xl font-bold text-gray-800 mb-1">18</p>
            <p class="text-sm font-medium text-gray-700 mb-3">검수대기</p>
            
            <div class="bg-white rounded-lg p-3 space-y-2">
              <div class="flex justify-between text-xs">
                <span class="text-green-600 font-medium">🟢 정상</span>
                <span class="font-bold">18건</span>
              </div>
              <div class="pt-2 border-t mt-2">
                <p class="text-xs text-gray-500">평균 체류</p>
                <p class="font-bold text-gray-700">0.5일</p>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 화살표 -->
        <div class="flex items-center">
          <div class="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
            <span class="text-gray-400">→</span>
          </div>
        </div>
        
        <!-- 포장/출고 -->
        <div class="flex-1 bg-gradient-to-b from-purple-50 to-purple-100/30 rounded-2xl p-5 border border-purple-200 hover:shadow-lg transition-all">
          <div class="text-center">
            <div class="w-16 h-16 mx-auto bg-white rounded-2xl shadow-sm flex items-center justify-center mb-3">
              <span class="text-3xl">📤</span>
            </div>
            <p class="text-4xl font-bold text-gray-800 mb-1">31</p>
            <p class="text-sm font-medium text-gray-700 mb-3">포장/출고</p>
            
            <div class="bg-white rounded-lg p-3 space-y-2">
              <div class="flex justify-between text-xs">
                <span class="text-green-600 font-medium">🟢 정상</span>
                <span class="font-bold">31건</span>
              </div>
              <div class="pt-2 border-t mt-2">
                <p class="text-xs text-gray-500">평균 체류</p>
                <p class="font-bold text-gray-700">1.2일</p>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 화살표 -->
        <div class="flex items-center">
          <div class="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
            <span class="text-gray-400">→</span>
          </div>
        </div>
        
        <!-- 국제배송 -->
        <div class="flex-1 bg-gradient-to-b from-green-50 to-green-100/30 rounded-2xl p-5 border border-green-200 hover:shadow-lg transition-all">
          <div class="text-center">
            <div class="w-16 h-16 mx-auto bg-white rounded-2xl shadow-sm flex items-center justify-center mb-3">
              <span class="text-3xl">✈️</span>
            </div>
            <p class="text-4xl font-bold text-gray-800 mb-1">67</p>
            <p class="text-sm font-medium text-gray-700 mb-3">국제배송</p>
            
            <div class="bg-white rounded-lg p-3 space-y-2">
              <div class="flex justify-between text-xs">
                <span class="text-green-600 font-medium">🟢 정상</span>
                <span class="font-bold">67건</span>
              </div>
              <div class="pt-2 border-t mt-2">
                <p class="text-xs text-gray-500">평균 체류</p>
                <p class="font-bold text-gray-700">5.8일</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 위험 건 테이블 -->
    <div class="bg-white rounded-xl shadow-sm border overflow-hidden">
      <div class="p-4 border-b flex justify-between items-center">
        <div>
          <h3 class="font-bold text-gray-900">🔴 위험 건 목록</h3>
          <p class="text-sm text-gray-500">7일 이상 체류 중인 건</p>
        </div>
        <div class="flex gap-2">
          <select class="px-3 py-2 border rounded-lg text-sm">
            <option>전체 단계</option>
            <option selected>미입고</option>
            <option>국내배송</option>
          </select>
          <button class="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium">
            선택 항목 작가 안내
          </button>
        </div>
      </div>
      
      <table class="w-full text-sm">
        <thead class="bg-gray-50 border-b">
          <tr>
            <th class="p-3 text-left"><input type="checkbox" class="rounded"></th>
            <th class="p-3 text-left font-medium text-gray-600">주문번호</th>
            <th class="p-3 text-left font-medium text-gray-600">작가</th>
            <th class="p-3 text-left font-medium text-gray-600">작품명</th>
            <th class="p-3 text-left font-medium text-gray-600">주문일</th>
            <th class="p-3 text-left font-medium text-gray-600">체류일</th>
            <th class="p-3 text-left font-medium text-gray-600">마지막 안내</th>
            <th class="p-3 text-left font-medium text-gray-600">액션</th>
          </tr>
        </thead>
        <tbody>
          <tr class="border-b bg-red-50/50 hover:bg-red-50">
            <td class="p-3"><input type="checkbox" class="rounded"></td>
            <td class="p-3 font-mono text-orange-600">ORD-2026-001234</td>
            <td class="p-3 font-medium">김작가</td>
            <td class="p-3">핸드메이드 실버 반지</td>
            <td class="p-3 text-gray-500">2025-12-30</td>
            <td class="p-3"><span class="px-2 py-1 bg-red-100 text-red-700 rounded-full font-bold">15일</span></td>
            <td class="p-3 text-gray-500">2026-01-05</td>
            <td class="p-3">
              <button class="text-orange-500 hover:underline font-medium">입고 요청 →</button>
            </td>
          </tr>
          <tr class="border-b bg-red-50/30 hover:bg-red-50">
            <td class="p-3"><input type="checkbox" class="rounded"></td>
            <td class="p-3 font-mono text-orange-600">ORD-2026-001189</td>
            <td class="p-3 font-medium">이작가</td>
            <td class="p-3">도자기 머그컵 세트</td>
            <td class="p-3 text-gray-500">2026-01-02</td>
            <td class="p-3"><span class="px-2 py-1 bg-red-100 text-red-700 rounded-full font-bold">12일</span></td>
            <td class="p-3 text-gray-500">-</td>
            <td class="p-3">
              <button class="text-orange-500 hover:underline font-medium">입고 요청 →</button>
            </td>
          </tr>
          <tr class="border-b hover:bg-gray-50">
            <td class="p-3"><input type="checkbox" class="rounded"></td>
            <td class="p-3 font-mono text-orange-600">ORD-2026-001156</td>
            <td class="p-3 font-medium">박작가</td>
            <td class="p-3">수제 가죽 지갑</td>
            <td class="p-3 text-gray-500">2026-01-04</td>
            <td class="p-3"><span class="px-2 py-1 bg-red-100 text-red-700 rounded-full font-bold">10일</span></td>
            <td class="p-3 text-gray-500">2026-01-10</td>
            <td class="p-3">
              <button class="text-orange-500 hover:underline font-medium">입고 요청 →</button>
            </td>
          </tr>
        </tbody>
      </table>
      
      <div class="p-4 border-t flex justify-between items-center bg-gray-50">
        <p class="text-sm text-gray-500">총 12건 중 1-3건 표시</p>
        <div class="flex gap-1">
          <button class="px-3 py-1.5 border rounded hover:bg-white">이전</button>
          <button class="px-3 py-1.5 bg-orange-500 text-white rounded">1</button>
          <button class="px-3 py-1.5 border rounded hover:bg-white">2</button>
          <button class="px-3 py-1.5 border rounded hover:bg-white">3</button>
          <button class="px-3 py-1.5 border rounded hover:bg-white">다음</button>
        </div>
      </div>
    </div>
  </div>
</body>
</html>
```

---

## 3. 고객 360도 뷰 (모달)

```html
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>고객 360도 뷰</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    * { font-family: 'Pretendard', -apple-system, sans-serif; }
    .gradient-orange { background: linear-gradient(135deg, #F78C3A 0%, #E67729 100%); }
    @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
    .animate-slide-up { animation: slideUp 0.3s ease-out; }
  </style>
</head>
<body class="bg-gray-900/50 min-h-screen flex items-center justify-center p-4">
  <!-- 모달 -->
  <div class="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl animate-slide-up">
    <!-- 헤더 -->
    <div class="gradient-orange p-6 text-white relative overflow-hidden">
      <div class="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
      <div class="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2"></div>
      
      <div class="relative flex justify-between items-start">
        <div>
          <div class="flex items-center gap-3 mb-2">
            <div class="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
              <span class="text-2xl">🇯🇵</span>
            </div>
            <div>
              <p class="text-sm text-white/70">Customer ID: 12345</p>
              <h2 class="text-2xl font-bold">田中太郎</h2>
            </div>
          </div>
          <div class="flex items-center gap-4 text-sm text-white/80">
            <span>📧 tanaka@email.com</span>
            <span>📍 Tokyo, Japan</span>
            <span>📅 가입 2024-03-15</span>
          </div>
        </div>
        <div class="text-right">
          <span class="inline-flex items-center gap-1 px-3 py-1.5 bg-white/20 rounded-full text-sm font-medium">
            👑 VIP 고객
          </span>
          <p class="text-sm text-white/70 mt-2">활성 상태</p>
        </div>
      </div>
    </div>
    
    <!-- 본문 -->
    <div class="p-6 max-h-[60vh] overflow-y-auto">
      <!-- RFM 스코어 -->
      <div class="grid grid-cols-4 gap-4 mb-6">
        <div class="bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-xl p-4 border border-purple-100">
          <div class="flex items-center justify-between mb-2">
            <p class="text-xs font-medium text-purple-600">R (최근성)</p>
            <span class="text-xs bg-purple-200 text-purple-700 px-2 py-0.5 rounded-full">상위 5%</span>
          </div>
          <p class="text-3xl font-bold text-purple-700">7일</p>
          <div class="mt-2">
            <div class="h-2 bg-purple-200 rounded-full overflow-hidden">
              <div class="h-full bg-purple-500 rounded-full" style="width: 95%"></div>
            </div>
          </div>
        </div>
        
        <div class="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl p-4 border border-blue-100">
          <div class="flex items-center justify-between mb-2">
            <p class="text-xs font-medium text-blue-600">F (빈도)</p>
            <span class="text-xs bg-blue-200 text-blue-700 px-2 py-0.5 rounded-full">상위 10%</span>
          </div>
          <p class="text-3xl font-bold text-blue-700">12회</p>
          <div class="mt-2">
            <div class="h-2 bg-blue-200 rounded-full overflow-hidden">
              <div class="h-full bg-blue-500 rounded-full" style="width: 85%"></div>
            </div>
          </div>
        </div>
        
        <div class="bg-gradient-to-br from-green-50 to-green-100/50 rounded-xl p-4 border border-green-100">
          <div class="flex items-center justify-between mb-2">
            <p class="text-xs font-medium text-green-600">M (금액)</p>
            <span class="text-xs bg-green-200 text-green-700 px-2 py-0.5 rounded-full">상위 8%</span>
          </div>
          <p class="text-3xl font-bold text-green-700">₩2.5M</p>
          <div class="mt-2">
            <div class="h-2 bg-green-200 rounded-full overflow-hidden">
              <div class="h-full bg-green-500 rounded-full" style="width: 90%"></div>
            </div>
          </div>
        </div>
        
        <div class="bg-gradient-to-br from-orange-50 to-orange-100/50 rounded-xl p-4 border border-orange-100">
          <div class="flex items-center justify-between mb-2">
            <p class="text-xs font-medium text-orange-600">CLV 예측</p>
            <span class="text-xs bg-orange-200 text-orange-700 px-2 py-0.5 rounded-full">높음</span>
          </div>
          <p class="text-3xl font-bold text-orange-700">₩5.2M</p>
          <p class="text-xs text-gray-500 mt-2">향후 12개월</p>
        </div>
      </div>
      
      <!-- 구매 패턴 차트 -->
      <div class="bg-gray-50 rounded-xl p-5 mb-6 border">
        <div class="flex items-center justify-between mb-4">
          <h4 class="font-bold text-gray-800">월별 구매 추이</h4>
          <div class="flex gap-4 text-sm">
            <span class="flex items-center gap-1 text-gray-500">
              <span class="w-3 h-3 bg-orange-500 rounded"></span> 구매금액
            </span>
            <span class="flex items-center gap-1 text-gray-500">
              <span class="w-3 h-0.5 bg-blue-500"></span> 주문수
            </span>
          </div>
        </div>
        
        <div class="h-32 flex items-end gap-3">
          <div class="flex-1 flex flex-col items-center">
            <div class="w-full bg-orange-200 rounded-t relative" style="height: 30%">
              <div class="absolute -top-1 left-1/2 w-2 h-2 bg-blue-500 rounded-full -translate-x-1/2"></div>
            </div>
            <p class="text-xs text-gray-400 mt-2">7월</p>
          </div>
          <div class="flex-1 flex flex-col items-center">
            <div class="w-full bg-orange-300 rounded-t relative" style="height: 45%">
              <div class="absolute -top-1 left-1/2 w-2 h-2 bg-blue-500 rounded-full -translate-x-1/2"></div>
            </div>
            <p class="text-xs text-gray-400 mt-2">8월</p>
          </div>
          <div class="flex-1 flex flex-col items-center">
            <div class="w-full bg-orange-300 rounded-t relative" style="height: 40%">
              <div class="absolute -top-1 left-1/2 w-2 h-2 bg-blue-500 rounded-full -translate-x-1/2"></div>
            </div>
            <p class="text-xs text-gray-400 mt-2">9월</p>
          </div>
          <div class="flex-1 flex flex-col items-center">
            <div class="w-full bg-orange-400 rounded-t relative" style="height: 60%">
              <div class="absolute -top-1 left-1/2 w-2 h-2 bg-blue-500 rounded-full -translate-x-1/2"></div>
            </div>
            <p class="text-xs text-gray-400 mt-2">10월</p>
          </div>
          <div class="flex-1 flex flex-col items-center">
            <div class="w-full bg-orange-400 rounded-t relative" style="height: 55%">
              <div class="absolute -top-1 left-1/2 w-2 h-2 bg-blue-500 rounded-full -translate-x-1/2"></div>
            </div>
            <p class="text-xs text-gray-400 mt-2">11월</p>
          </div>
          <div class="flex-1 flex flex-col items-center">
            <div class="w-full bg-orange-500 rounded-t relative" style="height: 80%">
              <div class="absolute -top-1 left-1/2 w-2 h-2 bg-blue-500 rounded-full -translate-x-1/2"></div>
            </div>
            <p class="text-xs text-gray-400 mt-2">12월</p>
          </div>
          <div class="flex-1 flex flex-col items-center">
            <div class="w-full bg-orange-500 rounded-t relative" style="height: 100%">
              <div class="absolute -top-1 left-1/2 w-2 h-2 bg-blue-500 rounded-full -translate-x-1/2"></div>
            </div>
            <p class="text-xs text-gray-400 mt-2">1월</p>
          </div>
        </div>
      </div>
      
      <!-- 주문 이력 -->
      <div class="mb-6">
        <div class="flex items-center justify-between mb-3">
          <h4 class="font-bold text-gray-800">최근 주문 이력</h4>
          <a href="#" class="text-sm text-orange-500 font-medium hover:underline">전체 보기 →</a>
        </div>
        
        <div class="space-y-3">
          <div class="flex gap-4 p-4 bg-white border rounded-xl hover:shadow-sm transition">
            <div class="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
              <span class="text-2xl">💍</span>
            </div>
            <div class="flex-1">
              <div class="flex items-start justify-between">
                <div>
                  <p class="font-medium text-gray-900">핸드메이드 실버 반지 - 별자리 시리즈</p>
                  <p class="text-sm text-gray-500">김작가 · ORD-2026-001234</p>
                </div>
                <span class="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">배송완료</span>
              </div>
              <div class="flex items-center gap-4 mt-2 text-sm text-gray-500">
                <span>📅 2026-01-07</span>
                <span>💰 ₩45,000</span>
              </div>
            </div>
          </div>
          
          <div class="flex gap-4 p-4 bg-white border rounded-xl hover:shadow-sm transition">
            <div class="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
              <span class="text-2xl">☕</span>
            </div>
            <div class="flex-1">
              <div class="flex items-start justify-between">
                <div>
                  <p class="font-medium text-gray-900">도자기 머그컵 세트 (4P)</p>
                  <p class="text-sm text-gray-500">이작가 · ORD-2025-012890</p>
                </div>
                <span class="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">배송중</span>
              </div>
              <div class="flex items-center gap-4 mt-2 text-sm text-gray-500">
                <span>📅 2025-12-20</span>
                <span>💰 ₩78,000</span>
              </div>
            </div>
          </div>
          
          <div class="flex gap-4 p-4 bg-white border rounded-xl hover:shadow-sm transition">
            <div class="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
              <span class="text-2xl">👜</span>
            </div>
            <div class="flex-1">
              <div class="flex items-start justify-between">
                <div>
                  <p class="font-medium text-gray-900">수제 가죽 미니 크로스백</p>
                  <p class="text-sm text-gray-500">박작가 · ORD-2025-011456</p>
                </div>
                <span class="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">배송완료</span>
              </div>
              <div class="flex items-center gap-4 mt-2 text-sm text-gray-500">
                <span>📅 2025-11-15</span>
                <span>💰 ₩125,000</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- AI 인사이트 -->
      <div class="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-5 border border-blue-100">
        <div class="flex items-center gap-2 mb-3">
          <span class="text-lg">💡</span>
          <h4 class="font-bold text-blue-800">AI 인사이트</h4>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div class="bg-white/70 rounded-lg p-3">
            <p class="text-xs text-blue-600 font-medium mb-1">선호 카테고리</p>
            <p class="text-sm text-gray-800">주얼리 (구매의 60%)</p>
          </div>
          <div class="bg-white/70 rounded-lg p-3">
            <p class="text-xs text-blue-600 font-medium mb-1">구매 시점</p>
            <p class="text-sm text-gray-800">월초 집중 (급여일 추정)</p>
          </div>
          <div class="bg-white/70 rounded-lg p-3">
            <p class="text-xs text-blue-600 font-medium mb-1">재구매 주기</p>
            <p class="text-sm text-gray-800">평균 23일</p>
          </div>
          <div class="bg-white/70 rounded-lg p-3">
            <p class="text-xs text-blue-600 font-medium mb-1">추천 액션</p>
            <p class="text-sm text-gray-800">신규 주얼리 컬렉션 안내</p>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 푸터 -->
    <div class="p-4 border-t bg-gray-50 flex justify-between items-center">
      <div class="flex gap-2">
        <button class="px-4 py-2 border rounded-lg text-sm font-medium hover:bg-white transition">
          📧 메일 발송
        </button>
        <button class="px-4 py-2 border rounded-lg text-sm font-medium hover:bg-white transition">
          📋 메모 추가
        </button>
      </div>
      <button class="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300 transition">
        닫기
      </button>
    </div>
  </div>
</body>
</html>
```

---

## 4. idus Marketing Studio (콘텐츠 생성)

```html
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>idus Marketing Studio</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    * { font-family: 'Pretendard', -apple-system, sans-serif; }
    .gradient-pink { background: linear-gradient(135deg, #F78C3A 0%, #EC4899 100%); }
  </style>
</head>
<body class="bg-gray-100 min-h-screen">
  <div class="max-w-6xl mx-auto p-6">
    <!-- 헤더 -->
    <div class="flex items-center justify-between mb-6">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 gradient-pink rounded-xl flex items-center justify-center">
          <span class="text-white font-bold">M</span>
        </div>
        <div>
          <h1 class="font-bold text-xl">Marketing Studio</h1>
          <p class="text-sm text-gray-500">AI 콘텐츠 자동 생성</p>
        </div>
      </div>
      <div class="flex gap-2">
        <button class="px-4 py-2 bg-white border rounded-lg text-sm">히스토리</button>
      </div>
    </div>
    
    <div class="grid grid-cols-2 gap-6">
      <!-- 왼쪽: 작품 선택 -->
      <div class="bg-white rounded-2xl p-6 shadow-sm">
        <h2 class="font-bold text-lg mb-4">선택된 작품 (3/5)</h2>
        
        <div class="space-y-3">
          <div class="flex gap-4 p-3 bg-orange-50 border border-orange-200 rounded-xl">
            <div class="w-16 h-16 bg-gray-200 rounded-lg"></div>
            <div class="flex-1">
              <p class="font-medium">핸드메이드 실버 반지</p>
              <p class="text-sm text-gray-500">김작가 · ₩45,000</p>
              <div class="flex gap-1 mt-1">
                <span class="text-xs bg-gray-100 px-2 py-0.5 rounded">주얼리</span>
                <span class="text-xs bg-gray-100 px-2 py-0.5 rounded">⭐ 4.9</span>
              </div>
            </div>
            <button class="text-gray-400 hover:text-red-500">✕</button>
          </div>
          
          <div class="flex gap-4 p-3 bg-orange-50 border border-orange-200 rounded-xl">
            <div class="w-16 h-16 bg-gray-200 rounded-lg"></div>
            <div class="flex-1">
              <p class="font-medium">도자기 머그컵 세트</p>
              <p class="text-sm text-gray-500">이작가 · ₩78,000</p>
              <div class="flex gap-1 mt-1">
                <span class="text-xs bg-gray-100 px-2 py-0.5 rounded">도자기</span>
                <span class="text-xs bg-gray-100 px-2 py-0.5 rounded">⭐ 4.8</span>
              </div>
            </div>
            <button class="text-gray-400 hover:text-red-500">✕</button>
          </div>
          
          <div class="flex gap-4 p-3 bg-orange-50 border border-orange-200 rounded-xl">
            <div class="w-16 h-16 bg-gray-200 rounded-lg"></div>
            <div class="flex-1">
              <p class="font-medium">수제 가죽 지갑</p>
              <p class="text-sm text-gray-500">박작가 · ₩89,000</p>
              <div class="flex gap-1 mt-1">
                <span class="text-xs bg-gray-100 px-2 py-0.5 rounded">가죽</span>
                <span class="text-xs bg-gray-100 px-2 py-0.5 rounded">⭐ 4.7</span>
              </div>
            </div>
            <button class="text-gray-400 hover:text-red-500">✕</button>
          </div>
        </div>
        
        <!-- 생성 옵션 -->
        <div class="mt-6 pt-6 border-t">
          <h3 class="font-bold mb-4">생성 옵션</h3>
          
          <div class="grid grid-cols-2 gap-4 mb-4">
            <div>
              <p class="text-sm text-gray-600 mb-2">플랫폼</p>
              <div class="space-y-2">
                <label class="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked class="w-4 h-4 rounded text-orange-500">
                  <span class="text-sm">📸 Instagram</span>
                </label>
                <label class="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked class="w-4 h-4 rounded text-orange-500">
                  <span class="text-sm">𝕏 X (Twitter)</span>
                </label>
              </div>
            </div>
            
            <div>
              <p class="text-sm text-gray-600 mb-2">언어</p>
              <div class="space-y-2">
                <label class="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked class="w-4 h-4 rounded text-orange-500">
                  <span class="text-sm">🇰🇷 한국어</span>
                </label>
                <label class="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked class="w-4 h-4 rounded text-orange-500">
                  <span class="text-sm">🇺🇸 English</span>
                </label>
                <label class="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked class="w-4 h-4 rounded text-orange-500">
                  <span class="text-sm">🇯🇵 日本語</span>
                </label>
              </div>
            </div>
          </div>
          
          <button class="w-full py-4 gradient-pink text-white rounded-xl font-bold text-lg hover:opacity-90 transition">
            ✨ AI 콘텐츠 생성
          </button>
        </div>
      </div>
      
      <!-- 오른쪽: 생성 결과 -->
      <div class="bg-white rounded-2xl p-6 shadow-sm">
        <div class="flex items-center justify-between mb-4">
          <h2 class="font-bold text-lg">생성된 콘텐츠</h2>
          <div class="flex gap-1">
            <button class="px-3 py-1.5 bg-gradient-to-r from-pink-500 to-orange-500 text-white rounded-lg text-sm font-medium">Instagram</button>
            <button class="px-3 py-1.5 bg-gray-100 rounded-lg text-sm">X</button>
            <button class="px-3 py-1.5 bg-gray-100 rounded-lg text-sm">CRM</button>
          </div>
        </div>
        
        <!-- 언어 탭 -->
        <div class="flex gap-2 mb-4">
          <button class="px-3 py-1.5 bg-orange-500 text-white rounded-full text-sm font-medium">🇰🇷 한국어</button>
          <button class="px-3 py-1.5 bg-gray-100 rounded-full text-sm">🇺🇸 English</button>
          <button class="px-3 py-1.5 bg-gray-100 rounded-full text-sm">🇯🇵 日本語</button>
        </div>
        
        <!-- 콘텐츠 미리보기 -->
        <div class="bg-gray-50 rounded-xl p-4 mb-4">
          <p class="text-gray-800 whitespace-pre-line leading-relaxed">
🌸 장인의 손끝에서 탄생한 특별한 작품

핸드메이드의 가치를 담은 실버 반지가 새롭게 출시되었습니다.
하나하나 정성스럽게 만들어진 이 반지는 세상에 단 하나뿐인 
나만의 특별한 아이템이 될 거예요.

지금 바로 아이디어스에서 만나보세요! 💫

#아이디어스 #핸드메이드 #실버반지 #수제주얼리 
#핸드메이드주얼리 #925실버 #선물추천 #idus
          </p>
        </div>
        
        <!-- 액션 버튼 -->
        <div class="flex gap-2 mb-6">
          <button class="flex-1 py-2.5 border rounded-lg text-sm font-medium hover:bg-gray-50 transition">
            📋 복사
          </button>
          <button class="flex-1 py-2.5 border rounded-lg text-sm font-medium hover:bg-gray-50 transition">
            🔄 재생성
          </button>
          <button class="flex-1 py-2.5 border rounded-lg text-sm font-medium hover:bg-gray-50 transition">
            ✏️ 수정
          </button>
        </div>
        
        <!-- 해시태그 룰 -->
        <div class="bg-blue-50 rounded-lg p-4 border border-blue-100">
          <p class="text-sm text-blue-700 font-medium mb-2">✓ 해시태그 룰 적용됨</p>
          <div class="flex flex-wrap gap-1.5">
            <span class="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">필수: #아이디어스</span>
            <span class="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">필수: #핸드메이드</span>
            <span class="px-2 py-1 bg-red-100 text-red-600 rounded text-xs line-through">제외: #etsy</span>
            <span class="px-2 py-1 bg-red-100 text-red-600 rounded text-xs line-through">제외: #minne</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</body>
</html>
```

---

## 5. 6개월 성장 여정 비교 (슬라이드 5)

```html
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>6개월 성장 여정</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    * { font-family: 'Pretendard', -apple-system, sans-serif; }
    .gradient-orange { background: linear-gradient(135deg, #F78C3A 0%, #E67729 100%); }
    @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }
    .float { animation: float 3s ease-in-out infinite; }
  </style>
</head>
<body class="bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen p-8">
  <div class="max-w-6xl mx-auto">
    <!-- 제목 -->
    <div class="text-center mb-10">
      <h1 class="text-3xl font-bold text-gray-800 mb-2">🚀 6개월간의 성장 여정</h1>
      <p class="text-gray-500">비개발자의 AI 코딩 성장 스토리</p>
    </div>
    
    <!-- Before/After 비교 카드 -->
    <div class="grid grid-cols-2 gap-8 mb-10">
      <!-- Before: 6개월 전 -->
      <div class="bg-white rounded-2xl shadow-lg border-2 border-gray-200 overflow-hidden">
        <div class="bg-gray-100 px-6 py-4 border-b">
          <div class="flex items-center justify-between">
            <span class="px-4 py-1.5 bg-gray-200 rounded-full text-gray-600 font-medium text-sm">6개월 전</span>
            <span class="text-gray-400 text-sm">2025년 상반기</span>
          </div>
        </div>
        
        <div class="p-6">
          <div class="flex items-center gap-3 mb-4">
            <div class="w-12 h-12 bg-gray-200 rounded-xl flex items-center justify-center">
              <span class="text-2xl">📊</span>
            </div>
            <div>
              <h3 class="font-bold text-gray-700">소담상회 인사점 대시보드</h3>
              <p class="text-sm text-gray-500">Google Sheets + Apps Script</p>
            </div>
          </div>
          
          <div class="space-y-3 mb-6">
            <div class="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <span class="text-xl">⏱️</span>
              <div class="flex-1">
                <p class="text-xs text-gray-500">데이터 로딩</p>
                <p class="font-bold text-red-500">30-60초</p>
              </div>
            </div>
            <div class="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <span class="text-xl">📄</span>
              <div class="flex-1">
                <p class="text-xs text-gray-500">페이지/기능</p>
                <p class="font-bold text-gray-700">1개 대시보드</p>
              </div>
            </div>
            <div class="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <span class="text-xl">🎨</span>
              <div class="flex-1">
                <p class="text-xs text-gray-500">UI/UX</p>
                <p class="font-bold text-gray-700">Sheets 기본 UI</p>
              </div>
            </div>
            <div class="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <span class="text-xl">🏪</span>
              <div class="flex-1">
                <p class="text-xs text-gray-500">업무 범위</p>
                <p class="font-bold text-gray-700">오프라인 매장 1곳</p>
              </div>
            </div>
          </div>
          
          <div class="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
            <p class="text-sm text-yellow-700">
              <span class="font-bold">구현 기능:</span> KPI, 일별 차트, TOP5, AI 분석, What-if
            </p>
            <p class="text-xs text-yellow-600 mt-1">
              ⚠️ 한계: 느린 속도, UI 제약, 모바일 불가
            </p>
          </div>
        </div>
      </div>
      
      <!-- After: 현재 -->
      <div class="bg-white rounded-2xl shadow-xl border-2 border-orange-400 overflow-hidden relative">
        <div class="absolute -top-0 -right-0 w-24 h-24 bg-orange-500/10 rounded-full translate-x-8 -translate-y-8"></div>
        <div class="absolute top-3 right-3 px-3 py-1 bg-orange-500 text-white rounded-full text-xs font-bold z-10">
          ✨ 현재
        </div>
        
        <div class="bg-orange-50 px-6 py-4 border-b border-orange-200">
          <div class="flex items-center justify-between">
            <span class="px-4 py-1.5 bg-orange-100 rounded-full text-orange-600 font-medium text-sm">2026년 1월</span>
            <span class="text-orange-400 text-sm">Global Business셀</span>
          </div>
        </div>
        
        <div class="p-6">
          <div class="flex items-center gap-3 mb-4">
            <div class="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center float">
              <span class="text-2xl">🌏</span>
            </div>
            <div>
              <h3 class="font-bold text-gray-800">Global Business Hub</h3>
              <p class="text-sm text-orange-500">Next.js + Express + React</p>
            </div>
          </div>
          
          <div class="space-y-3 mb-6">
            <div class="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
              <span class="text-xl">⚡</span>
              <div class="flex-1">
                <p class="text-xs text-gray-500">데이터 로딩</p>
                <p class="font-bold text-green-600">1-2초 <span class="text-xs font-normal">(30배↑)</span></p>
              </div>
              <span class="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs font-bold">30x</span>
            </div>
            <div class="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
              <span class="text-xl">📑</span>
              <div class="flex-1">
                <p class="text-xs text-gray-500">페이지/기능</p>
                <p class="font-bold text-green-600">20개+ 페이지 <span class="text-xs font-normal">(20배↑)</span></p>
              </div>
              <span class="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs font-bold">20x</span>
            </div>
            <div class="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
              <span class="text-xl">✨</span>
              <div class="flex-1">
                <p class="text-xs text-gray-500">UI/UX</p>
                <p class="font-bold text-green-600">브랜드 디자인 시스템</p>
              </div>
            </div>
            <div class="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
              <span class="text-xl">🌏</span>
              <div class="flex-1">
                <p class="text-xs text-gray-500">업무 범위</p>
                <p class="font-bold text-green-600">글로벌 비즈니스 전체</p>
              </div>
            </div>
          </div>
          
          <div class="bg-orange-50 rounded-lg p-4 border border-orange-200">
            <p class="text-sm text-orange-700">
              <span class="font-bold">확장 프로젝트:</span>
            </p>
            <div class="flex gap-2 mt-2">
              <span class="px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs">📱 Marketing Studio</span>
              <span class="px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs">🌐 GB Translation</span>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 핵심 메시지 배너 -->
    <div class="gradient-orange rounded-2xl p-8 text-white text-center shadow-lg">
      <p class="text-lg mb-3 opacity-90">💡 이 성장의 비결은?</p>
      <p class="text-3xl font-bold mb-4">"열심히 공부"가 아닌 "꾸준한 시도"</p>
      <div class="flex justify-center gap-4 text-sm">
        <div class="px-4 py-2 bg-white/20 rounded-full backdrop-blur">
          막히면 → AI에게 질문
        </div>
        <div class="px-4 py-2 bg-white/20 rounded-full backdrop-blur">
          에러나면 → AI에게 해결 요청
        </div>
        <div class="px-4 py-2 bg-white/20 rounded-full backdrop-blur">
          새 기능 → AI와 함께 설계
        </div>
      </div>
      <p class="mt-6 text-white/80 text-sm">
        이 사이클을 6개월간 반복한 것이 전부입니다.
      </p>
    </div>
    
    <!-- 성장 타임라인 -->
    <div class="mt-10 bg-white rounded-2xl p-6 shadow-lg">
      <h3 class="font-bold text-lg mb-6 text-center">📅 성장 타임라인</h3>
      
      <div class="relative">
        <!-- 타임라인 선 -->
        <div class="absolute top-8 left-0 right-0 h-1 bg-gray-200 rounded"></div>
        
        <div class="flex justify-between relative">
          <!-- 2025.01 -->
          <div class="text-center">
            <div class="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-2 relative z-10 border-4 border-white shadow">
              <span class="text-2xl">📊</span>
            </div>
            <p class="text-xs font-bold text-gray-600">2025.01-05</p>
            <p class="text-xs text-gray-500">오프라인셀</p>
            <p class="text-xs text-gray-400 mt-1">Sheets 대시보드</p>
          </div>
          
          <!-- 2025.06 -->
          <div class="text-center">
            <div class="w-16 h-16 mx-auto bg-yellow-100 rounded-full flex items-center justify-center mb-2 relative z-10 border-4 border-white shadow">
              <span class="text-2xl">💡</span>
            </div>
            <p class="text-xs font-bold text-yellow-600">2025.06</p>
            <p class="text-xs text-gray-500">전환점</p>
            <p class="text-xs text-gray-400 mt-1">GB셀 이동</p>
          </div>
          
          <!-- 2025.07-09 -->
          <div class="text-center">
            <div class="w-16 h-16 mx-auto bg-blue-100 rounded-full flex items-center justify-center mb-2 relative z-10 border-4 border-white shadow">
              <span class="text-2xl">🚀</span>
            </div>
            <p class="text-xs font-bold text-blue-600">2025.07-09</p>
            <p class="text-xs text-gray-500">첫 도전</p>
            <p class="text-xs text-gray-400 mt-1">Cursor 시작</p>
          </div>
          
          <!-- 2025.10-12 -->
          <div class="text-center">
            <div class="w-16 h-16 mx-auto bg-purple-100 rounded-full flex items-center justify-center mb-2 relative z-10 border-4 border-white shadow">
              <span class="text-2xl">📈</span>
            </div>
            <p class="text-xs font-bold text-purple-600">2025.10-12</p>
            <p class="text-xs text-gray-500">기능 확장</p>
            <p class="text-xs text-gray-400 mt-1">물류, 분석 추가</p>
          </div>
          
          <!-- 2026.01 -->
          <div class="text-center">
            <div class="w-16 h-16 mx-auto bg-orange-100 rounded-full flex items-center justify-center mb-2 relative z-10 border-4 border-orange-400 shadow-lg">
              <span class="text-2xl">✨</span>
            </div>
            <p class="text-xs font-bold text-orange-600">2026.01</p>
            <p class="text-xs text-gray-500">현재</p>
            <p class="text-xs text-gray-400 mt-1">3개 프로젝트 운영</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</body>
</html>
```

---

## 6. 초기 버전 대시보드 재현 (Google Sheets 스타일)

```html
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>소담상회 인사점 대시보드 (초기 버전 재현)</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    * { font-family: 'Noto Sans KR', -apple-system, sans-serif; }
    .sheets-border { border: 1px solid #dadce0; }
    .sheets-header { background: #f8f9fa; }
  </style>
</head>
<body class="bg-white p-4">
  <div class="max-w-6xl mx-auto">
    <!-- 헤더 (Sheets 스타일) -->
    <div class="sheets-border rounded-t-lg overflow-hidden mb-4">
      <div class="sheets-header p-4 border-b">
        <h1 class="text-xl text-gray-700">🏪 소담상회 인사점 운영 대시보드</h1>
        <p class="text-sm text-gray-500 mt-1">기간: 2025.01.01 ~ 2025.05.11</p>
      </div>
      
      <!-- 필터 영역 -->
      <div class="p-4 flex gap-4 flex-wrap bg-gray-50">
        <div>
          <label class="text-xs text-gray-500 block mb-1">시작일</label>
          <input type="date" value="2025-01-01" class="px-3 py-1.5 border rounded text-sm">
        </div>
        <div>
          <label class="text-xs text-gray-500 block mb-1">종료일</label>
          <input type="date" value="2025-05-11" class="px-3 py-1.5 border rounded text-sm">
        </div>
        <div>
          <label class="text-xs text-gray-500 block mb-1">참여 프로그램</label>
          <select class="px-3 py-1.5 border rounded text-sm">
            <option>모든 프로그램</option>
          </select>
        </div>
      </div>
    </div>
    
    <!-- 주요 현황 요약 -->
    <div class="sheets-border rounded-lg p-4 mb-4 bg-yellow-50">
      <h2 class="text-base font-medium text-yellow-700 mb-3">⭐ 주요 현황 요약 (선택된 기간 기준)</h2>
      <div class="text-sm text-gray-700 space-y-1">
        <p>⭐ 최다 판매 상품: 묘한랑 뉴트로 안경닦이 (561개)</p>
        <p>⭐ 최고 매출 상품: 트윌숄더백 (₩3,690,000)</p>
        <p>⭐ 최고 매출 작가: 꾸라미 couramee (₩6,896,400)</p>
        <p>⭐ 재고 위험 상품 주의: 500종 (상세 목록 확인)</p>
      </div>
    </div>
    
    <!-- KPI 카드 (Sheets 스타일) -->
    <div class="grid grid-cols-4 gap-4 mb-4">
      <div class="sheets-border rounded-lg p-4 text-center">
        <p class="text-sm text-gray-500 mb-1">💰 총 매출</p>
        <p class="text-2xl font-bold text-gray-800">₩263,716,200</p>
      </div>
      <div class="sheets-border rounded-lg p-4 text-center">
        <p class="text-sm text-gray-500 mb-1">📦 총 판매 수량</p>
        <p class="text-2xl font-bold text-gray-800">23,564</p>
      </div>
      <div class="sheets-border rounded-lg p-4 text-center">
        <p class="text-sm text-gray-500 mb-1">🏷️ 평균판매단가 (ASP)</p>
        <p class="text-2xl font-bold text-gray-800">₩11,191</p>
      </div>
      <div class="sheets-border rounded-lg p-4 text-center">
        <p class="text-sm text-gray-500 mb-1">⚠️ 재고 위험 상품 수</p>
        <p class="text-2xl font-bold text-red-600">500</p>
      </div>
    </div>
    
    <!-- 차트 영역 -->
    <div class="grid grid-cols-2 gap-4 mb-4">
      <!-- 일별 매출 추이 -->
      <div class="sheets-border rounded-lg p-4">
        <h3 class="text-sm font-medium text-gray-700 mb-3">📈 일별 매출 추이</h3>
        <div class="h-40 flex items-end gap-1">
          <!-- 간단한 바 차트 시뮬레이션 -->
          <div class="flex-1 bg-teal-400 rounded-t" style="height: 30%"></div>
          <div class="flex-1 bg-teal-400 rounded-t" style="height: 45%"></div>
          <div class="flex-1 bg-teal-400 rounded-t" style="height: 35%"></div>
          <div class="flex-1 bg-teal-400 rounded-t" style="height: 50%"></div>
          <div class="flex-1 bg-teal-400 rounded-t" style="height: 40%"></div>
          <div class="flex-1 bg-teal-400 rounded-t" style="height: 55%"></div>
          <div class="flex-1 bg-teal-400 rounded-t" style="height: 45%"></div>
          <div class="flex-1 bg-teal-400 rounded-t" style="height: 60%"></div>
          <div class="flex-1 bg-teal-400 rounded-t" style="height: 50%"></div>
          <div class="flex-1 bg-teal-400 rounded-t" style="height: 70%"></div>
          <div class="flex-1 bg-teal-400 rounded-t" style="height: 65%"></div>
          <div class="flex-1 bg-teal-400 rounded-t" style="height: 90%"></div>
        </div>
        <p class="text-xs text-gray-400 mt-2 text-center">2025.01 → 2025.05</p>
      </div>
      
      <!-- 판매 위치별 -->
      <div class="sheets-border rounded-lg p-4">
        <h3 class="text-sm font-medium text-gray-700 mb-3">📍 판매 위치별 상품그룹 매출 비중</h3>
        <div class="space-y-2">
          <div class="flex items-center gap-2">
            <span class="text-xs w-12">1층</span>
            <div class="flex-1 h-5 bg-gray-100 rounded overflow-hidden flex">
              <div class="bg-pink-400 h-full" style="width: 25%"></div>
              <div class="bg-blue-400 h-full" style="width: 20%"></div>
              <div class="bg-teal-400 h-full" style="width: 15%"></div>
              <div class="bg-purple-400 h-full" style="width: 15%"></div>
              <div class="bg-yellow-400 h-full" style="width: 10%"></div>
              <div class="bg-cyan-400 h-full" style="width: 15%"></div>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-xs w-12">2층</span>
            <div class="flex-1 h-5 bg-gray-100 rounded overflow-hidden flex">
              <div class="bg-pink-400 h-full" style="width: 30%"></div>
              <div class="bg-blue-400 h-full" style="width: 15%"></div>
              <div class="bg-teal-400 h-full" style="width: 20%"></div>
              <div class="bg-purple-400 h-full" style="width: 10%"></div>
              <div class="bg-yellow-400 h-full" style="width: 10%"></div>
              <div class="bg-cyan-400 h-full" style="width: 15%"></div>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-xs w-12">4층</span>
            <div class="flex-1 h-5 bg-gray-100 rounded overflow-hidden flex">
              <div class="bg-pink-400 h-full" style="width: 35%"></div>
              <div class="bg-blue-400 h-full" style="width: 18%"></div>
              <div class="bg-teal-400 h-full" style="width: 12%"></div>
              <div class="bg-purple-400 h-full" style="width: 12%"></div>
              <div class="bg-yellow-400 h-full" style="width: 8%"></div>
              <div class="bg-cyan-400 h-full" style="width: 15%"></div>
            </div>
          </div>
        </div>
        <div class="flex flex-wrap gap-2 mt-3 text-xs">
          <span class="flex items-center gap-1"><span class="w-3 h-3 bg-pink-400 rounded"></span>디지털/폰케이스</span>
          <span class="flex items-center gap-1"><span class="w-3 h-3 bg-blue-400 rounded"></span>문구/이벤트</span>
          <span class="flex items-center gap-1"><span class="w-3 h-3 bg-teal-400 rounded"></span>패션잡화</span>
        </div>
      </div>
    </div>
    
    <!-- TOP 5 테이블 -->
    <div class="sheets-border rounded-lg overflow-hidden mb-4">
      <div class="sheets-header px-4 py-3 border-b">
        <h3 class="text-sm font-medium text-gray-700">🏆 TOP 5 상품 (매출 기준)</h3>
      </div>
      <table class="w-full text-sm">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-4 py-2 text-left text-gray-600">순위</th>
            <th class="px-4 py-2 text-left text-gray-600">상품명</th>
            <th class="px-4 py-2 text-right text-gray-600">매출액</th>
            <th class="px-4 py-2 text-right text-gray-600">판매 수량</th>
            <th class="px-4 py-2 text-center text-gray-600">주요 판매 위치</th>
          </tr>
        </thead>
        <tbody>
          <tr class="border-t">
            <td class="px-4 py-2">1</td>
            <td class="px-4 py-2 text-blue-600">트윌숄더백</td>
            <td class="px-4 py-2 text-right">₩3,690,000</td>
            <td class="px-4 py-2 text-right">123</td>
            <td class="px-4 py-2 text-center">4층</td>
          </tr>
          <tr class="border-t">
            <td class="px-4 py-2">2</td>
            <td class="px-4 py-2 text-blue-600">국화매듭 나비 태슬 키링</td>
            <td class="px-4 py-2 text-right">₩3,567,800</td>
            <td class="px-4 py-2 text-right">142</td>
            <td class="px-4 py-2 text-center">1층</td>
          </tr>
          <tr class="border-t">
            <td class="px-4 py-2">3</td>
            <td class="px-4 py-2 text-blue-600">포켓 섬유향수</td>
            <td class="px-4 py-2 text-right">₩2,988,500</td>
            <td class="px-4 py-2 text-right">429</td>
            <td class="px-4 py-2 text-center">1층</td>
          </tr>
        </tbody>
      </table>
    </div>
    
    <!-- AI 분석 섹션 -->
    <div class="sheets-border rounded-lg overflow-hidden">
      <div class="bg-green-50 px-4 py-3 border-b flex items-center justify-between">
        <h3 class="text-sm font-medium text-green-700">💡 AI 시즌 운영 분석 및 제안</h3>
        <button class="px-4 py-1.5 bg-green-600 text-white rounded text-sm">AI 분석 요청</button>
      </div>
      <div class="p-4">
        <div class="mb-3">
          <label class="text-xs text-gray-500 block mb-1">시즌 테마 또는 주요 목표 입력 (AI 분석용):</label>
          <input type="text" value="신규 고객 유치" class="w-full px-3 py-2 border rounded text-sm">
        </div>
        <div class="bg-gray-50 rounded p-4">
          <h4 class="font-medium text-gray-800 mb-2">소담상회 인사점 운영 전략 보고서 (2025. 5. 11. 기준)</h4>
          <p class="text-sm text-gray-600">주요 목표: <span class="text-blue-600">신규 고객 유치</span></p>
          <div class="mt-3 text-sm text-gray-700">
            <p class="font-medium">1. 핵심 데이터 동향 심층 분석</p>
            <ul class="list-disc list-inside ml-2 mt-1 text-gray-600">
              <li>총 매출: ₩263,716,200 - 5개월간의 매출은 상당히 양호한 수준입니다.</li>
              <li>총 판매 수량: 23,564 - 평균적으로 하루 150개 이상 판매된 셈입니다.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 한계점 표시 배너 -->
    <div class="mt-6 bg-red-50 border-2 border-red-200 border-dashed rounded-lg p-4">
      <h4 class="font-medium text-red-700 mb-2">⚠️ 이 버전의 한계점</h4>
      <div class="grid grid-cols-4 gap-4 text-sm">
        <div class="text-center">
          <p class="text-red-600 font-bold">⏱️ 30-60초</p>
          <p class="text-gray-600">데이터 로딩 시간</p>
        </div>
        <div class="text-center">
          <p class="text-red-600 font-bold">❌ 불가</p>
          <p class="text-gray-600">모바일 대응</p>
        </div>
        <div class="text-center">
          <p class="text-red-600 font-bold">📊 제한적</p>
          <p class="text-gray-600">UI 커스터마이징</p>
        </div>
        <div class="text-center">
          <p class="text-red-600 font-bold">🏪 1개</p>
          <p class="text-gray-600">단일 업무만 가능</p>
        </div>
      </div>
    </div>
  </div>
</body>
</html>
```

---

## 사용 방법

### Genspark에서 사용 시
1. 각 HTML 코드를 복사
2. Genspark의 HTML 렌더링 기능 활용
3. 스크린샷 없이 실제 UI 확인 가능

### 로컬 테스트 시
1. HTML 파일로 저장 (예: `dashboard.html`)
2. 브라우저에서 직접 열기
3. Tailwind CDN이 포함되어 있어 즉시 렌더링

### 커스터마이징
- 색상: `#F78C3A` (idus Orange) 기준
- 폰트: Pretendard 사용 (CDN 또는 로컬)
- 아이콘: 이모지 기반 (별도 아이콘 라이브러리 불필요)

---

*이 목업들은 실제 Global Business Hub의 디자인 시스템을 기반으로 제작되었습니다.*
