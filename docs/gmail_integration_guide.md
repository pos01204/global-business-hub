# Gmail API 연동 가이드

## 📧 개요

QC 작가 알람 명단에서 작가들에게 이메일을 자동으로 발송하는 기능입니다. Gmail API를 사용하여 실제 이메일을 발송합니다.

---

## 🔧 설정 방법

### 1. Google Cloud Console 설정

1. **Google Cloud Console 접속**
   - https://console.cloud.google.com 접속
   - 프로젝트 선택 또는 새 프로젝트 생성

2. **Gmail API 활성화**
   - API 및 서비스 → 라이브러리
   - "Gmail API" 검색 후 활성화

3. **서비스 계정 생성**
   - API 및 서비스 → 사용자 인증 정보
   - "사용자 인증 정보 만들기" → "서비스 계정" 선택
   - 서비스 계정 이름 입력 후 생성

4. **서비스 계정 키 생성**
   - 생성된 서비스 계정 클릭
   - "키" 탭 → "키 추가" → "JSON" 선택
   - JSON 파일 다운로드

5. **Gmail API 권한 설정**
   - 서비스 계정의 이메일 주소 복사
   - Gmail 계정 설정 → "Google 계정" → "보안" → "2단계 인증" 활성화
   - "앱 비밀번호" 생성 (또는 OAuth 2.0 사용)

### 2. 환경 변수 설정

`backend/.env` 파일에 다음 환경 변수를 추가합니다:

```env
# Gmail API 설정
GMAIL_CLIENT_EMAIL=your-service-account-email@project-id.iam.gserviceaccount.com
GMAIL_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GMAIL_FROM_EMAIL=global_help@backpac.kr
GMAIL_FROM_NAME=Global Business 셀 | Business Pathfinder
```

**주의사항:**
- `GMAIL_PRIVATE_KEY`는 JSON 파일의 `private_key` 값을 그대로 복사
- 줄바꿈 문자(`\n`)를 포함해야 함
- 따옴표로 감싸야 함

### 3. 대체 방법: OAuth 2.0 사용

서비스 계정 대신 OAuth 2.0을 사용할 수도 있습니다:

1. **OAuth 2.0 클라이언트 ID 생성**
   - API 및 서비스 → 사용자 인증 정보
   - "사용자 인증 정보 만들기" → "OAuth 클라이언트 ID" 선택
   - 애플리케이션 유형: "웹 애플리케이션"
   - 승인된 리디렉션 URI 설정

2. **토큰 획득**
   - OAuth 2.0 플로우를 통해 액세스 토큰 획득
   - 토큰을 환경 변수에 저장

---

## 📋 기능 설명

### 1. 이메일 템플릿

QC 수정 필요 알람 이메일은 다음 정보를 포함합니다:

- **제목**: `[idus글로벌] QC 수정이 필요한 항목이 있습니다.`
- **본문**:
  - 작가 인사말
  - 수정 필요 항목 요약 (텍스트 QC, 이미지 QC 개수)
  - 수정 필요 항목 상세 목록
  - 안내사항
  - 발신자 정보

### 2. 이메일 발송 프로세스

1. 작가 알람 발송 버튼 클릭
2. 작가 메일 주소 확인
3. Gmail 서비스 설정 확인
4. 이메일 템플릿 생성
5. Gmail API로 이메일 발송
6. 발송 결과 반환 (성공/실패)

### 3. 발송 결과

이메일 발송 결과는 다음 정보를 포함합니다:

- `emailSent`: 이메일 발송 성공 여부 (boolean)
- `emailMessageId`: Gmail Message ID (성공 시)
- `emailError`: 오류 메시지 (실패 시)

---

## 🚀 사용 방법

### 백엔드 API

**엔드포인트**: `POST /api/qc/artists/notify`

**요청 본문**:
```json
{
  "artistId": "123",
  "items": ["item-id-1", "item-id-2"]
}
```

**응답**:
```json
{
  "success": true,
  "artistId": "123",
  "artistName": "작가명",
  "artistEmail": "artist@example.com",
  "sentItems": [...],
  "emailSent": true,
  "emailMessageId": "18a1b2c3d4e5f6g7",
  "emailError": null,
  "message": "작가명 작가에게 2개 항목에 대한 알람이 발송되었습니다. (이메일 발송 완료: artist@example.com)"
}
```

### 프론트엔드

작가 알람 명단 페이지에서 "알람 발송" 버튼을 클릭하면 자동으로 이메일이 발송됩니다.

---

## 🔍 문제 해결

### 1. 이메일이 발송되지 않는 경우

**확인 사항:**
- 환경 변수가 올바르게 설정되었는지 확인
- Gmail API가 활성화되었는지 확인
- 서비스 계정에 Gmail API 권한이 있는지 확인
- 작가 메일 주소가 올바른지 확인

**로그 확인:**
```bash
# 서버 로그에서 다음 메시지 확인
[QC] 이메일 발송 성공: ...
[QC] 이메일 발송 실패: ...
[Gmail] Gmail 서비스 초기화 완료
```

### 2. 인증 오류

**오류 메시지**: `Invalid credentials` 또는 `Unauthorized`

**해결 방법:**
- 서비스 계정 키가 올바른지 확인
- `GMAIL_PRIVATE_KEY`에 줄바꿈 문자(`\n`)가 포함되어 있는지 확인
- Gmail API 권한이 올바르게 설정되었는지 확인

### 3. 권한 오류

**오류 메시지**: `Insufficient Permission` 또는 `Forbidden`

**해결 방법:**
- 서비스 계정에 Gmail API 권한 부여
- OAuth 2.0을 사용하는 경우, 스코프 확인

---

## 📊 이메일 발송 이력

현재는 메모리에만 저장되지만, 향후 Google Sheets나 데이터베이스에 저장할 수 있습니다:

```typescript
{
  artistId: string;
  artistName: string;
  artistEmail: string;
  items: QCItem[];
  sentAt: Date;
  emailSent: boolean;
  emailMessageId?: string;
  emailError?: string;
}
```

---

## 🔐 보안 고려사항

1. **환경 변수 보호**
   - `.env` 파일을 `.gitignore`에 추가
   - 프로덕션에서는 환경 변수를 안전하게 관리

2. **이메일 주소 검증**
   - 유효한 이메일 형식인지 확인
   - 스팸 방지를 위한 발송 제한 고려

3. **에러 처리**
   - 이메일 발송 실패 시에도 알람은 정상적으로 처리
   - 오류 로그를 안전하게 저장

---

## 📝 향후 개선 사항

1. **이메일 발송 이력 저장**
   - Google Sheets에 발송 이력 저장
   - 발송 상태 추적

2. **템플릿 관리**
   - 다양한 이메일 템플릿 지원
   - 템플릿 커스터마이징 기능

3. **발송 스케줄링**
   - 자동 발송 스케줄 설정
   - 발송 빈도 제어

4. **이메일 수신 거부**
   - 작가별 이메일 수신 설정
   - 수신 거부 링크 처리

---

**마지막 업데이트**: 2025-01-XX
**작성자**: AI Assistant

