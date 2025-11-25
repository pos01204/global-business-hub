# 퍼포먼스 마케터 기능 설계 문서

## 📋 개요

idus 플랫폼에서 소재를 자동으로 발견하고, 이를 기반으로 owned media 콘텐츠를 생성하는 퍼포먼스 마케터 기능을 설계합니다.

## 🎯 목표

1. **소재 발견**: idus 플랫폼에서 트렌드성 있는 작품/작가를 자동으로 탐색
2. **콘텐츠 생성**: 발견한 소재를 기반으로 owned media 콘텐츠 자동 생성
3. **최적화**: SEO, 타겟 오디언스, 플랫폼별 최적화된 콘텐츠 생성
4. **배포 관리**: 생성된 콘텐츠의 배포 일정 및 성과 추적

---

## 🏗️ 시스템 아키텍처

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (Next.js)                    │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Performance Marketer Dashboard                  │   │
│  │  - 소재 탐색 UI                                  │   │
│  │  - 콘텐츠 생성 워크플로우                        │   │
│  │  - 콘텐츠 미리보기 및 편집                       │   │
│  │  - 배포 일정 관리                                │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
                          ↕ HTTP API
┌─────────────────────────────────────────────────────────┐
│              Backend (Express + TypeScript)              │
│  ┌──────────────────┐  ┌──────────────────┐           │
│  │  소재 탐색 서비스 │  │  콘텐츠 생성 서비스│          │
│  │  - idus 크롤링   │  │  - AI 콘텐츠 생성 │          │
│  │  - 트렌드 분석   │  │  - SEO 최적화     │          │
│  │  - 작품/작가 분석│  │  - 다국어 지원    │          │
│  └──────────────────┘  └──────────────────┘           │
│  ┌──────────────────┐  ┌──────────────────┐           │
│  │  Ollama 서비스   │  │  Google Sheets   │           │
│  │  - LLM 기반 생성 │  │  - 콘텐츠 저장   │           │
│  │  - 프롬프트 최적화│  │  - 성과 추적     │           │
│  └──────────────────┘  └──────────────────┘           │
└─────────────────────────────────────────────────────────┘
                          ↕
