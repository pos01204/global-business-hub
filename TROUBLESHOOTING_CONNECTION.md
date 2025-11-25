# 🔧 연결 오류 진단 및 해결 가이드

## 오류 메시지
- **오류**: `ERR_CONNECTION_REFUSED`
- **메시지**: "localhost에서 연결을 거부했습니다."

## 원인 분석

이 오류는 **서버가 실행되지 않았을 때** 발생합니다. 다음 중 하나일 가능성이 높습니다:

1. ✅ **서버가 시작되지 않음** (가장 가능성 높음)
2. 서버가 크래시됨
3. 포트가 이미 사용 중
4. 방화벽/보안 프로그램 차단

## 해결 방법

### 1단계: 서버 실행 확인

터미널에서 다음 명령어를 실행하여 서버가 실행 중인지 확인하세요:

```bash
npm run dev
```

이 명령어는 다음을 실행합니다:
- **프론트엔드 서버**: `http://localhost:3000`
- **백엔드 서버**: `http://localhost:3001`

### 2단계: 서버 실행 확인

서버가 정상적으로 시작되면 다음과 같은 메시지가 표시됩니다:

**프론트엔드:**
```
▲ Next.js 14.0.4
- Local: http://localhost:3000
✓ Ready in X.Xs
```

**백엔드:**
```
🚀 Server is running on http://localhost:3001
```

### 3단계: 브라우저 접속

서버가 실행된 후 브라우저에서 다음 주소로 접속하세요:
- **프론트엔드**: http://localhost:3000
- **백엔드 API**: http://localhost:3001/health

## 문제 해결 체크리스트

### ✅ 서버가 실행되지 않는 경우

1. **터미널 확인**
   - `npm run dev` 명령어가 실행되었는지 확인
   - 오류 메시지가 있는지 확인

2. **포트 충돌 확인**
   - 다른 프로그램이 3000 또는 3001 포트를 사용 중일 수 있음
   - 포트를 변경하려면:
     - 프론트엔드: `frontend/package.json`의 `dev` 스크립트에 `-p 3002` 추가
     - 백엔드: `backend/.env` 파일의 `PORT=3002` 변경

3. **의존성 설치 확인**
   ```bash
   # 루트 디렉토리에서
   npm install
   
   # 프론트엔드 디렉토리에서
   cd frontend
   npm install
   
   # 백엔드 디렉토리에서
   cd ../backend
   npm install
   ```

### ✅ 서버가 크래시되는 경우

1. **환경 변수 확인**
   - `backend/.env` 파일이 존재하는지 확인
   - 필수 환경 변수가 모두 설정되었는지 확인:
     - `GOOGLE_SHEETS_SPREADSHEET_ID`
     - `GOOGLE_SHEETS_CLIENT_EMAIL`
     - `GOOGLE_SHEETS_PRIVATE_KEY`
     - `PORT`

2. **로그 확인**
   - 터미널에 표시된 오류 메시지를 확인
   - 특히 Google Sheets API 인증 오류가 있는지 확인

### ✅ 포트가 이미 사용 중인 경우

다른 포트를 사용하도록 설정:

**프론트엔드 포트 변경:**
```json
// frontend/package.json
{
  "scripts": {
    "dev": "next dev -p 3002"
  }
}
```

**백엔드 포트 변경:**
```env
# backend/.env
PORT=3002
```

그리고 `frontend/lib/api.ts`의 `API_URL`도 변경:
```typescript
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002'
```

## 빠른 해결 방법

### 방법 1: 서버 재시작

1. 현재 실행 중인 터미널에서 `Ctrl + C`로 서버 중지
2. 다음 명령어로 다시 시작:
   ```bash
   npm run dev
   ```

### 방법 2: 개별 서버 실행

**터미널 1 (백엔드):**
```bash
cd backend
npm run dev
```

**터미널 2 (프론트엔드):**
```bash
cd frontend
npm run dev
```

### 방법 3: 포트 확인 및 변경

포트가 사용 중인지 확인:
```bash
# Windows PowerShell
netstat -ano | findstr ":3000"
netstat -ano | findstr ":3001"
```

사용 중이면 다른 포트로 변경하거나 해당 프로세스를 종료하세요.

## 추가 도움말

문제가 계속되면 다음 정보를 확인하세요:

1. **Node.js 버전**: `node --version` (v18 이상 권장)
2. **npm 버전**: `npm --version`
3. **터미널 오류 메시지**: 전체 오류 로그
4. **환경 변수**: `backend/.env` 파일 내용 (민감 정보 제외)

## 예상 실행 시간

- **첫 실행**: 10-30초 (의존성 설치 및 컴파일)
- **이후 실행**: 5-10초

서버가 시작되면 브라우저에서 자동으로 열리거나, 수동으로 `http://localhost:3000`에 접속하세요.


