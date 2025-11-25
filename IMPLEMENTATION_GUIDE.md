# 구현 가이드

## 🎯 현재 상태

Google Sheets 기반 웹 애플리케이션의 기본 구조가 완성되었습니다.

### 완성된 기능

1. **백엔드 API 서버**
   - Express + TypeScript 기반
   - Google Sheets API 연동
   - 메인 대시보드 데이터 API
   - 미입고 관리 데이터 API

2. **프론트엔드 웹 애플리케이션**
   - Next.js 14 (App Router) + TypeScript
   - Tailwind CSS 스타일링
   - React Query를 통한 데이터 페칭
   - 메인 대시보드 페이지
   - 미입고 관리 페이지

## 📋 다음 구현 단계

### Step 1: 나머지 페이지 이전 (1-2주)

#### 1.1 물류 추적 페이지
- [ ] `backend/src/routes/logistics.ts` 생성
- [ ] `frontend/app/logistics/page.tsx` 생성
- [ ] 필터링 기능 (국가, 상태, 주문번호)
- [ ] 작품 목록 확장/축소 기능

#### 1.2 물류 관제 센터 페이지
- [ ] `backend/src/routes/control-tower.ts` 생성
- [ ] `frontend/app/control-tower/page.tsx` 생성
- [ ] 파이프라인 5단계 시각화
- [ ] 위험 주문 목록 표시

#### 1.3 성과 분석 페이지
- [ ] `backend/src/routes/analytics.ts` 생성
- [ ] `frontend/app/analytics/page.tsx` 생성
- [ ] 탭 구조 (종합 성과, 고객 분석, 채널 분석)
- [ ] Chart.js 차트 통합
- [ ] RFM 분석 테이블

#### 1.4 통합 검색 페이지
- [ ] `backend/src/routes/lookup.ts` 생성
- [ ] `frontend/app/lookup/page.tsx` 생성
- [ ] 다중 검색 기준 지원
- [ ] 검색 결과 테이블

### Step 2: Chat Agent 기본 구조 (2-3주)

#### 2.1 Ollama 설정 및 연동
- [ ] Ollama 설치 및 모델 다운로드
- [ ] `backend/src/services/ollama.ts` 생성
- [ ] 기본 LLM 호출 테스트

#### 2.2 Chat UI 컴포넌트
- [ ] `frontend/components/Chat/` 디렉토리 생성
- [ ] Chat 인터페이스 컴포넌트
- [ ] 메시지 표시 컴포넌트
- [ ] 스트리밍 응답 처리

#### 2.3 기본 Agent 프레임워크
- [ ] LangChain 설치 및 설정
- [ ] `backend/src/agents/BaseAgent.ts` 생성
- [ ] 기본 도구 (Tools) 구현
- [ ] 간단한 질문-답변 API

### Step 3: 역할별 Agent 개발 (3-4주)

#### 3.1 Data Analyst Agent
- [ ] Text-to-SQL 기능 구현
- [ ] 데이터베이스 스키마 정보 제공
- [ ] SQL 검증 및 실행
- [ ] 결과 시각화

#### 3.2 Performance Marketer Agent
- [ ] 트렌드 추출 기능
- [ ] 콘텐츠 생성 기능
- [ ] CRM 세그먼트 생성

#### 3.3 Business Manager Agent
- [ ] 전략 분석 기능
- [ ] 메트릭 예측 기능
- [ ] 시나리오 시뮬레이션

## 🔧 기술적 구현 가이드

### Google Sheets API 사용법

```typescript
// 서비스 인스턴스 생성
const sheetsService = new GoogleSheetsService({
  spreadsheetId: process.env.GOOGLE_SHEETS_SPREADSHEET_ID!,
  clientEmail: process.env.GOOGLE_SHEETS_CLIENT_EMAIL!,
  privateKey: process.env.GOOGLE_SHEETS_PRIVATE_KEY!,
})

// 데이터 조회
const data = await sheetsService.getSheetDataAsJson('logistics', true)
```

### API 라우트 추가 방법

1. `backend/src/routes/` 디렉토리에 새 파일 생성
2. Express Router 사용하여 엔드포인트 정의
3. `backend/src/index.ts`에 라우트 등록

예시:
```typescript
// backend/src/routes/logistics.ts
import { Router } from 'express'
const router = Router()

router.get('/', async (req, res) => {
  // 로직 구현
})

export default router

// backend/src/index.ts
import logisticsRoutes from './routes/logistics'
app.use('/api/logistics', logisticsRoutes)
```

### 프론트엔드 페이지 추가 방법

1. `frontend/app/` 디렉토리에 새 폴더 생성
2. `page.tsx` 파일 생성
3. React Query를 사용하여 데이터 페칭
4. API 클라이언트에 함수 추가 (`frontend/lib/api.ts`)

예시:
```typescript
// frontend/lib/api.ts
export const logisticsApi = {
  getList: async () => {
    const response = await api.get('/api/logistics')
    return response.data
  },
}

// frontend/app/logistics/page.tsx
'use client'
import { useQuery } from '@tanstack/react-query'
import { logisticsApi } from '@/lib/api'

export default function LogisticsPage() {
  const { data } = useQuery({
    queryKey: ['logistics'],
    queryFn: () => logisticsApi.getList(),
  })
  // ...
}
```

## 🐛 문제 해결

### Google Sheets API 오류
- 서비스 계정이 스프레드시트에 공유되어 있는지 확인
- 인증 정보가 올바른지 확인
- API가 활성화되어 있는지 확인

### 타입 오류
- `shared/types/` 디렉토리에 공통 타입 정의
- 백엔드와 프론트엔드에서 공유 사용

### CORS 오류
- 백엔드에서 CORS 설정 확인
- 프론트엔드 URL이 올바른지 확인

## 📚 참고 자료

- [Next.js 문서](https://nextjs.org/docs)
- [React Query 문서](https://tanstack.com/query/latest)
- [Google Sheets API 문서](https://developers.google.com/sheets/api)
- [Ollama 문서](https://ollama.ai/docs)
- [LangChain 문서](https://js.langchain.com/docs)

## 💡 팁

1. **점진적 개발**: 한 번에 모든 기능을 구현하지 말고 단계적으로 진행
2. **타입 안정성**: TypeScript 타입을 명확히 정의하여 오류 방지
3. **에러 처리**: 모든 API 호출에 에러 처리 추가
4. **로딩 상태**: 사용자 경험을 위해 로딩 상태 표시
5. **캐싱**: React Query의 캐싱 기능 활용