┌─────────────────────────────────────────────────────────┐
│                    External Services                     │
│  - idus (크롤링 대상)                                    │
│  - Gemini API (선택적, 고품질 콘텐츠용)                  │
└─────────────────────────────────────────────────────────┘
```

---

## 📦 핵심 기능 모듈

### 1. 소재 탐색 모듈 (Content Discovery)

#### 1.1 작품 탐색
- **트렌드 기반 탐색**: 인기 작품, 신규 작품, 리뷰 많은 작품
- **카테고리별 탐색**: 핸드메이드, 아트, 라이프스타일 등
- **작가 기반 탐색**: 인기 작가, 신규 작가, 팔로워 많은 작가
- **키워드 기반 탐색**: 특정 키워드로 작품 검색

#### 1.2 소재 분석
- **작품 정보 추출**: 제목, 설명, 가격, 카테고리, 이미지
- **작가 정보 추출**: 이름, 팔로워 수, 작품 수, 평점
- **트렌드 분석**: 관련 키워드, 유사 작품, 시장 반응
- **타겟 오디언스 분석**: 예상 구매자 프로필, 관심사

### 2. 콘텐츠 생성 모듈 (Content Generation)

#### 2.1 콘텐츠 타입
- **블로그 포스트**: SEO 최적화된 장문 콘텐츠
- **소셜 미디어 포스트**: 인스타그램, 페이스북, X(트위터)
- **이메일 뉴스레터**: 작가 소개, 작품 하이라이트
- **프레스 릴리스**: 신규 작가/작품 발표

#### 2.2 생성 전략
- **SEO 최적화**: 키워드 밀도, 메타 설명, 헤딩 구조
- **플랫폼별 최적화**: 각 플랫폼의 특성에 맞는 형식
- **다국어 지원**: 한국어, 영어, 일본어
- **톤앤매너**: 브랜드 가이드라인에 맞는 톤 조절

### 3. 콘텐츠 관리 모듈 (Content Management)

#### 3.1 콘텐츠 저장소
- **Google Sheets 연동**: 콘텐츠 메타데이터 저장
- **로컬 저장소**: 생성된 콘텐츠 파일 저장
- **버전 관리**: 콘텐츠 수정 이력 추적

#### 3.2 배포 관리
- **배포 일정**: 캘린더 기반 배포 계획
- **플랫폼별 배포**: 각 플랫폼에 맞는 배포 설정
- **자동화**: 스케줄링된 자동 배포 (선택적)

### 4. 성과 추적 모듈 (Performance Tracking)

#### 4.1 지표 수집
- **조회수**: 콘텐츠 조회 수
- **참여도**: 좋아요, 댓글, 공유
- **전환율**: 작품 페이지 방문, 구매 전환
- **SEO 성과**: 검색 순위, 유입 키워드

#### 4.2 리포트 생성
- **주간/월간 리포트**: 성과 요약
- **콘텐츠별 분석**: 개별 콘텐츠 성과 분석
- **트렌드 분석**: 인기 콘텐츠 패턴 분석

---

## 🗂️ 데이터 구조

### Content Discovery Result
```typescript
interface DiscoveryResult {
  id: string;
  type: 'product' | 'artist' | 'trend';
  source: {
    platform: 'idus';
    url: string;
    scrapedAt: string;
  };
  metadata: {
    title: string;
    description: string;
    images: string[];
    category: string;
    tags: string[];
    price?: number;
    artist?: {
      name: string;
      followers: number;
      productsCount: number;
    };
  };
  analysis: {
    trendScore: number; // 0-100
    targetAudience: string[];
    keywords: string[];
    similarProducts: string[];
  };
  createdAt: string;
}
```

### Content Draft
```typescript
interface ContentDraft {
  id: string;
  discoveryId: string; // DiscoveryResult와 연결
  type: 'blog' | 'social' | 'email' | 'press';
  platform: 'blog' | 'instagram' | 'facebook' | 'twitter' | 'email';
  language: 'korean' | 'english' | 'japanese';
  title: string;
  content: string;
  metadata: {
    seoKeywords: string[];
    hashtags: string[];
    images: string[];
    callToAction: string;
  };
  status: 'draft' | 'review' | 'approved' | 'published';
  version: number;
  createdAt: string;
  updatedAt: string;
}
```

### Content Campaign
```typescript
interface ContentCampaign {
  id: string;
  name: string;
  discoveryResults: string[]; // DiscoveryResult IDs
  contentDrafts: string[]; // ContentDraft IDs
  schedule: {
    publishDate: string;
    platforms: string[];
    timezone: string;
  };
  status: 'planning' | 'draft' | 'scheduled' | 'published' | 'completed';
  performance?: {
    views: number;
    engagement: number;
    conversions: number;
  };
  createdAt: string;
  updatedAt: string;
}
```

---

## 🔌 API 엔드포인트 설계

### 소재 탐색 API
```
GET  /api/marketer/discovery/search
POST /api/marketer/discovery/analyze
GET  /api/marketer/discovery/trends
GET  /api/marketer/discovery/:id
```

### 콘텐츠 생성 API
```
POST /api/marketer/content/generate
GET  /api/marketer/content/:id
PUT  /api/marketer/content/:id
DELETE /api/marketer/content/:id
POST /api/marketer/content/:id/optimize
```

### 캠페인 관리 API
```
GET    /api/marketer/campaigns
POST   /api/marketer/campaigns
GET    /api/marketer/campaigns/:id
PUT    /api/marketer/campaigns/:id
DELETE /api/marketer/campaigns/:id
POST   /api/marketer/campaigns/:id/publish
```

### 성과 추적 API
```
GET /api/marketer/performance/:contentId
GET /api/marketer/performance/report
GET /api/marketer/performance/trends
```

---

## 🎨 UI/UX 설계

### 메인 대시보드
- **소재 탐색 섹션**: 검색, 필터, 트렌드 차트
- **콘텐츠 생성 워크플로우**: 단계별 가이드
- **캠페인 캘린더**: 배포 일정 시각화
- **성과 대시보드**: 주요 지표 카드

### 소재 탐색 페이지
- **검색 바**: 키워드, 카테고리, 작가명 검색
- **필터 패널**: 가격대, 인기도, 날짜 범위
- **결과 그리드**: 작품/작가 카드 뷰
- **상세 패널**: 선택한 소재의 상세 정보 및 분석

### 콘텐츠 생성 페이지
- **소재 선택**: 탐색한 소재 중 선택
- **콘텐츠 타입 선택**: 블로그, 소셜, 이메일 등
- **생성 옵션**: 언어, 톤, 플랫폼 설정
- **미리보기**: 생성된 콘텐츠 실시간 미리보기
- **편집 도구**: 텍스트 편집, 이미지 추가

### 캠페인 관리 페이지
- **캠페인 목록**: 테이블 또는 카드 뷰
- **캠페인 생성**: 마법사 형식 워크플로우
- **일정 관리**: 드래그 앤 드롭 캘린더
- **성과 모니터링**: 실시간 지표 업데이트

---

## 🤖 AI/LLM 통합

### Ollama 기반 콘텐츠 생성
- **모델**: Llama 3 또는 Mistral
- **프롬프트 엔지니어링**: 
  - 소재 정보를 구조화된 프롬프트로 변환
  - SEO 키워드 자동 추출 및 삽입
  - 플랫폼별 형식 가이드라인 적용
- **스트리밍 응답**: 실시간 생성 과정 표시

### Gemini API 통합 (선택적)
- **고품질 콘텐츠**: 프리미엄 콘텐츠용
- **이미지 분석**: 작품 이미지 기반 설명 생성
- **다국어 번역**: 자연스러운 현지화

---

## 📊 Google Sheets 연동

### 시트 구조
1. **소재 탐색 결과** (`discovery_results`)
   - id, type, url, metadata, analysis, createdAt

2. **콘텐츠 초안** (`content_drafts`)
   - id, discoveryId, type, platform, language, content, status

3. **캠페인** (`campaigns`)
   - id, name, contentIds, schedule, status, performance

4. **성과 데이터** (`performance_metrics`)
   - contentId, date, views, engagement, conversions

---

## 🔄 워크플로우

### 1. 소재 탐색 워크플로우
```
사용자 입력 (키워드/카테고리)
    ↓
