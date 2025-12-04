# 웹 배포 가이드

## 🚀 배포 개요

프로젝트를 웹에 배포하여 누구나 접근할 수 있도록 설정합니다.

## 📋 배포 옵션

### 추천 조합
- **프론트엔드**: Vercel (Next.js 최적화, 무료)
- **백엔드**: Railway 또는 Render (무료 티어 제공)

## 1단계: 프론트엔드 배포 (Vercel)

### Vercel 계정 생성
1. [Vercel](https://vercel.com) 접속
2. GitHub 계정으로 로그인 (또는 이메일 가입)

### 프로젝트 배포
1. Vercel 대시보드에서 "Add New Project" 클릭
2. GitHub 저장소 선택 (또는 직접 업로드)
3. 프로젝트 설정:
   - **Framework Preset**: Next.js
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build` (자동 감지)
   - **Output Directory**: `.next` (자동 감지)

### 환경 변수 설정
Vercel 대시보드 → Settings → Environment Variables:
```
NEXT_PUBLIC_API_URL=https://your-backend-url.railway.app
```

### 배포 완료
배포 후 Vercel이 자동으로 URL 제공:
- 예: `https://your-project.vercel.app`

## 2단계: 백엔드 배포 (Railway)

### Railway 계정 생성
1. [Railway](https://railway.app) 접속
2. GitHub 계정으로 로그인

### 프로젝트 배포
1. "New Project" → "Deploy from GitHub repo"
2. 저장소 선택
3. "Add Service" → "GitHub Repo"
4. `backend` 폴더 선택

### 환경 변수 설정
Railway 대시보드 → Variables 탭에서 추가:
```
PORT=3001
NODE_ENV=production
OPENAI_API_KEY=your-openai-key
GOOGLE_SHEETS_API_KEY=your-google-sheets-key
GOOGLE_SHEETS_SPREADSHEET_ID=your-sheet-id
```

### 도메인 설정
Railway 대시보드 → Settings → Generate Domain
- 예: `your-backend.railway.app`

### 프론트엔드 환경 변수 업데이트
Vercel 대시보드에서 `NEXT_PUBLIC_API_URL`을 Railway URL로 업데이트:
```
NEXT_PUBLIC_API_URL=https://your-backend.railway.app
```

## 3단계: 백엔드 배포 (Render - 대안)

### Render 계정 생성
1. [Render](https://render.com) 접속
2. GitHub 계정으로 로그인

### Web Service 생성
1. "New" → "Web Service"
2. 저장소 선택
3. 설정:
   - **Name**: `global-business-hub-backend`
   - **Root Directory**: `backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free

### 환경 변수 설정
Render 대시보드 → Environment:
```
NODE_ENV=production
PORT=3001
OPENAI_API_KEY=your-openai-key
GOOGLE_SHEETS_API_KEY=your-google-sheets-key
GOOGLE_SHEETS_SPREADSHEET_ID=your-sheet-id
```

### 도메인 확인
Render가 자동으로 URL 제공:
- 예: `https://your-backend.onrender.com`

## 🔧 배포 전 준비사항

### 1. 백엔드 빌드 설정 확인

`backend/package.json`에 빌드 스크립트 확인:
```json
{
  "scripts": {
    "build": "tsc",
    "start": "node dist/index.js"
  }
}
```

### 2. CORS 설정 확인

백엔드에서 모든 도메인 허용 (프로덕션에서는 특정 도메인만):
```typescript
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}))
```

### 3. 환경 변수 파일 생성

`.env.example` 파일 생성하여 필요한 환경 변수 문서화

## 📝 배포 체크리스트

### 프론트엔드 (Vercel)
- [ ] Vercel 계정 생성
- [ ] GitHub 저장소 연결
- [ ] 프로젝트 배포
- [ ] 환경 변수 설정 (`NEXT_PUBLIC_API_URL`)
- [ ] 배포 URL 확인

### 백엔드 (Railway/Render)
- [ ] Railway 또는 Render 계정 생성
- [ ] GitHub 저장소 연결
- [ ] 프로젝트 배포
- [ ] 환경 변수 설정
- [ ] 도메인 확인
- [ ] API 엔드포인트 테스트

### 통합 테스트
- [ ] 프론트엔드에서 백엔드 API 호출 확인
- [ ] CORS 오류 없음 확인
- [ ] 모든 기능 정상 작동 확인

## 🎯 빠른 배포 (5분)

### Vercel CLI 사용 (프론트엔드)
```bash
cd frontend
npm i -g vercel
vercel login
vercel
```

### Railway CLI 사용 (백엔드)
```bash
cd backend
npm i -g @railway/cli
railway login
railway init
railway up
```

## 💡 팁

### 무료 티어 제한
- **Vercel**: 무제한 (개인 프로젝트)
- **Railway**: $5 크레딧/월 (무료 티어)
- **Render**: 15분 비활성 시 슬리프 모드

### 성능 최적화
- Vercel은 자동으로 CDN 제공
- Railway는 자동 스케일링
- Render는 슬리프 모드로 비용 절감

### 보안
- 환경 변수는 절대 Git에 커밋하지 않기
- `.env` 파일을 `.gitignore`에 추가
- 프로덕션에서는 특정 도메인만 CORS 허용

## 🔍 문제 해결

### CORS 오류
백엔드에서 프론트엔드 도메인을 명시적으로 허용:
```typescript
app.use(cors({
  origin: ['https://your-frontend.vercel.app'],
  credentials: true
}))
```

### 환경 변수 오류
- Vercel/Railway 대시보드에서 환경 변수 확인
- 변수명 대소문자 확인
- 재배포 필요할 수 있음

### 빌드 오류
- 로컬에서 `npm run build` 테스트
- 빌드 로그 확인
- 의존성 문제 확인









