# Notion 연동 완료 ✅

업무 관련 데이터 학습을 위한 Notion API 연동이 완료되었습니다.

## 🎯 구현된 기능

### 1. Notion 서비스 클래스
- ✅ Notion API 클라이언트 초기화
- ✅ 연결 상태 확인
- ✅ 페이지 내용 읽기 (재귀적 블록 읽기)
- ✅ 데이터베이스 조회 및 쿼리
- ✅ 텍스트 추출 (학습용)
- ✅ 검색 기능

### 2. API 엔드포인트

#### 기본 기능
- `GET /api/notion/health` - 연결 상태 확인
- `GET /api/notion/pages/:pageId` - 페이지 조회
- `GET /api/notion/pages/:pageId/blocks` - 페이지 블록 조회
- `GET /api/notion/databases/:databaseId` - 데이터베이스 조회
- `POST /api/notion/databases/:databaseId/query` - 데이터베이스 쿼리
- `GET /api/notion/search` - 검색

#### 학습용 데이터 추출
- `GET /api/notion/learn/pages/:pageId` - 페이지 학습 데이터 추출
- `GET /api/notion/learn/databases/:databaseId` - 데이터베이스 학습 데이터 추출

## 📦 설치 필요

```bash
cd backend
npm install @notionhq/client
```

## ⚙️ 환경 변수 설정

`backend/.env` 파일에 추가:

```env
NOTION_API_KEY=secret_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

## 📚 상세 가이드

자세한 설정 및 사용 방법은 [docs/NOTION_INTEGRATION.md](docs/NOTION_INTEGRATION.md)를 참고하세요.

## 🚀 빠른 시작

1. **Notion 통합 생성**
   - https://www.notion.so/my-integrations 접속
   - "새 통합" 생성
   - 내부 통합 토큰 복사

2. **환경 변수 설정**
   ```env
   NOTION_API_KEY=secret_xxxxx
   ```

3. **페이지 공유**
   - 연동할 Notion 페이지 열기
   - "공유" → 통합 추가

4. **API 호출**
   ```bash
   # 연결 확인
   GET /api/notion/health
   
   # 페이지 학습 데이터 추출
   GET /api/notion/learn/pages/{pageId}
   ```

## 💡 사용 예시

### JavaScript/TypeScript

```typescript
// 페이지 학습 데이터 가져오기
const response = await fetch('/api/notion/learn/pages/PAGE_ID');
const data = await response.json();

console.log(data.title);  // 페이지 제목
console.log(data.text);   // 전체 텍스트 내용
console.log(data.blocks); // 블록별 상세 정보
```

### 데이터베이스 학습

```typescript
const response = await fetch('/api/notion/learn/databases/DATABASE_ID');
const data = await response.json();

console.log(data.schema);  // 데이터베이스 스키마
console.log(data.rows);   // 모든 행 데이터
console.log(data.text);   // 텍스트 형식 데이터
```

## 📝 주요 파일

- `backend/src/config/notion.ts` - Notion 설정
- `backend/src/services/notionService.ts` - Notion 서비스 클래스
- `backend/src/routes/notion.ts` - API 라우트
- `docs/NOTION_INTEGRATION.md` - 상세 가이드

## ⚠️ 주의사항

1. **패키지 설치 필요**: `npm install @notionhq/client` 실행
2. **페이지 공유 필수**: API로 접근하려면 각 페이지를 통합에 공유해야 함
3. **Rate Limit**: Notion API는 초당 3회 요청 제한이 있음




