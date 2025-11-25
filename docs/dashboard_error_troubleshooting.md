# 대시보드 데이터 오류 해결 가이드

## 🔍 오류: "데이터를 불러오는 중 문제가 발생했습니다"

이 오류는 대시보드가 백엔드 API에서 데이터를 가져오지 못할 때 발생합니다.

## ✅ 해결 방법

### 1단계: 백엔드 서버 실행 확인

대시보드는 `/api/dashboard/main` 엔드포인트를 호출합니다. 백엔드 서버가 실행 중인지 확인하세요.

**터미널에서 확인:**
```bash
cd backend
npm run dev
```

**예상 출력:**
```
서버가 포트 3001에서 실행 중입니다.
```

### 2단계: API 엔드포인트 직접 테스트

브라우저에서 다음 URL 접속:
```
http://localhost:3001/api/dashboard/main
```

또는 날짜 파라미터 포함:
```
http://localhost:3001/api/dashboard/main?startDate=2024-01-01&endDate=2024-01-31
```

### 3단계: 네트워크 오류 확인

브라우저 개발자 도구 (F12) → Network 탭에서:
1. 페이지 새로고침
2. `/api/dashboard/main` 요청 확인
3. 상태 코드 확인:
   - **200**: 성공 (데이터 문제일 수 있음)
   - **404**: 엔드포인트 없음
   - **500**: 서버 오류
   - **ERR_CONNECTION_REFUSED**: 백엔드 서버 미실행

## 🔧 문제 해결

### 문제 1: 백엔드 서버가 실행되지 않음

**증상:**
- `ERR_CONNECTION_REFUSED` 오류
- 네트워크 오류 메시지

**해결:**
```bash
cd backend
npm run dev
```

### 문제 2: 포트 충돌

**증상:**
- 포트 3001이 이미 사용 중

**해결:**
```bash
# Windows에서 포트 사용 중인 프로세스 찾기
netstat -ano | findstr :3001

# 프로세스 종료
taskkill /PID <프로세스ID> /F
```

### 문제 3: API 엔드포인트 오류

**증상:**
- 404 또는 500 오류

**해결:**
1. 백엔드 터미널의 오류 로그 확인
2. `backend/src/routes/dashboard.ts` 파일 확인
3. Google Sheets 연결 확인

### 문제 4: Google Sheets 연결 문제

**증상:**
- API는 응답하지만 데이터가 없음

**해결:**
1. `backend/.env` 파일 확인
2. Google Sheets API 키 확인
3. 시트 ID 확인

## 📋 체크리스트

- [ ] 백엔드 서버 실행 (`cd backend && npm run dev`)
- [ ] 프론트엔드 서버 실행 (`cd frontend && npm run dev`)
- [ ] API 엔드포인트 테스트 (`http://localhost:3001/api/dashboard/main`)
- [ ] 브라우저 개발자 도구에서 네트워크 요청 확인
- [ ] 백엔드 터미널의 오류 로그 확인

## 🎯 빠른 진단

### 1. 백엔드 서버 상태 확인
```bash
curl http://localhost:3001/health
```

### 2. 대시보드 API 테스트
```bash
curl "http://localhost:3001/api/dashboard/main?startDate=2024-01-01&endDate=2024-01-31"
```

### 3. 프론트엔드에서 API URL 확인
브라우저 콘솔에서:
```javascript
console.log(process.env.NEXT_PUBLIC_API_URL)
```

## 💡 팁

- **두 서버 모두 실행**: 프론트엔드와 백엔드 서버가 모두 실행되어 있어야 합니다
- **포트 확인**: 프론트엔드(3000), 백엔드(3001)
- **환경 변수**: `NEXT_PUBLIC_API_URL`이 올바르게 설정되어 있는지 확인

