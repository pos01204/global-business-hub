# 세션 슬라이드 보완 및 Genspark 프롬프트

## 📋 세션 개요

### 세션 정보
- **제목**: AI를 활용한 나만의 업무 관리 페이지 제작
- **일시**: 2026년 1월 15일 (목) 오후 5시
- **진행자**: Global Business셀 김지훈
- **대상**: 전 부서 (개발/비개발 구분 없음)

### 세션 목적
> 비개발 조직원의 고군분투 AI 활용기를 통해 업무 자동화를 위한 **용기와 동기 부여, 인사이트**를 제공

### 청중이 궁금해할 핵심 질문
1. 비개발자가 어떻게 저런 웹 앱을 구축했는가?
2. 어떤 업무부터 자동화해야 하는가?
3. AI agent로 어떤 업무까지 자동화 가능한가?
4. 어느 수준으로 구현이 가능한가?
5. 어느 정도의 시간이 걸리는가?

---

## 🔄 슬라이드 수정 사항

### 슬라이드 4: 담당자 배경 (대폭 보강)

**기존 내용 (간략함)**
```
- Global Business 운영 담당
- 주요 업무: 글로벌 비즈니스 전 범위
- 개발 경험: 없음
```

**수정 내용 (스토리텔링 강화)**

```markdown
## 슬라이드 4: 1인 팀의 탄생 - 담당자 배경

### 어떻게 1인 팀이 되었나

**이전**: 오프라인셀 (소담상회 인사점 운영)
- 매장 운영, 재고 관리, 판매 분석
- Google Sheets + Apps Script로 대시보드 구축
- "이 정도면 충분하지 않나?" 라고 생각

**전환점**: 글로벌 비즈니스셀 1인 팀으로 이동
- 규모는 작지만, 하나의 비즈니스 전체를 운영해야 하는 상황
- 기존 시트로는 감당이 안 되는 업무량
- "뭔가 다른 방법이 필요하다"

**현실**: 1인이 담당해야 하는 업무 범위
┌─────────────────────────────────────────────────────────────┐
│                                                              │
│   📊 비즈니스 현황 파악                                      │
│   └─ GMV, 주문, 고객, 작가 성과 분석                        │
│                                                              │
│   📦 물류 대응                                               │
│   └─ 입고 관리, 출고 처리, 배송 추적, 미입고 관리           │
│                                                              │
│   🎨 작가/작품 관리 (셀렉션)                                 │
│   └─ 신규 작가 발굴, 작품 QC, 계약 관리                     │
│                                                              │
│   👥 고객 관리                                               │
│   └─ 고객 분석, VIP 관리, 이탈 방지                         │
│                                                              │
│   💬 CS 대응                                                 │
│   └─ 고객 문의, 클레임 처리, 작가 커뮤니케이션              │
│                                                              │
│   📱 마케팅                                                  │
│   └─ 온드미디어 운영, 기획전, SNS 이벤트                    │
│   └─ 일본 현지 마케팅 업체 협업                             │
│   └─ 인플루언서 협찬 광고 진행                              │
│                                                              │
│   → 이 모든 것을 혼자서? 불가능.                            │
│   → 그래서 AI를 활용한 자동화가 필수였습니다.               │
│                                                              │
└─────────────────────────────────────────────────────────────┘

**개발 경험**: 없음 (기초적인 HTML 수준)
**사용 도구**: Antigravity + Gemini (회사 지원 계정)
```

---

### 새로 추가할 슬라이드들

## 📌 신규 슬라이드 A: "왜 자동화가 필요했는가"

```markdown
## 슬라이드 4-1: 1인 팀의 현실 - 왜 자동화가 필요했는가

### 매일 반복되는 업무들

**아침 루틴 (Before)**
┌─────────────────────────────────────────────────────────────┐
│  09:00  어제 주문 확인 → 시트 열기, 필터, 정렬 (15분)       │
│  09:15  미입고 현황 체크 → 3개 시트 오가며 확인 (20분)      │
│  09:35  작가 입고 요청 메일 작성 (30분)                      │
│  10:05  물류 현황 파악 → 시트 스크롤, 필터 (15분)           │
│  10:20  고객 문의 확인 → 주문 정보 찾기 (20분/건)           │
│  ...                                                         │
│                                                              │
│  😫 오전 내내 "현황 파악"에만 시간 소비                      │
│  😫 실제 "의사결정"과 "액션"은 오후부터                      │
└─────────────────────────────────────────────────────────────┘

**핵심 문제**
1. 같은 데이터를 매번 다른 관점으로 봐야 함
2. 시트를 오가며 정보를 조합하는 시간 낭비
3. 단순 확인 작업에 하루의 절반을 소비
4. 정작 중요한 의사결정 시간은 부족

**깨달음**
> "내가 해야 할 일은 데이터를 찾는 게 아니라,
> 데이터를 바탕으로 판단하고 행동하는 것이다."

→ 반복 업무를 자동화하면, 진짜 중요한 일에 집중할 수 있다
```

