# 퍼포먼스 마케터: 이미지 기반 소재 생성 기획서

## 🎯 핵심 가치 제안

**"이미지만으로 작품의 마케팅 소재를 자동 생성하는 AI 기반 워크플로우"**

작품 이미지를 업로드하면 AI가 이미지를 분석하고, 마케터 관점에서 소비자가 관심을 가질 만한 카피를 자동으로 생성합니다.

---

## 📋 현재 문제점 재진단

### 1. 크롤링 의존성 문제
- idus robot.txt 제한으로 크롤링 실패
- URL 기반 접근의 한계

### 2. **핵심 문제: 이미지 분석 및 카피라이팅 부재**
- 작품의 **시각적 특성**을 파악하지 못함
- **감성적 스토리텔링**이 어려움
- 소비자 관점의 **마케팅 카피** 생성 불가
- Google Sheets logistics는 주문/물류 데이터만 있어 마케팅 정보 부족

### 3. 데이터 소스의 한계
- Google Sheets logistics: 주문번호, 가격, 수량 등 **거래 데이터**만 존재
- 작품의 **시각적 특징**, **감성적 가치**, **스토리** 등 마케팅에 필요한 정보 부재

---

## 🚀 핵심 솔루션: 이미지 기반 AI 소재 생성

### Phase 1: 이미지 업로드 → AI 분석 → 소재 자동 생성

#### 1.1 이미지 분석 (OpenAI Vision API 활용)

**기능:**
- 작품 이미지 업로드 (드래그 앤 드롭 또는 파일 선택)
- OpenAI GPT-4 Vision으로 이미지 분석
- 다음 정보 자동 추출:
  - **시각적 특징**: 색상, 재료, 디자인 스타일, 크기 추정
  - **감성적 요소**: 분위기, 감성 키워드, 사용 시나리오
  - **타겟 오디언스**: 누가 관심을 가질지 추정
  - **마케팅 포인트**: 강조할 만한 특징

**기술 스택:**
- OpenAI GPT-4 Vision (gpt-4o 또는 gpt-4o-mini with vision)
- 이미지 업로드: multipart/form-data
- 이미지 저장: Google Sheets 또는 로컬 스토리지

#### 1.2 마케팅 카피 자동 생성

**프롬프트 전략:**
```
당신은 핸드메이드 작품을 마케팅하는 전문 카피라이터입니다.

다음은 작품 이미지 분석 결과입니다:
- 시각적 특징: [AI 분석 결과]
- 감성 키워드: [AI 분석 결과]
- 추정 타겟: [AI 분석 결과]

이 정보를 바탕으로:
1. 소비자가 관심을 가질 만한 **감성적 카피** 작성
2. 작품의 **독특한 스토리** 창조
3. **구매 동기**를 자극하는 문구 생성
4. 플랫폼별 최적화된 **해시태그** 제안
```

**생성되는 정보:**
- **제목**: 작품의 핵심을 담은 매력적인 제목
- **설명**: 감성적이고 설득력 있는 작품 설명
- **마케팅 카피**: 소비자 관심을 끄는 핵심 문구들
- **감성 키워드**: 작품의 분위기와 느낌
- **타겟 오디언스**: 누구에게 어필할지
- **사용 시나리오**: 언제, 어디서, 어떻게 사용할지
- **해시태그**: 플랫폼별 최적화된 태그

---

## 📐 상세 워크플로우

### 워크플로우 1: 이미지 업로드 → 자동 소재 생성

```
1. 사용자가 작품 이미지 업로드
   ↓
2. AI 이미지 분석 (OpenAI Vision)
   - 시각적 특징 추출
   - 감성적 요소 파악
   - 타겟 오디언스 추정
   ↓
3. AI 마케팅 카피 생성
   - 제목, 설명, 카피 자동 생성
   - 해시태그 제안
   ↓
4. 소재 미리보기 및 수정
   - 사용자가 생성된 소재 검토
   - 필요시 수정/보완
   ↓
5. 소재 저장
   - 소재 라이브러리에 저장
   - Google Sheets에 마케팅 정보 저장
```

### 워크플로우 2: 소재 선택 → 콘텐츠 생성

```
1. 소재 라이브러리에서 소재 선택
   ↓
2. 콘텐츠 타입 선택 (인스타그램, 블로그 등)
   ↓
3. AI가 소재 정보를 바탕으로 플랫폼별 콘텐츠 생성
   ↓
4. 콘텐츠 검토 및 수정
   ↓
5. 저장 또는 캠페인에 추가
```

---

## 🔧 기술 구현 상세

### 백엔드 API 설계

