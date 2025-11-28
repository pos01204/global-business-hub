# 🔗 Slack 연동 가이드

Global Business Hub와 Slack을 연동하여 CS팀이 주문/배송 정보를 Slack에서 바로 조회할 수 있습니다.

---

## 📋 목차

1. [기능 개요](#기능-개요)
2. [Slack App 설정](#slack-app-설정)
3. [환경 변수 설정](#환경-변수-설정)
4. [명령어 사용법](#명령어-사용법)
5. [문제 해결](#문제-해결)

---

## 기능 개요

### 지원 명령어

| 명령어 | 설명 | 사용 예시 |
|--------|------|-----------|
| `/order` | 주문번호로 주문 상세 조회 | `/order 123456` |
| `/track` | 송장번호로 배송 추적 | `/track KJPEXP789012` |
| `/customer` | 고객 ID로 주문 이력 조회 | `/customer user_12345` |
| `/artist` | 작가명으로 주문 현황 조회 | `/artist 달빛공방` |
| `/gb` | 도움말 표시 | `/gb` |

### 응답 내용

- **주문 정보**: 주문번호, 고객정보, 상품, 결제금액, 배송현황
- **배송 추적**: 배송 단계별 진행상황, 예상 도착일
- **고객 이력**: 총 주문 수, 구매액, 최근 주문 목록
- **작가 현황**: 주문 현황 요약, 지연 건 알림

---

## Slack App 설정

### 1단계: Slack App 생성

1. [Slack API](https://api.slack.com/apps) 접속
2. **Create New App** 클릭
3. **From scratch** 선택
4. App 이름: `Global Business Hub`
5. 워크스페이스 선택 후 **Create App**

### 2단계: Slash Commands 설정

**OAuth & Permissions** 메뉴에서 다음 권한 추가:
- `commands`
- `chat:write`

**Slash Commands** 메뉴에서 각 명령어 추가:

#### /order 명령어
- Command: `/order`
- Request URL: `https://your-domain.com/api/slack/commands/order`
- Short Description: `주문 상세 정보 조회`
- Usage Hint: `[주문번호]`

#### /track 명령어
- Command: `/track`
- Request URL: `https://your-domain.com/api/slack/commands/track`
- Short Description: `배송 추적 조회`
- Usage Hint: `[송장번호]`

#### /customer 명령어
- Command: `/customer`
- Request URL: `https://your-domain.com/api/slack/commands/customer`
- Short Description: `고객 주문 이력 조회`
- Usage Hint: `[고객ID]`

#### /artist 명령어
- Command: `/artist`
- Request URL: `https://your-domain.com/api/slack/commands/artist`
- Short Description: `작가별 주문 현황`
- Usage Hint: `[작가명]`

#### /gb 명령어
- Command: `/gb`
- Request URL: `https://your-domain.com/api/slack/commands/gb`
- Short Description: `도움말 및 빠른 현황`
- Usage Hint: `[help]`

### 3단계: Interactivity 설정 (선택)

**Interactivity & Shortcuts** 메뉴:
- Interactivity 활성화
- Request URL: `https://your-domain.com/api/slack/interactions`

### 4단계: App 설치

1. **Install to Workspace** 클릭
2. 권한 승인
3. Bot Token 복사 (xoxb-xxx)

---

## 환경 변수 설정

백엔드 `.env` 파일에 다음 환경 변수 추가:

```env
# Slack Integration
SLACK_SIGNING_SECRET=your_signing_secret
SLACK_BOT_TOKEN=xoxb-your-bot-token
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/xxx/xxx/xxx

# Hub URL (Slack 버튼 링크용)
HUB_BASE_URL=https://your-hub-domain.com
```

### 값 확인 방법

- **SLACK_SIGNING_SECRET**: Slack App > Basic Information > App Credentials > Signing Secret
- **SLACK_BOT_TOKEN**: Slack App > OAuth & Permissions > Bot User OAuth Token
- **SLACK_WEBHOOK_URL**: (선택) Incoming Webhooks에서 생성

---

## 명령어 사용법

### /order - 주문 조회

```
/order 123456
```

**응답 예시:**
```
📦 주문 상세 정보

주문번호: #123456
주문일시: 2024-11-25 14:30

👤 고객 정보
• 국가: 🇯🇵 일본
• 고객 ID: user_78901

🎨 상품 정보
• 작가: 달빛공방
• 상품: 한복 저고리 (그레이)
• 수량: 1개
• 결제금액: ¥12,500

🚚 배송 현황
• 상태: 배송중
• 운송사: K-Packet
• 송장번호: KJPEXP789012
• 발송일: 2024-11-26

[허브에서 상세보기] [배송 추적]
```

### /track - 배송 추적

```
/track KJPEXP789012
```

**응답 예시:**
```
🚚 배송 추적

송장번호: KJPEXP789012
운송사: K-Packet
목적지: 🇯🇵 일본

📍 배송 진행 상황
✅ 접수완료     11/26
✅ 발송         11/26
✅ 출국         11/27
✅ 도착국입항   11/28
🔄 통관중      ← 현재
⬜ 배송중
⬜ 배달완료

📅 예상 배송일: 12월 2일 (월)

[상세 추적]
```

### /customer - 고객 조회

```
/customer user_78901
```

**응답 예시:**
```
👤 고객 주문 이력

고객 ID: user_78901
국가: 🇯🇵 일본
총 주문: 5건 | 총 구매액: ¥52,300

📋 최근 주문 (5건)
1. #123456 | 11/25 | 배송중 | ¥12,500
   → 한복 저고리 (달빛공방)
   
2. #122100 | 10/15 | 배송완료 | ¥8,900
   → 자개 명함케이스 (나전공예)

[전체 이력 보기] [고객 상세]
```

### /artist - 작가 조회

```
/artist 달빛공방
```

**응답 예시:**
```
🎨 작가 주문 현황

작가명: 달빛공방
최근 30일 주문: 45건

📊 현황 요약
• 배송완료: 38건
• 배송중: 5건
• 준비중: 2건

⚠️ 주의 필요
• 미입고 지연: 1건 (#125000, 8일 지연)

📋 최근 주문 5건
1. #125100 | 🇺🇸 미국 | 준비중
2. #125000 | 🇯🇵 일본 | ⚠️ 미입고 8일
3. #124800 | 🇭🇰 홍콩 | 배송중

[작가 상세] [지연 건 확인]
```

---

## 문제 해결

### 명령어가 작동하지 않는 경우

1. **Request URL 확인**: 백엔드 서버가 실행 중이고 URL이 정확한지 확인
2. **SSL 인증서**: Slack은 HTTPS만 허용하므로 SSL 인증서 확인
3. **환경 변수**: `SLACK_SIGNING_SECRET` 설정 확인

### 응답이 느린 경우

Slack은 3초 내 응답을 요구합니다. 현재 구현은:
1. 즉시 "조회 중..." 응답
2. 비동기로 데이터 조회
3. `response_url`로 결과 전송

### 권한 오류

- Slack App에 필요한 권한(scopes)이 부여되었는지 확인
- App을 워크스페이스에 재설치

### 로그 확인

```bash
# 백엔드 로그에서 Slack 관련 로그 확인
[Slack] /order command error: ...
```

---

## 보안 고려사항

1. **서명 검증**: 모든 요청에 대해 Slack 서명 검증 수행
2. **타임스탬프 검증**: 5분 이상 된 요청 거부
3. **응답 범위**: 민감한 정보는 `ephemeral` 응답으로 본인에게만 표시
4. **접근 제한**: 필요시 특정 채널/사용자만 허용

---

## 향후 확장 가능 기능

### 자동 알림 (후순위)
- 7일 이상 미입고 건 알림
- QC 완료 후 작가 알림
- 소포수령증 발송 후 현황 알림

### 추가 명령어
- `/gb status`: 오늘 현황 요약
- `/gb unreceived`: 미입고 현황
- `/gb qc`: QC 대기 현황

---

## 문의

연동 관련 문의사항은 담당자에게 연락해주세요.