---

## 📌 신규 슬라이드 B: "어떤 업무부터 자동화했는가"

```markdown
## 슬라이드 4-2: 자동화 우선순위 - 어디서부터 시작했는가

### 자동화 우선순위 매트릭스

             반복 빈도 높음
                  ↑
    ┌─────────────┼─────────────┐
    │   🥈 2순위  │   🥇 1순위  │
    │  복잡하지만 │  반복+단순  │
    │  자주 반복  │  → 먼저!   │
시간 │─────────────┼─────────────│ 시간
소요 │   ⏳ 보류   │   🥉 3순위  │ 소요
적음 │  낮은 우선  │  단순하지만 │ 많음
    │    순위    │  가끔 발생  │
    └─────────────┼─────────────┘
                  ↓
             반복 빈도 낮음

### 실제 적용 순서

| 순서 | 업무 | 반복 빈도 | 소요 시간 | 자동화 효과 |
|------|------|-----------|-----------|-------------|
| 1️⃣ | 일일 현황 파악 | 매일 | 1시간+ | 1분으로 단축 |
| 2️⃣ | 미입고 현황 체크 | 매일 | 30분 | 실시간 알림 |
| 3️⃣ | 고객 정보 조회 | 수시 | 10분/건 | 3초로 단축 |
| 4️⃣ | SNS 콘텐츠 작성 | 주 3회 | 3시간 | 5분으로 단축 |
| 5️⃣ | 작가 입고 요청 | 수시 | 15분/건 | 1클릭 발송 |

### 자동화 선정 기준
1. **매일 반복**되는 업무 → 최우선
2. **단순하지만 시간이 오래** 걸리는 업무
3. **실수 가능성**이 높은 업무
4. **데이터 조합**이 필요한 업무
```

---

## 📌 신규 슬라이드 C: "업무별 AI 적용 사례"

```markdown
## 슬라이드 4-3: 업무별 AI 적용 - 각 페이지는 어떻게 탄생했는가

### 업무 Pain Point → AI 솔루션 매핑

┌─────────────────────────────────────────────────────────────────┐
│  업무 영역      │  기존 Pain Point        │  AI 솔루션 (페이지)  │
├─────────────────────────────────────────────────────────────────┤
│                 │                         │                      │
│  📊 현황 파악   │  3개 시트 오가며 계산   │  → 메인 대시보드     │
│                 │  KPI 수동 집계          │    (실시간 KPI)      │
│                 │                         │                      │
│  📦 물류 관리   │  수천 행 스크롤         │  → 물류 관제 센터    │
│                 │  병목 구간 파악 어려움  │    (5단계 파이프라인)│
│                 │                         │                      │
│  ⚠️ 미입고 대응 │  누락 발생, 수동 체크   │  → 미입고 관리       │
│                 │  작가 연락 일일이 작성  │    (자동 알림 예정)  │
│                 │                         │                      │
│  👥 고객 분석   │  3개 시트 조합 필요     │  → 고객 360도 뷰     │
│                 │  RFM 수동 계산          │    (자동 RFM 분석)   │
│                 │                         │                      │
│  💬 CS 대응     │  주문 정보 찾기 10분    │  → 통합 검색         │
│                 │  여러 시트 확인         │    (3초 만에 조회)   │
│                 │                         │                      │
│  📱 마케팅      │  SNS 콘텐츠 3시간       │  → Marketing Studio  │
│                 │  다국어 번역 2일        │    (5분 만에 생성)   │
│                 │                         │                      │
│  🎨 작품 관리   │  번역 외주 1-2일        │  → GB Translation    │
│                 │  품질 편차              │    (AI 자동 번역)    │
│                 │                         │                      │
└─────────────────────────────────────────────────────────────────┘

### 핵심 패턴
> Pain Point를 발견하면 → AI에게 "이거 자동화할 수 있어?"라고 질문
> → 가능하다고 하면 시도 → 반복 개선
```

---

## 📌 신규 슬라이드 D: "실제 구현 과정과 소요 시간"

