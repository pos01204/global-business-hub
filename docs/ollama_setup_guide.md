# Ollama 설정 및 진단 가이드

## 🔍 Ollama 연결 진단

### 1. 기본 확인

터미널에서 다음 명령어를 실행하여 Ollama 상태를 확인하세요:

```bash
# Ollama 버전 확인
ollama --version

# 설치된 모델 목록 확인
ollama list

# Ollama 서비스 상태 확인 (Windows)
# 작업 관리자에서 Ollama 프로세스 확인
```

### 2. 모델 다운로드

필요한 모델이 없다면 다운로드하세요:

```bash
# Llama 3 모델 다운로드
ollama pull llama3

# 또는 더 작은 모델 (빠른 테스트용)
ollama pull llama3:8b
```

### 3. 연결 테스트

백엔드 API를 통해 테스트:

```bash
# Ollama 연결 테스트
curl http://localhost:3001/api/marketer/test/ollama

# 또는 브라우저에서
http://localhost:3001/api/marketer/test/ollama
```

### 4. 크롤링 테스트

실제 URL로 크롤링 테스트:

```bash
curl -X POST http://localhost:3001/api/marketer/test/crawl \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.idus.com/product/your-product-id"}'
```

## 🛠️ 문제 해결

### 문제 1: Ollama 연결 실패

**증상**: "Ollama 서비스에 연결할 수 없습니다" 메시지

**해결 방법**:
1. Ollama가 실행 중인지 확인
2. 포트 확인 (기본값: 11434)
3. 방화벽 설정 확인
4. 환경 변수 확인: `backend/.env` 파일의 `OLLAMA_BASE_URL`

### 문제 2: 모델이 설치되지 않음

**증상**: "모델이 설치되지 않았습니다" 메시지

**해결 방법**:
```bash
# 모델 다운로드
ollama pull llama3

# 또는 다른 모델 사용
ollama pull mistral
```

그리고 `backend/.env` 파일에서 `OLLAMA_MODEL` 값을 변경하세요.

### 문제 3: 크롤링이 작동하지 않음

**증상**: 작품 정보가 제대로 추출되지 않음

**해결 방법**:
1. Ollama가 연결되어 있는지 확인
2. 테스트 API로 크롤링 과정 확인
3. 브라우저 개발자 도구에서 네트워크 탭 확인
4. 서버 로그 확인

## 📊 진단 API 엔드포인트

### Ollama 연결 테스트
```
GET /api/marketer/test/ollama
```

### 크롤링 테스트
```
POST /api/marketer/test/crawl
Body: { "url": "https://www.idus.com/product/..." }
```

### 헬스 체크 (상세)
```
GET /api/marketer/health
```

## 🔧 환경 변수 설정

`backend/.env` 파일에 다음 설정이 있는지 확인:

```env
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3
```

## 📝 다음 단계

1. Ollama 설치 및 실행 확인
2. 모델 다운로드 확인
3. 테스트 API로 연결 확인
4. 실제 URL로 크롤링 테스트




