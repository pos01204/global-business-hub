# Notion 연동 가이드

업무 관련 데이터 학습을 위한 Notion API 연동 설정 및 사용 방법입니다.

## 📋 목차

1. [Notion 통합 생성](#notion-통합-생성)
2. [환경 변수 설정](#환경-변수-설정)
3. [페이지/데이터베이스 공유](#페이지데이터베이스-공유)
4. [API 사용 방법](#api-사용-방법)
5. [학습 데이터 추출](#학습-데이터-추출)

---

## 🔑 Notion 통합 생성

### 1단계: Notion 통합 생성

1. [Notion 통합 페이지](https://www.notion.so/my-integrations)에 접속
2. **"새 통합"** 버튼 클릭
3. 통합 정보 입력:
   - **이름**: 예) "Global Business Hub"
   - **로고**: 선택사항
   - **연결된 워크스페이스**: 연동할 워크스페이스 선택
4. **"제출"** 클릭하여 통합 생성

### 2단계: 내부 통합 토큰 복사

1. 생성된 통합 페이지에서 **"내부 통합 토큰"** 확인
2. 토큰은 `secret_`으로 시작하는 문자열입니다
3. 이 토큰을 복사하여 환경 변수에 설정합니다

---

## ⚙️ 환경 변수 설정

### backend/.env 파일에 추가

```env
# Notion API 설정
NOTION_API_KEY=secret_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### Railway/배포 환경 설정

배포 환경에서는 환경 변수로 직접 설정:
- `NOTION_API_KEY`: Notion 내부 통합 토큰

---

## 🔗 페이지/데이터베이스 공유

Notion API로 접근하려면 **각 페이지와 데이터베이스를 통합에 공유**해야 합니다.

### 방법 1: 개별 페이지 공유

1. 연동할 Notion 페이지 열기
2. 우측 상단 **"공유"** 버튼 클릭
3. **"연결 추가"** 또는 **"통합 추가"** 클릭
4. 생성한 통합 이름 검색 후 선택
5. 권한 설정 (보통 "읽기" 권한으로 충분)

### 방법 2: 데이터베이스 공유

1. 연동할 데이터베이스 페이지 열기
2. 우측 상단 **"공유"** 버튼 클릭
3. 생성한 통합 추가

### 주의사항

- 통합을 공유하지 않으면 API로 접근할 수 없습니다
- 페이지 ID는 URL에서 확인 가능합니다:
  ```
  https://www.notion.so/workspace/Page-Title-xxxxxxxxxxxxxxxxxxxxxxxx
                                              ↑ 이 부분이 페이지 ID
  ```

---

## 📡 API 사용 방법

### 1. 연결 상태 확인

```bash
GET /api/notion/health
```

**응답 예시:**
```json
{
  "connected": true,
  "details": {
    "botId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
    "name": "Global Business Hub",
    "type": "bot"
  }
}
```

### 2. 페이지 내용 조회

```bash
# 페이지 메타데이터만
GET /api/notion/pages/{pageId}

# 블록 포함 전체 내용
GET /api/notion/pages/{pageId}?includeBlocks=true
```

**응답 예시:**
```json
{
  "title": "업무 가이드",
  "content": "페이지의 모든 텍스트 내용...",
  "blocks": [...],
  "metadata": {
    "id": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
    "createdTime": "2024-01-01T00:00:00.000Z",
    "lastEditedTime": "2024-01-02T00:00:00.000Z",
    "url": "https://www.notion.so/...",
    "properties": {...}
  }
}
```

### 3. 페이지 블록 조회

```bash
GET /api/notion/pages/{pageId}/blocks
```

### 4. 데이터베이스 조회

```bash
# 스키마만
GET /api/notion/databases/{databaseId}

# 데이터 포함
GET /api/notion/databases/{databaseId}?includeContent=true
```

### 5. 데이터베이스 쿼리

```bash
POST /api/notion/databases/{databaseId}/query
Content-Type: application/json

{
  "filter": {
    "property": "Status",
    "select": {
      "equals": "완료"
    }
  },
  "sorts": [
    {
      "property": "Created",
      "direction": "descending"
    }
  ]
}
```

### 6. 검색

```bash
# 간단한 검색
GET /api/notion/search?query=업무

# 필터 포함 검색
POST /api/notion/search
Content-Type: application/json

{
  "query": "업무",
  "filter": {
    "value": "page",
    "property": "object"
  }
}
```

---

## 🎓 학습 데이터 추출

### 페이지 학습 데이터

```bash
GET /api/notion/learn/pages/{pageId}
```

**응답 형식:**
```json
{
  "type": "page",
  "id": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "title": "업무 가이드",
  "text": "페이지의 모든 텍스트 내용...",
  "metadata": {...},
  "blocks": [
    {
      "type": "paragraph",
      "id": "block-id",
      "text": "블록 내용"
    }
  ]
}
```

### 데이터베이스 학습 데이터

```bash
GET /api/notion/learn/databases/{databaseId}
```

**응답 형식:**
```json
{
  "type": "database",
  "id": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "schema": {
    "이름": { "type": "title", ... },
    "상태": { "type": "select", ... },
    ...
  },
  "rows": [
    {
      "id": "...",
      "이름": "항목 1",
      "상태": "완료",
      ...
    }
  ],
  "totalCount": 10,
  "text": "Row 1: 이름: 항목 1, 상태: 완료\nRow 2: ..."
}
```

---

## 💡 사용 예시

### 예시 1: 업무 가이드 페이지 학습

```javascript
// 프론트엔드에서 호출
const response = await fetch('/api/notion/learn/pages/PAGE_ID');
const learningData = await response.json();

// AI 학습에 사용
const trainingText = `
제목: ${learningData.title}
내용: ${learningData.text}
`;
```

### 예시 2: 프로젝트 데이터베이스 학습

```javascript
const response = await fetch('/api/notion/learn/databases/DATABASE_ID');
const learningData = await response.json();

// 구조화된 데이터로 학습
learningData.rows.forEach(row => {
  console.log(`프로젝트: ${row.이름}, 상태: ${row.상태}`);
});
```

### 예시 3: 여러 페이지 일괄 학습

```javascript
const pageIds = ['PAGE_ID_1', 'PAGE_ID_2', 'PAGE_ID_3'];
const allContent = [];

for (const pageId of pageIds) {
  const response = await fetch(`/api/notion/learn/pages/${pageId}`);
  const data = await response.json();
  allContent.push(data);
}

// 통합 학습 데이터
const combinedText = allContent
  .map(d => `${d.title}\n\n${d.text}`)
  .join('\n\n---\n\n');
```

---

## 🔍 페이지/데이터베이스 ID 찾기

### 방법 1: URL에서 추출

Notion 페이지 URL 형식:
```
https://www.notion.so/workspace/Page-Title-xxxxxxxxxxxxxxxxxxxxxxxx
```

마지막 부분의 32자리 문자열이 페이지 ID입니다.
하이픈을 제거하면 실제 ID가 됩니다.

### 방법 2: API 검색 사용

```bash
GET /api/notion/search?query=페이지제목
```

검색 결과에서 `id` 필드를 확인할 수 있습니다.

---

## ⚠️ 주의사항

1. **Rate Limit**: Notion API는 요청 제한이 있습니다 (초당 3회)
2. **권한**: 통합에 공유하지 않은 페이지는 접근 불가
3. **비용**: Notion API는 무료이지만, 대량 요청 시 제한될 수 있음
4. **보안**: API 키는 절대 공개하지 마세요

---

## 🐛 문제 해결

### 연결 실패

- `NOTION_API_KEY` 환경 변수 확인
- 통합이 올바른 워크스페이스에 연결되어 있는지 확인

### 페이지 접근 불가

- 페이지/데이터베이스가 통합에 공유되어 있는지 확인
- 페이지 ID가 올바른지 확인 (하이픈 포함/제외 확인)

### 데이터 추출 실패

- 페이지가 비어있거나 접근 권한이 없는 경우
- API 로그 확인: `[Notion Service]`로 시작하는 로그

---

## 📚 참고 자료

- [Notion API 공식 문서](https://developers.notion.com/)
- [Notion API 레퍼런스](https://developers.notion.com/reference)
- [Notion SDK (Node.js)](https://github.com/makenotion/notion-sdk-js)