```markdown
## 슬라이드 4-4: 실제 구현 과정 - 얼마나 걸렸는가

### 각 기능별 실제 개발 소요 시간

| 기능 | 복잡도 | 소요 시간 | 주요 작업 |
|------|--------|-----------|-----------|
| 메인 대시보드 | ⭐⭐⭐ | 2주 | KPI 카드, 차트, 필터 |
| 물류 관제 센터 | ⭐⭐⭐⭐ | 2주 | 파이프라인, 상태 관리 |
| 고객 360도 뷰 | ⭐⭐⭐ | 1주 | 모달, RFM 계산 |
| 통합 검색 | ⭐⭐ | 3일 | 검색 API, 결과 표시 |
| 미입고 관리 | ⭐⭐⭐ | 1주 | 필터링, 정렬, 알림 |
| Marketing Studio | ⭐⭐⭐⭐ | 3주 | AI 연동, 다국어 |
| GB Translation | ⭐⭐⭐ | 2주 | AI 번역, 용어집 |

**총 소요 기간**: 약 4개월 (업무 병행)
**하루 평균 투자 시간**: 1-2시간

### 실제 개발 사이클 (1개 기능 기준)

```
Day 1-2: 기획
├─ "이 업무 자동화하고 싶어" → AI에게 설명
├─ AI가 제안하는 구조 검토
└─ 대략적인 화면 구성 논의

Day 3-5: 프로토타입
├─ AI에게 코드 생성 요청
├─ 에러 발생 → AI에게 해결 요청
├─ 기본 동작 확인
└─ "이 부분은 이렇게 바꿔줘" 요청

Day 6-7: 개선
├─ 실제 데이터로 테스트
├─ UI 다듬기
├─ 엣지 케이스 처리
└─ 배포
```

### 비개발자가 가능한 이유

1. **코드를 이해할 필요 없음** - "이렇게 동작했으면 좋겠어"만 설명
2. **에러를 직접 해결할 필요 없음** - 에러 메시지를 AI에게 전달
3. **설계를 직접 할 필요 없음** - AI가 제안, 내가 선택
4. **필요한 건 업무 이해도** - "뭘 자동화할지"를 아는 것이 핵심
```

---

## 📌 신규 슬라이드 E: "AI로 가능한 자동화 수준"

```markdown
## 슬라이드 4-5: AI 자동화 가능 범위 - 어디까지 가능한가

### 자동화 수준 스펙트럼

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                  │
│  Level 1: 데이터 조회/표시                                       │
│  ├─ 시트 데이터를 웹으로 표시                                   │
│  ├─ 필터, 정렬, 검색                                            │
│  └─ 난이도: ⭐ (1-2일)                                          │
│                                                                  │
│  Level 2: 데이터 가공/분석                                       │
│  ├─ KPI 자동 계산                                               │
│  ├─ 차트 시각화                                                 │
│  ├─ RFM 분석 등 복합 계산                                       │
│  └─ 난이도: ⭐⭐ (3-5일)                                        │
│                                                                  │
│  Level 3: 워크플로우 자동화                                      │
│  ├─ 조건부 알림 (미입고 7일 이상 등)                            │
│  ├─ 상태 자동 변경                                              │
│  ├─ 이메일/슬랙 연동                                            │
│  └─ 난이도: ⭐⭐⭐ (1-2주)                                      │
│                                                                  │
│  Level 4: AI 콘텐츠 생성                                         │
│  ├─ SNS 콘텐츠 자동 생성                                        │
│  ├─ 번역 자동화                                                 │
│  ├─ 분석 리포트 자동 생성                                       │
│  └─ 난이도: ⭐⭐⭐⭐ (2-3주)                                    │
│                                                                  │
│  Level 5: 의사결정 지원                                          │
│  ├─ AI 추천 (상품, 작가, 고객)                                  │
│  ├─ 이상 징후 감지                                              │
│  ├─ 예측 분석                                                   │
│  └─ 난이도: ⭐⭐⭐⭐⭐ (진행 중)                                │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 현재 Global Business Hub 구현 수준

- Level 1~2: ✅ 완료 (대시보드, 분석)
- Level 3: ✅ 부분 완료 (알림 시스템 구축 중)
- Level 4: ✅ 완료 (Marketing Studio, Translation)
- Level 5: 🔄 진행 중 (AI 추천, Business Brain)

### 핵심 인사이트
> "완벽하게 구현하려 하지 마세요.
> Level 1부터 시작해서 점진적으로 확장하세요.
> 작은 성공이 다음 도전의 원동력이 됩니다."
```

---

## 📌 신규 슬라이드 F: "청중을 위한 실전 가이드"

