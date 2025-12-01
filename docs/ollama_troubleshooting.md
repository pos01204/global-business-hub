# Ollama 오류 해결 가이드

## 🔍 일반적인 오류 및 해결 방법

### 오류: "콘텐츠 생성 중 오류가 발생했습니다"

이 오류는 여러 원인이 있을 수 있습니다. 다음 단계를 따라 확인하세요.

## 1단계: Ollama 서비스 확인

터미널에서 다음 명령어 실행:

```bash
ollama list
```

**예상 결과:**
```
NAME            ID              SIZE    MODIFIED
llama3          abc123...       4.7GB   2 hours ago
```

**문제가 있다면:**
- Ollama가 실행되지 않음 → Ollama 앱 실행
- 모델이 없음 → `ollama pull llama3` 실행

## 2단계: 모델 확인

설치된 모델 이름 확인:

```bash
ollama list
```

**중요:** 모델 이름이 정확히 일치해야 합니다:
- ✅ `llama3` (정확히 일치)
- ✅ `llama3:8b` (태그 포함)
- ❌ `Llama3` (대소문자 구분)
- ❌ `llama-3` (하이픈 포함)

## 3단계: 환경 변수 확인

`backend/.env` 파일이 있다면 확인:

```env
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3
```

**없다면:**
- 기본값 사용 (`llama3`)
- 또는 `.env` 파일 생성 후 모델명 설정

## 4단계: 백엔드 로그 확인

백엔드 서버 터미널에서 다음 로그 확인:

```
[Ollama] 연결 확인 시작 - URL: http://localhost:11434/api/tags
[Ollama] 연결 성공 - 사용 가능한 모델: llama3
✅ 모델 'llama3' 확인됨
[Ollama] 생성 요청 시작 - 모델: llama3, URL: http://localhost:11434/api/generate
```

**에러 로그 예시:**
```
[Ollama] API 오류 상세: {
  message: '모델을 찾을 수 없습니다',
  code: '404',
  ...
}
```

## 5단계: 직접 Ollama API 테스트

브라우저나 curl로 직접 테스트:

```bash
curl http://localhost:11434/api/tags
```

**성공 응답:**
```json
{
  "models": [
    {
      "name": "llama3",
      "size": 4900000000,
      ...
    }
  ]
}
```

## 6단계: 생성 API 직접 테스트

```bash
curl http://localhost:11434/api/generate -d '{
  "model": "llama3",
  "prompt": "Hello",
  "stream": false
}'
```

## 🔧 해결 방법

### 문제 1: 모델을 찾을 수 없음

**증상:**
```json
{
  "success": false,
  "error": "모델 'llama3'을 찾을 수 없습니다."
}
```

**해결:**
```bash
# 모델 다운로드
ollama pull llama3

# 또는 다른 모델 사용
ollama pull mistral
```

그리고 `backend/.env` 파일에:
```env
OLLAMA_MODEL=mistral
```

### 문제 2: 연결 거부됨

**증상:**
```json
{
  "success": false,
  "error": "Ollama 서비스에 연결할 수 없습니다."
}
```

**해결:**
1. Ollama 앱 실행 확인
2. 포트 확인 (기본: 11434)
3. 방화벽 확인

### 문제 3: 타임아웃

**증상:**
- 요청이 오래 걸림
- 타임아웃 에러

**해결:**
1. 더 작은 모델 사용 (`llama3:8b`)
2. 타임아웃 시간 증가 (코드에서 60초 → 120초)

### 문제 4: 모델 이름 불일치

**증상:**
- 모델은 있지만 인식 안 됨

**해결:**
1. `ollama list`로 정확한 모델명 확인
2. `backend/.env`에 정확한 이름 입력
3. 백엔드 서버 재시작

## 📊 진단 체크리스트

- [ ] `ollama list` 명령어 작동
- [ ] 모델이 목록에 표시됨
- [ ] `curl http://localhost:11434/api/tags` 성공
- [ ] 백엔드 로그에 연결 성공 메시지
- [ ] 테스트 API (`/api/marketer/test/ollama`) 성공

## 🎯 빠른 해결

모든 것이 실패하면:

1. Ollama 재시작
2. 백엔드 서버 재시작
3. 모델 재다운로드:
   ```bash
   ollama rm llama3
   ollama pull llama3
   ```

## 💡 팁

- **작은 모델 사용**: 빠른 테스트를 위해 `llama3:8b` 사용
- **로그 확인**: 백엔드 터미널의 상세 로그 확인
- **단계별 테스트**: 각 단계를 하나씩 확인








