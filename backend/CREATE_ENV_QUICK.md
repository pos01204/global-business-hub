# ⚡ 빠른 .env 파일 생성 가이드

## 가장 쉬운 방법 (3단계)

### 1단계: 메모장 열기
- **Windows 키 + R** → `notepad` 입력 → Enter

### 2단계: 내용 입력
다음 내용을 복사하여 붙여넣기:

```env
GOOGLE_SHEETS_SPREADSHEET_ID=여기에_스프레드시트_ID_입력
GOOGLE_SHEETS_CLIENT_EMAIL=여기에_서비스_계정_이메일_입력
GOOGLE_SHEETS_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n여기에_개인키_전체_입력\n-----END PRIVATE KEY-----\n"

PORT=3001
```

### 3단계: 저장하기
1. **파일** → **다른 이름으로 저장**
2. `backend` 폴더로 이동
3. 파일 이름: `.env` 입력
4. **파일 형식**: **"모든 파일(*.*)"** 선택 ⚠️ 중요!
5. **저장** 클릭

---

## 기존 .txt 파일이 있다면

### 방법 1: 파일 이름 변경
1. 파일 탐색기에서 **보기** → **파일 이름 확장자** 체크
2. `.env.txt` 파일 찾기
3. 우클릭 → **이름 바꾸기**
4. `.env.txt` → `.env`로 변경
5. 경고 창에서 **예** 클릭

### 방법 2: 명령 프롬프트 사용
```bash
cd "C:\Users\김지훈\Desktop\[Global Business셀] 김지훈\AI 자동화\고도화 작업\backend"
ren .env.txt .env
```

---

## 확인 방법

명령 프롬프트에서:
```bash
cd backend
dir .env
```

다음과 같이 표시되면 성공:
```
2025-11-25  오후 05:00             123 .env
```

---

## ⚠️ 중요 사항

- 파일 이름: `.env` (점으로 시작, 확장자 없음)
- 파일 위치: `backend` 폴더 안
- 파일 형식: 저장 시 "모든 파일(*.*)" 선택 필수!


