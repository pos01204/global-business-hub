# 퍼포먼스 마케터 기능 구현 계획

## 📋 구현 우선순위

### 우선순위 1: 핵심 기능 (MVP)
1. 소재 탐색 기본 기능
2. 콘텐츠 생성 기본 기능
3. 콘텐츠 저장 및 관리

### 우선순위 2: 고급 기능
1. 트렌드 분석
2. SEO 최적화
3. 다국어 지원

### 우선순위 3: 자동화 및 최적화
1. 자동 배포
2. 성과 추적
3. 리포트 생성

---

## 🗂️ 파일 구조

### Backend 구조
```
backend/src/
├── routes/
│   └── marketer/
│       ├── discovery.ts      # 소재 탐색 API
│       ├── content.ts        # 콘텐츠 생성 API
│       ├── campaign.ts       # 캠페인 관리 API
│       └── performance.ts    # 성과 추적 API
├── services/
│   ├── idusCrawler.ts        # idus 크롤링 서비스
│   ├── contentGenerator.ts   # 콘텐츠 생성 서비스
│   ├── seoOptimizer.ts       # SEO 최적화 서비스
│   └── trendAnalyzer.ts      # 트렌드 분석 서비스
├── agents/
│   └── marketerAgent.ts      # 퍼포먼스 마케터 Agent
└── types/
    └── marketer.ts           # 타입 정의
```

### Frontend 구조
```
frontend/app/
├── marketer/
│   ├── page.tsx              # 메인 대시보드
│   ├── discovery/
│   │   └── page.tsx          # 소재 탐색 페이지
│   ├── content/
│   │   ├── page.tsx          # 콘텐츠 생성 페이지
│   │   └── [id]/
│   │       └── page.tsx      # 콘텐츠 상세/편집
│   ├── campaigns/
│   │   ├── page.tsx          # 캠페인 목록
│   │   └── [id]/
│   │       └── page.tsx      # 캠페인 상세
│   └── performance/
│       └── page.tsx          # 성과 분석 페이지
└── components/
    └── marketer/
        ├── DiscoveryPanel.tsx
        ├── ContentEditor.tsx
        ├── CampaignCalendar.tsx
        └── PerformanceChart.tsx
```

---

## 🔧 기술 스택 추가

### 필요한 패키지

#### Backend
```json
{
  "dependencies": {
    "puppeteer": "^21.0.0",           // 웹 크롤링
    "cheerio": "^1.0.0",              // HTML 파싱
    "axios": "^1.6.0",                // HTTP 요청
    "date-fns": "^3.0.0",             // 날짜 처리
    "natural": "^6.0.0"               // 자연어 처리 (키워드 추출)
  }
}
```

#### Frontend
```json
{
  "dependencies": {
    "react-markdown": "^9.0.0",       // 마크다운 렌더링
    "react-calendar": "^4.0.0",       // 캘린더 컴포넌트
    "react-quill": "^2.0.0",          // 리치 텍스트 에디터
    "html-to-image": "^1.0.0"         // 이미지 생성
  }
}
```

---

## 📝 주요 타입 정의

```typescript
// backend/src/types/marketer.ts

export interface IdusProduct {
  id: string;
  url: string;
  title: string;
  description: string;
  price: number;
  images: string[];
  category: string;
  tags: string[];
  artist: {
    name: string;
    url: string;
    followers: number;
    productsCount: number;
  };
  stats: {
    views: number;
    likes: number;
    reviews: number;
  };
}

export interface DiscoveryQuery {
  keyword?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: 'popular' | 'new' | 'price';
  limit?: number;
}

export interface ContentGenerationRequest {
  discoveryId: string;
  contentType: 'blog' | 'social' | 'email' | 'press';
  platform: 'blog' | 'instagram' | 'facebook' | 'twitter' | 'email';
  language: 'korean' | 'english' | 'japanese';
  tone?: string;
  includeSeo?: boolean;
  targetAudience?: string[];
}

export interface GeneratedContent {
  id: string;
  title: string;
  content: string;
  metadata: {
    seoKeywords: string[];
    hashtags: string[];
    images: string[];
    callToAction: string;
  };
  seoScore?: number;
  readabilityScore?: number;
}
```

---

## 🚀 시작하기

### 1단계: 기본 구조 생성
```bash
# Backend 라우트 생성
mkdir -p backend/src/routes/marketer
touch backend/src/routes/marketer/discovery.ts
touch backend/src/routes/marketer/content.ts

# Frontend 페이지 생성
mkdir -p frontend/app/marketer/{discovery,content,campaigns,performance}
touch frontend/app/marketer/page.tsx
```

### 2단계: 의존성 설치
```bash
cd backend
npm install puppeteer cheerio natural

cd ../frontend
npm install react-markdown react-calendar react-quill
```

### 3단계: 기본 API 구현
- 소재 탐색 API 엔드포인트
- 콘텐츠 생성 API 엔드포인트
- 기본 UI 컴포넌트

---

## 📌 다음 작업

1. **소재 탐색 기능 구현**
   - idus 크롤링 로직 개발
   - 소재 분석 및 저장

2. **콘텐츠 생성 기능 구현**
   - Ollama 연동
   - 프롬프트 엔지니어링
   - 콘텐츠 편집 UI

3. **통합 및 테스트**
   - 전체 워크플로우 테스트
   - 성능 최적화
   - 사용자 피드백 수집