```markdown
## 슬라이드: 여러분도 시작할 수 있습니다

### 오늘부터 시작하는 3단계

**Step 1: Pain Point 발견 (오늘)**
```
┌─────────────────────────────────────────────────────────────┐
│  질문: "매일 반복하는데 귀찮은 업무가 뭐지?"                │
│                                                              │
│  예시:                                                       │
│  · 매일 아침 시트 열어서 어제 현황 확인                     │
│  · 같은 형식의 보고서를 매주 작성                           │
│  · 여러 시트를 오가며 정보 조합                             │
│  · 같은 질문에 같은 답변 반복                               │
│                                                              │
│  → 이 중 하나를 선택하세요                                  │
└─────────────────────────────────────────────────────────────┘
```

**Step 2: AI에게 질문 (이번 주)**
```
┌─────────────────────────────────────────────────────────────┐
│  프롬프트 예시:                                              │
│                                                              │
│  "나는 [업무]를 담당하고 있어.                              │
│   매일 [반복 작업]을 하는데 시간이 너무 오래 걸려.          │
│   이걸 자동화할 수 있는 방법이 있을까?                      │
│   비개발자도 만들 수 있는 수준으로 알려줘."                 │
│                                                              │
│  → AI가 제안하는 방법 중 가장 쉬운 것부터 시도              │
└─────────────────────────────────────────────────────────────┘
```

**Step 3: 작은 것부터 시도 (이번 달)**
```
┌─────────────────────────────────────────────────────────────┐
│  추천 첫 프로젝트:                                           │
│                                                              │
│  · Google Sheets + Apps Script로 자동 계산                  │
│  · Notion + 자동화 (Zapier, Make)                           │
│  · 간단한 대시보드 (Google Data Studio)                     │
│  · AI 챗봇으로 반복 질문 자동 응답                          │
│                                                              │
│  → 완벽하지 않아도 OK, 동작하면 성공!                       │
└─────────────────────────────────────────────────────────────┘
```

### 실패해도 괜찮습니다

> "저도 처음엔 수많은 에러를 만났습니다.
> 하지만 AI에게 에러 메시지를 보여주면 해결해줍니다.
> 실패는 학습의 과정일 뿐입니다."
```

---

## 🎨 Genspark 프롬프트

### 메인 프롬프트: 담당자 배경 및 자동화 여정 슬라이드

