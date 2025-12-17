# 🔐 환경 변수 설정 가이드

## 📍 파일 위치

`backend` 폴더 안에 `.env` 파일을 생성하세요.

**경로:**
```
backend/.env
```

## 📝 파일 내용 (Phase 2 업데이트)

`.env` 파일에 다음 내용을 입력하세요:

```env
# ============================================================
# 서버 설정
# ============================================================
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# ============================================================
# Google Sheets API (필수)
# ============================================================
GOOGLE_SHEETS_SPREADSHEET_ID=여기에_스프레드시트_ID_입력
GOOGLE_SHEETS_CLIENT_EMAIL=여기에_서비스_계정_이메일_입력
GOOGLE_SHEETS_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n여기에_개인키_전체_입력\n-----END PRIVATE KEY-----\n"

# ============================================================
# PostgreSQL 데이터베이스 (Phase 2 - 필수)
# ============================================================
DB_HOST=localhost
DB_PORT=5432
DB_NAME=global_business_hub
DB_USER=postgres
DB_PASSWORD=여기에_DB_비밀번호_입력

# 연결 풀 설정 (선택)
DB_POOL_MAX=10

# ============================================================
# 배치 Job 설정 (Phase 2)
# ============================================================
# 배치 Job 활성화 (DB_HOST 설정 시 자동 활성화)
ENABLE_BATCH_JOBS=true

# ============================================================
# AI/LLM API 키 (선택)
# ============================================================
OPENAI_API_KEY=sk-여기에_OpenAI_API_키_입력
GEMINI_API_KEY=여기에_Gemini_API_키_입력

# ============================================================
# 외부 서비스 (선택)
# ============================================================
SLACK_SIGNING_SECRET=여기에_Slack_시크릿_입력
SLACK_BOT_TOKEN=xoxb-여기에_Slack_봇_토큰_입력
NOTION_API_KEY=secret_여기에_Notion_API_키_입력
RESEND_API_KEY=re_여기에_Resend_API_키_입력
```

## 🔍 각 값 찾는 방법

### 1. GOOGLE_SHEETS_SPREADSHEET_ID

Google Sheets URL에서 ID 추출:

```
https://docs.google.com/spreadsheets/d/[여기가_ID]/edit
```

**예시:**
- URL: `https://docs.google.com/spreadsheets/d/1abc123def456ghi789/edit`
- ID: `1abc123def456ghi789`

### 2. GOOGLE_SHEETS_CLIENT_EMAIL

Google Cloud Console에서 다운로드한 JSON 파일을 열어서:

```json
{
  "client_email": "sheets-reader@my-project.iam.gserviceaccount.com",
  ...
}
```

`client_email` 값을 복사하세요.

### 3. GOOGLE_SHEETS_PRIVATE_KEY

같은 JSON 파일에서:

```json
{
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n"
}
```

**⚠️ 중요:**
- `private_key` 값 **전체**를 복사하세요
- 큰따옴표(`"`)로 감싸야 합니다
- 줄바꿈 문자(`\n`)는 그대로 유지하세요
- 여러 줄에 걸쳐 있어도 한 줄로 입력하세요

**예시:**
```env
GOOGLE_SHEETS_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ\n-----END PRIVATE KEY-----\n"
```

---

## 🐘 PostgreSQL 데이터베이스 설정 (Phase 2)

### 1. PostgreSQL 설치

**Windows:**
- [PostgreSQL 공식 다운로드](https://www.postgresql.org/download/windows/)에서 설치
- 설치 시 비밀번호를 기억해 두세요

**macOS:**
```bash
brew install postgresql@15
brew services start postgresql@15
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

### 2. 데이터베이스 생성

```bash
# PostgreSQL 접속
psql -U postgres

# 데이터베이스 생성
CREATE DATABASE global_business_hub;

# 확인
\l

# 종료
\q
```

### 3. 스키마 적용

```bash
# backend 폴더에서 실행
cd backend
psql -U postgres -d global_business_hub -f src/db/schema.sql
```

### 4. 연결 테스트

서버 시작 후 다음 API로 DB 연결 상태 확인:
```bash
curl http://localhost:3001/api/admin/db-status
```

정상 응답:
```json
{
  "success": true,
  "connected": true,
  "serverTime": "2024-12-17T12:00:00.000Z"
}
```

### 5. 과거 데이터 백필 (선택)

DB 설정 완료 후 과거 데이터를 집계하려면:

```bash
cd backend

# 최근 90일 데이터 백필
npx ts-node src/scripts/backfill.ts 2024-09-18 2024-12-16

# 특정 기간만 백필
npx ts-node src/scripts/backfill.ts 2024-12-01 2024-12-16

# Dry-run (실제 저장 없이 확인)
npx ts-node src/scripts/backfill.ts 2024-12-01 2024-12-16 --dry-run

# 백필 후 검증
npx ts-node src/scripts/backfill.ts 2024-12-01 2024-12-16 --verify
```

---

## ✅ 확인 방법

### 1. 파일 저장 확인
- 파일 이름이 정확히 `.env`인지 확인 (확장자 없음)
- `backend` 폴더 안에 있는지 확인

### 2. 값 확인
- 각 값에 따옴표나 공백이 잘못 들어가지 않았는지 확인
- `GOOGLE_SHEETS_PRIVATE_KEY`가 큰따옴표로 감싸져 있는지 확인

### 3. 서버 재시작
`.env` 파일을 저장한 후 서버를 재시작하세요:

```bash
# 서버 중지 (Ctrl + C)
# 그 다음 다시 실행
npm run dev
```

### 4. 오류 확인
서버 재시작 후:
- `Error: No key or keyFile set.` 오류가 사라졌는지 확인
- `🚀 Server is running on http://localhost:3001` 메시지만 보이는지 확인

## 🐛 문제 해결

### 문제 1: "No key or keyFile set" 오류가 계속됨
**해결:**
1. `.env` 파일이 `backend` 폴더에 있는지 확인
2. 파일 이름이 정확히 `.env`인지 확인 (`.env.txt` 아님)
3. 각 값이 올바르게 입력되었는지 확인
4. 서버를 완전히 중지하고 재시작

### 문제 2: "401 Unauthorized" 오류
**해결:**
1. Google Sheets에 서비스 계정이 공유되었는지 확인
2. 서비스 계정 권한이 "편집자"인지 확인
3. `GOOGLE_SHEETS_CLIENT_EMAIL` 값이 정확한지 확인

### 문제 3: "The caller does not have permission" 오류
**해결:**
1. Google Sheets API가 활성화되었는지 확인
2. 서비스 계정에 올바른 권한이 있는지 확인

## 📞 추가 도움

문제가 계속되면:
1. `backend/.env` 파일 내용 확인 (민감 정보 제외)
2. 서버 로그의 전체 오류 메시지 확인
3. [QUICK_START.md](../QUICK_START.md) 파일의 "Google Sheets API 설정" 섹션 재확인