#### 1. 이미지 분석 API
```typescript
POST /api/marketer/materials/analyze-image
Content-Type: multipart/form-data
Body: {
  image: File (이미지 파일)
  options?: {
    includeMarketingCopy?: boolean  // 마케팅 카피도 생성할지
    targetAudience?: string         // 타겟 오디언스 힌트
  }
}

Response: {
  success: true,
  data: {
    visualAnalysis: {
      colors: string[],
      materials: string[],
      style: string,
      size: string,
      mood: string[]
    },
    marketingInsights: {
      title: string,
      description: string,
      marketingCopy: string[],
      emotionalKeywords: string[],
      targetAudience: string[],
      useCases: string[],
      hashtags: string[]
    },
    imageUrl: string  // 저장된 이미지 URL
  }
}
```

#### 2. 소재 생성 API (이미지 분석 결과 기반)
```typescript
POST /api/marketer/materials
Body: {
  imageUrl: string,
  visualAnalysis: {...},
  marketingInsights: {...},
  // 사용자가 수정한 정보
  title?: string,
  description?: string,
  price?: number,
  category?: string,
  tags?: string[],
  artist?: {
    name: string,
    url?: string
  }
}

Response: {
  success: true,
  data: {
    id: string,
    ...소재 정보
  }
}
```

#### 3. OpenAI Vision API 통합

**새로운 서비스: `imageAnalysisService.ts`**
```typescript
class ImageAnalysisService {
  /**
   * 이미지를 분석하여 시각적 특징 추출
   */
  async analyzeImage(imageUrl: string): Promise<VisualAnalysis> {
    // OpenAI Vision API 호출
    // gpt-4o 또는 gpt-4o-mini with vision 사용
  }

  /**
   * 이미지 분석 결과를 바탕으로 마케팅 카피 생성
   */
  async generateMarketingCopy(
    visualAnalysis: VisualAnalysis,
    options?: MarketingCopyOptions
  ): Promise<MarketingInsights> {
    // GPT-4로 마케팅 카피 생성
  }
}
```

---

## 📊 데이터 구조 설계

### 소재(Material) 데이터 모델

```typescript
interface Material {
  id: string
  // 기본 정보
  title: string
  description: string
  images: string[]  // 이미지 URL 배열
  
  // AI 분석 결과
  visualAnalysis: {
    colors: string[]
    materials: string[]
    style: string
    estimatedSize: string
    mood: string[]
  }
  
  marketingInsights: {
    marketingCopy: string[]  // 핵심 마케팅 문구들
    emotionalKeywords: string[]
    targetAudience: string[]
    useCases: string[]
    hashtags: string[]
  }
  
  // 비즈니스 정보
  price?: number
  category: string
  tags: string[]
  artist?: {
    name: string
    url?: string
  }
  
  // 메타데이터
  createdAt: string
  updatedAt: string
  createdBy?: string
}
```

### Google Sheets 저장 구조

**새로운 시트: `marketer_materials`**

| 컬럼 | 설명 |
|------|------|
| id | 소재 ID |
| title | 제목 |
| description | 설명 |
| image_urls | 이미지 URL (JSON 배열) |
| visual_colors | 색상 (JSON 배열) |
| visual_materials | 재료 (JSON 배열) |
| visual_style | 스타일 |
| marketing_copy | 마케팅 카피 (JSON 배열) |
| emotional_keywords | 감성 키워드 (JSON 배열) |
| target_audience | 타겟 오디언스 (JSON 배열) |
| hashtags | 해시태그 (JSON 배열) |
| price | 가격 |
| category | 카테고리 |
| tags | 태그 (JSON 배열) |
| artist_name | 작가명 |
| created_at | 생성일시 |

---

## 🎨 UI/UX 설계

### 소재 등록 화면 (이미지 중심)

```
┌─────────────────────────────────────────┐
│  소재 등록                              │
├─────────────────────────────────────────┤
│                                         │
│  ┌─────────────────────────────┐       │
│  │                             │       │
│  │   이미지 드롭 영역           │       │
│  │   또는 클릭하여 업로드       │       │
│  │                             │       │
│  └─────────────────────────────┘       │
│                                         │
│  [이미지 분석 시작] 버튼                 │
│                                         │
│  ─── AI 분석 결과 ───                  │
│                                         │
│  시각적 특징:                           │
│  • 색상: 파스텔 톤, 부드러운 베이지     │
│  • 재료: 도자기, 세라믹                 │
│  • 스타일: 미니멀, 모던                 │
│                                         │
│  마케팅 인사이트:                       │
│  • 제목: [AI 생성 제목] ✏️             │
│  • 설명: [AI 생성 설명] ✏️             │
│  • 핵심 카피:                          │
│    - "일상에 따뜻함을 더하는..."       │
│    - "특별한 순간을 위한..."           │
│                                         │
│  감성 키워드:                           │
│  #따뜻함 #미니멀 #일상 #선물           │
│                                         │
│  [소재 저장] [콘텐츠 생성하기]          │
└─────────────────────────────────────────┘
```

