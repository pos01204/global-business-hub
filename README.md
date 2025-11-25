# 글로벌 비즈니스 통합 허브

크로스보더 이커머스 및 글로벌 로지스틱스 통합 대시보드

## 🚀 빠른 시작

### 로컬 개발 환경 설정

```bash
# 프론트엔드 실행
cd frontend
npm install
npm run dev

# 백엔드 실행 (다른 터미널)
cd backend
npm install
npm run dev
```

## 📁 프로젝트 구조

```
.
├── frontend/          # Next.js 프론트엔드
│   ├── app/          # 페이지 및 라우팅
│   ├── components/   # React 컴포넌트
│   └── lib/          # 유틸리티 및 API 클라이언트
│
├── backend/          # Express 백엔드
│   ├── src/
│   │   ├── routes/  # API 라우트
│   │   ├── services/ # 비즈니스 로직
│   │   └── types/   # TypeScript 타입 정의
│   └── dist/        # 빌드 출력 (자동 생성)
│
└── docs/            # 문서
```

## 🌐 웹 배포

### 배포 플랫폼
- **프론트엔드**: Vercel
- **백엔드**: Railway 또는 Render

### 배포 가이드
자세한 배포 방법은 다음 문서를 참조하세요:
- [빠른 배포 가이드](DEPLOYMENT_QUICK_START.md)
- [단계별 배포 가이드](DEPLOYMENT_STEP_BY_STEP.md)
- [상세 배포 가이드](docs/deployment_guide.md)

## 🔧 환경 변수

### 프론트엔드 (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### 백엔드 (.env)
```env
PORT=3001
NODE_ENV=development
OPENAI_API_KEY=your-openai-key
GOOGLE_SHEETS_API_KEY=your-google-sheets-key
GOOGLE_SHEETS_SPREADSHEET_ID=your-sheet-id
```

## 📚 주요 기능

- 📊 메인 대시보드: 핵심 성과 지표 및 트렌드 분석
- 🚨 미입고 관리: 미입고 작품 현황 및 관리
- 🚚 물류 추적: 글로벌 물류 추적 및 현황
- 📡 물류 관제 센터: 실시간 물류 파이프라인 현황
- 📈 성과 분석: 상세 성과 분석 및 리포트
- 🔍 통합 검색: 주문번호, 송장번호, 사용자 ID 등 통합 검색
- 📝 퍼포먼스 마케터: idus 소재 탐색 및 owned media 콘텐츠 생성
- 💬 AI 어시스턴트: 자연어 기반 데이터 분석

## 🛠️ 기술 스택

### 프론트엔드
- Next.js 14 (App Router)
- React 18
- TypeScript
- Tailwind CSS
- React Query
- Chart.js

### 백엔드
- Express.js
- TypeScript
- Google Sheets API
- OpenAI API
- Cheerio (웹 크롤링)

## 📝 라이선스

프로젝트 내부 사용
