# 글로벌 작가 온보딩 페이지 - 슬라이드 가이드

## 📋 프로젝트 개요

**프로젝트명**: 글로벌 작가 온보딩 페이지
**GitHub**: [artists-global-registration](https://github.com/pos01204/artists-global-registration)
**배포 URL**: [artists-global-registration.vercel.app](https://artists-global-registration.vercel.app)

### 프로젝트 목적
KR 서버에 입점된 작가님들이 글로벌 판매에 대한 어려움을 낮추고, 재미있고 쉬운 온보딩을 통해 실제 글로벌 작가 등록까지 이어지도록 유도

---

## 🎯 핵심 메시지

### Google Forms vs 전용 온보딩 페이지

| 항목 | Google Forms | 전용 온보딩 페이지 |
|------|-------------|-------------------|
| **콘텐츠 유형** | 텍스트, 이미지 (제한적) | 영상, 퀴즈, 인터랙티브 콘텐츠 |
| **편집 자유도** | 템플릿 제한 | 완전한 커스터마이징 |
| **사용자 경험** | 단순 설문 형태 | 몰입형 학습 경험 |
| **분기 처리** | 기본 분기만 가능 | 복잡한 조건부 분기 |
| **브랜딩** | Google 스타일 | 자사 브랜드 아이덴티티 |
| **데이터 활용** | Sheets 연동 | Sheets + 추가 분석 가능 |
| **보상 연동** | 불가능 | 포인트 지급 등 연동 가능 |

---

## 📑 슬라이드 구성

### 슬라이드 A-8: 추가 프로젝트 - 글로벌 작가 온보딩

```markdown
## 슬라이드: 글로벌 작가 온보딩 페이지

### 프로젝트 배경

**기존 방식: Google Forms**
- 단순 설문 형태의 작가 등록
- 글로벌 판매에 대한 정보 부족
- 높은 이탈률, 낮은 전환율

**문제점**
- 작가님들이 글로벌 판매를 어렵게 느낌
- 필요한 정보를 충분히 전달하기 어려움
- 학습 과정 없이 바로 등록 요청
- 브랜드 경험 부재

**해결책: 전용 온보딩 페이지**
- 단계별 학습 과정으로 자연스러운 이해
- 영상, 퀴즈 등 다양한 콘텐츠
- 자격 조건에 따른 분기 처리
- 학습 완료 시 포인트 보상

### 기술 스택
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Framer Motion (애니메이션)
- Google Sheets API (데이터 저장)
```

---

### 슬라이드 A-9: Google Forms vs 전용 페이지 비교

```markdown
## 슬라이드: 왜 Google Forms를 벗어났는가

### Before: Google Forms의 한계

┌─────────────────────────────────────────────────────────────┐
│  📋 Google Forms                                             │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ❌ 콘텐츠 제한                                              │
│     · 텍스트와 이미지만 가능                                │
│     · 영상 삽입 불가 (링크만 가능)                          │
│     · 인터랙티브 요소 없음                                  │
│                                                              │
│  ❌ 편집 자유도 부족                                         │
│     · 정해진 템플릿만 사용                                  │
│     · 브랜드 색상/폰트 제한                                 │
│     · 레이아웃 커스터마이징 불가                            │
│                                                              │
│  ❌ 사용자 경험 제한                                         │
│     · 단순 설문 형태                                        │
│     · 진행률 표시 제한적                                    │
│     · 조건부 분기 기능 제한                                 │
│                                                              │
│  ❌ 기능 확장 불가                                           │
│     · 퀴즈/학습 기능 없음                                   │
│     · 보상 시스템 연동 불가                                 │
│     · UTM 추적 제한                                         │
│                                                              │
└─────────────────────────────────────────────────────────────┘

### After: 전용 온보딩 페이지

┌─────────────────────────────────────────────────────────────┐
│  🌏 글로벌 작가 온보딩 페이지                                │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ✅ 다양한 콘텐츠                                            │
│     · 영상 임베드 (YouTube, Vimeo)                          │
│     · 인터랙티브 퀴즈                                       │
│     · 애니메이션 가이드                                     │
│     · 단계별 학습 모듈                                      │
│                                                              │
│  ✅ 완전한 편집 자유도                                       │
│     · idus 브랜드 아이덴티티 적용                           │
│     · 자유로운 레이아웃 구성                                │
│     · 맞춤형 UI 컴포넌트                                    │
│                                                              │
│  ✅ 몰입형 사용자 경험                                       │
│     · 게이미피케이션 요소                                   │
│     · 진행률 시각화                                         │
│     · 자격 조건별 분기 처리                                 │
│                                                              │
│  ✅ 확장 가능한 기능                                         │
│     · 학습 완료 시 포인트 지급                              │
│     · UTM 파라미터 완전 추적                                │
│     · 리마케팅용 데이터 수집                                │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

### 슬라이드 A-10: 주요 기능 소개

```markdown
## 슬라이드: 온보딩 페이지 주요 기능

### 1️⃣ 작가 정보 입력 & 자격 확인

입력 정보:
- 작가명/브랜드명
- 연락처
- 사업자등록번호 보유 여부
- 판매 카테고리
- 2026 확장 카테고리 관심 여부

### 2️⃣ 자격 분기 처리

```
작가 정보 입력
      │
      ▼
  자격 확인
      │
      ├─── ✅ 자격 충족 ──────→ 학습 과정으로
      │
      ├─── ⚠️ 사업자 미등록 ──→ 안내 페이지
      │                         (리마케팅 데이터 저장)
      │
      └─── 📋 2026 대기 ─────→ 대기 리스트 등록
```

### 3️⃣ 3단계 학습 과정

| STEP | 내용 | 소요 시간 |
|------|------|-----------|
| STEP 1 | 글로벌 서비스 이해하기 | ~15분 |
| STEP 2 | 작품 등록 마스터하기 | ~20분 |
| STEP 3 | 주문 처리 & 운영하기 | ~15분 |
| 퀴즈 | 학습 내용 확인 | 3문제 |

### 4️⃣ 완료 & 보상

- 학습 완료 축하 페이지
- KR 광고포인트 10,000P 지급
- 글로벌 작가 등록 CTA
```

---

### 슬라이드 A-11: 학습 페이지 플로우

```markdown
## 슬라이드: 학습 페이지 사용자 플로우

### 전체 플로우

```
┌─────────────────────────────────────────────────────────────┐
│                                                              │
│  🏠 랜딩 페이지                                              │
│     │                                                        │
│     ▼                                                        │
│  📝 작가 정보 입력                                           │
│     │                                                        │
│     ▼                                                        │
│  ⚡ 자격 확인 로딩 (애니메이션)                              │
│     │                                                        │
│     ├─────────────────────────────────────────┐              │
│     │                                         │              │
│     ▼                                         ▼              │
│  ✅ 자격 충족                            ❌ 미충족           │
│     │                                    (안내 페이지)       │
│     ▼                                                        │
│  📚 학습 메인                                                │
│     │                                                        │
│     ├── STEP 1: 글로벌 서비스 이해                          │
│     │      └── 콘텐츠 + 영상 + 체크포인트                   │
│     │                                                        │
│     ├── STEP 2: 작품 등록 마스터                            │
│     │      └── 콘텐츠 + 영상 + 체크포인트                   │
│     │                                                        │
│     ├── STEP 3: 주문 처리 & 운영                            │
│     │      └── 콘텐츠 + 영상 + 체크포인트                   │
│     │                                                        │
│     └── 📝 퀴즈 (3문제)                                     │
│            │                                                 │
│            ▼                                                 │
│  🎉 완료 페이지                                              │
│     · 축하 메시지                                           │
│     · 포인트 지급 안내                                      │
│     · 글로벌 작가 등록 CTA                                  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 학습 STEP 상세

**STEP 1: 글로벌 서비스 이해하기 (~15분)**
- 글로벌 마켓 소개
- 판매 가능 국가
- 수수료 구조
- 정산 방식

**STEP 2: 작품 등록 마스터하기 (~20분)**
- 작품 정보 입력 방법
- 다국어 설정 가이드
- 가격 설정 (환율 계산)
- 배송 옵션 설정

**STEP 3: 주문 처리 & 운영하기 (~15분)**
- 주문 확인 및 처리
- 배송 라벨 출력
- CS 대응 가이드
- FAQ
```

---

## 🎨 HTML 목업 코드

### 1. 랜딩 페이지 (작가 정보 입력)

```html
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>글로벌 작가 온보딩</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    * { font-family: 'Pretendard', -apple-system, sans-serif; }
    .gradient-orange { background: linear-gradient(135deg, #FF6F00 0%, #FF8F00 100%); }
  </style>
</head>
<body class="bg-gray-50 min-h-screen">
  <!-- 헤더 -->
  <header class="bg-white border-b">
    <div class="max-w-2xl mx-auto px-6 py-4 flex items-center justify-between">
      <div class="flex items-center gap-2">
        <div class="w-8 h-8 gradient-orange rounded-lg flex items-center justify-center">
          <span class="text-white font-bold text-sm">🌏</span>
        </div>
        <span class="font-bold text-gray-800">idus Global</span>
      </div>
      <span class="text-sm text-gray-500">작가 온보딩</span>
    </div>
  </header>

  <main class="max-w-2xl mx-auto px-6 py-10">
    <!-- 히어로 -->
    <div class="text-center mb-10">
      <div class="inline-flex items-center gap-2 px-4 py-2 bg-orange-100 text-orange-600 rounded-full text-sm font-medium mb-4">
        <span>🎁</span> 학습 완료 시 10,000P 지급
      </div>
      <h1 class="text-3xl font-bold text-gray-900 mb-3">
        글로벌 작가가 되어보세요
      </h1>
      <p class="text-gray-500">
        해외 고객에게 작품을 판매하고, 더 넓은 세상과 만나보세요
      </p>
    </div>

    <!-- 혜택 카드 -->
    <div class="grid grid-cols-3 gap-4 mb-10">
      <div class="bg-white rounded-xl p-4 text-center shadow-sm border">
        <div class="text-2xl mb-2">🌍</div>
        <p class="text-sm font-medium text-gray-700">전 세계 고객</p>
        <p class="text-xs text-gray-500">190개국 판매 가능</p>
      </div>
      <div class="bg-white rounded-xl p-4 text-center shadow-sm border">
        <div class="text-2xl mb-2">💴</div>
        <p class="text-sm font-medium text-gray-700">추가 수익</p>
        <p class="text-xs text-gray-500">새로운 매출 채널</p>
      </div>
      <div class="bg-white rounded-xl p-4 text-center shadow-sm border">
        <div class="text-2xl mb-2">📦</div>
        <p class="text-sm font-medium text-gray-700">간편한 배송</p>
        <p class="text-xs text-gray-500">통합 물류 시스템</p>
      </div>
    </div>

    <!-- 입력 폼 -->
    <div class="bg-white rounded-2xl p-6 shadow-lg border">
      <h2 class="text-lg font-bold text-gray-900 mb-6">작가님 정보를 입력해주세요</h2>
      
      <div class="space-y-5">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            작가명/브랜드명 <span class="text-red-500">*</span>
          </label>
          <input type="text" placeholder="예: 손으로공방" 
                 class="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent">
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            연락처 <span class="text-red-500">*</span>
          </label>
          <input type="tel" placeholder="010-0000-0000" 
                 class="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent">
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            사업자등록번호 보유 여부 <span class="text-red-500">*</span>
          </label>
          <div class="grid grid-cols-2 gap-3">
            <button class="px-4 py-3 border-2 border-orange-500 bg-orange-50 text-orange-600 rounded-xl font-medium">
              ✓ 보유하고 있어요
            </button>
            <button class="px-4 py-3 border rounded-xl text-gray-600 hover:bg-gray-50">
              아직 없어요
            </button>
          </div>
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            주요 판매 카테고리 <span class="text-red-500">*</span>
          </label>
          <div class="flex flex-wrap gap-2">
            <button class="px-3 py-2 bg-orange-500 text-white rounded-full text-sm">주얼리</button>
            <button class="px-3 py-2 bg-gray-100 text-gray-600 rounded-full text-sm hover:bg-gray-200">패션잡화</button>
            <button class="px-3 py-2 bg-gray-100 text-gray-600 rounded-full text-sm hover:bg-gray-200">홈리빙</button>
            <button class="px-3 py-2 bg-gray-100 text-gray-600 rounded-full text-sm hover:bg-gray-200">아트</button>
            <button class="px-3 py-2 bg-gray-100 text-gray-600 rounded-full text-sm hover:bg-gray-200">기타</button>
          </div>
        </div>
      </div>
      
      <button class="w-full mt-8 py-4 gradient-orange text-white rounded-xl font-bold text-lg hover:opacity-90 transition">
        글로벌 작가 시작하기 →
      </button>
      
      <p class="text-center text-xs text-gray-400 mt-4">
        입력하신 정보는 글로벌 작가 등록 및 안내에만 사용됩니다
      </p>
    </div>
  </main>
</body>
</html>
```

---

### 2. 학습 메인 페이지

```html
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>글로벌 작가 학습</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    * { font-family: 'Pretendard', -apple-system, sans-serif; }
    .gradient-orange { background: linear-gradient(135deg, #FF6F00 0%, #FF8F00 100%); }
  </style>
</head>
<body class="bg-gray-50 min-h-screen">
  <!-- 헤더 -->
  <header class="bg-white border-b sticky top-0 z-50">
    <div class="max-w-2xl mx-auto px-6 py-4">
      <div class="flex items-center justify-between">
        <span class="font-bold text-gray-800">글로벌 작가 학습</span>
        <div class="flex items-center gap-2">
          <span class="text-sm text-gray-500">진행률</span>
          <div class="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div class="h-full bg-orange-500 rounded-full" style="width: 33%"></div>
          </div>
          <span class="text-sm font-bold text-orange-500">1/3</span>
        </div>
      </div>
    </div>
  </header>

  <main class="max-w-2xl mx-auto px-6 py-8">
    <!-- 환영 메시지 -->
    <div class="bg-gradient-to-r from-orange-500 to-orange-400 rounded-2xl p-6 text-white mb-8">
      <p class="text-sm opacity-90 mb-1">안녕하세요, 손으로공방 작가님!</p>
      <h1 class="text-xl font-bold mb-2">글로벌 판매, 함께 시작해볼까요?</h1>
      <p class="text-sm opacity-80">약 50분 정도 소요되며, 완료 시 10,000P가 지급됩니다.</p>
    </div>

    <!-- 학습 단계 -->
    <div class="space-y-4">
      <!-- STEP 1 - 진행 중 -->
      <div class="bg-white rounded-2xl p-5 shadow-sm border-2 border-orange-400 relative">
        <div class="absolute -top-3 left-4 px-3 py-1 bg-orange-500 text-white text-xs rounded-full font-bold">
          진행 중
        </div>
        <div class="flex items-start gap-4">
          <div class="w-14 h-14 bg-orange-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <span class="text-2xl">🌍</span>
          </div>
          <div class="flex-1">
            <div class="flex items-center gap-2 mb-1">
              <span class="text-xs text-orange-500 font-bold">STEP 1</span>
              <span class="text-xs text-gray-400">~15분</span>
            </div>
            <h3 class="font-bold text-gray-900 mb-1">글로벌 서비스 이해하기</h3>
            <p class="text-sm text-gray-500 mb-3">idus 글로벌 서비스의 구조와 혜택을 알아봅니다</p>
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <div class="w-20 h-1.5 bg-orange-200 rounded-full overflow-hidden">
                  <div class="h-full bg-orange-500 rounded-full" style="width: 60%"></div>
                </div>
                <span class="text-xs text-gray-500">60%</span>
              </div>
              <button class="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition">
                이어서 학습 →
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- STEP 2 - 대기 -->
      <div class="bg-white rounded-2xl p-5 shadow-sm border opacity-70">
        <div class="flex items-start gap-4">
          <div class="w-14 h-14 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <span class="text-2xl">📝</span>
          </div>
          <div class="flex-1">
            <div class="flex items-center gap-2 mb-1">
              <span class="text-xs text-gray-400 font-bold">STEP 2</span>
              <span class="text-xs text-gray-400">~20분</span>
            </div>
            <h3 class="font-bold text-gray-700 mb-1">작품 등록 마스터하기</h3>
            <p class="text-sm text-gray-400 mb-3">글로벌 작품 등록 방법을 상세히 배웁니다</p>
            <div class="flex items-center gap-2">
              <span class="text-xs text-gray-400">🔒 STEP 1 완료 후 진행 가능</span>
            </div>
          </div>
        </div>
      </div>

      <!-- STEP 3 - 대기 -->
      <div class="bg-white rounded-2xl p-5 shadow-sm border opacity-70">
        <div class="flex items-start gap-4">
          <div class="w-14 h-14 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <span class="text-2xl">📦</span>
          </div>
          <div class="flex-1">
            <div class="flex items-center gap-2 mb-1">
              <span class="text-xs text-gray-400 font-bold">STEP 3</span>
              <span class="text-xs text-gray-400">~15분</span>
            </div>
            <h3 class="font-bold text-gray-700 mb-1">주문 처리 & 운영하기</h3>
            <p class="text-sm text-gray-400 mb-3">주문 확인부터 배송까지, 운영 방법을 익힙니다</p>
            <div class="flex items-center gap-2">
              <span class="text-xs text-gray-400">🔒 STEP 2 완료 후 진행 가능</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 퀴즈 - 대기 -->
      <div class="bg-white rounded-2xl p-5 shadow-sm border opacity-70">
        <div class="flex items-start gap-4">
          <div class="w-14 h-14 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <span class="text-2xl">✅</span>
          </div>
          <div class="flex-1">
            <div class="flex items-center gap-2 mb-1">
              <span class="text-xs text-gray-400 font-bold">QUIZ</span>
              <span class="text-xs text-gray-400">3문제</span>
            </div>
            <h3 class="font-bold text-gray-700 mb-1">학습 내용 확인</h3>
            <p class="text-sm text-gray-400 mb-3">배운 내용을 퀴즈로 확인해보세요</p>
            <div class="flex items-center gap-2">
              <span class="text-xs text-gray-400">🔒 STEP 3 완료 후 진행 가능</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 보상 안내 -->
    <div class="mt-8 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-2xl p-5 border border-yellow-200">
      <div class="flex items-center gap-3">
        <div class="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
          <span class="text-2xl">🎁</span>
        </div>
        <div>
          <p class="font-bold text-gray-800">학습 완료 보상</p>
          <p class="text-sm text-gray-600">모든 학습 완료 시 <span class="font-bold text-orange-500">광고포인트 10,000P</span> 지급!</p>
        </div>
      </div>
    </div>
  </main>
</body>
</html>
```

---

### 3. 학습 콘텐츠 페이지 (영상 + 콘텐츠)

```html
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>STEP 1: 글로벌 서비스 이해하기</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    * { font-family: 'Pretendard', -apple-system, sans-serif; }
    .gradient-orange { background: linear-gradient(135deg, #FF6F00 0%, #FF8F00 100%); }
  </style>
</head>
<body class="bg-gray-50 min-h-screen">
  <!-- 헤더 -->
  <header class="bg-white border-b sticky top-0 z-50">
    <div class="max-w-2xl mx-auto px-6 py-4">
      <div class="flex items-center justify-between">
        <button class="flex items-center gap-2 text-gray-600 hover:text-gray-900">
          <span>←</span>
          <span class="text-sm">학습 목록</span>
        </button>
        <div class="text-sm text-gray-500">STEP 1 / 3</div>
      </div>
    </div>
  </header>

  <main class="max-w-2xl mx-auto">
    <!-- 진행률 바 -->
    <div class="h-1 bg-gray-200">
      <div class="h-full bg-orange-500" style="width: 65%"></div>
    </div>

    <div class="px-6 py-8">
      <!-- 제목 -->
      <div class="mb-6">
        <span class="inline-block px-3 py-1 bg-orange-100 text-orange-600 rounded-full text-xs font-bold mb-2">STEP 1</span>
        <h1 class="text-2xl font-bold text-gray-900">글로벌 서비스 이해하기</h1>
        <p class="text-gray-500 mt-1">idus 글로벌 서비스의 구조와 혜택을 알아봅니다</p>
      </div>

      <!-- 영상 섹션 -->
      <div class="bg-black rounded-2xl overflow-hidden mb-6 aspect-video relative">
        <div class="absolute inset-0 flex items-center justify-center">
          <div class="text-center text-white">
            <div class="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3 backdrop-blur">
              <span class="text-3xl">▶️</span>
            </div>
            <p class="text-sm opacity-80">글로벌 서비스 소개 영상</p>
            <p class="text-xs opacity-60 mt-1">3:24</p>
          </div>
        </div>
        <!-- 실제 구현 시 YouTube iframe -->
        <div class="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
          <div class="h-full bg-orange-500" style="width: 45%"></div>
        </div>
      </div>

      <!-- 콘텐츠 섹션 -->
      <div class="space-y-6">
        <!-- 섹션 1 -->
        <div class="bg-white rounded-2xl p-6 shadow-sm border">
          <div class="flex items-center gap-2 mb-4">
            <span class="w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center text-xs font-bold">1</span>
            <h2 class="font-bold text-gray-900">글로벌 마켓이란?</h2>
          </div>
          <p class="text-gray-600 leading-relaxed mb-4">
            idus 글로벌은 한국의 핸드메이드 작품을 전 세계에 판매할 수 있는 플랫폼입니다. 
            일본, 미국, 동남아시아 등 190개국 이상의 고객에게 작품을 선보일 수 있습니다.
          </p>
          <div class="bg-orange-50 rounded-xl p-4">
            <p class="text-sm text-orange-700">
              💡 <strong>Tip:</strong> 현재 가장 활발한 시장은 일본으로, 전체 해외 주문의 약 70%를 차지합니다.
            </p>
          </div>
        </div>

        <!-- 섹션 2 -->
        <div class="bg-white rounded-2xl p-6 shadow-sm border">
          <div class="flex items-center gap-2 mb-4">
            <span class="w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center text-xs font-bold">2</span>
            <h2 class="font-bold text-gray-900">왜 글로벌 판매인가요?</h2>
          </div>
          
          <div class="grid grid-cols-2 gap-4 mb-4">
            <div class="bg-gray-50 rounded-xl p-4 text-center">
              <p class="text-3xl font-bold text-orange-500 mb-1">+40%</p>
              <p class="text-sm text-gray-500">평균 매출 증가</p>
            </div>
            <div class="bg-gray-50 rounded-xl p-4 text-center">
              <p class="text-3xl font-bold text-orange-500 mb-1">190+</p>
              <p class="text-sm text-gray-500">판매 가능 국가</p>
            </div>
          </div>
          
          <ul class="space-y-2 text-gray-600">
            <li class="flex items-start gap-2">
              <span class="text-green-500 mt-0.5">✓</span>
              <span>새로운 고객층 확보로 추가 매출 창출</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-green-500 mt-0.5">✓</span>
              <span>K-핸드메이드에 대한 해외 관심 증가</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-green-500 mt-0.5">✓</span>
              <span>idus 통합 물류 시스템으로 간편한 배송</span>
            </li>
          </ul>
        </div>

        <!-- 체크포인트 -->
        <div class="bg-blue-50 rounded-2xl p-6 border border-blue-200">
          <h3 class="font-bold text-blue-800 mb-4">✅ 이번 섹션에서 배운 내용</h3>
          <div class="space-y-3">
            <label class="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked class="w-5 h-5 text-blue-500 rounded">
              <span class="text-gray-700">글로벌 마켓의 개념을 이해했습니다</span>
            </label>
            <label class="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked class="w-5 h-5 text-blue-500 rounded">
              <span class="text-gray-700">글로벌 판매의 장점을 알게 되었습니다</span>
            </label>
            <label class="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" class="w-5 h-5 text-blue-500 rounded">
              <span class="text-gray-700">주요 판매 국가에 대해 알게 되었습니다</span>
            </label>
          </div>
        </div>
      </div>

      <!-- 하단 네비게이션 -->
      <div class="mt-8 flex items-center justify-between">
        <button class="px-6 py-3 border rounded-xl text-gray-600 hover:bg-gray-50 transition">
          ← 이전
        </button>
        <button class="px-6 py-3 gradient-orange text-white rounded-xl font-bold hover:opacity-90 transition">
          다음 섹션 →
        </button>
      </div>
    </div>
  </main>
</body>
</html>
```

---

### 4. 퀴즈 페이지

```html
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>학습 퀴즈</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    * { font-family: 'Pretendard', -apple-system, sans-serif; }
    .gradient-orange { background: linear-gradient(135deg, #FF6F00 0%, #FF8F00 100%); }
  </style>
</head>
<body class="bg-gray-50 min-h-screen">
  <!-- 헤더 -->
  <header class="bg-white border-b">
    <div class="max-w-2xl mx-auto px-6 py-4">
      <div class="flex items-center justify-between">
        <span class="font-bold text-gray-800">학습 퀴즈</span>
        <span class="text-sm text-gray-500">문제 2 / 3</span>
      </div>
    </div>
  </header>

  <!-- 진행률 -->
  <div class="h-1 bg-gray-200">
    <div class="h-full bg-orange-500 transition-all" style="width: 66%"></div>
  </div>

  <main class="max-w-2xl mx-auto px-6 py-8">
    <!-- 퀴즈 카드 -->
    <div class="bg-white rounded-2xl p-6 shadow-lg border">
      <!-- 문제 번호 -->
      <div class="flex items-center gap-2 mb-4">
        <span class="px-3 py-1 bg-orange-100 text-orange-600 rounded-full text-sm font-bold">Q2</span>
        <span class="text-sm text-gray-400">STEP 2에서 배운 내용</span>
      </div>

      <!-- 질문 -->
      <h2 class="text-xl font-bold text-gray-900 mb-6">
        글로벌 작품 등록 시, 가격 설정은 어떤 통화 기준으로 해야 할까요?
      </h2>

      <!-- 선택지 -->
      <div class="space-y-3">
        <button class="w-full p-4 text-left border-2 rounded-xl hover:border-orange-300 hover:bg-orange-50 transition group">
          <div class="flex items-center gap-3">
            <span class="w-8 h-8 bg-gray-100 group-hover:bg-orange-100 rounded-full flex items-center justify-center text-sm font-bold text-gray-500 group-hover:text-orange-500">A</span>
            <span class="text-gray-700">해당 국가의 현지 통화 (JPY, USD 등)</span>
          </div>
        </button>

        <button class="w-full p-4 text-left border-2 border-orange-500 bg-orange-50 rounded-xl">
          <div class="flex items-center gap-3">
            <span class="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-sm font-bold text-white">B</span>
            <span class="text-gray-900 font-medium">원화(KRW) 기준으로 설정하면 자동 환산</span>
          </div>
        </button>

        <button class="w-full p-4 text-left border-2 rounded-xl hover:border-orange-300 hover:bg-orange-50 transition group">
          <div class="flex items-center gap-3">
            <span class="w-8 h-8 bg-gray-100 group-hover:bg-orange-100 rounded-full flex items-center justify-center text-sm font-bold text-gray-500 group-hover:text-orange-500">C</span>
            <span class="text-gray-700">달러(USD)로만 설정 가능</span>
          </div>
        </button>

        <button class="w-full p-4 text-left border-2 rounded-xl hover:border-orange-300 hover:bg-orange-50 transition group">
          <div class="flex items-center gap-3">
            <span class="w-8 h-8 bg-gray-100 group-hover:bg-orange-100 rounded-full flex items-center justify-center text-sm font-bold text-gray-500 group-hover:text-orange-500">D</span>
            <span class="text-gray-700">국가별로 각각 다르게 설정해야 함</span>
          </div>
        </button>
      </div>

      <!-- 정답 확인 버튼 -->
      <button class="w-full mt-6 py-4 gradient-orange text-white rounded-xl font-bold text-lg hover:opacity-90 transition">
        정답 확인 →
      </button>
    </div>

    <!-- 힌트 -->
    <div class="mt-6 bg-blue-50 rounded-xl p-4 border border-blue-200">
      <p class="text-sm text-blue-700">
        💡 <strong>힌트:</strong> STEP 2의 "가격 설정" 섹션에서 배운 내용을 떠올려보세요!
      </p>
    </div>
  </main>
</body>
</html>
```

---

### 5. 완료 & 보상 페이지

```html
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>학습 완료!</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    * { font-family: 'Pretendard', -apple-system, sans-serif; }
    .gradient-orange { background: linear-gradient(135deg, #FF6F00 0%, #FF8F00 100%); }
    @keyframes confetti { 0% { transform: translateY(-100vh) rotate(0deg); } 100% { transform: translateY(100vh) rotate(720deg); } }
    .confetti { animation: confetti 3s ease-in-out infinite; }
  </style>
</head>
<body class="bg-gradient-to-b from-orange-50 to-white min-h-screen">
  <!-- 축하 애니메이션 배경 -->
  <div class="fixed inset-0 pointer-events-none overflow-hidden">
    <div class="confetti absolute top-0 left-1/4 text-4xl" style="animation-delay: 0s;">🎉</div>
    <div class="confetti absolute top-0 left-1/2 text-3xl" style="animation-delay: 0.5s;">✨</div>
    <div class="confetti absolute top-0 left-3/4 text-4xl" style="animation-delay: 1s;">🎊</div>
  </div>

  <main class="max-w-2xl mx-auto px-6 py-12 relative">
    <!-- 메인 카드 -->
    <div class="bg-white rounded-3xl p-8 shadow-xl border text-center">
      <!-- 아이콘 -->
      <div class="w-24 h-24 mx-auto bg-gradient-to-r from-orange-400 to-orange-500 rounded-full flex items-center justify-center mb-6 shadow-lg">
        <span class="text-5xl">🎓</span>
      </div>

      <!-- 축하 메시지 -->
      <h1 class="text-3xl font-bold text-gray-900 mb-2">
        축하합니다! 🎉
      </h1>
      <p class="text-lg text-gray-600 mb-6">
        손으로공방 작가님, 글로벌 작가 학습을 완료했습니다!
      </p>

      <!-- 학습 요약 -->
      <div class="bg-gray-50 rounded-2xl p-5 mb-6">
        <div class="grid grid-cols-3 gap-4">
          <div class="text-center">
            <p class="text-2xl font-bold text-orange-500">3</p>
            <p class="text-xs text-gray-500">완료한 STEP</p>
          </div>
          <div class="text-center">
            <p class="text-2xl font-bold text-orange-500">3/3</p>
            <p class="text-xs text-gray-500">퀴즈 정답</p>
          </div>
          <div class="text-center">
            <p class="text-2xl font-bold text-orange-500">48분</p>
            <p class="text-xs text-gray-500">총 학습 시간</p>
          </div>
        </div>
      </div>

      <!-- 보상 안내 -->
      <div class="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-2xl p-6 border border-yellow-200 mb-6">
        <div class="flex items-center justify-center gap-3 mb-3">
          <span class="text-3xl">🎁</span>
          <div class="text-left">
            <p class="text-sm text-gray-600">학습 완료 보상</p>
            <p class="text-2xl font-bold text-orange-500">광고포인트 10,000P</p>
          </div>
        </div>
        <p class="text-sm text-gray-500">
          포인트는 24시간 이내 지급되며, KR 광고 집행에 사용 가능합니다
        </p>
      </div>

      <!-- CTA 버튼 -->
      <button class="w-full py-4 gradient-orange text-white rounded-xl font-bold text-lg hover:opacity-90 transition mb-4">
        🌏 글로벌 작가 등록하기
      </button>

      <button class="w-full py-3 border rounded-xl text-gray-600 hover:bg-gray-50 transition">
        나중에 할게요
      </button>
    </div>

    <!-- 다음 단계 안내 -->
    <div class="mt-8 bg-white rounded-2xl p-6 shadow-sm border">
      <h3 class="font-bold text-gray-900 mb-4">📋 다음 단계</h3>
      <div class="space-y-3">
        <div class="flex items-center gap-3">
          <span class="w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center text-xs font-bold">1</span>
          <span class="text-gray-700">글로벌 작가 등록 신청</span>
        </div>
        <div class="flex items-center gap-3">
          <span class="w-6 h-6 bg-gray-200 text-gray-500 rounded-full flex items-center justify-center text-xs font-bold">2</span>
          <span class="text-gray-500">심사 진행 (1-2 영업일)</span>
        </div>
        <div class="flex items-center gap-3">
          <span class="w-6 h-6 bg-gray-200 text-gray-500 rounded-full flex items-center justify-center text-xs font-bold">3</span>
          <span class="text-gray-500">승인 완료 & 글로벌 판매 시작!</span>
        </div>
      </div>
    </div>
  </main>
</body>
</html>
```

---

## 🎯 Genspark 프롬프트

```
# 글로벌 작가 온보딩 페이지 슬라이드 생성 요청

## 프로젝트 개요
- 프로젝트명: 글로벌 작가 온보딩 페이지
- 목적: KR 작가들의 글로벌 판매 진입 장벽을 낮추고, 학습 기반 온보딩으로 전환율 향상
- 기술 스택: Next.js 14, TypeScript, Tailwind CSS, Framer Motion
- 배포: Vercel

## 슬라이드 목적
Google Forms의 한계를 벗어나 전용 웹 페이지를 구축한 이유와 장점을 설명하고,
실제 구현 화면을 보여줌으로써 AI 코딩 도구의 활용 가능성을 시연

## 디자인 스타일
- 메인 컬러: #FF6F00 (idus Orange)
- 배경: 밝은 톤
- 폰트: Pretendard
- 아이콘: 이모지

## 슬라이드 구성 (3장)

### 슬라이드 1: 왜 Google Forms를 벗어났는가

제목: "설문 도구의 한계를 넘어서"

2열 비교 레이아웃:

왼쪽 (Before: Google Forms):
- 배경: 회색
- 콘텐츠 제한: 텍스트/이미지만
- 편집 제한: 템플릿 고정
- 브랜딩: Google 스타일
- 기능: 단순 설문
- 연동: Sheets만

오른쪽 (After: 전용 페이지):
- 배경: 오렌지
- 콘텐츠: 영상, 퀴즈, 인터랙티브
- 편집: 완전 자유
- 브랜딩: idus 아이덴티티
- 기능: 학습 + 분기 + 보상
- 연동: 포인트 지급, 리마케팅

### 슬라이드 2: 온보딩 플로우

제목: "3단계 학습 기반 온보딩"

플로우 다이어그램:

작가 정보 입력
    │
    ▼
자격 확인 (분기)
    │
    ├─ ✅ 자격 충족 → 학습 과정
    │                    │
    │                    ├─ STEP 1: 글로벌 서비스 이해 (15분)
    │                    ├─ STEP 2: 작품 등록 마스터 (20분)
    │                    ├─ STEP 3: 주문 처리 & 운영 (15분)
    │                    └─ 퀴즈 (3문제)
    │                         │
    │                         ▼
    │                    완료 & 보상 (10,000P)
    │                         │
    │                         ▼
    │                    글로벌 작가 등록
    │
    ├─ ⚠️ 사업자 미등록 → 안내 페이지 (리마케팅)
    │
    └─ 📋 2026 대기 → 대기 리스트 등록

### 슬라이드 3: 실제 구현 화면

제목: "실제 학습 페이지 미리보기"

3열 이미지 레이아웃:
1. 랜딩 페이지 (작가 정보 입력)
2. 학습 콘텐츠 페이지 (영상 + 체크포인트)
3. 완료 & 보상 페이지

각 이미지 하단 캡션:
- "브랜드 아이덴티티 적용"
- "영상 + 체크포인트 학습"
- "게이미피케이션 보상"

하단 핵심 메시지:
"Google Forms로는 불가능했던 경험을 AI 코딩 도구로 2주 만에 구현"

## HTML 목업 렌더링 요청
- ARTISTS_ONBOARDING_SLIDES.md 파일의 HTML 목업 코드를 실제 UI로 렌더링
- 5개 페이지 (랜딩, 학습 메인, 학습 콘텐츠, 퀴즈, 완료)

## 특별 요청사항
1. Google Forms vs 전용 페이지 비교를 시각적으로 명확하게
2. 학습 플로우의 분기 처리 강조
3. 실제 화면 목업으로 "이런 걸 만들 수 있다" 시연
4. 구현 소요 시간 (2주) 강조
```

---

## ✅ 체크리스트

### 추가할 슬라이드
- [ ] 슬라이드 A-8: 프로젝트 배경 & 개요
- [ ] 슬라이드 A-9: Google Forms vs 전용 페이지 비교
- [ ] 슬라이드 A-10: 주요 기능 & 플로우
- [ ] 슬라이드 A-11: 실제 구현 화면 (목업)

### HTML 목업
- [ ] 랜딩 페이지 (작가 정보 입력)
- [ ] 학습 메인 페이지 (STEP 목록)
- [ ] 학습 콘텐츠 페이지 (영상 + 텍스트)
- [ ] 퀴즈 페이지
- [ ] 완료 & 보상 페이지

### 핵심 메시지
- [ ] Google Forms의 한계 (콘텐츠, 편집, 기능)
- [ ] 전용 페이지의 장점 (영상, 퀴즈, 분기, 보상)
- [ ] 2주 만에 구현 가능했던 이유 (AI 코딩 도구)
- [ ] 실제 화면으로 가능성 시연

---

*이 문서는 글로벌 작가 온보딩 페이지 프로젝트를 발표 슬라이드에 추가하기 위한 가이드입니다.*
