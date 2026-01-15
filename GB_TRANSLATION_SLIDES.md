# 작품 번역 자동화 (GB Translation) - 슬라이드 가이드

## 📋 프로젝트 개요

**프로젝트명**: Idus 작품 번역 자동화 (GB Translation)
**GitHub**: [GB-translation](https://github.com/pos01204/GB-translation)
**배포 URL**: [gb-translation.vercel.app](https://gb-translation.vercel.app)
**기술 스택**: Next.js 14, FastAPI, Playwright, Google Gemini 2.0 Flash

### 프로젝트 목적
KR 작품 페이지를 글로벌 서버에 등록하기 위한 번역 업무를 자동화.
URL 입력만으로 텍스트 크롤링, 이미지 OCR, AI 번역까지 원스톱으로 처리.

---

## 🎯 핵심 메시지

### 기존 번역 업무 vs 자동화 후

| 항목 | 기존 방식 (수동) | 자동화 후 |
|------|-----------------|----------|
| **텍스트 수집** | 작품 페이지에서 직접 복사 (5분) | URL 입력 → 자동 크롤링 (10초) |
| **이미지 텍스트** | 이미지 다운로드 → OCR 도구 → 복사 (10분) | 자동 OCR 추출 (30초) |
| **번역** | 번역기 붙여넣기 → 복사 (10분) | AI 자동 번역 (20초) |
| **옵션 정보** | 옵션 하나씩 클릭하며 확인 (5분) | 자동 추출 (5초) |
| **품질 검수** | 수동 확인 | 번역 품질 점수 자동 제공 |
| **총 소요 시간** | **30분+ / 작품** | **1-2분 / 작품** |

**시간 단축: 약 95%**

---

## 🔄 작동 프로세스

### 4단계 자동 처리

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                  │
│  1️⃣ 크롤링                                                      │
│     URL 입력 → Playwright로 페이지 접근                         │
│     상품명, 설명, 옵션, 가격, 작가명 자동 수집                   │
│     (playwright-stealth로 봇 탐지 우회)                         │
│                    │                                             │
│                    ▼                                             │
│  2️⃣ 번역                                                        │
│     Google Gemini 2.0 Flash API                                 │
│     한국어 → 일본어/영어 번역                                   │
│     맥락을 고려한 자연스러운 번역                               │
│                    │                                             │
│                    ▼                                             │
│  3️⃣ OCR 처리                                                    │
│     상품 이미지 6장 자동 수집                                   │
│     Gemini Vision으로 이미지 내 텍스트 추출                     │
│     추출된 텍스트 자동 번역                                     │
│                    │                                             │
│                    ▼                                             │
│  4️⃣ 완료                                                        │
│     번역 결과 표시                                              │
│     품질 점수 (A/B/C 등급)                                      │
│     직접 수정 가능한 에디터                                     │
│     복사/다운로드 기능                                          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📑 슬라이드 구성

### 슬라이드 B-1: 프로젝트 배경 - 기존 번역 업무의 Pain Point

```markdown
## 슬라이드: KR 작품 번역, 얼마나 번거로웠는가

### 글로벌 작품 등록을 위한 번역 업무

**기존 워크플로우**

┌─────────────────────────────────────────────────────────────────┐
│                                                                  │
│  Step 1: 텍스트 수집 (~5분)                                     │
│  ├─ KR 작품 페이지 접속                                         │
│  ├─ 상품명 복사                                                 │
│  ├─ 상품 설명 복사                                              │
│  ├─ 옵션 정보 하나씩 클릭하며 복사                              │
│  └─ 작가 정보 복사                                              │
│                                                                  │
│  Step 2: 이미지 내 텍스트 (~10분)                               │
│  ├─ 상품 이미지 다운로드 (6장)                                  │
│  ├─ OCR 도구 실행                                               │
│  ├─ 이미지별로 텍스트 추출                                      │
│  └─ 추출된 텍스트 정리                                          │
│                                                                  │
│  Step 3: 번역 (~10분)                                           │
│  ├─ 번역기에 텍스트 붙여넣기                                    │
│  ├─ 번역 결과 확인                                              │
│  ├─ 어색한 부분 수정                                            │
│  └─ 번역 결과 복사                                              │
│                                                                  │
│  Step 4: 등록 (~5분)                                            │
│  ├─ 글로벌 작품 등록 페이지 접속                                │
│  ├─ 번역된 내용 붙여넣기                                        │
│  └─ 저장                                                        │
│                                                                  │
│  ────────────────────────────────────────────────────────────   │
│  총 소요 시간: 30분+ / 작품                                     │
│  월 50개 작품 기준: 25시간+                                     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘

### 핵심 문제점

1. **반복적인 복사-붙여넣기** - 단순하지만 시간 소모
2. **이미지 OCR의 번거로움** - 별도 도구 필요, 정확도 이슈
3. **번역 품질 불균일** - 맥락 없는 기계 번역
4. **옵션 정보 누락** - 숨겨진 옵션 확인 어려움
```

---

### 슬라이드 B-2: 해결책 - 자동화 웹 앱

```markdown
## 슬라이드: URL 하나로 끝내는 번역 자동화

### GB Translation의 해결책

**Before: 수동 작업 30분+**
```
페이지 접속 → 텍스트 복사 → 이미지 다운로드 → OCR 실행
→ 텍스트 정리 → 번역기 실행 → 번역 결과 복사 → 등록
```

**After: 자동화 1-2분**
```
URL 입력 → [자동 처리] → 번역 결과 복사 → 등록
```

### 주요 기능

| 기능 | 설명 |
|------|------|
| 🔗 URL 기반 크롤링 | 작품 URL만 입력하면 모든 정보 자동 수집 |
| 🖼️ 이미지 OCR | 상품 이미지 내 텍스트 자동 추출 (Gemini Vision) |
| 🌐 AI 번역 | 맥락을 이해하는 자연스러운 번역 (Gemini 2.0 Flash) |
| ⚙️ 옵션 자동 추출 | 숨겨진 옵션까지 자동으로 수집 |
| ✏️ 실시간 편집 | 번역 결과 직접 수정 가능 |
| 📊 품질 검증 | 번역 품질 점수 자동 제공 (A/B/C 등급) |

### 시간 단축 효과

| 기준 | 기존 | 자동화 후 | 절감 |
|------|------|----------|------|
| 작품 1개 | 30분 | 2분 | 93% |
| 월 50개 | 25시간 | 1.7시간 | 93% |
| 연간 | 300시간 | 20시간 | **280시간 절감** |
```

---

### 슬라이드 B-3: 실제 작동 화면

```markdown
## 슬라이드: 실제 작동 과정

### 4단계 자동 처리

1️⃣ **크롤링 중** - URL에서 상품 정보 수집
   - Playwright + playwright-stealth
   - 봇 탐지 우회

2️⃣ **번역 중** - AI가 텍스트 번역
   - Google Gemini 2.0 Flash
   - 한국어 → 일본어/영어

3️⃣ **OCR 처리** - 이미지 내 텍스트 추출
   - Gemini Vision API
   - 6장 이미지 자동 분석

4️⃣ **완료** - 결과 표시
   - 원본/번역 병렬 뷰
   - 품질 점수
   - 복사/다운로드

### 결과 화면 구성

**탭 1: 상품 정보**
- 상품명 (원본 + 번역)
- 상품 설명 (원본 + 번역)
- 작가명, 가격

**탭 2: 옵션**
- 옵션 목록 (자동 추출)
- 옵션별 번역

**탭 3: 이미지**
- 상품 이미지 6장
- 전체 선택 / 다운로드

**탭 4: OCR**
- 이미지별 추출 텍스트
- 원문 + 번역 병렬 표시
```

---

### 슬라이드 B-4: 기술 스택 및 핵심 기술

```markdown
## 슬라이드: 어떻게 구현했는가

### 기술 스택

**Frontend**
- Next.js 14 (App Router)
- Tailwind CSS + Shadcn UI
- TypeScript
- 배포: Vercel

**Backend**
- Python 3.11 + FastAPI
- Playwright + playwright-stealth (크롤링)
- Google Gemini 2.0 Flash API (번역/OCR)
- 배포: Railway (Docker)

### 핵심 기술 포인트

1. **playwright-stealth**
   - 일반 Playwright는 봇으로 감지됨
   - stealth 플러그인으로 탐지 우회
   - 안정적인 크롤링 가능

2. **Gemini Vision**
   - 이미지 내 텍스트 자동 인식
   - 한글/영어/일본어 모두 지원
   - 맥락 기반 번역까지 한 번에

3. **옵션 자동 추출**
   - '옵션 선택' 버튼 자동 클릭
   - 숨겨진 옵션까지 수집
   - JavaScript 렌더링 대응

### 개발 소요 시간
- 기획: 2일
- 크롤링 구현: 3일
- 번역/OCR 연동: 2일
- UI 개발: 3일
- 배포 및 테스트: 2일
- **총 약 2주**
```

---

## 🎨 HTML 목업 코드

### 1. 메인 페이지 (URL 입력)

```html
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Idus Translator</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    * { font-family: 'Pretendard', -apple-system, sans-serif; }
    .gradient-orange { background: linear-gradient(135deg, #FF6F00 0%, #FF8F00 100%); }
  </style>
</head>
<body class="bg-gray-50 min-h-screen">
  <!-- 헤더 -->
  <header class="bg-white border-b">
    <div class="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
      <div class="flex items-center gap-2">
        <div class="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
          <span class="text-white font-bold text-sm">ID</span>
        </div>
        <span class="font-bold text-gray-800">Idus Translator</span>
      </div>
      <a href="#" class="text-sm text-gray-500 hover:text-orange-500">아이디어스 바로가기 ↗</a>
    </div>
  </header>

  <main class="max-w-4xl mx-auto px-6 py-12">
    <!-- 히어로 -->
    <div class="text-center mb-10">
      <h1 class="text-3xl font-bold text-gray-900 mb-3">
        🌐 KR 작품 번역 자동화
      </h1>
      <p class="text-gray-500">
        아이디어스 상품 URL을 입력하면 자동으로 번역해드립니다
      </p>
    </div>

    <!-- URL 입력 -->
    <div class="bg-white rounded-2xl p-8 shadow-lg border">
      <div class="mb-6">
        <label class="block text-sm font-medium text-gray-700 mb-2">
          아이디어스 상품 URL
        </label>
        <div class="flex gap-3">
          <input type="url" 
                 placeholder="https://www.idus.com/v2/product/xxxxx" 
                 class="flex-1 px-4 py-3 border rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent">
          <button class="px-6 py-3 gradient-orange text-white rounded-xl font-bold hover:opacity-90 transition">
            번역 시작
          </button>
        </div>
        <p class="text-xs text-gray-400 mt-2">
          예: https://www.idus.com/v2/product/12345678
        </p>
      </div>

      <!-- 언어 선택 -->
      <div class="flex items-center gap-4">
        <span class="text-sm text-gray-500">번역 언어:</span>
        <label class="flex items-center gap-2 cursor-pointer">
          <input type="radio" name="lang" checked class="w-4 h-4 text-orange-500">
          <span class="text-sm">🇯🇵 일본어</span>
        </label>
        <label class="flex items-center gap-2 cursor-pointer">
          <input type="radio" name="lang" class="w-4 h-4 text-orange-500">
          <span class="text-sm">🇺🇸 영어</span>
        </label>
      </div>
    </div>

    <!-- 기능 소개 -->
    <div class="grid grid-cols-4 gap-4 mt-8">
      <div class="bg-white rounded-xl p-4 text-center border">
        <div class="text-2xl mb-2">🔗</div>
        <p class="text-sm font-medium text-gray-700">URL 크롤링</p>
        <p class="text-xs text-gray-400">자동 정보 수집</p>
      </div>
      <div class="bg-white rounded-xl p-4 text-center border">
        <div class="text-2xl mb-2">🤖</div>
        <p class="text-sm font-medium text-gray-700">AI 번역</p>
        <p class="text-xs text-gray-400">Gemini 2.0</p>
      </div>
      <div class="bg-white rounded-xl p-4 text-center border">
        <div class="text-2xl mb-2">🖼️</div>
        <p class="text-sm font-medium text-gray-700">이미지 OCR</p>
        <p class="text-xs text-gray-400">텍스트 자동 추출</p>
      </div>
      <div class="bg-white rounded-xl p-4 text-center border">
        <div class="text-2xl mb-2">✏️</div>
        <p class="text-sm font-medium text-gray-700">실시간 편집</p>
        <p class="text-xs text-gray-400">직접 수정 가능</p>
      </div>
    </div>
  </main>

  <!-- 푸터 -->
  <footer class="border-t mt-12">
    <div class="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between text-sm text-gray-400">
      <span>© 2024 Idus Translator. 글로벌 비즈니스 자동화 도구.</span>
      <span>Powered by GPT-4o Vision & Playwright</span>
    </div>
  </footer>
</body>
</html>
```

---

### 2. 진행 상태 표시

```html
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>번역 진행 중</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    * { font-family: 'Pretendard', -apple-system, sans-serif; }
    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
    .animate-pulse { animation: pulse 1.5s infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .animate-spin { animation: spin 1s linear infinite; }
  </style>
</head>
<body class="bg-gray-50 min-h-screen flex items-center justify-center">
  <div class="bg-white rounded-2xl p-10 shadow-lg border max-w-xl w-full">
    <!-- 진행 단계 -->
    <div class="flex items-center justify-between mb-10">
      <!-- 크롤링 - 완료 -->
      <div class="flex flex-col items-center">
        <div class="w-14 h-14 bg-green-500 rounded-full flex items-center justify-center mb-2">
          <svg class="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
          </svg>
        </div>
        <span class="text-sm font-medium text-green-600">크롤링 중</span>
      </div>
      
      <div class="flex-1 h-0.5 bg-green-500 mx-2"></div>
      
      <!-- 번역 - 진행 중 -->
      <div class="flex flex-col items-center">
        <div class="w-14 h-14 bg-orange-500 rounded-full flex items-center justify-center mb-2 animate-pulse">
          <div class="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
        </div>
        <span class="text-sm font-medium text-orange-600">번역 중</span>
      </div>
      
      <div class="flex-1 h-0.5 bg-gray-200 mx-2"></div>
      
      <!-- OCR - 대기 -->
      <div class="flex flex-col items-center">
        <div class="w-14 h-14 bg-gray-200 rounded-full flex items-center justify-center mb-2">
          <svg class="w-7 h-7 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
          </svg>
        </div>
        <span class="text-sm text-gray-400">OCR 처리</span>
      </div>
      
      <div class="flex-1 h-0.5 bg-gray-200 mx-2"></div>
      
      <!-- 완료 - 대기 -->
      <div class="flex flex-col items-center">
        <div class="w-14 h-14 bg-gray-200 rounded-full flex items-center justify-center mb-2">
          <svg class="w-7 h-7 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
        </div>
        <span class="text-sm text-gray-400">완료</span>
      </div>
    </div>

    <!-- 현재 상태 -->
    <div class="text-center">
      <div class="flex items-center justify-center gap-2 mb-2">
        <div class="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
        <span class="text-lg font-medium text-gray-800">텍스트를 번역하고 있습니다...</span>
      </div>
      <p class="text-sm text-orange-500">
        💡 이미지가 많은 상품은 OCR 처리에 시간이 더 소요될 수 있습니다.
      </p>
    </div>
  </div>
</body>
</html>
```

---

### 3. 번역 결과 페이지 (상품 정보 탭)

```html
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>번역 결과</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    * { font-family: 'Pretendard', -apple-system, sans-serif; }
    .gradient-orange { background: linear-gradient(135deg, #FF6F00 0%, #FF8F00 100%); }
  </style>
</head>
<body class="bg-gray-50 min-h-screen">
  <!-- 헤더 -->
  <header class="bg-white border-b sticky top-0 z-50">
    <div class="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
      <div class="flex items-center gap-2">
        <div class="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
          <span class="text-white font-bold text-sm">ID</span>
        </div>
        <span class="font-bold text-gray-800">Idus Translator</span>
      </div>
      <a href="#" class="text-sm text-gray-500 hover:text-orange-500">아이디어스 바로가기 ↗</a>
    </div>
  </header>

  <main class="max-w-5xl mx-auto px-6 py-8">
    <!-- 페이지 헤더 -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">번역 결과</h1>
        <p class="text-sm text-orange-500">日本語 번역 완료 · 클릭하여 직접 수정할 수 있습니다</p>
      </div>
      <div class="flex gap-2">
        <button class="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition flex items-center gap-2">
          <span>📋</span> 전체 복사
        </button>
        <button class="px-4 py-2 border rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition flex items-center gap-2">
          <span>📋</span> 복사 옵션
        </button>
        <button class="px-4 py-2 border rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition flex items-center gap-2">
          <span>⬇️</span> 다운로드
        </button>
        <button class="px-4 py-2 border rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition flex items-center gap-2">
          <span>🔄</span> 새 번역
        </button>
      </div>
    </div>

    <!-- 품질 점수 -->
    <div class="bg-white rounded-xl p-4 border mb-6 flex items-center justify-between">
      <div class="flex items-center gap-3">
        <span class="text-2xl font-bold text-gray-800">B</span>
        <div>
          <p class="font-medium text-gray-800">번역 품질 검증 <span class="text-orange-500">80점</span></p>
          <p class="text-sm text-gray-500">확인이 필요한 문제가 있습니다.</p>
        </div>
      </div>
      <button class="text-sm text-orange-500 flex items-center gap-1">
        <span>⚠️</span> 1
      </button>
    </div>

    <!-- 탭 -->
    <div class="flex gap-2 mb-6">
      <button class="px-4 py-2 bg-white border-2 border-orange-500 text-orange-600 rounded-lg text-sm font-medium">
        상품 정보
      </button>
      <button class="px-4 py-2 bg-white border rounded-lg text-sm text-gray-600 hover:bg-gray-50">
        옵션
      </button>
      <button class="px-4 py-2 bg-white border rounded-lg text-sm text-gray-600 hover:bg-gray-50 flex items-center gap-1">
        이미지 <span class="px-1.5 py-0.5 bg-gray-100 rounded text-xs">6</span>
      </button>
      <button class="px-4 py-2 bg-white border rounded-lg text-sm text-gray-600 hover:bg-gray-50 flex items-center gap-1">
        OCR <span class="px-1.5 py-0.5 bg-orange-100 text-orange-600 rounded text-xs">6</span>
      </button>
    </div>

    <!-- 번역 결과 (병렬 뷰) -->
    <div class="grid grid-cols-2 gap-6">
      <!-- 원본 -->
      <div class="bg-white rounded-xl border overflow-hidden">
        <div class="px-4 py-3 bg-gray-50 border-b flex items-center gap-2">
          <span class="w-2 h-2 bg-blue-500 rounded-full"></span>
          <span class="font-medium text-gray-700">원본 (한국어)</span>
        </div>
        
        <div class="p-4 space-y-4">
          <div>
            <p class="text-xs text-gray-400 mb-1">상품명</p>
            <div class="p-3 bg-gray-50 rounded-lg text-gray-800">
              [쿠키런 콜라보] 자개를 품은 조선 쿠키런 노리개
            </div>
          </div>
          
          <div>
            <p class="text-xs text-gray-400 mb-1">상품 설명</p>
            <div class="p-3 bg-gray-50 rounded-lg text-gray-800 text-sm leading-relaxed">
              <p class="font-medium mb-2">1. 전통 공예 기반의 독창적 캐릭터 해석</p>
              <p class="text-gray-600 mb-3">
                천연 자개의 자연스러운 빛과 결을 활용해 쿠키런 캐릭터를 재해석한 작품으로,
                한국 전통미와 현대 IP 디자인을 조화롭게 결합했습니다.
              </p>
              <p class="font-medium mb-2">2. 천연 전북 자개만 사용한 프리미엄 소재</p>
              <p class="text-gray-600 mb-3">
                색을 인위적으로 입히지 않은 천연 전북 자개의 고유한 광택을 그대로 살려, 각 작
                품마다 서로 다른 빛깔과 결을 지닌 유일성을 갖습니다.
              </p>
              <p class="font-medium mb-2">3. 수작업 중심의 정교한 제작 방식</p>
              <p class="text-gray-600">
                자개 절삭·연마·부착까지 전 공정을 직접 검수하며 진행하여, 대량 제작이 어려
                운 높은 완성도와 섬세한 라인을 구현했습니다.
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- 번역 -->
      <div class="bg-white rounded-xl border overflow-hidden">
        <div class="px-4 py-3 bg-orange-50 border-b flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span class="w-2 h-2 bg-orange-500 rounded-full"></span>
            <span class="font-medium text-gray-700">日本語</span>
          </div>
          <div class="flex gap-1">
            <button class="p-1.5 hover:bg-orange-100 rounded text-gray-400 hover:text-gray-600">
              <span>📋</span>
            </button>
            <button class="p-1.5 hover:bg-orange-100 rounded text-gray-400 hover:text-gray-600">
              <span>✏️</span>
            </button>
          </div>
        </div>
        
        <div class="p-4 space-y-4">
          <div>
            <p class="text-xs text-gray-400 mb-1">상품명</p>
            <div class="p-3 bg-orange-50 rounded-lg text-gray-800 border border-orange-200">
              [クッキーラン コラボ] クッキーラン 螺鈿の朝鮮 ノリゲ
            </div>
          </div>
          
          <div>
            <p class="text-xs text-gray-400 mb-1">상품 설명</p>
            <div class="p-3 bg-orange-50 rounded-lg text-gray-800 text-sm leading-relaxed border border-orange-200">
              <p class="font-medium mb-2">1. **伝統工芸を基盤とした独創的なキャラクター解釈**</p>
              <p class="text-gray-600 mb-3">
                天然の螺鈿（らでん）が持つ自然な輝きと模様を活かし、クッキーラン
                のキャラクターを再解釈したハンドメイド作品です。韓国の伝統美と現代
                のIPデザインが調和しています。
              </p>
              <p class="font-medium mb-2">2. **天然アワビの螺鈿のみを使用したプレミアム素材**</p>
              <p class="text-gray-600 mb-3">
                人工的な着色を施していない天然アワビの螺鈿が持つ固有の光沢をその
                まま活かしているため、一つ一つの作品が異なる色合いと模様を持ち、唯
                一無二の存在感を放ちます。
              </p>
              <p class="font-medium mb-2">3. **手作業を中心とした精巧な制作方法**</p>
              <p class="text-gray-600">
                螺鈿の切削・研磨・接着に至る全工程を直接監修し、手作業で丁寧に仕
                上げています。これにより、大量生産では難しい高い完成度と繊細なライ
                ンを実現しました。
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 추가 정보 -->
    <div class="grid grid-cols-3 gap-4 mt-6">
      <div class="bg-white rounded-xl p-4 border">
        <p class="text-xs text-gray-400 mb-1">작가명</p>
        <p class="font-medium text-gray-800">희뮤즈</p>
      </div>
      <div class="bg-white rounded-xl p-4 border">
        <p class="text-xs text-gray-400 mb-1">가격</p>
        <p class="font-medium text-gray-800">39,800원</p>
      </div>
      <div class="bg-white rounded-xl p-4 border">
        <p class="text-xs text-gray-400 mb-1">상세 이미지</p>
        <p class="font-medium text-gray-800">6개</p>
      </div>
    </div>
  </main>
</body>
</html>
```

---

### 4. OCR 결과 페이지

```html
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>OCR 결과</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    * { font-family: 'Pretendard', -apple-system, sans-serif; }
  </style>
</head>
<body class="bg-gray-50 min-h-screen">
  <main class="max-w-5xl mx-auto px-6 py-8">
    <!-- 탭 (OCR 선택됨) -->
    <div class="flex gap-2 mb-6">
      <button class="px-4 py-2 bg-white border rounded-lg text-sm text-gray-600">
        상품 정보
      </button>
      <button class="px-4 py-2 bg-white border rounded-lg text-sm text-gray-600">
        옵션
      </button>
      <button class="px-4 py-2 bg-white border rounded-lg text-sm text-gray-600 flex items-center gap-1">
        이미지 <span class="px-1.5 py-0.5 bg-gray-100 rounded text-xs">6</span>
      </button>
      <button class="px-4 py-2 bg-white border-2 border-orange-500 rounded-lg text-sm text-orange-600 font-medium flex items-center gap-1">
        OCR <span class="px-1.5 py-0.5 bg-orange-100 text-orange-600 rounded text-xs">6</span>
      </button>
    </div>

    <!-- OCR 정보 -->
    <div class="flex items-center justify-between mb-4">
      <p class="text-sm text-orange-500">전체 이미지: 6개 | OCR 추출: 6개</p>
      <span class="text-sm text-gray-400">1 / 6</span>
    </div>

    <!-- 이미지 썸네일 -->
    <div class="flex gap-2 mb-6 overflow-x-auto pb-2">
      <div class="w-20 h-20 rounded-lg overflow-hidden border-2 border-orange-500 flex-shrink-0 relative">
        <div class="absolute inset-0 bg-gray-200"></div>
        <div class="absolute bottom-1 left-1 px-1.5 py-0.5 bg-orange-500 text-white text-xs rounded">OCR 1</div>
      </div>
      <div class="w-20 h-20 rounded-lg overflow-hidden border flex-shrink-0 relative">
        <div class="absolute inset-0 bg-gray-200"></div>
        <div class="absolute bottom-1 left-1 px-1.5 py-0.5 bg-orange-500 text-white text-xs rounded">OCR 2</div>
      </div>
      <div class="w-20 h-20 rounded-lg overflow-hidden border flex-shrink-0 relative">
        <div class="absolute inset-0 bg-gray-200"></div>
        <div class="absolute bottom-1 left-1 px-1.5 py-0.5 bg-orange-500 text-white text-xs rounded">OCR 3</div>
      </div>
      <div class="w-20 h-20 rounded-lg overflow-hidden border flex-shrink-0 relative">
        <div class="absolute inset-0 bg-gray-200"></div>
        <div class="absolute bottom-1 left-1 px-1.5 py-0.5 bg-orange-500 text-white text-xs rounded">OCR 4</div>
      </div>
      <div class="w-20 h-20 rounded-lg overflow-hidden border flex-shrink-0 relative">
        <div class="absolute inset-0 bg-gray-200"></div>
        <div class="absolute bottom-1 left-1 px-1.5 py-0.5 bg-orange-500 text-white text-xs rounded">OCR 5</div>
      </div>
      <div class="w-20 h-20 rounded-lg overflow-hidden border flex-shrink-0 relative">
        <div class="absolute inset-0 bg-gray-200"></div>
        <div class="absolute bottom-1 left-1 px-1.5 py-0.5 bg-orange-500 text-white text-xs rounded">OCR 6</div>
      </div>
    </div>

    <!-- OCR 결과 -->
    <div class="grid grid-cols-2 gap-6">
      <!-- 이미지 -->
      <div class="bg-white rounded-xl border overflow-hidden">
        <div class="px-4 py-3 bg-gray-50 border-b flex items-center justify-between">
          <span class="font-medium text-gray-700">이미지 1</span>
          <div class="flex gap-2">
            <button class="p-1.5 hover:bg-gray-100 rounded">←</button>
            <button class="p-1.5 hover:bg-gray-100 rounded">→</button>
          </div>
        </div>
        <div class="p-4">
          <div class="aspect-square bg-gradient-to-br from-orange-100 to-orange-50 rounded-lg flex items-center justify-center relative">
            <!-- 이미지 내용 시뮬레이션 -->
            <div class="text-center p-6">
              <div class="flex items-center justify-center gap-2 mb-3">
                <span class="text-2xl font-bold text-orange-600">idus</span>
                <span class="text-lg">×</span>
                <span class="text-xl font-bold text-blue-600">CookieRun</span>
              </div>
              <p class="text-sm text-gray-600 mb-4">
                idus 작가님이 데브시스터즈와 함께<br/>
                직접 기획하고 만든 <strong>쿠키런 공식 콜라보 작품</strong>이에요.
              </p>
              <div class="bg-white/80 rounded-lg p-3 text-xs text-gray-500">
                한국의 전통 요소가 담긴 쿠키런 전통 콜라보<br/>
                오직 idus에서 만나보세요!
              </div>
            </div>
            <div class="absolute top-2 left-2 px-2 py-1 bg-orange-500 text-white text-xs rounded font-bold">
              OCR #1
            </div>
          </div>
        </div>
      </div>

      <!-- OCR 텍스트 + 번역 -->
      <div class="bg-white rounded-xl border overflow-hidden">
        <div class="px-4 py-3 bg-gray-50 border-b flex items-center justify-between">
          <span class="font-medium text-gray-700">원문 (한국어)</span>
          <button class="text-sm text-gray-400 hover:text-gray-600 flex items-center gap-1">
            <span>📋</span> 복사
          </button>
        </div>
        <div class="p-4">
          <div class="p-3 bg-orange-50 rounded-lg text-sm text-gray-800 leading-relaxed border border-orange-200">
            idus 작가님이 데브시스터즈와 함께 직접 기획하고 만든 쿠키런 공식 콜라보 작품이에요.
            쿠키런 전승 콜라보 idus에서 만나보세요! 한국의 전통 요소가 담긴 쿠키런 전통 콜라보
            오직 idus에서 만나보세요!
          </div>
        </div>
        
        <div class="px-4 py-3 bg-orange-50 border-t border-orange-200 flex items-center justify-between">
          <span class="font-medium text-gray-700">번역</span>
          <div class="flex gap-1">
            <button class="text-sm text-gray-400 hover:text-gray-600 flex items-center gap-1">
              <span>✏️</span> 편집
            </button>
            <button class="text-sm text-gray-400 hover:text-gray-600 flex items-center gap-1">
              <span>📋</span> 복사
            </button>
          </div>
        </div>
        <div class="p-4 bg-orange-50/50">
          <div class="p-3 bg-white rounded-lg text-sm text-gray-800 leading-relaxed border">
            アイディアスの作家がデブシスターズと共同で、直接企画・制作したクッキーラン公式コラボのハンドメイド作品です。クッキーラン伝承コラボはアイディアスでぜひご覧ください！韓国の伝統要素が詰まったクッキーラン伝統コラボは、アイディアス限定でお求めいただけます！もし作品の制作時間や詳細について知りたい場合は、アイディアス(idus)アプリのメッセージ機能を通じてご連絡ください。
          </div>
        </div>
      </div>
    </div>

    <!-- OCR 결과 요약 -->
    <div class="mt-6 bg-white rounded-xl border">
      <div class="px-4 py-3 border-b">
        <span class="font-medium text-gray-700">OCR 결과 요약 (6개)</span>
      </div>
      <div class="divide-y">
        <div class="p-4 flex items-start justify-between hover:bg-gray-50">
          <div class="flex-1">
            <div class="flex items-center gap-2 mb-1">
              <span class="px-2 py-0.5 bg-orange-100 text-orange-600 rounded text-xs font-medium">1</span>
              <p class="text-sm text-gray-600 truncate">idus 작가님이 데브시스터즈와 함께 직접 기획하고 만든 쿠키런 공식 콜라보 작품이에요...</p>
            </div>
            <p class="text-sm text-gray-400 truncate ml-7">アイディアスの作家がデブシスターズと共同で、直接企画・制作したクッキーラン公式コラボのハンドメイド作...</p>
          </div>
          <button class="p-1.5 hover:bg-gray-100 rounded text-gray-400">
            <span>📋</span>
          </button>
        </div>
        <div class="p-4 flex items-start justify-between hover:bg-gray-50">
          <div class="flex-1">
            <div class="flex items-center gap-2 mb-1">
              <span class="px-2 py-0.5 bg-orange-100 text-orange-600 rounded text-xs font-medium">2</span>
              <p class="text-sm text-gray-600 truncate">희뮤즈 복(福)과 기쁨을 전하는 전통 공예 브랜드, 희뮤즈 [쿠키런 콜라보] 자개를 품은 ...</p>
            </div>
            <p class="text-sm text-gray-400 truncate ml-7">[作家紹介] [ヒミューズについて] 福と喜びを伝える伝統工芸ブランド、ヒミューズ [クッキーラン...</p>
          </div>
          <button class="p-1.5 hover:bg-gray-100 rounded text-gray-400">
            <span>📋</span>
          </button>
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
# 작품 번역 자동화 (GB Translation) 슬라이드 생성 요청

## 프로젝트 개요
- 프로젝트명: Idus 작품 번역 자동화
- GitHub: https://github.com/pos01204/GB-translation
- 배포: gb-translation.vercel.app
- 기술: Next.js 14, FastAPI, Playwright, Google Gemini 2.0 Flash

## 슬라이드 목적
기존 KR 작품 번역 업무의 번거로움을 보여주고,
URL 입력만으로 크롤링 + 번역 + OCR까지 자동화한 웹 앱 소개

## 디자인 스타일
- 메인 컬러: #FF6F00 (idus Orange)
- 배경: 밝은 톤
- 폰트: Pretendard
- 아이콘: 이모지

## 슬라이드 구성 (4장)

### 슬라이드 B-1: 기존 번역 업무의 Pain Point

제목: "KR 작품 번역, 얼마나 번거로웠는가"

기존 워크플로우 다이어그램:
```
페이지 접속 → 텍스트 복사 (5분)
           → 이미지 다운로드 (2분)
           → OCR 도구 실행 (5분)
           → 텍스트 정리 (3분)
           → 번역기 실행 (5분)
           → 번역 결과 복사 (5분)
           → 등록 (5분)
           ─────────────────
           총 30분+ / 작품
```

핵심 문제:
1. 반복적인 복사-붙여넣기
2. 이미지 OCR의 번거로움 (별도 도구 필요)
3. 맥락 없는 기계 번역
4. 숨겨진 옵션 확인 어려움

### 슬라이드 B-2: 해결책 - 자동화 웹 앱

제목: "URL 하나로 끝내는 번역 자동화"

Before/After 비교:
- Before: 수동 작업 30분+
- After: URL 입력 → 자동 처리 → 1-2분

주요 기능 4개:
1. 🔗 URL 기반 크롤링 - 모든 정보 자동 수집
2. 🤖 AI 번역 - Gemini 2.0 Flash
3. 🖼️ 이미지 OCR - 텍스트 자동 추출
4. ✏️ 실시간 편집 - 직접 수정 가능

시간 단축 테이블:
| 기준 | 기존 | 자동화 | 절감 |
| 작품 1개 | 30분 | 2분 | 93% |
| 월 50개 | 25시간 | 1.7시간 | 93% |

### 슬라이드 B-3: 실제 작동 과정

제목: "4단계 자동 처리"

진행 상태 다이어그램:
크롤링 중 ✅ → 번역 중 🔄 → OCR 처리 ⏳ → 완료 ⏳

각 단계 설명:
1. 크롤링: Playwright로 정보 수집
2. 번역: Gemini AI 번역
3. OCR: 이미지 텍스트 추출
4. 완료: 결과 표시 + 품질 점수

결과 화면 구성:
- 탭 1: 상품 정보 (원본 + 번역 병렬)
- 탭 2: 옵션 (자동 추출)
- 탭 3: 이미지 (6장)
- 탭 4: OCR (추출 텍스트 + 번역)

### 슬라이드 B-4: 핵심 기술 & 개발 소요

제목: "어떻게 구현했는가"

기술 스택:
- Frontend: Next.js 14, Tailwind CSS
- Backend: Python FastAPI, Playwright
- AI: Google Gemini 2.0 Flash (번역 + OCR)
- 배포: Vercel + Railway

핵심 기술:
1. playwright-stealth: 봇 탐지 우회
2. Gemini Vision: 이미지 OCR + 번역 동시 처리
3. 옵션 자동 클릭: 숨겨진 옵션 수집

개발 소요: 약 2주 (업무 병행)

## HTML 목업 렌더링 요청
- GB_TRANSLATION_SLIDES.md 파일의 HTML 목업 코드를 실제 UI로 렌더링
- 4개 페이지 (메인, 진행 상태, 번역 결과, OCR 결과)

## 특별 요청사항
1. 기존 수동 작업의 번거로움 강조 (시간, 단계)
2. 4단계 자동화 프로세스 시각화
3. Before/After 시간 비교 명확하게
4. 실제 화면 목업으로 결과물 시연
5. 약 2주 개발 소요 시간 강조
```

---

## ✅ 체크리스트

### 추가할 슬라이드
- [ ] 슬라이드 B-1: 기존 번역 업무의 Pain Point
- [ ] 슬라이드 B-2: 해결책 - 자동화 웹 앱
- [ ] 슬라이드 B-3: 실제 작동 과정 (4단계)
- [ ] 슬라이드 B-4: 핵심 기술 & 개발 소요

### HTML 목업
- [ ] 메인 페이지 (URL 입력)
- [ ] 진행 상태 표시 (4단계)
- [ ] 번역 결과 (상품 정보 탭)
- [ ] OCR 결과 (이미지 + 텍스트 병렬)

### 핵심 메시지
- [ ] 기존 수동 작업의 번거로움 (30분+ / 작품)
- [ ] URL 입력만으로 자동화 (1-2분 / 작품)
- [ ] 이미지 OCR까지 자동 처리
- [ ] 품질 검증 점수 자동 제공
- [ ] 2주 만에 구현 가능 (AI 코딩 도구)

---

*이 문서는 작품 번역 자동화 프로젝트를 발표 슬라이드에 추가하기 위한 가이드입니다.*
