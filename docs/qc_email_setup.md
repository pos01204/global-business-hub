# QC 작가 알람 이메일 발송 설정 가이드

## 🚀 빠른 시작

### 1. 환경 변수 설정

`backend/.env` 파일에 다음을 추가:

```env
# Gmail API 설정
GMAIL_CLIENT_EMAIL=your-service-account@project-id.iam.gserviceaccount.com
GMAIL_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GMAIL_FROM_EMAIL=global_help@backpac.kr
GMAIL_FROM_NAME=Global Business 셀 | Business Pathfinder
```

### 2. 서버 재시작

```bash
cd backend
npm run dev
```

### 3. 사용 방법

1. 허브 → QC 관리 → 작가 알람 명단
2. 작가 카드에서 "알람 발송" 버튼 클릭
3. 이메일이 자동으로 발송됩니다

---

## 📧 이메일 템플릿

### 제목
`[idus글로벌] QC 수정이 필요한 항목이 있습니다.`

### 포함 내용
- 작가 인사말
- 수정 필요 항목 요약 (텍스트 QC, 이미지 QC 개수)
- 수정 필요 항목 상세 목록
- 안내사항
- 발신자 정보

---

## ✅ 확인 사항

### 이메일 발송 성공 시
- ✅ 알람이 성공적으로 발송되었습니다.
- 📧 이메일 발송 완료 (ID: ...)

### 이메일 발송 실패 시
- ✅ 알람이 성공적으로 발송되었습니다.
- ⚠️ 이메일 발송 실패: [오류 메시지]

### 메일 주소 없음
- ✅ 알람이 성공적으로 발송되었습니다.
- ℹ️ 작가 메일 주소가 없어 이메일을 발송할 수 없습니다.

---

## 🔧 상세 설정

자세한 설정 방법은 `docs/gmail_integration_guide.md`를 참고하세요.

