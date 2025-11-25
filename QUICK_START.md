# 🚀 대시보드 실행 가이드 (초보자용)

이 가이드는 개발 경험이 없어도 따라할 수 있도록 작성되었습니다. 각 단계를 순서대로 진행하세요.

---

## 📋 1단계: 필수 프로그램 설치 확인

### Node.js 설치 확인
1. **Windows 키 + R**을 누르고 `cmd`를 입력한 후 Enter
2. 검은 창(명령 프롬프트)이 열리면 다음 명령어 입력:
   ```
   node --version
   ```
3. 버전 번호가 나오면 설치됨 (예: v18.17.0)
4. **설치되지 않았다면**: https://nodejs.org 에서 LTS 버전 다운로드 및 설치

---

## 📋 2단계: Google Sheets API 설정

### 2-1. Google Cloud Console 접속
1. 웹 브라우저에서 https://console.cloud.google.com 접속
2. Google 계정으로 로그인

### 2-2. 프로젝트 생성
1. 상단의 프로젝트 선택 메뉴 클릭
2. **"새 프로젝트"** 클릭
3. 프로젝트 이름 입력 (예: "Global Business Hub")
4. **"만들기"** 클릭
5. 생성된 프로젝트 선택

### 2-3. Google Sheets API 활성화
1. 왼쪽 메뉴에서 **"API 및 서비스"** → **"라이브러리"** 클릭
2. 검색창에 **"Google Sheets API"** 입력
3. **"Google Sheets API"** 클릭
4. **"사용 설정"** 버튼 클릭

### 2-4. 서비스 계정 생성
1. 왼쪽 메뉴에서 **"API 및 서비스"** → **"사용자 인증 정보"** 클릭
2. 상단의 **"+ 사용자 인증 정보 만들기"** 클릭
3. **"서비스 계정"** 선택
4. 서비스 계정 이름 입력 (예: "sheets-reader")
5. **"만들기"** 클릭
6. 역할은 건너뛰고 **"완료"** 클릭

### 2-5. 키 파일 다운로드
1. 생성된 서비스 계정을 클릭
2. 상단 탭에서 **"키"** 클릭
3. **"키 추가"** → **"새 키 만들기"** 클릭
4. 키 유형: **"JSON"** 선택
5. **"만들기"** 클릭
6. JSON 파일이 자동으로 다운로드됨 (예: `프로젝트명-xxxxx.json`)

### 2-6. JSON 파일에서 정보 추출
다운로드한 JSON 파일을 메모장으로 열어서 다음 정보를 확인하세요:
- `client_email`: 서비스 계정 이메일 (예: `sheets-reader@프로젝트명.iam.gserviceaccount.com`)
- `private_key`: 긴 문자열 (-----BEGIN PRIVATE KEY----- 로 시작)

### 2-7. Google Sheets에 서비스 계정 공유
1. 사용 중인 Google Sheets 열기
2. 우측 상단의 **"공유"** 버튼 클릭
3. 2-6에서 확인한 `client_email` 주소 입력
4. 권한: **"편집자"** 선택
5. **"보내기"** 클릭

### 2-8. 스프레드시트 ID 확인
Google Sheets URL에서 ID 확인:
```
https://docs.google.com/spreadsheets/d/[여기가_ID]/edit
```
예: `https://docs.google.com/spreadsheets/d/1abc123def456ghi789/edit`
→ ID는 `1abc123def456ghi789`

---

## 📋 3단계: 프로젝트 파일 준비

### 3-1. 프로젝트 폴더 위치 확인
현재 프로젝트가 있는 폴더 경로를 확인하세요:
```
C:\Users\김지훈\Desktop\[Global Business셀] 김지훈\AI 자동화\고도화 작업
```

### 3-2. 파일 탐색기에서 확인
1. 위 경로로 이동
2. 다음 폴더들이 있는지 확인:
   - `backend` 폴더
   - `frontend` 폴더
   - `package.json` 파일

---

## 📋 4단계: 환경 변수 파일 생성

### 4-1. 백엔드 환경 변수 파일 생성
1. `backend` 폴더 안에 `.env` 파일 생성 (메모장 사용)
2. 다음 내용을 복사하여 붙여넣기:

```env
GOOGLE_SHEETS_SPREADSHEET_ID=여기에_스프레드시트_ID_입력
GOOGLE_SHEETS_CLIENT_EMAIL=여기에_서비스_계정_이메일_입력
GOOGLE_SHEETS_PRIVATE_KEY="여기에_개인키_전체_입력"

PORT=3001

OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3
```

### 4-2. 실제 값 입력 방법
**예시:**
```env
GOOGLE_SHEETS_SPREADSHEET_ID=1abc123def456ghi789
GOOGLE_SHEETS_CLIENT_EMAIL=sheets-reader@my-project.iam.gserviceaccount.com
GOOGLE_SHEETS_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n"

PORT=3001
```

**⚠️ 중요 사항:**
- `GOOGLE_SHEETS_PRIVATE_KEY`는 JSON 파일의 `private_key` 값을 **전체** 복사
- 줄바꿈 문자(`\n`)는 그대로 유지
- 큰따옴표로 감싸기
- 파일 저장 시 인코딩: **UTF-8** 선택

