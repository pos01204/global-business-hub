# 의존성 설치 가이드

## 문제 해결

`cheerio` 모듈을 찾을 수 없다는 에러가 발생했습니다. 다음 단계를 따라주세요:

## 해결 방법

### 1단계: 터미널 열기

Windows PowerShell 또는 명령 프롬프트를 엽니다.

### 2단계: backend 디렉토리로 이동

```bash
cd "C:\Users\김지훈\Desktop\[Global Business셀] 김지훈\AI 자동화\고도화 작업\backend"
```

또는 프로젝트 루트에서:

```bash
cd backend
```

### 3단계: 의존성 설치

```bash
npm install
```

이 명령어는 `package.json`에 있는 모든 의존성을 설치합니다:
- `cheerio` (웹 크롤링용)
- `@types/cheerio` (TypeScript 타입 정의)
- 기타 모든 패키지

### 4단계: 설치 확인

설치가 완료되면 `node_modules` 폴더가 생성됩니다.

### 5단계: 서버 재시작

```bash
npm run dev
```

## 빠른 해결 (한 줄 명령어)

프로젝트 루트 디렉토리에서:

```bash
cd backend && npm install && npm run dev
```

## 문제가 계속되면

1. `package-lock.json` 파일 삭제 후 재설치:
   ```bash
   cd backend
   del package-lock.json
   npm install
   ```

2. `node_modules` 폴더 삭제 후 재설치:
   ```bash
   cd backend
   rmdir /s node_modules
   npm install
   ```

3. npm 캐시 클리어:
   ```bash
   npm cache clean --force
   npm install
   ```