### 소재 라이브러리 화면

```
┌─────────────────────────────────────────┐
│  소재 라이브러리        [검색] [필터]   │
├─────────────────────────────────────────┤
│                                         │
│  ┌────┐  ┌────┐  ┌────┐  ┌────┐      │
│  │이미│  │이미│  │이미│  │이미│      │
│  │지1 │  │지2 │  │지3 │  │지4 │      │
│  └────┘  └────┘  └────┘  └────┘      │
│  제목1    제목2    제목3    제목4      │
│  카피1    카피2    카피3    카피4      │
│                                         │
│  [더 보기]                              │
└─────────────────────────────────────────┘
```

---

## 💡 핵심 차별화 포인트

### 1. 이미지 중심 워크플로우
- **기존**: URL 입력 → 크롤링 → 텍스트 정보만 추출
- **개선**: 이미지 업로드 → AI 시각 분석 → 감성적 마케팅 정보 생성

### 2. 마케터 관점의 AI 분석
- 단순 제품 정보가 아닌 **마케팅 인사이트** 생성
- 소비자 관심을 끄는 **감성적 카피** 자동 생성
- 플랫폼별 최적화된 **해시태그** 제안

### 3. Google Sheets 활용 전략 변경
- **기존**: logistics 시트에서 주문 데이터만 활용
- **개선**: 
  - 새로운 `marketer_materials` 시트 생성
  - 이미지 분석 결과와 마케팅 정보 저장
  - 기존 logistics와 연계하여 주문 데이터와 마케팅 데이터 연결

---

## 🔄 하이브리드 접근: 이미지 + 보조 정보

### 시나리오 1: 이미지만으로 소재 생성 (완전 자동)
- 이미지 업로드 → AI 분석 → 소재 자동 생성
- 빠르고 간편하지만 일부 정보는 추정

### 시나리오 2: 이미지 + 기본 정보 입력 (반자동)
- 이미지 업로드
- 가격, 작가명 등 기본 정보 입력
- AI가 이미지 분석 + 입력 정보를 종합하여 소재 생성
- 더 정확하고 풍부한 소재 생성

### 시나리오 3: 이미지 + Google Sheets 연동 (하이브리드)
- 이미지 업로드
- Google Sheets에서 작품 ID로 기본 정보 조회
- AI가 이미지 분석 + Sheets 데이터를 종합하여 소재 생성
- 비즈니스 데이터와 마케팅 정보의 완벽한 결합

---

## 📝 구현 우선순위

### Phase 1: 핵심 기능 (즉시 구현)
1. ✅ 이미지 업로드 기능
2. ✅ OpenAI Vision API 통합
3. ✅ 이미지 분석 서비스 구현
4. ✅ 마케팅 카피 생성 로직
5. ✅ 소재 저장 (Google Sheets)

### Phase 2: UI/UX 개선
6. 이미지 드롭 앤 드롭 UI
7. 분석 결과 미리보기
8. 소재 수정 기능
9. 소재 라이브러리 UI

### Phase 3: 고급 기능
10. 배치 이미지 분석
11. 이미지 비교 분석
12. 소재 템플릿 기능
13. 성과 추적 연동

---

## 🚦 다음 단계

1. **OpenAI Vision API 통합**: 이미지 분석 기능 구현
2. **마케팅 카피 생성 로직**: 이미지 분석 결과 기반 카피 생성
3. **UI 프로토타입**: 이미지 업로드 및 분석 결과 표시
4. **Google Sheets 연동**: 마케팅 소재 데이터 저장 구조 설계

---

## 💰 비용 고려사항

### OpenAI Vision API 비용
- GPT-4o Vision: 이미지당 약 $0.01-0.03 (이미지 크기에 따라)
- GPT-4o-mini Vision: 더 저렴하지만 품질은 약간 낮음
- **권장**: GPT-4o-mini로 시작, 필요시 GPT-4o로 업그레이드

### 최적화 전략
- 이미지 크기 제한 (최대 4MB)
- 이미지 압축
- 분석 결과 캐싱 (동일 이미지 재분석 방지)

---

## 🎯 기대 효과

1. **작업 효율성**: 이미지만으로 소재 생성, 수동 입력 시간 대폭 감소
2. **품질 향상**: AI 기반 감성적 카피로 마케팅 효과 증대
3. **일관성**: 모든 소재가 동일한 품질 기준으로 생성
4. **확장성**: 배치 처리로 대량 소재 생성 가능






