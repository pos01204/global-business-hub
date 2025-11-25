# 🔐 환경 변수 설정 가이드

## 📍 파일 위치

`backend` 폴더 안에 `.env` 파일을 생성하세요.

**경로:**
```
backend/.env
```

## 📝 파일 내용

`.env` 파일에 다음 내용을 입력하세요:

```env
GOOGLE_SHEETS_SPREADSHEET_ID=여기에_스프레드시트_ID_입력
GOOGLE_SHEETS_CLIENT_EMAIL=여기에_서비스_계정_이메일_입력
GOOGLE_SHEETS_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n여기에_개인키_전체_입력\n-----END PRIVATE KEY-----\n"

PORT=3001
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


