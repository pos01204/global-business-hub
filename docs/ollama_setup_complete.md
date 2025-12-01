# Ollama API 연결 완료 가이드

## ✅ 완료된 단계
- [x] Ollama 설치
- [x] 모델 다운로드 (`ollama pull llama3`)

## 🔧 다음 단계

### 1단계: 환경 변수 확인 (선택사항)

`backend/.env` 파일이 있다면 확인하세요. 없어도 기본값으로 작동합니다.

```env
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3
```

**기본값:**
- `OLLAMA_BASE_URL`: `http://localhost:11434` (Ollama 기본 포트)
- `OLLAMA_MODEL`: `llama3` (다운로드한 모델명)

> 💡 **참고**: 다른 모델을 다운로드했다면 `OLLAMA_MODEL` 값을 변경하세요.
> 예: `mistral`, `llama3:8b` 등

### 2단계: 백엔드 서버 실행

터미널에서 백엔드 디렉토리로 이동 후 서버를 실행하세요:

```bash
cd backend
npm run dev
```

서버가 정상적으로 실행되면 다음과 같은 메시지가 표시됩니다:
```
서버가 포트 3001에서 실행 중입니다.
```

### 3단계: Ollama 연결 테스트

#### 방법 1: 브라우저에서 테스트
브라우저 주소창에 입력:
```
http://localhost:3001/api/marketer/test/ollama
```

**성공 응답 예시:**
```json
{
  "success": true,
  "message": "Ollama 서비스가 정상적으로 작동합니다.",
  "details": {
    "baseUrl": "http://localhost:11434",
    "model": "llama3",
    "testResponse": "안녕하세요, 세계"
  }
}
```

**실패 응답 예시:**
```json
{
  "success": false,
  "message": "Ollama 서비스에 연결할 수 없습니다.",
  "troubleshooting": [
    "1. Ollama가 설치되어 있고 실행 중인지 확인하세요.",
    "2. `ollama list` 명령어로 모델이 다운로드되었는지 확인하세요."
  ]
}
```

#### 방법 2: 터미널에서 테스트
```bash
curl http://localhost:3001/api/marketer/test/ollama
```

### 4단계: 헬스 체크 (상세 정보)

브라우저에서:
```
http://localhost:3001/api/marketer/health
```

이 API는 다음 정보를 제공합니다:
- Ollama 연결 상태
- 모델 설치 여부
- 사용 가능한 모델 목록
- 해결 방법 안내

### 5단계: 크롤링 테스트

실제 idus 작품 URL로 테스트해보세요:

#### 브라우저에서 테스트 (Postman 또는 브라우저 확장 프로그램 사용)

**POST** `http://localhost:3001/api/marketer/test/crawl`

**Body (JSON):**
```json
{
  "url": "https://www.idus.com/product/실제작품ID"
}
```

#### 터미널에서 테스트
```bash
curl -X POST http://localhost:3001/api/marketer/test/crawl \
  -H "Content-Type: application/json" \
  -d "{\"url\": \"https://www.idus.com/product/실제작품ID\"}"
```

### 6단계: 프론트엔드에서 확인

1. 프론트엔드 서버 실행 (다른 터미널):
   ```bash
   cd frontend
   npm run dev
   ```

2. 브라우저에서 접속:
   ```
   http://localhost:3000/marketer
   ```

3. 확인 사항:
   - ✅ 상단에 "Ollama 서비스가 정상적으로 연결되었습니다" 메시지 확인
   - ✅ "콘텐츠 생성" 탭에서 작품 URL 입력 후 "분석" 버튼 클릭
   - ✅ 작품 정보가 올바르게 표시되는지 확인

## 🔍 문제 해결

### 문제 1: "Ollama 서비스에 연결할 수 없습니다"

**해결 방법:**
1. Ollama가 실행 중인지 확인:
   ```bash
   ollama list
   ```
   이 명령어가 작동하면 Ollama가 실행 중입니다.

2. Windows에서 Ollama 서비스 확인:
   - 작업 관리자에서 "Ollama" 프로세스 확인
   - 없으면 Ollama 앱을 실행하세요

3. 포트 확인:
   - 기본 포트: `11434`
   - 다른 포트를 사용한다면 `backend/.env` 파일에 설정

### 문제 2: "모델이 설치되지 않았습니다"

**해결 방법:**
```bash
# 설치된 모델 확인
ollama list

# 모델이 없다면 다운로드
ollama pull llama3

# 또는 다른 모델 사용
ollama pull mistral
```

그리고 `backend/.env` 파일의 `OLLAMA_MODEL` 값을 다운로드한 모델명으로 변경하세요.

### 문제 3: 크롤링이 작동하지 않음

**확인 사항:**
1. Ollama 연결 상태 확인 (3단계)
2. 실제 idus URL이 올바른지 확인
3. 백엔드 터미널의 로그 확인 (에러 메시지 확인)

## 📊 테스트 체크리스트

- [ ] 백엔드 서버 실행 (`npm run dev`)
- [ ] Ollama 연결 테스트 성공 (`/api/marketer/test/ollama`)
- [ ] 헬스 체크 성공 (`/api/marketer/health`)
- [ ] 크롤링 테스트 성공 (`/api/marketer/test/crawl`)
- [ ] 프론트엔드에서 Ollama 연결 상태 확인
- [ ] 실제 작품 URL로 크롤링 테스트

## 🎯 다음 단계

모든 테스트가 성공하면:
1. 프론트엔드에서 작품 URL 입력
2. "분석" 버튼 클릭
3. 작품 정보 확인
4. 콘텐츠 생성 테스트

## 💡 팁

- **서버 재시작**: 환경 변수를 변경했다면 백엔드 서버를 재시작하세요
- **로그 확인**: 문제가 발생하면 백엔드 터미널의 로그를 확인하세요
- **모델 변경**: 더 빠른 테스트를 원한다면 작은 모델(`llama3:8b`)을 사용하세요







