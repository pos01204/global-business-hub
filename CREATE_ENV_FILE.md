# 📝 .env 파일 생성 방법 (Windows)

Windows에서 확장자 없는 `.env` 파일을 만드는 방법입니다.

---

## 방법 1: 메모장 사용 (가장 간단)

### 1단계: 메모장 열기
1. **Windows 키 + R** 누르기
2. `notepad` 입력 후 Enter
3. 메모장이 열립니다

### 2단계: 내용 입력
메모장에 다음 내용을 입력하세요:

```env
GOOGLE_SHEETS_SPREADSHEET_ID=여기에_스프레드시트_ID_입력
GOOGLE_SHEETS_CLIENT_EMAIL=여기에_서비스_계정_이메일_입력
GOOGLE_SHEETS_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n여기에_개인키_전체_입력\n-----END PRIVATE KEY-----\n"

PORT=3001
```

### 3단계: 저장하기 (중요!)
1. **파일** → **다른 이름으로 저장** 클릭
2. **파일 탐색기**에서 `backend` 폴더로 이동:
   ```
   C:\Users\김지훈\Desktop\[Global Business셀] 김지훈\AI 자동화\고도화 작업\backend
   ```
3. **파일 이름** 입력: `.env` (점으로 시작, 확장자 없음)
4. **파일 형식** 선택: **"모든 파일(*.*)"** ⚠️ 중요!
5. **인코딩** 선택: **UTF-8** (한글이 포함된 경우)
6. **저장** 클릭

### 4단계: 확인
- 파일 이름이 `.env`로 표시되는지 확인
- `.env.txt`가 아닌 `.env`여야 합니다

---

## 방법 2: 명령 프롬프트 사용

### 1단계: 명령 프롬프트 열기
1. **Windows 키 + R** 누르기
2. `cmd` 입력 후 Enter

### 2단계: backend 폴더로 이동
```bash
cd "C:\Users\김지훈\Desktop\[Global Business셀] 김지훈\AI 자동화\고도화 작업\backend"
```

### 3단계: .env 파일 생성
```bash
echo. > .env
```

### 4단계: 메모장으로 열기
```bash
notepad .env
```

### 5단계: 내용 입력 및 저장
- 메모장에 내용 입력
- **저장** (Ctrl + S)
- 메모장 닫기

---

## 방법 3: 기존 .txt 파일 이름 변경

### 1단계: 파일 탐색기 열기
1. `backend` 폴더로 이동
2. 파일 탐색기에서 **보기** 탭 클릭
3. **파일 이름 확장자** 체크박스 활성화

### 2단계: 파일 이름 변경
1. `.env.txt` 파일을 찾기
2. 파일을 **우클릭** → **이름 바꾸기**
3. `.env.txt` → `.env`로 변경
4. Enter 키 누르기
5. **"확장자를 변경하면 파일을 사용할 수 없게 될 수 있습니다"** 경고가 나오면 **예** 클릭

### 3단계: 확인
- 파일 이름이 `.env`로 표시되는지 확인
- 아이콘이 텍스트 파일 아이콘에서 일반 파일 아이콘으로 변경됨

---

## 방법 4: PowerShell 사용

### 1단계: PowerShell 열기
1. **Windows 키 + X** 누르기
2. **Windows PowerShell** 선택

### 2단계: backend 폴더로 이동
```powershell
cd "C:\Users\김지훈\Desktop\[Global Business셀] 김지훈\AI 자동화\고도화 작업\backend"
```

### 3단계: .env 파일 생성
```powershell
New-Item -Path .env -ItemType File
```

### 4단계: 메모장으로 열기
```powershell
notepad .env
```

### 5단계: 내용 입력 및 저장
- 메모장에 내용 입력
- **저장** (Ctrl + S)

---

## ✅ 파일 생성 확인 방법

### 방법 1: 파일 탐색기에서 확인
1. `backend` 폴더 열기
2. 파일 이름이 `.env`인지 확인
3. 파일 형식이 "ENV 파일" 또는 "파일"로 표시되는지 확인

### 방법 2: 명령 프롬프트에서 확인
```bash
cd "C:\Users\김지훈\Desktop\[Global Business셀] 김지훈\AI 자동화\고도화 작업\backend"
dir .env
```

다음과 같이 표시되면 성공:
```
2025-11-25  오후 05:00             123 .env
```

### 방법 3: 파일 속성 확인
1. `.env` 파일을 **우클릭** → **속성**
2. **파일 형식**이 "ENV 파일" 또는 "파일"로 표시되는지 확인
3. **확장자**가 없거나 빈 값인지 확인

---

## ⚠️ 주의사항

### 1. 파일 이름
- ✅ 올바름: `.env`
- ❌ 잘못됨: `.env.txt`, `env.txt`, `.env.txt.txt`

### 2. 파일 위치
- ✅ 올바른 위치: `backend\.env`
- ❌ 잘못된 위치: `backend\.env.txt`, 루트 폴더의 `.env`

### 3. 파일 내용
- 각 줄 끝에 공백이 없어야 합니다
- 큰따옴표는 `GOOGLE_SHEETS_PRIVATE_KEY` 값에만 사용합니다
- 줄바꿈 문자(`\n`)는 그대로 유지합니다

---

## 🐛 문제 해결

### 문제 1: "파일 이름에 점(.)을 사용할 수 없습니다"
**해결**: 
- 파일 이름을 `env`로 저장한 후
- 명령 프롬프트에서 이름 변경:
  ```bash
  cd backend
  ren env .env
  ```

### 문제 2: 저장 후에도 .txt로 표시됨
**해결**:
- 파일 탐색기에서 **보기** → **파일 이름 확장자** 활성화
- 파일 이름을 `.env.txt` → `.env`로 변경

### 문제 3: 파일이 보이지 않음
**해결**:
- 파일 탐색기에서 **보기** → **숨김 파일** 체크
- 또는 명령 프롬프트에서:
  ```bash
  dir /a
  ```

---

## 📋 체크리스트

- [ ] `.env` 파일이 `backend` 폴더에 생성됨
- [ ] 파일 이름이 정확히 `.env`임 (확장자 없음)
- [ ] 파일 내용이 올바르게 입력됨
- [ ] 각 환경 변수 값이 올바름
- [ ] `GOOGLE_SHEETS_PRIVATE_KEY`가 큰따옴표로 감싸져 있음
- [ ] 파일이 저장됨

---

## 🎯 다음 단계

`.env` 파일을 생성한 후:

1. **서버 재시작**
   ```bash
   # 현재 서버 중지 (Ctrl + C)
   npm run dev
   ```

2. **오류 확인**
   - `Error: No key or keyFile set.` 오류가 사라졌는지 확인
   - `🚀 Server is running on http://localhost:3001` 메시지만 보이는지 확인

3. **브라우저에서 테스트**
   - `http://localhost:3000` 접속
   - 대시보드에서 데이터가 표시되는지 확인


