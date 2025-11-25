# 🔍 환경 변수 디버깅 가이드

## 현재 상황

`.env` 파일은 정상적으로 생성되어 있지만, 서버가 환경 변수를 읽지 못하고 있습니다.

## 가능한 원인

1. **서버가 재시작되지 않음** - 환경 변수는 서버 시작 시에만 로드됨
2. **파일 인코딩 문제** - UTF-8이 아닐 수 있음
3. **줄바꿈 문자 문제** - Windows 줄바꿈(`\r\n`) 문제
4. **큰따옴표 문제** - 따옴표가 잘못 포함됨

## 해결 방법

### 1단계: 서버 완전히 재시작

**중요**: 환경 변수는 서버 시작 시에만 로드됩니다!

1. **현재 서버 중지**
   - 명령 프롬프트에서 **Ctrl + C** 두 번 누르기
   - 모든 프로세스가 종료될 때까지 기다리기

2. **서버 다시 시작**
   ```bash
   cd "C:\Users\김지훈\Desktop\[Global Business셀] 김지훈\AI 자동화\고도화 작업"
   npm run dev
   ```

### 2단계: 환경 변수 로드 확인

서버 재시작 후 로그를 확인하세요:

**정상:**
```
🚀 Server is running on http://localhost:3001
```
(환경 변수 오류 메시지가 없어야 함)

**오류:**
```
❌ 환경 변수 오류: backend/.env 파일을 확인하세요.
```

### 3단계: .env 파일 인코딩 확인

메모장으로 `.env` 파일을 열어서:

1. **파일** → **다른 이름으로 저장**
2. **인코딩** 확인: **UTF-8** 선택되어 있는지 확인
3. **저장** (변경 사항이 없어도 저장)

### 4단계: .env 파일 형식 확인

`.env` 파일이 다음과 같은 형식인지 확인:

```env
GOOGLE_SHEETS_SPREADSHEET_ID=18wVO8auhIrGiZR0TpuqzdBVqByxPBi-3LxypKCwExe8
GOOGLE_SHEETS_CLIENT_EMAIL=sheets-reader@global-business-hub.iam.gserviceaccount.com
GOOGLE_SHEETS_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCn54Q3z3J0tnOk\nnij5Gnyo41CofGxN14yYZxwRNNJSIUqEZOtDTwzMIg8Y6+yaol9C+979mOURtlKi\n2wam9mp9L+3+e57xZnobZI95GZ81zwfgWTxbLGznpDg5NSJGWSlzkyK3QzAztC3S\nfm8NZegHonS7qIUJkLBC/D4E4sVQaX8DoLIYCWZmzU9/37A01Unnn1N0tA9ct5bZ\nBRHm5kR7g/Nqq+j5c25Ko7GRBcjfooG27Eiq+IatP+cViwPoIREaOPEu/T1toIO8\nwY2YHtulaTKR8wgh6pIRdPeWLwoOLykVJz+lmmGpUHW13ntILa43QcMxCYBw/ZCM\nemzLDjftAgMBAAECggEASgbuiea5+VBJ2z3qJa3yYUnbkXVOEOHkeHsZalKmGhTY\ndFfETChJpaSskFnQNvs40eEXlyq2cCE4/NlhbPJ+z9P2c7lQQfFjC7nB8ewEgGZX\nfCgLzsze9SA3s61D/80m0/B+oVsLoPgjLceVscwIyXjsS6KIiUeUFux8cY4D3af2\nKhrqf/Ct3HmsWANjmr/+9qX6JgzYAPVIrgxx7OhW5cbBGuaPQsrABvb2mXbUTBEi\nJ+NMGBd7GtKhzaPDkpL9G2srktzV28Qd+qmIEhSV8qIRIm7aWXLQdJNyOryszkPm\nhFUyzU9/y8MncLiM9+/P/yjHYLrRptp5FR9SW8BrBwKBgQDhJpr+WSKIjpwR+oad\n/aZKqchXrWWOg1QiXTplSOzzdHTGFthnXAI/JJdf9AQZUKXbu96hVLHIG0In6bla\nx0u6A1ks559XiJBmbC0RmyIqnHS4zvHhucihz7Uik5YhP+2Zh0DM3zQzWtLUHO1B\ngr7+oMOAFCLxipjGBhMNW49t5wKBgQC+6O7/d6iPycOKJviZmMYJjZismR22OhYg\nE9snXeJRcoguWpNvYyK0nGt33uJnZE4rhSSS/KwCqOMmAlPu/CPPW5af4wRRojmF\n649uoq+53ubXqZp/Z8f6DWXGFGkq+u4N8kaMsb6GjpMCGGHJuKHCRyRqF3IWjRXt\nD0sTIBGpCwKBgEY22eM0PPbFMprQvCaNMczbAeWF58P35McKt+laQrrxuHEGMtqY\n8QJsEOEVoima4v6Rqi450W+MQKdd1jYfLNiHrsm4OhL8PbwTRELXVGJhhG0V7Izu\neUktE1oDGLCp1Rkp+uVpPkg9rL4Ff2AMvC+ARzesD/GvvVEUF+D0ithFAoGAVybD\nJECd5LY42/KafpPtpCLN1c04cR3nR9GItFn5nTDp1i9nKuxYxZa6wMgxFv4FaXyo\ni6lpZPVwbMOXSXw1ZM3s3ySlrhaep/I3UkxWaEXHoCA+9XaNJivDkD91GzfeQOOf\nLU9fKNIhbk1vJsVwot4TU5NMc9sIbWYT4bE8Hq0CgYEAwBUc1AqxcJCFfjbgpqQ5\nEWFT5iYx/8r6t2v84qbRWHegkVpHH/5hkRtVoIANrBZpM270ekh4ZteZfrIuCaED\nBmlUrtqI4DnsuKsmvgOox6WV5voem0J6z4Q+ndHQrYfjSBjod/k/26w2AbCnAqHb\nRjHM+Ct78FXl2H5u9vDuzfE=\n-----END PRIVATE KEY-----\n"
PORT=3001
```

**주의사항:**
- 각 줄 끝에 공백이 없어야 함
- `GOOGLE_SHEETS_PRIVATE_KEY`는 큰따옴표로 감싸져 있어야 함
- `\n`은 실제 줄바꿈이 아닌 문자열 `\n`이어야 함

## 테스트 방법

### 방법 1: 간단한 테스트 스크립트

`backend` 폴더에 `test-env.js` 파일 생성:

```javascript
require('dotenv').config();
console.log('SPREADSHEET_ID:', process.env.GOOGLE_SHEETS_SPREADSHEET_ID ? '있음' : '없음');
console.log('CLIENT_EMAIL:', process.env.GOOGLE_SHEETS_CLIENT_EMAIL ? '있음' : '없음');
console.log('PRIVATE_KEY:', process.env.GOOGLE_SHEETS_PRIVATE_KEY ? '있음' : '없음');
```

실행:
```bash
cd backend
node test-env.js
```

모두 "있음"으로 표시되면 정상입니다.

### 방법 2: 브라우저에서 확인

서버 재시작 후:
1. `http://localhost:3000` 접속
2. 대시보드 페이지에서 데이터가 표시되는지 확인
3. 브라우저 개발자 도구(F12) → Network 탭에서 API 요청 확인

## 추가 확인 사항

1. **파일 위치**: `.env` 파일이 `backend` 폴더에 있는지 확인
2. **파일 이름**: 정확히 `.env`인지 확인 (`.env.txt` 아님)
3. **서버 재시작**: 환경 변수 변경 후 반드시 서버 재시작

## 문제가 계속되면

1. `.env` 파일을 삭제하고 다시 생성
2. 메모장으로 열어서 UTF-8로 저장
3. 서버 완전히 재시작