### 4-3. 프론트엔드 환경 변수 파일 생성
1. `frontend` 폴더 안에 `.env.local` 파일 생성
2. 다음 내용 입력:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

---

## 📋 5단계: 프로그램 설치

### 5-1. 명령 프롬프트 열기
1. **Windows 키 + R** → `cmd` 입력 → Enter
2. 또는 파일 탐색기에서 프로젝트 폴더로 이동 후 주소창에 `cmd` 입력 → Enter

### 5-2. 루트 폴더에서 설치
명령 프롬프트에서 다음 명령어를 **순서대로** 실행:

```bash
cd "C:\Users\김지훈\Desktop\[Global Business셀] 김지훈\AI 자동화\고도화 작업"
npm install
```

**설치가 완료될 때까지 기다리세요 (1-2분 소요)**

### 5-3. 백엔드 폴더에서 설치
```bash
cd backend
npm install
```

**설치가 완료될 때까지 기다리세요 (1-2분 소요)**

### 5-4. 프론트엔드 폴더에서 설치
```bash
cd ../frontend
npm install
```

**설치가 완료될 때까지 기다리세요 (2-3분 소요)**

---

## 📋 6단계: 서버 실행

### 방법 1: 자동 실행 (권장)
1. 프로젝트 루트 폴더로 이동:
   ```bash
   cd "C:\Users\김지훈\Desktop\[Global Business셀] 김지훈\AI 자동화\고도화 작업"
   ```
2. 다음 명령어 실행:
   ```bash
   npm run dev
   ```
3. 두 개의 서버가 자동으로 실행됩니다:
   - 백엔드: http://localhost:3001
   - 프론트엔드: http://localhost:3000

### 방법 2: 수동 실행 (문제 해결용)
**터미널 1 (백엔드):**
```bash
cd "C:\Users\김지훈\Desktop\[Global Business셀] 김지훈\AI 자동화\고도화 작업\backend"
npm run dev
```

**터미널 2 (프론트엔드) - 새 명령 프롬프트 창 열기:**
```bash
cd "C:\Users\김지훈\Desktop\[Global Business셀] 김지훈\AI 자동화\고도화 작업\frontend"
npm run dev
```

---

## 📋 7단계: 대시보드 접속

1. 웹 브라우저 열기 (Chrome, Edge 등)
2. 주소창에 입력: `http://localhost:3000`
3. Enter 키 누르기
4. 대시보드 홈페이지가 표시되면 성공!

---

## ✅ 실행 확인 체크리스트

- [ ] Node.js가 설치되어 있음 (`node --version` 실행 시 버전 표시)
- [ ] Google Sheets API가 활성화됨
- [ ] 서비스 계정이 생성되고 키 파일이 다운로드됨
- [ ] Google Sheets에 서비스 계정이 공유됨 (편집자 권한)
- [ ] `backend/.env` 파일이 생성되고 올바른 값이 입력됨
- [ ] `frontend/.env.local` 파일이 생성됨
- [ ] `npm install`이 모든 폴더에서 완료됨
- [ ] 서버가 실행 중임 (터미널에 에러 없음)
- [ ] 브라우저에서 `http://localhost:3000` 접속 가능

---

## 🐛 문제 해결

### 문제 1: "node: command not found"
**해결**: Node.js가 설치되지 않았습니다. https://nodejs.org 에서 설치하세요.

### 문제 2: "npm: command not found"
**해결**: Node.js 설치 후 명령 프롬프트를 다시 시작하세요.

### 문제 3: "Cannot find module" 오류
**해결**: 해당 폴더에서 `npm install`을 실행하세요.

### 문제 4: "EADDRINUSE: address already in use"
**해결**: 포트가 사용 중입니다. 
- 다른 프로그램을 종료하거나
- `backend/.env`에서 `PORT=3002`로 변경

### 문제 5: Google Sheets 데이터가 안 보임
**해결**: 
- `backend/.env` 파일의 값이 올바른지 확인
- Google Sheets에 서비스 계정이 공유되었는지 확인
- 서비스 계정 권한이 "편집자"인지 확인

### 문제 6: "401 Unauthorized" 오류
**해결**: 
- `GOOGLE_SHEETS_PRIVATE_KEY`의 큰따옴표와 줄바꿈(`\n`) 확인
- JSON 파일의 `private_key` 값을 정확히 복사했는지 확인

---

## 📞 추가 도움말

문제가 계속되면 다음 정보를 확인하세요:
1. 명령 프롬프트에 표시된 오류 메시지
2. `backend/.env` 파일 내용 (민감 정보 제외)
3. 브라우저 개발자 도구의 콘솔 오류 (F12 키)

---

## 🎉 성공!

대시보드가 정상적으로 실행되면 다음 페이지들을 사용할 수 있습니다:
- 📊 메인 대시보드
- 🚨 미입고 관리
- 🚚 물류 추적
- 📡 물류 관제 센터
- 📈 성과 분석
- 🔍 통합 검색


