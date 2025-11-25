# 👋 여기서 시작하세요!

대시보드를 처음 실행하시나요? 아래 가이드를 따라하세요.

## 📖 가이드 선택

### 🚀 빠른 시작 (초보자용)
→ **[QUICK_START.md](./QUICK_START.md)** 파일을 열어주세요
- 개발 경험이 없어도 따라할 수 있습니다
- 각 단계를 그림으로 설명합니다
- 문제 해결 방법도 포함되어 있습니다

### 📋 체크리스트로 확인
→ **[SETUP_CHECKLIST.md](./SETUP_CHECKLIST.md)** 파일을 열어주세요
- 설치 과정을 체크리스트로 확인할 수 있습니다
- 빠르게 진행 상황을 파악할 수 있습니다

### 🔧 상세 설정 가이드
→ **[SETUP.md](./SETUP.md)** 파일을 열어주세요
- Google Sheets API 설정 방법
- Ollama 설치 방법
- 고급 설정 옵션

---

## ⚡ 가장 빠른 실행 방법 (요약)

1. **Node.js 설치** (없다면)
   - https://nodejs.org 에서 다운로드

2. **Google Sheets API 설정**
   - Google Cloud Console에서 프로젝트 생성
   - Google Sheets API 활성화
   - 서비스 계정 생성 및 JSON 키 다운로드
   - Google Sheets에 서비스 계정 공유

3. **환경 변수 파일 생성**
   - `backend/.env` 파일 생성 및 값 입력
   - `frontend/.env.local` 파일 생성 및 값 입력

4. **프로그램 설치**
   ```bash
   npm install
   cd backend && npm install
   cd ../frontend && npm install
   ```

5. **서버 실행**
   ```bash
   npm run dev
   ```

6. **브라우저에서 접속**
   - http://localhost:3000

---

## ❓ 문제가 있나요?

1. **[QUICK_START.md](./QUICK_START.md)**의 "문제 해결" 섹션 확인
2. 터미널에 표시된 오류 메시지 확인
3. 모든 체크리스트 항목이 완료되었는지 확인

---

## ✅ 완료 후 확인사항

- [ ] 브라우저에서 `http://localhost:3000` 접속 가능
- [ ] 홈페이지가 정상적으로 표시됨
- [ ] 각 페이지 링크가 작동함
- [ ] 데이터가 정상적으로 표시됨

**모든 항목이 체크되면 성공입니다! 🎉**


