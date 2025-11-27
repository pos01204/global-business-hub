# 🚀 빠른 배포 가이드 (5분)

## 목표
프로젝트를 웹에 배포하여 누구나 접근할 수 있도록 설정합니다.

## 추천 배포 플랫폼
- **프론트엔드**: Vercel (Next.js 최적화, 무료)
- **백엔드**: Railway (무료 티어, 간단한 설정)

---

## 1단계: 프론트엔드 배포 (Vercel) - 2분

### 방법 1: Vercel 웹사이트 사용 (가장 간단)

1. **Vercel 접속**
   - https://vercel.com 접속
   - GitHub 계정으로 로그인

2. **프로젝트 추가**
   - "Add New Project" 클릭
   - GitHub 저장소 선택
   - 또는 "Import Git Repository"로 직접 연결

3. **프로젝트 설정**
   - **Framework Preset**: Next.js (자동 감지)
   - **Root Directory**: `frontend` 선택
   - **Build Command**: `npm run build` (자동)
   - **Output Directory**: `.next` (자동)

4. **환경 변수 추가** (나중에 백엔드 URL로 업데이트)
   - "Environment Variables" 섹션
   - `NEXT_PUBLIC_API_URL` = `http://localhost:3001` (임시, 나중에 변경)

5. **배포**
   - "Deploy" 클릭
   - 배포 완료 후 URL 확인 (예: `https://your-project.vercel.app`)

### 방법 2: Vercel CLI 사용

```bash
cd frontend
npm i -g vercel
vercel login
vercel
```

---

## 2단계: 백엔드 배포 (Railway) - 3분

### Railway 웹사이트 사용

1. **Railway 접속**
   - https://railway.app 접속
   - GitHub 계정으로 로그인

2. **프로젝트 생성**
   - "New Project" 클릭
   - "Deploy from GitHub repo" 선택
   - 저장소 선택

3. **서비스 추가**
   - "Add Service" → "GitHub Repo"
   - 저장소 선택
   - **Root Directory**: `backend` 선택

4. **환경 변수 설정**
   - "Variables" 탭 클릭
   - 다음 변수 추가:

```
PORT=3001
NODE_ENV=production
OPENAI_API_KEY=your-openai-key
GOOGLE_SHEETS_API_KEY=your-google-sheets-key
GOOGLE_SHEETS_SPREADSHEET_ID=your-sheet-id
```

5. **도메인 생성**
   - "Settings" → "Generate Domain" 클릭
   - 도메인 확인 (예: `your-backend.railway.app`)

6. **배포 확인**
   - "Deployments" 탭에서 배포 상태 확인
   - 배포 완료 후 도메인으로 API 테스트:
     ```
     https://your-backend.railway.app/health
     ```

---

## 3단계: 프론트엔드 환경 변수 업데이트

1. **Vercel 대시보드로 돌아가기**
   - 프로젝트 선택
   - "Settings" → "Environment Variables"

2. **환경 변수 업데이트**
   - `NEXT_PUBLIC_API_URL` 값을 Railway 백엔드 URL로 변경:
     ```
     https://your-backend.railway.app
     ```

3. **재배포**
   - "Deployments" 탭에서 "Redeploy" 클릭
   - 또는 코드 푸시 시 자동 재배포

---

## 4단계: 테스트

1. **프론트엔드 접속**
   - Vercel에서 제공한 URL 접속
   - 예: `https://your-project.vercel.app`

2. **기능 테스트**
   - 대시보드 로드 확인
   - API 호출 확인
   - 브라우저 개발자 도구(F12) → Network 탭에서 오류 확인

---

## 🔧 문제 해결

### CORS 오류 발생 시

백엔드 `backend/src/index.ts`에서 CORS 설정 확인:
```typescript
const corsOptions = {
  origin: process.env.FRONTEND_URL || '*',
  credentials: true,
};
```

Railway 환경 변수에 추가:
```
FRONTEND_URL=https://your-frontend.vercel.app
```

### 환경 변수가 적용되지 않을 때

- Vercel/Railway에서 재배포 필요
- 환경 변수 이름 확인 (대소문자 구분)
- 변수 값에 공백 없도록 확인

### 빌드 오류 발생 시

- 로컬에서 먼저 테스트:
  ```bash
  cd frontend && npm run build
  cd ../backend && npm run build
  ```
- 빌드 로그 확인
- 의존성 문제 확인

---

## 📝 체크리스트

- [ ] Vercel 계정 생성 및 프론트엔드 배포
- [ ] Railway 계정 생성 및 백엔드 배포
- [ ] 백엔드 환경 변수 설정
- [ ] 프론트엔드 환경 변수 업데이트 (백엔드 URL)
- [ ] 배포된 사이트 접속 테스트
- [ ] 모든 기능 정상 작동 확인

---

## 💡 팁

### 무료 티어 제한
- **Vercel**: 무제한 (개인 프로젝트)
- **Railway**: $5 크레딧/월 (충분함)

### 자동 배포
- GitHub에 푸시하면 자동으로 재배포됨
- 환경 변수는 수동으로 설정 필요

### 도메인 커스터마이징
- Vercel: Settings → Domains에서 커스텀 도메인 추가 가능
- Railway: Settings → Custom Domain에서 추가 가능

---

## 🎯 다음 단계

배포 완료 후:
1. 팀원들에게 URL 공유
2. 모니터링 설정 (선택사항)
3. 백업 설정 (선택사항)




