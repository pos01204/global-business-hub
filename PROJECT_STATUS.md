# 프로젝트 진행 현황

## ✅ 완료된 작업

### 1. 프로젝트 구조 설정
- [x] 루트 프로젝트 구조 생성
- [x] 백엔드 기본 구조 (Express + TypeScript)
- [x] 프론트엔드 기본 구조 (Next.js 14 + TypeScript)
- [x] 설정 파일 (package.json, tsconfig.json, tailwind.config.js 등)

### 2. 백엔드 구축
- [x] Express 서버 기본 설정
- [x] Google Sheets API 연동 서비스
- [x] 메인 대시보드 API (`/api/dashboard/main`)
- [x] 미입고 관리 API (`/api/unreceived`)
- [x] CORS 및 기본 미들웨어 설정

### 3. 프론트엔드 구축
- [x] Next.js 14 App Router 설정
- [x] Tailwind CSS 설정
- [x] React Query 설정
- [x] API 클라이언트 모듈
- [x] 메인 대시보드 페이지
- [x] 미입고 관리 페이지
- [x] 물류 추적 페이지
- [x] 물류 관제 센터 페이지
- [x] 성과 분석 페이지
- [x] 통합 검색 페이지
- [x] 기본 레이아웃 및 스타일링

## 🚧 진행 중인 작업

없음

## 📋 다음 단계

### Phase 1: 기존 기능 이전 ✅ 완료
- [x] 물류 추적 페이지 (`/logistics`)
- [x] 물류 관제 센터 페이지 (`/control-tower`)
- [x] 성과 분석 페이지 (`/analytics`)
- [x] 통합 검색 페이지 (`/lookup`)

### Phase 2: Chat Agent 기본 구조
- [ ] Chat UI 컴포넌트 개발
- [ ] Ollama 연동 모듈
- [ ] 기본 Agent 프레임워크 (LangChain)
- [ ] 간단한 질문-답변 기능

### Phase 3: 역할별 Agent 개발
- [ ] Data Analyst Agent (Text-to-SQL)
- [ ] Performance Marketer Agent
- [ ] Business Manager Agent

## 📁 현재 프로젝트 구조

```
.
├── backend/                 # Express 백엔드
│   ├── src/
│   │   ├── index.ts        # 서버 진입점
│   │   ├── routes/         # API 라우트
│   │   │   ├── dashboard.ts
│   │   │   └── unreceived.ts
│   │   ├── services/        # 비즈니스 로직
│   │   │   └── googleSheets.ts
│   │   └── config/          # 설정
│   │       └── sheets.ts
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/               # Next.js 프론트엔드
│   ├── app/
│   │   ├── page.tsx        # 홈 페이지
│   │   ├── dashboard/      # 메인 대시보드
│   │   ├── unreceived/     # 미입고 관리
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── lib/
│   │   └── api.ts          # API 클라이언트
│   ├── package.json
│   └── tsconfig.json
│
├── docs/                   # 문서
│   ├── system_diagnosis.md
│   ├── agent_design.md
│   └── raw_data_structure.md
│
├── README.md
├── SETUP.md
└── package.json            # 루트 package.json
```

## 🔧 기술 스택

### 백엔드
- Express.js
- TypeScript
- Google Sheets API (googleapis)
- LangChain (준비 중)

### 프론트엔드
- Next.js 14 (App Router)
- React 18
- TypeScript
- Tailwind CSS
- React Query
- Chart.js (준비 중)

### AI/ML (예정)
- Ollama (로컬 LLM 실행)
- LangChain (Agent 프레임워크)
- Llama 3 또는 Mistral

## 📝 주요 파일 설명

### 백엔드
- `backend/src/services/googleSheets.ts`: Google Sheets 데이터 조회/업데이트 서비스
- `backend/src/routes/dashboard.ts`: 메인 대시보드 API 엔드포인트
- `backend/src/routes/unreceived.ts`: 미입고 관리 API 엔드포인트

### 프론트엔드
- `frontend/app/dashboard/page.tsx`: 메인 대시보드 페이지
- `frontend/app/unreceived/page.tsx`: 미입고 관리 페이지
- `frontend/lib/api.ts`: API 클라이언트 모듈

## 🚀 실행 방법

자세한 내용은 [SETUP.md](./SETUP.md) 참고

```bash
# 루트에서
npm install
npm run dev

# 또는 개별 실행
cd backend && npm run dev
cd frontend && npm run dev
```

## ⚠️ 주의사항

1. **환경 변수 설정 필수**: `backend/.env` 파일에 Google Sheets API 인증 정보 필요
2. **포트 충돌**: 백엔드(3001), 프론트엔드(3000) 포트 확인
3. **Google Sheets 공유**: 서비스 계정을 스프레드시트에 공유해야 함

## 📊 API 엔드포인트

### 대시보드
- `GET /api/dashboard/main?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD`

### 미입고 관리
- `GET /api/unreceived`
- `POST /api/unreceived/update-status`

### 물류 추적
- `GET /api/logistics`

### 물류 관제 센터
- `GET /api/control-tower`

### 성과 분석
- `GET /api/analytics?dateRange=30d&countryFilter=all`

### 통합 검색
- `GET /api/lookup?query=검색어&searchType=order_code`

### Health Check
- `GET /health`

