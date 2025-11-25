# 🔧 ENOWORKSPACES 오류 해결 가이드

## 문제 상황

`npm run dev` 실행 시 다음과 같은 오류가 발생:
```
npm error code ENOWORKSPACES
npm error This command does not support workspaces.
```

하지만 서버는 정상적으로 실행됨:
- ✅ 백엔드: `🚀 Server is running on http://localhost:3001`
- ✅ 프론트엔드: `✓ Ready in 4.9s`

## 원인

루트 `package.json`에 `workspaces` 설정이 있어서 Next.js가 내부적으로 workspace를 감지하려고 할 때 충돌이 발생했습니다.

## 해결 방법

루트 `package.json`에서 `workspaces` 설정을 제거했습니다. 이제 다음 단계를 진행하세요:

### 1단계: 서버 재시작

현재 실행 중인 서버를 중지하고 다시 시작하세요:

1. 터미널에서 `Ctrl + C`를 눌러 서버 중지
2. 다음 명령어로 다시 시작:
   ```bash
   npm run dev
   ```

### 2단계: 정상 실행 확인

서버가 정상적으로 시작되면 다음과 같은 메시지가 표시됩니다:

**정상 실행 시:**
```
[0] ▲ Next.js 14.0.4
[0] - Local:        http://localhost:3000
[0] ✓ Ready in X.Xs

[1] ✅ 환경 변수 로드 성공
[1] 🚀 Server is running on http://localhost:3001
```

**오류 없이 실행되면 성공입니다!**

### 3단계: 브라우저 접속

브라우저에서 다음 주소로 접속하세요:
- **프론트엔드**: http://localhost:3000
- **백엔드 API**: http://localhost:3001/health

## 참고 사항

- `workspaces` 설정을 제거했지만, 프로젝트 구조와 기능에는 영향이 없습니다.
- `concurrently`를 사용하여 프론트엔드와 백엔드를 동시에 실행하는 방식은 그대로 유지됩니다.
- 각 폴더(`frontend`, `backend`)는 독립적으로 `package.json`을 가지고 있어 정상 작동합니다.

## 추가 문제 해결

만약 여전히 오류가 발생한다면:

1. **캐시 정리:**
   ```bash
   # 루트 디렉토리에서
   npm cache clean --force
   ```

2. **node_modules 재설치:**
   ```bash
   # 루트 디렉토리에서
   rm -rf node_modules
   npm install
   
   # 프론트엔드에서
   cd frontend
   rm -rf node_modules
   npm install
   
   # 백엔드에서
   cd ../backend
   rm -rf node_modules
   npm install
   ```

3. **개별 서버 실행 (문제 해결용):**
   - 터미널 1: `cd backend && npm run dev`
   - 터미널 2: `cd frontend && npm run dev`


