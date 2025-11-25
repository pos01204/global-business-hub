# ✅ 설치 체크리스트

각 항목을 완료하면 체크박스에 ✓ 표시하세요.

## 1단계: 기본 환경 설정
- [ ] Node.js 설치 확인 (`node --version` 실행)
- [ ] 프로젝트 폴더 위치 확인

## 2단계: Google Sheets API 설정
- [ ] Google Cloud Console 프로젝트 생성
- [ ] Google Sheets API 활성화
- [ ] 서비스 계정 생성
- [ ] JSON 키 파일 다운로드
- [ ] Google Sheets에 서비스 계정 공유 (편집자 권한)
- [ ] 스프레드시트 ID 확인

## 3단계: 환경 변수 설정
- [ ] `backend/.env` 파일 생성
- [ ] `GOOGLE_SHEETS_SPREADSHEET_ID` 입력
- [ ] `GOOGLE_SHEETS_CLIENT_EMAIL` 입력
- [ ] `GOOGLE_SHEETS_PRIVATE_KEY` 입력 (큰따옴표 포함)
- [ ] `frontend/.env.local` 파일 생성
- [ ] `NEXT_PUBLIC_API_URL` 입력

## 4단계: 프로그램 설치
- [ ] 루트 폴더에서 `npm install` 실행
- [ ] `backend` 폴더에서 `npm install` 실행
- [ ] `frontend` 폴더에서 `npm install` 실행
- [ ] 모든 설치가 오류 없이 완료됨

## 5단계: 서버 실행
- [ ] `npm run dev` 실행 (루트 폴더)
- [ ] 백엔드 서버 실행 확인 (터미널에 "Server is running on http://localhost:3001" 표시)
- [ ] 프론트엔드 서버 실행 확인 (터미널에 "Local: http://localhost:3000" 표시)

## 6단계: 접속 확인
- [ ] 브라우저에서 `http://localhost:3000` 접속
- [ ] 홈페이지가 정상적으로 표시됨
- [ ] 각 페이지 링크 클릭 시 정상 작동

## 완료!
모든 항목을 체크했다면 대시보드가 정상적으로 실행 중입니다! 🎉


