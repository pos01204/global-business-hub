# 🔧 설치 오류 해결 가이드

## 문제 상황
- `@langchain/ollama@^0.0.5` 패키지가 존재하지 않음
- `concurrently` 명령어를 찾을 수 없음
- `tsx` 명령어를 찾을 수 없음

## 해결 방법

### 1단계: 기존 node_modules 삭제 (선택사항)
오류가 계속되면 기존 설치 파일을 삭제하세요:

```bash
# 루트 폴더에서
rmdir /s /q node_modules
cd backend
rmdir /s /q node_modules
cd ../frontend
rmdir /s /q node_modules
cd ..
```

### 2단계: 올바른 순서로 설치

**중요: 다음 순서를 정확히 따라하세요!**

#### 2-1. 루트 폴더에서 설치
```bash
cd "C:\Users\김지훈\Desktop\[Global Business셀] 김지훈\AI 자동화\고도화 작업"
npm install
```

이 단계에서 `concurrently` 패키지가 설치됩니다.

#### 2-2. 백엔드 폴더에서 설치
```bash
cd backend
npm install
```

이 단계에서 `tsx`와 다른 백엔드 패키지들이 설치됩니다.

#### 2-3. 프론트엔드 폴더에서 설치
```bash
cd ../frontend
npm install
```

### 3단계: 설치 확인

각 폴더에서 `node_modules` 폴더가 생성되었는지 확인하세요:
- `node_modules` 폴더가 있어야 합니다
- 폴더 크기가 0이 아니어야 합니다

### 4단계: 서버 실행

#### 방법 1: 자동 실행 (권장)
```bash
# 루트 폴더에서
cd "C:\Users\김지훈\Desktop\[Global Business셀] 김지훈\AI 자동화\고도화 작업"
npm run dev
```

#### 방법 2: 수동 실행
**터미널 1 (백엔드):**
```bash
cd "C:\Users\김지훈\Desktop\[Global Business셀] 김지훈\AI 자동화\고도화 작업\backend"
npm run dev
```

**터미널 2 (프론트엔드) - 새 명령 프롬프트 창:**
```bash
cd "C:\Users\김지훈\Desktop\[Global Business셀] 김지훈\AI 자동화\고도화 작업\frontend"
npm run dev
```

---

## ✅ 성공 확인

설치가 성공했다면:
- 각 `npm install` 명령어가 오류 없이 완료됨
- `node_modules` 폴더가 각 폴더에 생성됨
- `npm run dev` 실행 시 서버가 시작됨

---

## 🐛 여전히 문제가 있다면

### 오류 1: "npm: command not found"
**해결**: Node.js가 설치되지 않았거나 PATH에 없습니다.
- Node.js 재설치: https://nodejs.org
- 명령 프롬프트 재시작

### 오류 2: "ETARGET" 또는 "No matching version"
**해결**: 패키지 버전 문제입니다.
- `package.json` 파일이 최신 버전인지 확인
- `package-lock.json` 파일 삭제 후 재설치:
  ```bash
  del package-lock.json
  npm install
  ```

### 오류 3: "EADDRINUSE" (포트 사용 중)
**해결**: 포트가 이미 사용 중입니다.
- 다른 프로그램 종료
- 또는 `backend/.env`에서 포트 변경

### 오류 4: 권한 오류
**해결**: 관리자 권한으로 실행:
- 명령 프롬프트를 **관리자 권한으로 실행**
- 또는 설치 경로의 권한 확인

---

## 📞 추가 도움

문제가 계속되면 다음 정보를 확인하세요:
1. Node.js 버전: `node --version`
2. npm 버전: `npm --version`
3. 오류 메시지 전체 내용
4. `package.json` 파일 내용