```
# 슬라이드 생성 요청: 1인 팀의 AI 자동화 여정

## 슬라이드 목적
비개발자가 AI를 활용해 업무를 자동화한 과정을 스토리텔링 형식으로 전달.
청중에게 "나도 할 수 있겠다"는 용기와 동기 부여 제공.

## 디자인 스타일
- 스타일: 스토리텔링, 감성적이면서도 실용적
- 메인 컬러: #F78C3A (오렌지), #1F2937 (다크)
- 배경: 밝은 톤, 깔끔한 레이아웃
- 아이콘: 이모지 활용으로 친근하게
- 폰트: Pretendard 또는 유사 산세리프

## 슬라이드 1: 1인 팀의 탄생

제목: "혼자서 비즈니스 전체를?"
부제: 오프라인셀에서 글로벌 비즈니스 1인 팀으로

레이아웃: 2열
- 왼쪽: Before (오프라인셀)
  - 매장 운영, 재고 관리
  - Google Sheets 대시보드
  - "이 정도면 충분하지 않나?"
  
- 오른쪽: After (글로벌 비즈니스셀)
  - 1인 팀으로 전체 비즈니스 운영
  - "기존 방식으론 감당이 안 된다"
  - 화살표로 전환 강조

하단: "뭔가 다른 방법이 필요했습니다"

## 슬라이드 2: 1인이 담당하는 업무 범위

제목: "이 모든 걸 혼자서?"

원형 또는 육각형 다이어그램으로 6개 업무 영역 표시:

중앙: 👤 1인 팀

주변 (시계 방향):
1. 📊 비즈니스 현황 파악 - GMV, 주문, 고객, 작가 성과
2. 📦 물류 대응 - 입고, 출고, 배송, 미입고 관리
3. 🎨 작가/작품 관리 - 셀렉션, QC, 계약
4. 👥 고객 관리 - 분석, VIP, 이탈 방지
5. 💬 CS 대응 - 고객 문의, 클레임, 작가 커뮤니케이션
6. 📱 마케팅 - SNS, 기획전, 인플루언서, 현지 업체 협업

하단 메시지: "불가능해 보이는 업무량 → AI 자동화가 답이었습니다"

## 슬라이드 3: 어떤 업무부터 자동화?

제목: "자동화 우선순위 매트릭스"

2x2 매트릭스:
- X축: 반복 빈도 (낮음 ↔ 높음)
- Y축: 시간 소요 (적음 ↔ 많음)

사분면:
- 1순위 (우상단): 반복 빈도 높음 + 시간 많이 소요 → 🥇 먼저 자동화
- 2순위 (좌상단): 반복 빈도 낮음 + 시간 많이 소요 → 🥈 다음 자동화
- 3순위 (우하단): 반복 빈도 높음 + 시간 적게 소요 → 🥉 여유 있을 때
- 보류 (좌하단): 반복 빈도 낮음 + 시간 적게 소요 → ⏳ 나중에

오른쪽: 실제 적용 순서 테이블
1. 일일 현황 파악 (매일 1시간 → 1분)
2. 미입고 현황 체크 (매일 30분 → 실시간)
3. 고객 정보 조회 (수시 10분 → 3초)
4. SNS 콘텐츠 (주 3회 3시간 → 5분)

## 슬라이드 4: Pain Point → AI 솔루션

제목: "업무별 AI 적용 사례"

테이블 형식 (컬러풀한 카드 스타일):

| 업무 Pain Point | AI 솔루션 (페이지) |
|-----------------|-------------------|
| 📊 3개 시트 오가며 KPI 계산 | → 메인 대시보드 (실시간 KPI) |
| 📦 수천 행 스크롤, 병목 파악 어려움 | → 물류 관제 센터 (파이프라인) |
| ⚠️ 미입고 누락, 수동 연락 | → 미입고 관리 (자동 알림) |
| 👥 고객 정보 조합에 10분 | → 고객 360도 뷰 (3초 조회) |
| 📱 SNS 콘텐츠 3시간 | → Marketing Studio (5분) |

하단 패턴:
"Pain Point 발견 → AI에게 질문 → 시도 → 반복"

## 슬라이드 5: 실제 소요 시간

제목: "얼마나 걸렸을까?"

타임라인 + 테이블 조합:

| 기능 | 난이도 | 소요 시간 |
|------|--------|-----------|
| 메인 대시보드 | ⭐⭐⭐ | 2주 |
| 물류 관제 센터 | ⭐⭐⭐⭐ | 2주 |
| 고객 360도 뷰 | ⭐⭐⭐ | 1주 |
| 통합 검색 | ⭐⭐ | 3일 |
| Marketing Studio | ⭐⭐⭐⭐ | 3주 |

하단 정보:
- 총 소요: 약 4개월 (업무 병행)
- 하루 평균 투자: 1-2시간
- 개발 경험: 없음

핵심 메시지:
"코드를 이해할 필요 없습니다.
'이렇게 동작했으면 좋겠어'만 설명하면 됩니다."

## 슬라이드 6: AI 자동화 가능 수준

제목: "어디까지 가능한가?"

피라미드 또는 계단 형태:

Level 5: 의사결정 지원 (AI 추천, 예측) - 🔄 진행 중
Level 4: AI 콘텐츠 생성 (번역, SNS) - ✅ 완료
Level 3: 워크플로우 자동화 (알림, 연동) - ✅ 부분 완료
Level 2: 데이터 가공/분석 (KPI, 차트) - ✅ 완료
Level 1: 데이터 조회/표시 (필터, 검색) - ✅ 완료

오른쪽: 난이도별 소요 시간
- Level 1: 1-2일
- Level 2: 3-5일
- Level 3: 1-2주
- Level 4: 2-3주
- Level 5: 진행 중

핵심 메시지:
"Level 1부터 시작하세요. 작은 성공이 다음 도전의 원동력입니다."

## 슬라이드 7: 여러분도 시작할 수 있습니다

제목: "오늘부터 시작하는 3단계"

3개 카드 레이아웃:

Step 1: Pain Point 발견 (오늘)
- 질문: "매일 반복하는데 귀찮은 업무가 뭐지?"
- 예시: 매일 시트 확인, 주간 보고서, 정보 조합...
- 배경색: 노란색

Step 2: AI에게 질문 (이번 주)
- 프롬프트: "이 업무를 자동화할 수 있어?"
- AI가 제안하는 방법 중 쉬운 것부터 시도
- 배경색: 파란색

Step 3: 작은 것부터 시도 (이번 달)
- Apps Script, Notion 자동화, 간단한 대시보드
- 완벽하지 않아도 OK
- 배경색: 초록색

하단 메시지 (오렌지 배경):
"저도 처음엔 수많은 에러를 만났습니다.
하지만 AI에게 에러 메시지를 보여주면 해결해줍니다.
실패는 학습의 과정일 뿐입니다."

---

## 특별 요청사항

1. 스토리텔링 흐름 유지
   - 1인 팀의 탄생 → 업무 범위 → 자동화 필요성 → 우선순위 → 적용 사례 → 소요 시간 → 가능 범위 → 청중 가이드

2. 감정적 공감 요소
   - "이 모든 걸 혼자서?" → 공감
   - "불가능해 보이는 업무량" → 어려움 인정
   - "여러분도 할 수 있습니다" → 용기 부여

3. 실용적 정보 제공
   - 구체적인 소요 시간
   - 난이도별 분류
   - 실제 시작 가이드

4. 시각적 강조
   - Pain Point는 빨간/노란 계열
   - 솔루션은 초록/파란 계열
   - 핵심 메시지는 오렌지 배경
```

---

## 📝 HTML 목업 코드

### 1인 팀 업무 범위 다이어그램

