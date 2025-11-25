# 🔍 환경 변수 확인 가이드

## 현재 상태 분석

### ✅ 정상 작동 중
- ✅ 프론트엔드 서버: `http://localhost:3000` 실행 중
- ✅ 백엔드 서버: `http://localhost:3001` 실행 중
- ✅ 서버 컴파일 완료

### ⚠️ 문제 발견
- ❌ 환경 변수 오류: `.env` 파일이 없거나 값이 비어있음
- ❌ Google Sheets 데이터를 가져올 수 없음

---

## 🔧 해결 방법

### 1단계: .env 파일 확인

명령 프롬프트에서 다음 명령어 실행:

```bash
cd "C:\Users\김지훈\Desktop\[Global Business셀] 김지훈\AI 자동화\고도화 작업\backend"
dir .env
```

**결과 확인:**
- 파일이 보이면 → 2단계로 진행
- "파일을 찾을 수 없습니다" → `.env` 파일 생성 필요

### 2단계: .env 파일 내용 확인

`.env` 파일이 있다면 내용을 확인하세요:

```bash
type .env
```

또는 메모장으로 열기:
```bash
notepad .env
```

### 3단계: 필수 값 확인

`.env` 파일에 다음 3개 값이 모두 있어야 합니다:

```env
GOOGLE_SHEETS_SPREADSHEET_ID=값이_있어야_함
GOOGLE_SHEETS_CLIENT_EMAIL=값이_있어야_함
GOOGLE_SHEETS_PRIVATE_KEY="값이_있어야_함"
```

**확인 사항:**
- [ ] `GOOGLE_SHEETS_SPREADSHEET_ID` 값이 있음 (빈 값 아님)
- [ ] `GOOGLE_SHEETS_CLIENT_EMAIL` 값이 있음 (빈 값 아님)
- [ ] `GOOGLE_SHEETS_PRIVATE_KEY` 값이 있음 (큰따옴표 포함)

---

## 📝 .env 파일 생성/수정 방법

### 방법 1: 메모장으로 생성

1. **메모장 열기**
   ```bash
   notepad backend\.env
   ```

2. **다음 내용 입력** (실제 값으로 변경):
   ```env
   GOOGLE_SHEETS_SPREADSHEET_ID=1abc123def456ghi789
   GOOGLE_SHEETS_CLIENT_EMAIL=sheets-reader@my-project.iam.gserviceaccount.com
   GOOGLE_SHEETS_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n"
   
   PORT=3001
   ```

3. **저장** (Ctrl + S)
4. **파일 형식**: "모든 파일(*.*)" 선택 (중요!)

### 방법 2: 명령 프롬프트로 생성

```bash
cd backend
echo GOOGLE_SHEETS_SPREADSHEET_ID=여기에_값_입력 > .env
echo GOOGLE_SHEETS_CLIENT_EMAIL=여기에_값_입력 >> .env
echo GOOGLE_SHEETS_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n여기에_값_입력\n-----END PRIVATE KEY-----\n" >> .env
echo. >> .env
echo PORT=3001 >> .env
notepad .env
```

그 다음 메모장에서 실제 값으로 수정하고 저장하세요.

---

## ✅ 값 찾는 방법

### 1. GOOGLE_SHEETS_SPREADSHEET_ID
Google Sheets URL에서:
```
https://docs.google.com/spreadsheets/d/[여기가_ID]/edit
```

### 2. GOOGLE_SHEETS_CLIENT_EMAIL
Google Cloud Console에서 다운로드한 JSON 파일의 `client_email` 값

### 3. GOOGLE_SHEETS_PRIVATE_KEY
같은 JSON 파일의 `private_key` 값 전체 (큰따옴표로 감싸기)

---

## 🔄 서버 재시작

`.env` 파일을 수정한 후:

1. **현재 서버 중지**: Ctrl + C
2. **다시 실행**:
   ```bash
   npm run dev
   ```

3. **오류 확인**:
   - `❌ 환경 변수 오류` 메시지가 사라졌는지 확인
   - `🚀 Server is running on http://localhost:3001` 메시지만 보이는지 확인

---

## 🎯 정상 작동 확인

### 1. 백엔드 로그 확인
서버 재시작 후 다음과 같이 표시되면 정상:
```
🚀 Server is running on http://localhost:3001
```
(환경 변수 오류 메시지가 없어야 함)

### 2. 브라우저에서 확인
- `http://localhost:3000` 접속
- 대시보드 페이지에서 데이터가 표시되는지 확인

### 3. API 테스트
브라우저에서:
- `http://localhost:3001/health` → `{"status":"ok",...}` 응답 확인
- `http://localhost:3001/api/dashboard/main` → 데이터 JSON 응답 확인

---

## 🐛 문제 해결

### 문제 1: "파일을 찾을 수 없습니다"
**해결**: `.env` 파일이 `backend` 폴더에 없습니다. 위의 방법으로 생성하세요.

### 문제 2: 파일은 있는데 여전히 오류
**해결**: 
1. `.env` 파일 내용 확인 (`type .env`)
2. 각 값이 올바르게 입력되었는지 확인
3. 큰따옴표, 줄바꿈 문자(`\n`) 확인
4. 서버 재시작

### 문제 3: "401 Unauthorized" 오류
**해결**:
1. Google Sheets에 서비스 계정이 공유되었는지 확인
2. 서비스 계정 권한이 "편집자"인지 확인
3. `GOOGLE_SHEETS_CLIENT_EMAIL` 값이 정확한지 확인

---

## 📋 체크리스트

- [ ] `.env` 파일이 `backend` 폴더에 있음
- [ ] 파일 이름이 정확히 `.env`임 (확장자 없음)
- [ ] `GOOGLE_SHEETS_SPREADSHEET_ID` 값이 있음
- [ ] `GOOGLE_SHEETS_CLIENT_EMAIL` 값이 있음
- [ ] `GOOGLE_SHEETS_PRIVATE_KEY` 값이 있음 (큰따옴표 포함)
- [ ] 서버 재시작 후 오류 메시지가 사라짐
- [ ] 브라우저에서 데이터가 표시됨


