# OpenAI GPT API 설정 가이드

## 🚀 빠른 시작

### 1단계: OpenAI API 키 발급

1. [OpenAI Platform](https://platform.openai.com/)에 로그인
2. [API Keys](https://platform.openai.com/api-keys) 페이지로 이동
3. "Create new secret key" 클릭
4. 키 이름 입력 후 생성
5. **생성된 키를 복사** (다시 볼 수 없으므로 안전하게 보관)

### 2단계: 환경 변수 설정

`backend` 디렉토리에 `.env` 파일 생성 (없다면):

```env
OPENAI_API_KEY=sk-your-api-key-here
OPENAI_MODEL=gpt-4o-mini
OPENAI_BASE_URL=https://api.openai.com/v1
```

**설정 설명:**
- `OPENAI_API_KEY`: 발급받은 API 키 (필수)
- `OPENAI_MODEL`: 사용할 모델 (선택, 기본값: `gpt-4o-mini`)
- `OPENAI_BASE_URL`: API 엔드포인트 (선택, 기본값: `https://api.openai.com/v1`)

### 3단계: 백엔드 서버 재시작

환경 변수를 변경했다면 백엔드 서버를 재시작하세요:

```bash
cd backend
npm run dev
```

### 4단계: 연결 확인

브라우저에서 다음 URL 접속:

```
http://localhost:3001/api/marketer/health
```

**성공 응답:**
```json
{
  "status": "ok",
  "openaiConnected": true,
  "configuredModel": "gpt-4o-mini",
  "message": "OpenAI 서비스가 정상적으로 연결되었습니다."
}
```

## 📊 사용 가능한 모델

### 추천 모델

1. **gpt-4o-mini** (기본값)
   - 빠르고 저렴
   - 대부분의 작업에 충분한 성능
   - 비용 효율적

2. **gpt-4o**
   - 최신 모델
   - 더 높은 성능
   - 비용이 더 높음

3. **gpt-4-turbo**
   - 높은 성능
   - 복잡한 작업에 적합

4. **gpt-3.5-turbo**
   - 빠르고 저렴
   - 간단한 작업에 적합

### 모델 변경

`backend/.env` 파일에서:

```env
OPENAI_MODEL=gpt-4o
```

## 💰 비용 관리

### 예상 비용 (gpt-4o-mini 기준)

- 입력: $0.15 / 1M 토큰
- 출력: $0.60 / 1M 토큰

**예시:**
- 콘텐츠 생성 1회: 약 1,000-2,000 토큰
- 비용: 약 $0.001-0.002 (약 1-2원)

### 비용 절감 팁

1. **gpt-4o-mini 사용**: 가장 저렴한 옵션
2. **maxTokens 제한**: 불필요하게 긴 응답 방지
3. **프롬프트 최적화**: 간결하고 명확한 프롬프트 사용

## 🔍 문제 해결

### 문제 1: "OpenAI API 키가 유효하지 않습니다"

**해결:**
1. API 키가 올바르게 복사되었는지 확인
2. `.env` 파일의 `OPENAI_API_KEY` 값 확인
3. API 키가 활성화되어 있는지 확인
4. 백엔드 서버 재시작

### 문제 2: "요청 한도가 초과되었습니다"

**해결:**
1. [Usage](https://platform.openai.com/usage) 페이지에서 사용량 확인
2. 결제 정보 확인
3. 요청 빈도 줄이기

### 문제 3: "모델을 찾을 수 없습니다"

**해결:**
1. 사용 가능한 모델 목록 확인
2. `OPENAI_MODEL` 값 확인
3. 올바른 모델명 사용 (예: `gpt-4o-mini`)

## 📝 환경 변수 예시

### 최소 설정

```env
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxx
```

### 전체 설정

```env
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxx
OPENAI_MODEL=gpt-4o-mini
OPENAI_BASE_URL=https://api.openai.com/v1
```

## 🎯 다음 단계

1. ✅ API 키 발급
2. ✅ 환경 변수 설정
3. ✅ 서버 재시작
4. ✅ 연결 확인
5. ✅ 콘텐츠 생성 테스트

## 💡 팁

- **API 키 보안**: `.env` 파일을 `.gitignore`에 추가하여 Git에 커밋하지 않도록 주의
- **비용 모니터링**: [Usage](https://platform.openai.com/usage) 페이지에서 정기적으로 확인
- **모델 선택**: 작업에 맞는 모델 선택 (간단한 작업은 `gpt-4o-mini`, 복잡한 작업은 `gpt-4o`)