```html
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>1인 팀 업무 범위</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    * { font-family: 'Pretendard', -apple-system, sans-serif; }
    .gradient-orange { background: linear-gradient(135deg, #F78C3A 0%, #E67729 100%); }
  </style>
</head>
<body class="bg-gray-50 min-h-screen p-8">
  <div class="max-w-4xl mx-auto">
    <h2 class="text-2xl font-bold text-center mb-2">이 모든 걸 혼자서?</h2>
    <p class="text-gray-500 text-center mb-10">1인 팀이 담당하는 업무 범위</p>
    
    <!-- 중앙 다이어그램 -->
    <div class="relative">
      <!-- 중앙 -->
      <div class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
        <div class="w-24 h-24 gradient-orange rounded-full flex items-center justify-center shadow-lg">
          <div class="text-center text-white">
            <span class="text-3xl">👤</span>
            <p class="text-xs font-bold mt-1">1인 팀</p>
          </div>
        </div>
      </div>
      
      <!-- 업무 영역들 -->
      <div class="grid grid-cols-3 gap-4">
        <!-- 상단 -->
        <div class="col-span-3 flex justify-center gap-4">
          <div class="bg-white rounded-xl p-4 shadow-md border-l-4 border-blue-500 w-64">
            <div class="flex items-center gap-2 mb-2">
              <span class="text-2xl">📊</span>
              <span class="font-bold text-gray-800">비즈니스 현황</span>
            </div>
            <p class="text-sm text-gray-500">GMV, 주문, 고객, 작가 성과 분석</p>
          </div>
          <div class="bg-white rounded-xl p-4 shadow-md border-l-4 border-amber-500 w-64">
            <div class="flex items-center gap-2 mb-2">
              <span class="text-2xl">📦</span>
              <span class="font-bold text-gray-800">물류 대응</span>
            </div>
            <p class="text-sm text-gray-500">입고, 출고, 배송, 미입고 관리</p>
          </div>
        </div>
        
        <!-- 중앙 (빈 공간) -->
        <div class="bg-white rounded-xl p-4 shadow-md border-l-4 border-purple-500">
          <div class="flex items-center gap-2 mb-2">
            <span class="text-2xl">🎨</span>
            <span class="font-bold text-gray-800">작가/작품</span>
          </div>
          <p class="text-sm text-gray-500">셀렉션, QC, 계약 관리</p>
        </div>
        
        <div class="h-32"></div> <!-- 중앙 빈 공간 -->
        
        <div class="bg-white rounded-xl p-4 shadow-md border-l-4 border-green-500">
          <div class="flex items-center gap-2 mb-2">
            <span class="text-2xl">👥</span>
            <span class="font-bold text-gray-800">고객 관리</span>
          </div>
          <p class="text-sm text-gray-500">분석, VIP, 이탈 방지</p>
        </div>
        
        <!-- 하단 -->
        <div class="col-span-3 flex justify-center gap-4">
          <div class="bg-white rounded-xl p-4 shadow-md border-l-4 border-red-500 w-64">
            <div class="flex items-center gap-2 mb-2">
              <span class="text-2xl">💬</span>
              <span class="font-bold text-gray-800">CS 대응</span>
            </div>
            <p class="text-sm text-gray-500">고객 문의, 클레임, 작가 소통</p>
          </div>
          <div class="bg-white rounded-xl p-4 shadow-md border-l-4 border-pink-500 w-64">
            <div class="flex items-center gap-2 mb-2">
              <span class="text-2xl">📱</span>
              <span class="font-bold text-gray-800">마케팅</span>
            </div>
            <p class="text-sm text-gray-500">SNS, 기획전, 인플루언서, 현지 업체</p>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 하단 메시지 -->
    <div class="mt-10 gradient-orange rounded-xl p-6 text-white text-center">
      <p class="text-lg">불가능해 보이는 업무량</p>
      <p class="text-2xl font-bold mt-2">→ AI 자동화가 답이었습니다</p>
    </div>
  </div>
</body>
</html>
```

### 자동화 우선순위 매트릭스