idus 크롤링 실행
    ↓
소재 정보 추출
    ↓
트렌드 분석 (LLM)
    ↓
결과 저장 및 표시
```

### 2. 콘텐츠 생성 워크플로우
```
소재 선택
    ↓
콘텐츠 타입 및 옵션 설정
    ↓
LLM 기반 콘텐츠 생성
    ↓
SEO 최적화 (키워드 삽입)
    ↓
미리보기 및 편집
    ↓
초안 저장
```

### 3. 캠페인 배포 워크플로우
```
콘텐츠 초안 선택
    ↓
배포 일정 설정
    ↓
플랫폼별 최적화
    ↓
승인 프로세스 (선택적)
    ↓
배포 실행
    ↓
성과 추적 시작
```

---

## 🚀 구현 단계

### Phase 1: 기본 구조 (1-2주)
- [ ] 백엔드 API 라우트 생성
- [ ] 프론트엔드 페이지 구조 생성
- [ ] 기본 UI 컴포넌트 개발
- [ ] Google Sheets 연동 설정

### Phase 2: 소재 탐색 (2-3주)
- [ ] idus 크롤링 서비스 개발
- [ ] 소재 분석 로직 구현
- [ ] 트렌드 분석 기능
- [ ] 소재 탐색 UI 개발

### Phase 3: 콘텐츠 생성 (2-3주)
- [ ] Ollama 연동 및 프롬프트 엔지니어링
- [ ] 콘텐츠 생성 서비스 개발
- [ ] SEO 최적화 로직
- [ ] 콘텐츠 편집 UI 개발

### Phase 4: 캠페인 관리 (1-2주)
- [ ] 캠페인 CRUD API
- [ ] 일정 관리 기능
- [ ] 배포 자동화 (선택적)
- [ ] 캠페인 관리 UI 개발

### Phase 5: 성과 추적 (1-2주)
- [ ] 성과 데이터 수집 API
- [ ] 리포트 생성 기능
- [ ] 대시보드 차트 통합
- [ ] 성과 분석 UI 개발

---

## 🔐 보안 및 제한사항

### 보안
- **API Rate Limiting**: 외부 API 호출 제한
- **크롤링 제한**: idus robots.txt 준수
- **데이터 암호화**: 민감 정보 암호화 저장

### 제한사항
- **크롤링 주기**: 서버 부하 고려한 제한
- **콘텐츠 생성 속도**: LLM 응답 시간 고려
- **저장 용량**: 이미지 및 콘텐츠 저장 용량 관리

---

## 📝 참고사항

### idus 크롤링 고려사항
- **공개 정보만 수집**: 로그인 필요 정보 제외
- **저작권 준수**: 작가 동의 없는 상업적 사용 금지
- **개인정보 보호**: 개인정보 수집 최소화

### 콘텐츠 품질 관리
- **인간 검토**: AI 생성 콘텐츠는 반드시 검토
- **브랜드 가이드라인**: 일관된 톤앤매너 유지
- **법적 준수**: 광고법, 소비자보호법 준수

---

## 🎯 성공 지표

1. **소재 발견 효율성**: 시간당 발견 소재 수
2. **콘텐츠 생성 속도**: 소재 선택부터 초안 완성까지 시간
3. **콘텐츠 품질**: 검토 통과율, 사용자 만족도
4. **성과 개선**: 생성된 콘텐츠의 평균 조회수, 전환율

---

## 📚 다음 단계

1. **기술 검증**: idus 크롤링 가능성 테스트
2. **프로토타입 개발**: 핵심 기능 MVP 개발
3. **사용자 테스트**: 내부 사용자 피드백 수집
4. **반복 개선**: 피드백 기반 기능 개선

