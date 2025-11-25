# 🔧 .env 파일 수정 가이드

## 현재 상태

`.env` 파일 내용은 정상적으로 보이지만, 서버가 읽지 못하는 경우가 있습니다.

## 해결 방법

### 방법 1: 메모장으로 다시 저장 (권장)

1. **메모장으로 .env 파일 열기**
   ```bash
   cd "C:\Users\김지훈\Desktop\[Global Business셀] 김지훈\AI 자동화\고도화 작업\backend"
   notepad .env
   ```

2. **내용 확인**
   - 위에 제공한 정확한 형식과 비교
   - 각 줄 끝에 공백이 없는지 확인
   - `GOOGLE_SHEETS_PRIVATE_KEY`가 큰따옴표로 올바르게 감싸져 있는지 확인

3. **다시 저장**
   - **파일** → **다른 이름으로 저장**
   - 파일 이름: `.env` (확장자 없음)
   - 파일 형식: **"모든 파일(*.*)"** 선택 ⚠️ 중요!
   - 인코딩: **UTF-8** 선택
   - 저장

### 방법 2: 명령 프롬프트로 재생성

기존 파일을 백업하고 새로 생성:

```bash
cd "C:\Users\김지훈\Desktop\[Global Business셀] 김지훈\AI 자동화\고도화 작업\backend"

# 기존 파일 백업
copy .env .env.backup

# 새 파일 생성
(
echo GOOGLE_SHEETS_SPREADSHEET_ID=18wVO8auhIrGiZR0TpuqzdBVqByxPBi-3LxypKCwExe8
echo.
echo GOOGLE_SHEETS_CLIENT_EMAIL=sheets-reader@global-business-hub.iam.gserviceaccount.com
echo.
echo GOOGLE_SHEETS_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCn54Q3z3J0tnOk\nnij5Gnyo41CofGxN14yYZxwRNNJSIUqEZOtDTwzMIg8Y6+yaol9C+979mOURtlKi\n2wam9mp9L+3+e57xZnobZI95GZ81zwfgWTxbLGznpDg5NSJGWSlzkyK3QzAztC3S\nfm8NZegHonS7qIUJkLBC/D4E4sVQaX8DoLIYCWZmzU9/37A01Unnn1N0tA9ct5bZ\nBRHm5kR7g/Nqq+j5c25Ko7GRBcjfooG27Eiq+IatP+cViwPoIREaOPEu/T1toIO8\nwY2YHtulaTKR8wgh6pIRdPeWLwoOLykVJz+lmmGpUHW13ntILa43QcMxCYBw/ZCM\nemzLDjftAgMBAAECggEASgbuiea5+VBJ2z3qJa3yYUnbkXVOEOHkeHsZalKmGhTY\ndFfETChJpaSskFnQNvs40eEXlyq2cCE4/NlhbPJ+z9P2c7lQQfFjC7nB8ewEgGZX\nfCgLzsze9SA3s61D/80m0/B+oVsLoPgjLceVscwIyXjsS6KIiUeUFux8cY4D3af2\nKhrqf/Ct3HmsWANjmr/+9qX6JgzYAPVIrgxx7OhW5cbBGuaPQsrABvb2mXbUTBEi\nJ+NMGBd7GtKhzaPDkpL9G2srktzV28Qd+qmIEhSV8qIRIm7aWXLQdJNyOryszkPm\nhFUyzU9/y8MncLiM9+/P/yjHYLrRptp5FR9SW8BrBwKBgQDhJpr+WSKIjpwR+oad\n/aZKqchXrWWOg1QiXTplSOzzdHTGFthnXAI/JJdf9AQZUKXbu96hVLHIG0In6bla\nx0u6A1ks559XiJBmbC0RmyIqnHS4zvHhucihz7Uik5YhP+2Zh0DM3zQzWtLUHO1B\ngr7+oMOAFCLxipjGBhMNW49t5wKBgQC+6O7/d6iPycOKJviZmMYJjZismR22OhYg\nE9snXeJRcoguWpNvYyK0nGt33uJnZE4rhSSS/KwCqOMmAlPu/CPPW5af4wRRojmF\n649uoq+53ubXqZp/Z8f6DWXGFGkq+u4N8kaMsb6GjpMCGGHJuKHCRyRqF3IWjRXt\nD0sTIBGpCwKBgEY22eM0PPbFMprQvCaNMczbAeWF58P35McKt+laQrrxuHEGMtqY\n8QJsEOEVoima4v6Rqi450W+MQKdd1jYfLNiHrsm4OhL8PbwTRELXVGJhhG0V7Izu\neUktE1oDGLCp1Rkp+uVpPkg9rL4Ff2AMvC+ARzesD/GvvVEUF+D0ithFAoGAVybD\nJECd5LY42/KafpPtpCLN1c04cR3nR9GItFn5nTDp1i9nKuxYxZa6wMgxFv4FaXyo\ni6lpZPVwbMOXSXw1ZM3s3ySlrhaep/I3UkxWaEXHoCA+9XaNJivDkD91GzfeQOOf\nLU9fKNIhbk1vJsVwot4TU5NMc9sIbWYT4bE8Hq0CgYEAwBUc1AqxcJCFfjbgpqQ5\nEWFT5iYx/8r6t2v84qbRWHegkVpHH/5hkRtVoIANrBZpM270ekh4ZteZfrIuCaED\nBmlUrtqI4DnsuKsmvgOox6WV5voem0J6z4Q+ndHQrYfjSBjod/k/26w2AbCnAqHb\nRjHM+Ct78FXl2H5u9vDuzfE=\n-----END PRIVATE KEY-----\n"
echo.
echo PORT=3001
echo.
echo OLLAMA_BASE_URL=http://localhost:11434
echo.
echo OLLAMA_MODEL=llama3
) > .env

# 메모장으로 열어서 확인
notepad .env
```

그 다음 메모장에서 내용을 확인하고 저장하세요.

## ✅ 확인 사항

### 1. 파일 이름
```bash
dir .env
```
다음과 같이 표시되어야 함:
```
2025-11-25  오후 05:00             1,997 .env
```

### 2. 파일 내용
```bash
type .env
```
각 값이 올바르게 표시되는지 확인

### 3. 서버 재시작
`.env` 파일을 수정한 후 **반드시** 서버를 재시작하세요:

```bash
# 서버 중지 (Ctrl + C)
# 다시 시작
cd "C:\Users\김지훈\Desktop\[Global Business셀] 김지훈\AI 자동화\고도화 작업"
npm run dev
```

## 🎯 정상 작동 확인

서버 재시작 후 로그에서:
- ✅ `✅ 환경 변수 로드 성공` 메시지 확인
- ✅ `🚀 Server is running on http://localhost:3001` 메시지 확인
- ❌ `❌ 환경 변수 오류` 메시지가 없어야 함

브라우저에서:
- `http://localhost:3000` 접속
- 대시보드에서 데이터가 표시되는지 확인