```html
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>자동화 우선순위 매트릭스</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    * { font-family: 'Pretendard', -apple-system, sans-serif; }
  </style>
</head>
<body class="bg-gray-50 min-h-screen p-8">
  <div class="max-w-5xl mx-auto">
    <h2 class="text-2xl font-bold text-center mb-8">어떤 업무부터 자동화할까?</h2>
    
    <div class="grid grid-cols-2 gap-8">
      <!-- 매트릭스 -->
      <div class="bg-white rounded-xl p-6 shadow-lg">
        <h3 class="font-bold text-gray-700 mb-4 text-center">자동화 우선순위 매트릭스</h3>
        
        <div class="relative">
          <!-- Y축 레이블 -->
          <div class="absolute -left-4 top-1/2 -translate-y-1/2 -rotate-90 text-xs text-gray-500 whitespace-nowrap">
            시간 소요 →
          </div>
          
          <!-- X축 레이블 -->
          <div class="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-6 text-xs text-gray-500">
            반복 빈도 →
          </div>
          
          <div class="grid grid-cols-2 gap-2 ml-4">
            <div class="bg-yellow-100 rounded-lg p-4 h-28 flex flex-col justify-center items-center border-2 border-yellow-300">
              <span class="text-2xl mb-1">🥈</span>
              <span class="text-sm font-bold text-yellow-700">2순위</span>
              <span class="text-xs text-yellow-600">복잡 + 가끔</span>
            </div>
            <div class="bg-green-100 rounded-lg p-4 h-28 flex flex-col justify-center items-center border-2 border-green-400 ring-4 ring-green-200">
              <span class="text-2xl mb-1">🥇</span>
              <span class="text-sm font-bold text-green-700">1순위</span>
              <span class="text-xs text-green-600">반복 + 시간多</span>
            </div>
            <div class="bg-gray-100 rounded-lg p-4 h-28 flex flex-col justify-center items-center border border-gray-200">
              <span class="text-2xl mb-1">⏳</span>
              <span class="text-sm font-bold text-gray-500">보류</span>
              <span class="text-xs text-gray-400">단순 + 가끔</span>
            </div>
            <div class="bg-blue-100 rounded-lg p-4 h-28 flex flex-col justify-center items-center border border-blue-200">
              <span class="text-2xl mb-1">🥉</span>
              <span class="text-sm font-bold text-blue-700">3순위</span>
              <span class="text-xs text-blue-600">반복 + 시간少</span>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 실제 적용 순서 -->
      <div class="bg-white rounded-xl p-6 shadow-lg">
        <h3 class="font-bold text-gray-700 mb-4">실제 적용 순서</h3>
        
        <div class="space-y-3">
          <div class="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
            <span class="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center font-bold">1</span>
            <div class="flex-1">
              <p class="font-medium">일일 현황 파악</p>
              <p class="text-sm text-gray-500">매일 1시간+ → <span class="text-green-600 font-bold">1분</span></p>
            </div>
          </div>
          
          <div class="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
            <span class="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center font-bold">2</span>
            <div class="flex-1">
              <p class="font-medium">미입고 현황 체크</p>
              <p class="text-sm text-gray-500">매일 30분 → <span class="text-green-600 font-bold">실시간 알림</span></p>
            </div>
          </div>
          
          <div class="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <span class="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold">3</span>
            <div class="flex-1">
              <p class="font-medium">고객 정보 조회</p>
              <p class="text-sm text-gray-500">수시 10분/건 → <span class="text-blue-600 font-bold">3초</span></p>
            </div>
          </div>
          
          <div class="flex items-center gap-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
            <span class="w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center font-bold">4</span>
            <div class="flex-1">
              <p class="font-medium">SNS 콘텐츠 작성</p>
              <p class="text-sm text-gray-500">주 3회 3시간 → <span class="text-purple-600 font-bold">5분</span></p>
            </div>
          </div>
        </div>
        
        <div class="mt-4 p-3 bg-orange-50 rounded-lg border border-orange-200">
          <p class="text-sm text-orange-700">
            <span class="font-bold">💡 핵심:</span> 매일 반복 + 시간 많이 소요 = 최우선 자동화
          </p>
        </div>
      </div>
    </div>
  </div>
</body>
</html>
```

### 자동화 가능 수준 피라미드

