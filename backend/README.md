# 백엔드 API 서버

글로벌 비즈니스 통합 허브 백엔드 API 서버

## 설치

```bash
npm install
```

## 환경 변수 설정

`.env` 파일을 생성하고 `.env.example`을 참고하여 설정하세요.

### Google Sheets API 인증 설정

1. Google Cloud Console에서 프로젝트 생성
2. Google Sheets API 활성화
3. 서비스 계정 생성 및 JSON 키 다운로드
4. `.env` 파일에 다음 정보 입력:
   - `GOOGLE_SHEETS_SPREADSHEET_ID`: 스프레드시트 ID
   - `GOOGLE_SHEETS_CLIENT_EMAIL`: 서비스 계정 이메일
   - `GOOGLE_SHEETS_PRIVATE_KEY`: 개인 키 (전체 키를 문자열로)

## 실행

```bash
# 개발 모드
npm run dev

# 프로덕션 빌드
npm run build
npm start
```

## API 엔드포인트

### Health Check
- `GET /health` - 서버 상태 확인

### 대시보드
- `GET /api/dashboard/main?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD` - 메인 대시보드 데이터

### 미입고 관리
- `GET /api/unreceived` - 미입고 작품 목록
- `POST /api/unreceived/update-status` - 처리상태 업데이트


