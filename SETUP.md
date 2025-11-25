# 설치 및 실행 가이드

## 1. 필수 요구사항

- Node.js 18 이상
- npm 또는 yarn
- Google Sheets API 인증 정보
- Ollama (Chat Agent용, 선택사항)

## 2. 프로젝트 설치

```bash
# 루트 디렉토리에서
npm install

# 프론트엔드 의존성 설치
cd frontend
npm install

# 백엔드 의존성 설치
cd ../backend
npm install
```

## 3. Google Sheets API 설정

### 3.1 Google Cloud Console 설정

1. [Google Cloud Console](https://console.cloud.google.com/) 접속
2. 새 프로젝트 생성 또는 기존 프로젝트 선택
3. **API 및 서비스** > **라이브러리**에서 "Google Sheets API" 검색 및 활성화
4. **API 및 서비스** > **사용자 인증 정보**로 이동
5. **사용자 인증 정보 만들기** > **서비스 계정** 선택
6. 서비스 계정 생성 후 **키** 탭에서 **키 추가** > **JSON** 선택
7. 다운로드된 JSON 파일에서 다음 정보 추출:
   - `client_email`: 서비스 계정 이메일
   - `private_key`: 개인 키 (전체 키를 문자열로)

### 3.2 스프레드시트 공유 설정

1. Google Sheets에서 대상 스프레드시트 열기
2. **공유** 버튼 클릭
3. 서비스 계정 이메일을 **편집자** 권한으로 추가
4. 스프레드시트 URL에서 ID 추출:
   ```
   https://docs.google.com/spreadsheets/d/{SPREADSHEET_ID}/edit
   ```

## 4. 환경 변수 설정

### 백엔드 환경 변수

`backend/.env` 파일 생성:

```env
GOOGLE_SHEETS_SPREADSHEET_ID=your_spreadsheet_id_here
GOOGLE_SHEETS_CLIENT_EMAIL=your_service_account_email@project.iam.gserviceaccount.com
GOOGLE_SHEETS_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

PORT=3001

# Ollama 설정 (선택사항)
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3
```

**주의**: `GOOGLE_SHEETS_PRIVATE_KEY`는 전체 키를 문자열로 입력하되, `\n`을 실제 줄바꿈으로 변환해야 합니다.

### 프론트엔드 환경 변수

`frontend/.env.local` 파일 생성:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## 5. Ollama 설치 (Chat Agent용, 선택사항)

### Windows

1. [Ollama 공식 사이트](https://ollama.ai/)에서 다운로드
2. 설치 후 실행
3. 모델 다운로드:
   ```bash
   ollama pull llama3
   # 또는
   ollama pull mistral
   ```

### macOS/Linux

```bash
curl -fsSL https://ollama.ai/install.sh | sh
ollama pull llama3
```

## 6. 실행

### 개발 모드

```bash
# 루트 디렉토리에서 (프론트엔드 + 백엔드 동시 실행)
npm run dev

# 또는 개별 실행
# 터미널 1: 백엔드
cd backend
npm run dev

# 터미널 2: 프론트엔드
cd frontend
npm run dev
```

### 접속

- 프론트엔드: http://localhost:3000
- 백엔드 API: http://localhost:3001

## 7. 문제 해결

### Google Sheets API 오류

- 서비스 계정이 스프레드시트에 공유되어 있는지 확인
- 인증 정보가 올바른지 확인
- API가 활성화되어 있는지 확인

### 포트 충돌

- 백엔드 포트 변경: `backend/.env`에서 `PORT` 수정
- 프론트엔드 포트 변경: `frontend/package.json`의 `dev` 스크립트 수정

### Ollama 연결 오류

- Ollama가 실행 중인지 확인: `ollama list`
- `OLLAMA_BASE_URL`이 올바른지 확인

## 8. 다음 단계

1. 백엔드 API 테스트: http://localhost:3001/health
2. 프론트엔드 접속: http://localhost:3000
3. 대시보드 페이지 확인: http://localhost:3000/dashboard