```html
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AI 자동화 가능 수준</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    * { font-family: 'Pretendard', -apple-system, sans-serif; }
  </style>
</head>
<body class="bg-gray-50 min-h-screen p-8">
  <div class="max-w-4xl mx-auto">
    <h2 class="text-2xl font-bold text-center mb-2">어디까지 자동화 가능한가?</h2>
    <p class="text-gray-500 text-center mb-8">AI 자동화 수준 스펙트럼</p>
    
    <!-- 피라미드 -->
    <div class="flex flex-col items-center gap-2 mb-8">
      <!-- Level 5 -->
      <div class="w-48 bg-gradient-to-r from-purple-400 to-purple-500 rounded-lg p-3 text-white text-center relative">
        <div class="absolute -right-24 top-1/2 -translate-y-1/2 flex items-center gap-2">
          <span class="text-yellow-500">🔄</span>
          <span class="text-sm text-gray-600">진행 중</span>
        </div>
        <p class="text-xs font-bold">Level 5</p>
        <p class="text-sm">의사결정 지원</p>
        <p class="text-xs opacity-80">AI 추천, 예측</p>
      </div>
      
      <!-- Level 4 -->
      <div class="w-64 bg-gradient-to-r from-blue-400 to-blue-500 rounded-lg p-3 text-white text-center relative">
        <div class="absolute -right-20 top-1/2 -translate-y-1/2 flex items-center gap-2">
          <span class="text-green-500">✅</span>
          <span class="text-sm text-gray-600">완료</span>
        </div>
        <p class="text-xs font-bold">Level 4</p>
        <p class="text-sm">AI 콘텐츠 생성</p>
        <p class="text-xs opacity-80">번역, SNS 콘텐츠</p>
      </div>
      
      <!-- Level 3 -->
      <div class="w-80 bg-gradient-to-r from-teal-400 to-teal-500 rounded-lg p-3 text-white text-center relative">
        <div class="absolute -right-24 top-1/2 -translate-y-1/2 flex items-center gap-2">
          <span class="text-yellow-500">🔄</span>
          <span class="text-sm text-gray-600">부분 완료</span>
        </div>
        <p class="text-xs font-bold">Level 3</p>
        <p class="text-sm">워크플로우 자동화</p>
        <p class="text-xs opacity-80">조건부 알림, 연동</p>
      </div>
      
      <!-- Level 2 -->
      <div class="w-96 bg-gradient-to-r from-green-400 to-green-500 rounded-lg p-3 text-white text-center relative">
        <div class="absolute -right-20 top-1/2 -translate-y-1/2 flex items-center gap-2">
          <span class="text-green-500">✅</span>
          <span class="text-sm text-gray-600">완료</span>
        </div>
        <p class="text-xs font-bold">Level 2</p>
        <p class="text-sm">데이터 가공/분석</p>
        <p class="text-xs opacity-80">KPI 계산, 차트, RFM</p>
      </div>
      
      <!-- Level 1 -->
      <div class="w-[28rem] bg-gradient-to-r from-gray-400 to-gray-500 rounded-lg p-3 text-white text-center relative">
        <div class="absolute -right-20 top-1/2 -translate-y-1/2 flex items-center gap-2">
          <span class="text-green-500">✅</span>
          <span class="text-sm text-gray-600">완료</span>
        </div>
        <p class="text-xs font-bold">Level 1</p>
        <p class="text-sm">데이터 조회/표시</p>
        <p class="text-xs opacity-80">필터, 정렬, 검색</p>
      </div>
    </div>
    
    <!-- 난이도별 소요 시간 -->
    <div class="grid grid-cols-5 gap-2 mb-8">
      <div class="bg-gray-100 rounded-lg p-3 text-center">
        <p class="text-xs text-gray-500">Level 1</p>
        <p class="font-bold text-gray-700">1-2일</p>
      </div>
      <div class="bg-green-100 rounded-lg p-3 text-center">
        <p class="text-xs text-gray-500">Level 2</p>
        <p class="font-bold text-green-700">3-5일</p>
      </div>
      <div class="bg-teal-100 rounded-lg p-3 text-center">
        <p class="text-xs text-gray-500">Level 3</p>
        <p class="font-bold text-teal-700">1-2주</p>
      </div>
      <div class="bg-blue-100 rounded-lg p-3 text-center">
        <p class="text-xs text-gray-500">Level 4</p>
        <p class="font-bold text-blue-700">2-3주</p>
      </div>
      <div class="bg-purple-100 rounded-lg p-3 text-center">
        <p class="text-xs text-gray-500">Level 5</p>
        <p class="font-bold text-purple-700">진행 중</p>
      </div>
    </div>
    
    <!-- 핵심 메시지 -->
    <div class="bg-gradient-to-r from-orange-500 to-orange-400 rounded-xl p-6 text-white text-center">
      <p class="text-lg font-bold mb-2">💡 Level 1부터 시작하세요</p>
      <p class="text-white/90">작은 성공이 다음 도전의 원동력입니다</p>
    </div>
  </div>
</body>
</html>
```

---

## ✅ 체크리스트

### 슬라이드 수정/추가 목록

- [ ] 슬라이드 4: 담당자 배경 → 1인 팀의 탄생 (스토리텔링)
- [ ] 신규 슬라이드 4-1: 왜 자동화가 필요했는가
- [ ] 신규 슬라이드 4-2: 자동화 우선순위 매트릭스
- [ ] 신규 슬라이드 4-3: 업무별 AI 적용 사례 (Pain Point → 솔루션)
- [ ] 신규 슬라이드 4-4: 실제 구현 과정과 소요 시간
- [ ] 신규 슬라이드 4-5: AI 자동화 가능 수준 (스펙트럼)
- [ ] 신규 슬라이드: 청중을 위한 실전 가이드 (3단계)

### 핵심 메시지 체크

- [ ] 1인 팀의 현실적인 업무 범위 전달
- [ ] "왜 자동화가 필요했는지" 공감 유도
- [ ] "어디서부터 시작해야 하는지" 명확한 가이드
- [ ] "얼마나 걸리는지" 구체적인 시간 정보
- [ ] "어디까지 가능한지" 수준별 분류
- [ ] "나도 할 수 있다"는 용기와 동기 부여

---

*이 문서는 세션의 목적에 맞게 슬라이드를 보완하기 위한 가이드입니다.*
