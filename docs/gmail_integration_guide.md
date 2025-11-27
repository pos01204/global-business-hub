# Gmail 이메일 발송 설정 가이드

## 📧 개요

QC 작가 알람 명단에서 작가들에게 이메일을 자동으로 발송하는 기능입니다. Gmail SMTP와 Nodemailer를 사용합니다.

---

## 🔧 설정 방법 (Gmail 앱 비밀번호)

### 1. 2단계 인증 활성화

1. **Google 계정 접속**
   - https://myaccount.google.com 접속
   - 왼쪽 메뉴에서 "보안" 클릭

2. **2단계 인증 설정**
   - "2단계 인증" 클릭
   - 시작하기 → 안내에 따라 설정

### 2. 앱 비밀번호 생성

1. **앱 비밀번호 페이지 접속**
   - https://myaccount.google.com/apppasswords 접속
   - 또는 보안 → 2단계 인증 → 앱 비밀번호

2. **앱 비밀번호 생성**
   - "앱 선택" → "기타 (맞춤 이름)" 선택
   - 이름 입력 (예: "Business Hub Email")
   - "생성" 클릭
   - **16자리 비밀번호 복사** (xxxx xxxx xxxx xxxx 형식)

### 3. 환경 변수 설정

`backend/.env` 파일에 다음을 추가:

```env
# Gmail SMTP 설정
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx
GMAIL_FROM_EMAIL=your-email@gmail.com
GMAIL_FROM_NAME=Global Business 셀 | Business Pathfinder
```

**주의사항:**
- `GMAIL_APP_PASSWORD`는 16자리 앱 비밀번호 (띄어쓰기 포함 가능)
- 일반 계정 비밀번호가 아닌 **앱 비밀번호**를 사용해야 함
- `GMAIL_FROM_EMAIL`은 `GMAIL_USER`와 동일하게 설정

### 4. 서버 재시작

```bash
cd backend
npm install  # nodemailer 패키지 설치
npm run dev
```

---

## ✅ 설정 확인

서버 시작 시 다음 메시지가 표시되면 설정 완료:

```
✅ Gmail SMTP 환경 변수 로드 성공
[Email] Nodemailer 서비스 초기화 완료
```

설정되지 않은 경우:

```
⚠️  Gmail SMTP 환경 변수가 설정되지 않았습니다.
```

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

### 2. 알람 발송 확인 창

알람 발송 버튼 클릭 시 확인 창에 다음 정보가 표시됩니다:
- 작가명
- **발송될 메일 주소**
- 수정 필요 항목 수

### 3. 발송 결과

이메일 발송 결과는 다음과 같이 표시됩니다:

- ✅ 알람이 성공적으로 발송되었습니다.
- 📧 이메일 발송 완료 (ID: xxx)
- ⚠️ 이메일 발송 실패: [오류 메시지]
- ℹ️ 작가 메일 주소가 없어 이메일을 발송할 수 없습니다.

---

## 🚀 사용 방법

1. 허브 → QC 관리 → 작가 알람 명단
2. 작가 카드에서 "알람 발송" 버튼 클릭
3. 확인 창에서 **발송 메일 주소** 확인
4. 확인 버튼 클릭
5. 이메일 자동 발송

---

## 🔍 문제 해결

### 1. 이메일이 발송되지 않는 경우

**확인 사항:**
- 환경 변수가 올바르게 설정되었는지 확인
- 2단계 인증이 활성화되었는지 확인
- 앱 비밀번호가 올바른지 확인
- 작가 메일 주소가 올바른지 확인

**로그 확인:**
```bash
# 서버 로그에서 다음 메시지 확인
[Email] 이메일 발송 성공: ...
[Email] 이메일 발송 실패: ...
[Email] Nodemailer 서비스 초기화 완료
```

### 2. 인증 오류

**오류 메시지**: `Invalid login` 또는 `Username and Password not accepted`

**해결 방법:**
- 앱 비밀번호가 올바른지 확인 (일반 비밀번호 X)
- 2단계 인증이 활성화되었는지 확인
- 앱 비밀번호를 새로 생성

### 3. 보낸편지함에 메일이 없는 경우

Gmail SMTP로 발송된 메일은 **보낸편지함에 자동 저장되지 않습니다**.
실제로 수신자에게 메일이 전송됩니다.

**확인 방법:**
- 테스트용으로 본인 이메일 주소로 발송
- 받은편지함에서 확인

---

## 📊 API 응답 형식

### 작가 알람 발송 응답
```json
{
  "success": true,
  "artistId": "123",
  "artistName": "작가명",
  "artistEmail": "artist@example.com",
  "sentItems": [...],
  "emailSent": true,
  "emailMessageId": "<abc123@gmail.com>",
  "emailError": null,
  "message": "작가명 작가에게 2개 항목에 대한 알람이 발송되었습니다. (이메일 발송 완료: artist@example.com)"
}
```

---

## 🔐 보안 고려사항

1. **환경 변수 보호**
   - `.env` 파일을 `.gitignore`에 추가
   - 앱 비밀번호를 코드에 직접 작성하지 않음

2. **앱 비밀번호 관리**
   - 앱 비밀번호가 노출되면 즉시 삭제하고 새로 생성
   - 정기적으로 앱 비밀번호 갱신

---

## 📝 환경 변수 요약

| 환경 변수 | 설명 | 예시 |
|----------|------|------|
| `GMAIL_USER` | Gmail 계정 이메일 | your-email@gmail.com |
| `GMAIL_APP_PASSWORD` | 앱 비밀번호 (16자리) | xxxx xxxx xxxx xxxx |
| `GMAIL_FROM_EMAIL` | 발신자 이메일 (선택) | your-email@gmail.com |
| `GMAIL_FROM_NAME` | 발신자 이름 | Global Business 셀 |

---

**마지막 업데이트**: 2025-01-XX
**작성자**: AI Assistant
