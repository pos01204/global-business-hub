# 글로벌 비즈니스 업무 자동화 프로젝트
## 분산된 데이터를 하나로, 그리고 업무 전반으로 확장
### AI 코딩 도구를 활용한 3개 자동화 시스템 구축 사례

**프로젝트 구성**
| 프로젝트 | 목적 | 배포 |
|---------|------|------|
| Global Business Hub | 데이터 통합, 비즈니스 분석, 물류/CS | Vercel + Railway |
| Marketing Studio | 퍼포먼스 마케팅 자동화 | [performance-marketer.vercel.app](https://performance-marketer.vercel.app) |
| GB Translation | 작품 번역 자동화 | 개발 중 |

---

## 📋 목차

### Part 1: Global Business Hub (데이터 통합 플랫폼)
1. 프로젝트 개요 (슬라이드 1-3)
2. **🎯 AI 자동화 여정 (슬라이드 4~4-7)** ← 대폭 보강
   - AI 자동화 여정의 시작, 업무 범위, 왜 자동화가 필요했는가
   - 자동화 우선순위 매트릭스
   - Pain Point → AI 솔루션 매핑
   - 실제 구현 과정과 소요 시간
   - AI 자동화 가능 수준 (Level 1~5)
   - 청중을 위한 실전 가이드
3. **🚀 6개월간의 성장 여정 (슬라이드 5)**
4. 기술 스택 (슬라이드 6)
5. 핵심 가치: 데이터 통합과 조합 (슬라이드 7-12)
6. AI 코딩 도구를 활용한 구현 과정 (슬라이드 13-17)
7. UI/UX 디자인 시스템 (슬라이드 18-22)
8. 주요 기능 및 화면 (슬라이드 23-32)
   - 기능 맵, 대시보드, 물류 관제, 미입고 관리, RFM, 고객 360도 뷰 등
9. 업무 적용 및 확장 계획 (슬라이드 33-37)
10. 향후 계획 및 Q&A (슬라이드 38-39)

### Part 2: 추가 자동화 프로젝트
A. 퍼포먼스 마케팅 자동화 - Marketing Studio (슬라이드 A-1~A-7)
B. 작품 번역 자동화 - GB Translation (슬라이드 B-1~B-6)
C. 3개 프로젝트 통합 비전 (슬라이드 C-1~C-4)

---

# 섹션 1: 프로젝트 개요

---

## 슬라이드 1: 타이틀

### 글로벌 비즈니스 통합 허브
**분산된 데이터를 하나로, 그리고 업무 전반으로 확장**

- 발표: Global Business셀
- 일시: 2026년 1월

---

## 슬라이드 2: 프로젝트 핵심 메시지

### 이 프로젝트가 해결한 것

**Before: 무한 복사되는 시트, 쌓이는 피로도**
```
┌─────────────────────────────────────────────────────────────┐
│  Google Spreadsheet 기반 업무 환경                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  [원본 시트]                                                 │
│      ↓ 복사                                                  │
│  주문_분석용.xlsx                                            │
│  주문_물류용.xlsx                                            │
│  주문_정산용_v2.xlsx                                         │
│  주문_마케팅_최종.xlsx                                       │
│  주문_마케팅_최종_수정.xlsx                                  │
│  주문_마케팅_최종_수정_final.xlsx  ← 어떤 게 최신?          │
│      ...                                                     │
│                                                              │
│  문제점:                                                     │
│  · 같은 데이터가 프로젝트마다 무한 복사                      │
│  · 어떤 시트가 최신인지 파악 어려움                          │
│  · 시트가 늘어날수록 가독성 저하                             │
│  · 데이터 찾는 시간 증가 → 업무 피로도 상승                  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**After: 하나의 데이터 체계, 다양한 활용**
```
┌─────────────────────────────────────────────────────────────┐
│  Admin 웹 앱 기반 업무 환경                                  │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  [단일 Raw Data]                                             │
│       ↓                                                      │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              Global Business Hub                     │    │
│  │                                                      │    │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐   │    │
│  │  │대시보드 │ │물류관제 │ │성과분석 │ │ QC/CS  │   │    │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘   │    │
│  │                                                      │    │
│  │  · 같은 데이터, 다른 View                           │    │
│  │  · 항상 최신 데이터 조회                            │    │
│  │  · 목적에 맞는 UI/UX 제공                           │    │
│  │                                                      │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 슬라이드 3: 프로젝트 범위

### 현재 구현된 기능과 확장 계획

**현재 운영 중**
| 영역 | 기능 |
|------|------|
| 비즈니스 분석 | 대시보드, 성과 분석, 고객 분석 |
| 물류 운영 | 미입고 관리, 물류 관제, 배송 추적 |
| 마케팅 | 퍼포먼스 마케팅 도구, 쿠폰 생성기 |
| 품질 관리 | 작품 QC 관리 |
| CS 지원 | 소포수령증 발급, 통합 검색 |

**확장 예정**
| 영역 | 기능 |
|------|------|
| 자동화 | KR 작품 자동 번역 |
| CS 고도화 | AI 기반 CS 대응 |
| 알림 | Slack 연동, 자동 리포트 |

---

## 슬라이드 4: AI 자동화 여정의 시작

### 글로벌 비즈니스셀로의 전환

**Before: 오프라인셀 (2025년 상반기)**
- 소담상회 인사점 매장 운영
- 재고 관리, 판매 분석 담당
- Google Sheets + Apps Script로 대시보드 구축
- "이 정도면 충분하지 않나?" 라고 생각

**전환점: 글로벌 비즈니스셀 이동**
- 규모는 작지만, **하나의 비즈니스 전체**를 운영해야 하는 상황
- 기존 시트로는 감당이 안 되는 업무량
- "뭔가 다른 방법이 필요하다"

**개발 경험**: 없음 (기초적인 HTML 수준)
**사용 도구**: Antigravity + Gemini (회사 지원 계정)

---

## 슬라이드 4-1: 1인이 담당하는 업무 범위

### "이 모든 걸 혼자서?"

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                  │
│  📊 비즈니스 현황 파악                                          │
│     └─ GMV, 주문, 고객, 작가 성과 분석                          │
│                                                                  │
│  📦 물류 대응                                                   │
│     └─ 입고 관리, 출고 처리, 배송 추적, 미입고 관리             │
│                                                                  │
│  🎨 작가/작품 관리 (셀렉션)                                     │
│     └─ 신규 작가 발굴, 작품 QC, 계약 관리                       │
│                                                                  │
│  👥 고객 관리                                                   │
│     └─ 고객 분석, VIP 관리, 이탈 방지                           │
│                                                                  │
│  💬 CS 대응 (작가 & 고객)                                       │
│     └─ 고객 문의, 클레임 처리, 작가 커뮤니케이션                │
│                                                                  │
│  📱 마케팅                                                      │
│     └─ 온드미디어 운영, 기획전, SNS 채널 이벤트                 │
│     └─ 일본 현지 마케팅 업체 협업                               │
│     └─ 인플루언서 협찬 광고 진행                                │
│                                                                  │
│  ─────────────────────────────────────────────────────────────  │
│  → 이 모든 것을 혼자서? 불가능.                                 │
│  → 그래서 AI를 활용한 자동화가 필수였습니다.                    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 슬라이드 4-2: 왜 자동화가 필요했는가

### 매일 반복되는 업무들

**Before: 하루의 시작**
```
09:00  어제 주문 현황 확인 → 시트 열기, 필터, 정렬 (15분)
09:15  미입고 현황 체크 → 3개 시트 오가며 확인 (20분)
09:35  작가 입고 요청 메일 작성 (30분)
10:05  물류 현황 파악 → 시트 스크롤, 필터 (15분)
10:20  고객 문의 대응 → 주문 정보 찾기 (20분/건)
...

😫 오전 내내 "현황 파악"에만 시간 소비
😫 실제 "의사결정"과 "액션"은 오후부터
```

**핵심 문제**
1. 같은 데이터를 매번 다른 관점으로 봐야 함
2. 시트를 오가며 정보를 조합하는 시간 낭비
3. 단순 확인 작업에 하루의 절반을 소비
4. 정작 중요한 의사결정 시간은 부족

**깨달음**
> "내가 해야 할 일은 데이터를 찾는 게 아니라,
> 데이터를 바탕으로 판단하고 행동하는 것이다."

→ **반복 업무를 자동화하면, 진짜 중요한 일에 집중할 수 있다**

---

## 슬라이드 4-3: 자동화 우선순위 - 어디서부터 시작했는가

### 자동화 우선순위 매트릭스

```
                    반복 빈도 높음
                         ↑
       ┌─────────────────┼─────────────────┐
       │                 │                 │
       │   🥈 2순위      │   🥇 1순위     │
       │   복잡하지만    │   반복+시간多   │
시간   │   자주 반복     │   → 먼저!      │
소요   │                 │                 │
많음   │─────────────────┼─────────────────│
       │                 │                 │
       │   ⏳ 보류       │   🥉 3순위     │
시간   │   낮은 우선순위 │   단순+자주    │
소요   │                 │                 │
적음   └─────────────────┼─────────────────┘
                         ↓
                    반복 빈도 낮음
```

### 실제 적용 순서

| 순서 | 업무 | 반복 빈도 | 기존 소요 | 자동화 후 |
|------|------|-----------|-----------|-----------|
| 1️⃣ | 일일 현황 파악 | 매일 | 1시간+ | **1분** |
| 2️⃣ | 미입고 현황 체크 | 매일 | 30분 | **실시간 알림** |
| 3️⃣ | 고객 정보 조회 | 수시 | 10분/건 | **3초** |
| 4️⃣ | SNS 콘텐츠 작성 | 주 3회 | 3시간 | **5분** |
| 5️⃣ | 작가 입고 요청 | 수시 | 15분/건 | **1클릭** |

**자동화 선정 기준**
1. **매일 반복**되는 업무 → 최우선
2. **단순하지만 시간이 오래** 걸리는 업무
3. **실수 가능성**이 높은 업무
4. **데이터 조합**이 필요한 업무

---

## 슬라이드 4-4: 업무별 AI 적용 - Pain Point → 솔루션

### 각 페이지는 어떻게 탄생했는가

| 업무 | Pain Point | AI 솔루션 (페이지) |
|------|------------|-------------------|
| 📊 현황 파악 | 3개 시트 오가며 KPI 수동 계산 | → **메인 대시보드** (실시간 KPI) |
| 📦 물류 관리 | 수천 행 스크롤, 병목 파악 어려움 | → **물류 관제 센터** (5단계 파이프라인) |
| ⚠️ 미입고 대응 | 누락 발생, 작가 연락 일일이 작성 | → **미입고 관리** (자동 알림 예정) |
| 👥 고객 분석 | 3개 시트 조합에 10분+ 소요 | → **고객 360도 뷰** (3초 조회) |
| 💬 CS 대응 | 주문 정보 찾느라 10분 | → **통합 검색** (3초 조회) |
| 📱 마케팅 | SNS 콘텐츠 작성에 3시간 | → **Marketing Studio** (5분) |
| 🎨 작품 관리 | 번역 외주 1-2일, 품질 편차 | → **GB Translation** (AI 자동 번역) |

### 핵심 패턴
```
Pain Point 발견 → AI에게 "이거 자동화 가능해?" 질문
→ 가능하다고 하면 시도 → 에러 나면 AI에게 해결 요청
→ 반복 개선 → 완성
```

---

## 슬라이드 4-5: 실제 구현 과정 - 얼마나 걸렸는가

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

---

## 슬라이드 4-6: AI 자동화 가능 수준 - 어디까지 가능한가

### 자동화 수준 스펙트럼

```
Level 5: 의사결정 지원          🔄 진행 중
         AI 추천, 이상 징후 감지, 예측 분석
         ⭐⭐⭐⭐⭐ (수 개월)
              │
Level 4: AI 콘텐츠 생성         ✅ 완료
         SNS 콘텐츠, 번역, 분석 리포트 자동 생성
         ⭐⭐⭐⭐ (2-3주)
              │
Level 3: 워크플로우 자동화      ✅ 부분 완료
         조건부 알림, 상태 자동 변경, 연동
         ⭐⭐⭐ (1-2주)
              │
Level 2: 데이터 가공/분석       ✅ 완료
         KPI 자동 계산, 차트 시각화, RFM 분석
         ⭐⭐ (3-5일)
              │
Level 1: 데이터 조회/표시       ✅ 완료
         시트 데이터 표시, 필터, 정렬, 검색
         ⭐ (1-2일)
```

### 핵심 인사이트

> "완벽하게 구현하려 하지 마세요.
> **Level 1부터 시작**해서 점진적으로 확장하세요.
> 작은 성공이 다음 도전의 원동력이 됩니다."

---

## 슬라이드 4-7: 여러분도 시작할 수 있습니다

### 오늘부터 시작하는 3단계

**Step 1: Pain Point 발견 (오늘)**
```
질문: "매일 반복하는데 귀찮은 업무가 뭐지?"

예시:
· 매일 아침 시트 열어서 어제 현황 확인
· 같은 형식의 보고서를 매주 작성
· 여러 시트를 오가며 정보 조합
· 같은 질문에 같은 답변 반복

→ 이 중 하나를 선택하세요
```

**Step 2: AI에게 질문 (이번 주)**
```
프롬프트 예시:

"나는 [업무]를 담당하고 있어.
 매일 [반복 작업]을 하는데 시간이 너무 오래 걸려.
 이걸 자동화할 수 있는 방법이 있을까?
 비개발자도 만들 수 있는 수준으로 알려줘."

→ AI가 제안하는 방법 중 가장 쉬운 것부터 시도
```

**Step 3: 작은 것부터 시도 (이번 달)**
```
추천 첫 프로젝트:

· Google Sheets + Apps Script로 자동 계산
· Notion + 자동화 (Zapier, Make)
· 간단한 대시보드 (Google Data Studio)
· AI 챗봇으로 반복 질문 자동 응답

→ 완벽하지 않아도 OK, 동작하면 성공!
```

### 실패해도 괜찮습니다

> "저도 처음엔 수많은 에러를 만났습니다.
> 하지만 AI에게 에러 메시지를 보여주면 해결해줍니다.
> **실패는 학습의 과정**일 뿐입니다."

---

## 슬라이드 5: 6개월간의 성장 여정

### 비개발자의 AI 코딩 성장 스토리

**핵심 메시지**: 열심히 공부한 것이 아닙니다. **꾸준히 AI를 활용해 시도**했을 뿐입니다.

---

### Before: 6개월 전 (2025년 상반기, 오프라인셀)

**기술 스택**: Google Sheets + Apps Script

```
┌─────────────────────────────────────────────────────────────────┐
│  🏪 소담상회 인사점 운영 대시보드 (초기 버전)                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  📊 주요 현황 요약                                              │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐              │
│  │ 총 매출 │ │판매 수량│ │  ASP   │ │재고 위험│              │
│  │₩263.7M │ │ 23,564 │ │₩11,191│ │  500  │              │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘              │
│                                                                  │
│  📈 일별 매출 추이 (기본 라인 차트)                             │
│  📊 판매 위치별 매출 비중 (스택 바 차트)                        │
│  📋 TOP 5 상품/작가/위치 테이블                                 │
│  🤖 AI 시즌 운영 분석 (Apps Script + OpenAI)                    │
│  📅 이벤트 성과 분석                                            │
│  🔮 What-if 시뮬레이션                                          │
│                                                                  │
│  한계점:                                                         │
│  · 데이터 로딩에 수십 초 소요                                   │
│  · UI 커스터마이징 제한                                         │
│  · 복잡한 분석 기능 구현 어려움                                 │
│  · 모바일 대응 불가                                             │
│  · 단일 업무(오프라인 매장)에만 특화                            │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

### After: 현재 (2026년 1월, Global Business셀)

**기술 스택**: Next.js + Express + React + TypeScript

```
┌─────────────────────────────────────────────────────────────────┐
│  🌏 Global Business Hub (현재 버전)                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ⚡ 데이터 처리 속도                                            │
│  · 수십 초 → 1-2초 (10배+ 개선)                                │
│                                                                  │
│  🎨 UI/UX 완성도                                                │
│  · Sheets 기본 UI → 브랜드 디자인 시스템                       │
│  · 반응형, 다크모드, 애니메이션                                │
│                                                                  │
│  🔧 기능 다양성                                                 │
│  · 단일 대시보드 → 20개+ 페이지                                │
│  · 물류 파이프라인 시각화                                       │
│  · RFM 분석, 고객 360도 뷰                                     │
│  · 실시간 알림, 통합 검색                                       │
│                                                                  │
│  📋 업무 적용 범위                                              │
│  · 오프라인 매장 1개 → 글로벌 비즈니스 전체                    │
│  · 분석 + 물류 + 마케팅 + CS                                   │
│                                                                  │
│  🚀 추가 프로젝트                                               │
│  · Marketing Studio (마케팅 자동화)                             │
│  · GB Translation (번역 자동화)                                 │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

### 비약적 성장의 비결

| 항목 | 6개월 전 | 현재 | 성장폭 |
|------|----------|------|--------|
| 데이터 로딩 | 30-60초 | 1-2초 | **30배 개선** |
| 페이지 수 | 1개 | 20개+ | **20배 증가** |
| UI 완성도 | Sheets 기본 | 브랜드 디자인 시스템 | - |
| 업무 범위 | 오프라인 매장 | 글로벌 비즈니스 전체 | - |
| 추가 프로젝트 | - | 3개 (+ 진행중) | - |

**이 모든 성장의 핵심은 단 하나:**

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                  │
│   ❌  "개발 공부를 열심히 했다"                                  │
│                                                                  │
│   ✅  "AI를 활용해 꾸준히 시도하고 개선했다"                    │
│                                                                  │
│   · 막히면 AI에게 물어보기                                      │
│   · 에러가 나면 AI에게 해결 요청                                │
│   · 새로운 기능이 필요하면 AI에게 설계 요청                     │
│   · 더 나은 방법이 있는지 AI에게 질문                           │
│                                                                  │
│   → 6개월간 반복 = 비약적 성장                                  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 목업 코드: 6개월 성장 비교 카드 (HTML)

```html
<div class="p-8 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
  <h2 class="text-2xl font-bold text-center mb-8">🚀 6개월간의 성장 여정</h2>
  
  <div class="grid grid-cols-2 gap-8 max-w-5xl mx-auto">
    <!-- Before -->
    <div class="bg-white rounded-2xl p-6 shadow-lg border-2 border-gray-200">
      <div class="text-center mb-4">
        <span class="px-4 py-2 bg-gray-100 rounded-full text-gray-600 font-medium">6개월 전</span>
      </div>
      <h3 class="text-xl font-bold text-gray-700 mb-4">Google Sheets + Apps Script</h3>
      
      <div class="space-y-4">
        <div class="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
          <span class="text-2xl">⏱️</span>
          <div>
            <p class="text-sm text-gray-500">데이터 로딩</p>
            <p class="font-bold text-red-500">30-60초</p>
          </div>
        </div>
        <div class="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
          <span class="text-2xl">📄</span>
          <div>
            <p class="text-sm text-gray-500">페이지 수</p>
            <p class="font-bold">1개</p>
          </div>
        </div>
        <div class="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
          <span class="text-2xl">🎨</span>
          <div>
            <p class="text-sm text-gray-500">UI/UX</p>
            <p class="font-bold">Sheets 기본 UI</p>
          </div>
        </div>
        <div class="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
          <span class="text-2xl">🏪</span>
          <div>
            <p class="text-sm text-gray-500">업무 범위</p>
            <p class="font-bold">오프라인 매장 1곳</p>
          </div>
        </div>
      </div>
      
      <div class="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
        <p class="text-sm text-yellow-700">
          <span class="font-bold">한계:</span> UI 제한, 느린 속도, 단일 업무만 가능
        </p>
      </div>
    </div>
    
    <!-- After -->
    <div class="bg-white rounded-2xl p-6 shadow-lg border-2 border-orange-400 relative">
      <div class="absolute -top-3 -right-3 px-3 py-1 bg-orange-500 text-white rounded-full text-sm font-bold">
        현재
      </div>
      <div class="text-center mb-4">
        <span class="px-4 py-2 bg-orange-100 rounded-full text-orange-600 font-medium">2026년 1월</span>
      </div>
      <h3 class="text-xl font-bold text-gray-800 mb-4">Next.js + Express + React</h3>
      
      <div class="space-y-4">
        <div class="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
          <span class="text-2xl">⚡</span>
          <div>
            <p class="text-sm text-gray-500">데이터 로딩</p>
            <p class="font-bold text-green-600">1-2초 <span class="text-xs">(30배↑)</span></p>
          </div>
        </div>
        <div class="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
          <span class="text-2xl">📑</span>
          <div>
            <p class="text-sm text-gray-500">페이지 수</p>
            <p class="font-bold text-green-600">20개+ <span class="text-xs">(20배↑)</span></p>
          </div>
        </div>
        <div class="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
          <span class="text-2xl">✨</span>
          <div>
            <p class="text-sm text-gray-500">UI/UX</p>
            <p class="font-bold text-green-600">브랜드 디자인 시스템</p>
          </div>
        </div>
        <div class="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
          <span class="text-2xl">🌏</span>
          <div>
            <p class="text-sm text-gray-500">업무 범위</p>
            <p class="font-bold text-green-600">글로벌 비즈니스 전체</p>
          </div>
        </div>
      </div>
      
      <div class="mt-6 p-4 bg-orange-50 rounded-lg border border-orange-200">
        <p class="text-sm text-orange-700">
          <span class="font-bold">확장:</span> 분석 + 물류 + 마케팅 + CS + 번역
        </p>
      </div>
    </div>
  </div>
  
  <!-- 핵심 메시지 -->
  <div class="max-w-3xl mx-auto mt-10">
    <div class="bg-gradient-to-r from-orange-500 to-orange-400 rounded-2xl p-6 text-white text-center">
      <p class="text-lg mb-2">💡 6개월 성장의 비결</p>
      <p class="text-2xl font-bold">"공부"가 아닌 "AI 활용 시도"의 꾸준한 반복</p>
      <div class="flex justify-center gap-4 mt-4 text-sm">
        <span class="px-3 py-1 bg-white/20 rounded-full">막히면 AI에게 질문</span>
        <span class="px-3 py-1 bg-white/20 rounded-full">에러는 AI가 해결</span>
        <span class="px-3 py-1 bg-white/20 rounded-full">새 기능도 AI와 설계</span>
      </div>
    </div>
  </div>
</div>
```

---

## 슬라이드 6: 기술 스택

### 구현에 사용된 기술

| 영역 | 기술 |
|------|------|
| Frontend | Next.js 14, React, TypeScript, Tailwind CSS |
| Backend | Express.js, Node.js, TypeScript |
| 데이터 | Google Sheets API |
| AI | OpenAI API (채팅 기능) |
| 배포 | Vercel + Railway |
| 차트 | Chart.js, Recharts |

---

# 섹션 2: 핵심 가치 - 데이터 통합과 조합

---

## 슬라이드 6: 기존 문제 - 분산된 데이터

### 동일한 데이터, 무한 복사되는 시트

**실제 상황**
```
[주문 데이터가 필요한 경우]

업무A: "주문_분석용.xlsx" 복사해서 사용
업무B: "주문_물류용_v2.xlsx" 복사해서 사용
업무C: "주문_정산용_최종_수정.xlsx" 복사해서 사용

→ 프로젝트/업무마다 시트가 무한 복사됨
→ 시트 개수가 늘어날수록 가독성 저하
→ "이 숫자 왜 달라요?", "어떤 게 최신이에요?" 문제 발생
```

**문제점**
| 문제 | 설명 |
|------|------|
| 무한 복사 | 같은 데이터가 업무마다 복사되어 시트 증가 |
| 가독성 저하 | 시트가 많아질수록 원하는 데이터 찾기 어려움 |
| 버전 혼란 | 어떤 시트가 최신인지 파악 어려움 |
| 업무 피로도 | 데이터 찾고 정리하는 데 시간 소모 |
| 정합성 이슈 | 같은 데이터인데 계산 결과가 다름 |

---

## 슬라이드 7: Google Sheets의 한계

### 기능은 훌륭하지만, 시각적 표현과 UI/UX의 제한

**Google Sheets의 강점**
- 협업 기능 (동시 편집, 공유)
- 수식 및 함수 기능
- 무료 사용

**업무별 구체적 한계**
| 업무 | Google Sheets | 필요한 것 |
|------|---------------|----------|
| 물류 현황 | 수천 행 스크롤, 필터 반복 | 파이프라인 시각화, 병목 하이라이트 |
| 미입고 관리 | 수동 필터, 작가별 정리 어려움 | 자동 그룹화, 안내 발송 연동 |
| 고객 분석 | 3개 시트 오가며 조합 | 360도 뷰, 원클릭 상세 |
| 성과 리포트 | 매번 수식 재작성 | 실시간 대시보드, 자동 계산 |

**시각적 표현의 한계**
| 영역 | Google Sheets | Admin 웹 앱 |
|------|---------------|-------------|
| 물류 흐름 | 테이블 행 나열 | 파이프라인 다이어그램 |
| 병목 파악 | 조건부 서식 수동 설정 | 자동 하이라이트, 알림 |
| 고객 여정 | 시트 간 이동 반복 | 모달에서 통합 조회 |
| KPI 현황 | 별도 요약 시트 필요 | 카드형 대시보드 |
| 트렌드 분석 | 차트 수동 생성 | 실시간 연동 차트 |

**→ 전용 Admin 웹 앱으로 해결**

---

## 슬라이드 8: 해결 - 단일 데이터 소스 + 전용 UI

### 하나의 Raw Data, 목적에 맞는 인터페이스

**새로운 구조**
```
┌─────────────────────────────────────────────────┐
│         Google Sheets (Raw Data 저장소)          │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐│
│  │ order   │ │logistics│ │ users   │ │ artists ││
│  │주문 정보│ │물류 정보│ │고객 정보│ │작가 정보││
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘│
│                                                  │
│  ※ 시트 복사 없이 원본 데이터만 유지             │
└───────────────────────┬─────────────────────────┘
                        ↓ API
┌───────────────────────────────────────────────────┐
│                    Backend                         │
│    Raw Data 조합 → 2차, 3차, n차 데이터 생성        │
└───────────────────────┬───────────────────────────┘
                        ↓
┌───────────────────────────────────────────────────┐
│            Admin 웹 앱 (Frontend)                  │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐      │
│  │대시보드│ │물류관제│ │성과분석│ │QC관리 │ ...  │
│  └────────┘ └────────┘ └────────┘ └────────┘      │
│                                                    │
│  ※ 업무 목적에 맞는 UI/UX 제공                    │
│  ※ 시트에서 불가능했던 시각화 구현                │
└───────────────────────────────────────────────────┘
```

**Admin 웹 앱으로 가능해진 것**
| 기능 | 설명 |
|------|------|
| KPI 카드 | 핵심 지표를 한눈에 확인 |
| 파이프라인 뷰 | 물류 단계별 현황 시각화 |
| 모달 상세 | 클릭 시 상세 정보 팝업 |
| 실시간 필터 | 기간/국가/상태 필터 즉시 적용 |
| 차트 연동 | 데이터 변경 시 차트 자동 업데이트 |

---

## 슬라이드 9: 핵심 차별점 - 데이터 조합

### Raw Data에서 복합 분석 데이터까지

**데이터 조합 예시**

```
[1차 데이터: Raw Data]
- order: 주문번호, 금액, 날짜, 고객ID
- users: 고객ID, 가입일, 국가

[2차 데이터: 단순 조합]
- 고객별 주문 내역 (order + users)
- 국가별 매출 집계

[3차 데이터: 복합 분석]
- RFM 분석 (Recency, Frequency, Monetary)
- 고객 생애주기 (가입일 + 구매 패턴)
- 이탈 위험 고객 분류

[n차 데이터: 인사이트 도출]
- VIP 고객 예측
- 매출 예측
- 이상 징후 감지
```

---

## 슬라이드 10: 실제 데이터 조합 사례

### 4개 시트로 만드는 다양한 분석

**기본 시트 (Raw Data)**
| 시트 | 주요 컬럼 | 데이터 규모 |
|------|----------|-------------|
| order | 주문번호, 금액, 고객ID, 결제수단 | 수천 건 |
| logistics | 주문번호, 배송상태, 작가명, 작품명 | 수만 건 |
| users | 고객ID, 가입일, 국가, 이메일 | 지속 증가 |
| artists | 작가명, 작품수 | 수백 건 |

**생성되는 분석 데이터**
| 분석 | 조합 방식 | 활용 |
|------|----------|------|
| 고객 RFM | order 집계 + users | 마케팅 세그먼트 |
| 작가별 매출 | order + logistics + artists | 작가 관리 |
| 물류 파이프라인 | order + logistics 상태 | 운영 모니터링 |
| 국가별 성과 | order + users.국가 | 지역 전략 |

---

## 슬라이드 11: 데이터 통합의 효과

### 정합성 확보 및 분석 일관성

**Before**
```
팀A 매출: ₩123,456,789 (집계 방식 A)
팀B 매출: ₩120,000,000 (집계 방식 B)
팀C 매출: ₩125,000,000 (집계 방식 C)

→ "어느 숫자가 맞는 거예요?"
```

**After**
```
모든 팀이 동일한 API 호출
→ 매출: ₩123,456,789 (단일 계산 로직)

→ "모두 같은 숫자를 봅니다"
```

**추가 효과**
- 새로운 분석 요구 시 기존 API 조합으로 빠른 구현
- 데이터 수정 시 모든 화면에 자동 반영
- 분석 로직 중앙 관리

---

# 섹션 3: AI 코딩 도구를 활용한 구현 과정

---

## 슬라이드 12: 기본 작업 방식

### AI와의 협업 프로세스

```
1. 기능 정의
   └─ "이 데이터들을 조합해서 이런 분석이 필요해"

2. AI에게 요청
   └─ 구체적으로 설명
   └─ 예: "order와 users를 조인해서 국가별 매출 집계해줘"

3. 결과 확인
   └─ 생성된 코드 실행 및 확인

4. 수정 요청
   └─ "필터 조건 추가해줘", "차트 스타일 변경해줘"

5. 반복
   └─ 기능 추가 및 개선
```

---

## 슬라이드 13: 효과적인 요청 방법

### 데이터 조합 요청 예시

**좋은 요청 예시**
```
"고객 분석 API를 만들어줘.

[입력 데이터]
- order 시트: 주문번호, 금액, 고객ID, 주문일
- users 시트: 고객ID, 가입일, 국가

[출력 데이터]
- 고객별 RFM 계산
  - R: 마지막 주문으로부터 경과일
  - F: 총 주문 횟수
  - M: 총 구매금액
- 세그먼트 분류: VIP, 잠재, 이탈위험

[조건]
- 기간 필터 적용 가능하도록
- 국가 필터 적용 가능하도록"
```

---

## 슬라이드 14: 점진적 구축 과정

### 단계별 기능 확장

**Phase 1: 기본 분석 (2주)**
- 메인 대시보드 KPI
- 기본 데이터 조회
- order + users 조합

**Phase 2: 운영 도구 (2주)**
- 물류 관제 (order + logistics)
- 미입고 관리
- 통합 검색

**Phase 3: 고급 분석 (2주)**
- RFM 분석 (다중 시트 조합)
- 고객 생애주기
- 작가별 성과

**Phase 4: 업무 확장 (진행 중)**
- 퍼포먼스 마케팅 도구
- 작품 QC 관리
- 소포수령증 발급

---

## 슬라이드 15: 구현 타임라인

### 주차별 진행 내용

| 주차 | 작업 내용 | 데이터 조합 |
|-----|----------|-------------|
| 1주 | 환경 설정, 기본 API | order 단일 |
| 2주 | 대시보드, KPI | order + users |
| 3주 | 물류 관제 | order + logistics |
| 4주 | 성과 분석 | 전체 시트 조합 |
| 5주 | 고급 분석 (RFM) | 다중 집계 |
| 6주 | 추가 기능, 배포 | 확장 API |

**총 소요 기간**: 약 6주
**투입 시간**: 약 120시간 (업무 외 시간 활용)

---

## 슬라이드 16: 어려웠던 점과 해결 방법

### 데이터 조합 시 발생한 문제들

**1. 시트 간 키 불일치**
- 문제: order.user_id와 users.ID 컬럼명 다름
- 해결: 매핑 로직 추가

**2. 대용량 데이터 처리**
- 문제: 수만 건 조인 시 성능 저하
- 해결: 캐싱 적용 (10분 TTL)

**3. 복잡한 집계 로직**
- 문제: RFM 계산 로직 구현
- 해결: AI에게 단계별로 분해하여 요청

**4. 데이터 정합성**
- 문제: 빈 값, 잘못된 형식
- 해결: 데이터 정제 로직 추가

---

# 섹션 4: UI/UX 디자인 시스템 및 주요 기능

---

## 슬라이드 17: 디자인 시스템 개요

### idus 브랜드 기반 UI/UX

**브랜드 컬러 시스템**
```
┌─────────────────────────────────────────────────────────────┐
│                    idus Brand Colors                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Primary (포인트)                                            │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                   │
│  │ #F78C3A  │  │ #E67729  │  │ #FFF8F3  │                   │
│  │  Orange  │  │  Dark    │  │  Light   │                   │
│  └──────────┘  └──────────┘  └──────────┘                   │
│                                                              │
│  Neutral (기본)                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│  │ #1F2937  │  │ #374151  │  │ #6B7280  │  │ #F9FAFB  │    │
│  │  Dark    │  │  Medium  │  │  Muted   │  │  Light   │    │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘    │
│                                                              │
│  Status Colors                                               │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│  │ #059669  │  │ #DC2626  │  │ #D97706  │  │ #2563EB  │    │
│  │ Success  │  │ Danger   │  │ Warning  │  │  Info    │    │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**목업 코드 (HTML) - 컬러 팔레트**
```html
<div class="p-8 bg-white rounded-2xl shadow-lg">
  <h3 class="text-xl font-bold mb-6">Brand Color System</h3>
  
  <!-- Primary Colors -->
  <div class="mb-8">
    <p class="text-sm text-gray-500 mb-3 font-medium">PRIMARY (POINT)</p>
    <div class="flex gap-4">
      <div class="text-center">
        <div class="w-20 h-20 rounded-xl shadow-md" style="background: #F78C3A"></div>
        <p class="text-xs mt-2 font-mono">#F78C3A</p>
        <p class="text-xs text-gray-500">Orange</p>
      </div>
      <div class="text-center">
        <div class="w-20 h-20 rounded-xl shadow-md" style="background: #E67729"></div>
        <p class="text-xs mt-2 font-mono">#E67729</p>
        <p class="text-xs text-gray-500">Dark</p>
      </div>
      <div class="text-center">
        <div class="w-20 h-20 rounded-xl shadow-md border" style="background: #FFF8F3"></div>
        <p class="text-xs mt-2 font-mono">#FFF8F3</p>
        <p class="text-xs text-gray-500">Light</p>
      </div>
    </div>
  </div>
  
  <!-- Status Colors -->
  <div>
    <p class="text-sm text-gray-500 mb-3 font-medium">STATUS</p>
    <div class="flex gap-4">
      <div class="text-center">
        <div class="w-16 h-16 rounded-lg" style="background: #059669"></div>
        <p class="text-xs mt-2">Success</p>
      </div>
      <div class="text-center">
        <div class="w-16 h-16 rounded-lg" style="background: #DC2626"></div>
        <p class="text-xs mt-2">Danger</p>
      </div>
      <div class="text-center">
        <div class="w-16 h-16 rounded-lg" style="background: #D97706"></div>
        <p class="text-xs mt-2">Warning</p>
      </div>
      <div class="text-center">
        <div class="w-16 h-16 rounded-lg" style="background: #2563EB"></div>
        <p class="text-xs mt-2">Info</p>
      </div>
    </div>
  </div>
</div>
```

---

## 슬라이드 18: 타이포그래피 & 컴포넌트

### 일관된 디자인 언어

**폰트 시스템**
| 용도 | 폰트 | 크기 |
|------|------|------|
| 본문 | Pretendard | 14px (0.875rem) |
| 제목 | Pretendard Bold | 18-36px |
| 숫자/데이터 | JetBrains Mono | 가변 |
| 한글 | Pretendard | - |

**목업 코드 (HTML) - 컴포넌트 시스템**
```html
<div class="p-8 bg-gray-50 rounded-2xl">
  <h3 class="text-xl font-bold mb-6">Component Library</h3>
  
  <!-- Buttons -->
  <div class="mb-8">
    <p class="text-sm text-gray-500 mb-3">BUTTONS</p>
    <div class="flex gap-3 items-center">
      <button class="px-5 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg font-semibold shadow-md hover:shadow-lg transition">
        Primary
      </button>
      <button class="px-5 py-2.5 bg-white border border-gray-200 rounded-lg font-medium hover:bg-gray-50 transition">
        Secondary
      </button>
      <button class="px-5 py-2.5 text-orange-500 hover:bg-orange-50 rounded-lg font-medium transition">
        Ghost
      </button>
    </div>
  </div>
  
  <!-- Badges -->
  <div class="mb-8">
    <p class="text-sm text-gray-500 mb-3">BADGES</p>
    <div class="flex gap-2">
      <span class="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">완료</span>
      <span class="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-medium">진행중</span>
      <span class="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">지연</span>
      <span class="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">정보</span>
      <span class="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-medium">VIP</span>
    </div>
  </div>
  
  <!-- Cards -->
  <div class="mb-8">
    <p class="text-sm text-gray-500 mb-3">CARDS</p>
    <div class="grid grid-cols-3 gap-4">
      <!-- KPI Card -->
      <div class="bg-white rounded-xl p-5 border border-gray-100 shadow-sm relative overflow-hidden">
        <div class="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 to-orange-300"></div>
        <p class="text-sm text-gray-500">GMV</p>
        <p class="text-2xl font-bold mt-1">₩123.4M</p>
        <p class="text-sm text-green-500 mt-1">+15.2%</p>
      </div>
      
      <!-- Standard Card -->
      <div class="bg-white rounded-xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition">
        <p class="font-medium">Standard Card</p>
        <p class="text-sm text-gray-500 mt-1">Hover effect</p>
      </div>
      
      <!-- Highlight Card -->
      <div class="bg-gradient-to-br from-orange-50 to-white rounded-xl p-5 border border-orange-100">
        <p class="font-medium text-orange-700">Highlight Card</p>
        <p class="text-sm text-gray-500 mt-1">Brand accent</p>
      </div>
    </div>
  </div>
  
  <!-- Input -->
  <div>
    <p class="text-sm text-gray-500 mb-3">INPUTS</p>
    <div class="flex gap-4">
      <input type="text" placeholder="검색어 입력" 
             class="px-4 py-2.5 border border-gray-200 rounded-lg focus:border-orange-500 focus:ring-2 focus:ring-orange-100 outline-none transition w-48">
      <select class="px-4 py-2.5 border border-gray-200 rounded-lg focus:border-orange-500 outline-none w-36">
        <option>전체</option>
        <option>옵션 1</option>
      </select>
    </div>
  </div>
</div>
```

---

## 슬라이드 19: 차트 & 시각화

### 데이터 시각화 컴포넌트

**차트 컬러 팔레트**
```
Chart Colors (조화로운 팔레트)
┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
│ #3B82F6  │ │ #10B981  │ │ #8B5CF6  │ │ #06B6D4  │ │ #F43F5E  │ │ #F59E0B  │
│   Blue   │ │  Green   │ │  Purple  │ │   Cyan   │ │   Rose   │ │  Amber   │
└──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘
```

**목업 코드 (HTML) - 차트 영역**
```html
<div class="grid grid-cols-2 gap-6 p-6">
  <!-- Line Chart Area -->
  <div class="bg-white rounded-xl p-6 shadow-sm border">
    <div class="flex justify-between items-center mb-4">
      <h4 class="font-bold">GMV & 주문 추세</h4>
      <div class="flex gap-2">
        <button class="px-3 py-1 bg-orange-500 text-white rounded-full text-xs">월별</button>
        <button class="px-3 py-1 bg-gray-100 rounded-full text-xs">주별</button>
      </div>
    </div>
    <div class="h-48 bg-gradient-to-t from-blue-50 to-white rounded-lg flex items-end justify-around p-4">
      <!-- Simplified chart bars -->
      <div class="w-8 bg-blue-500 rounded-t" style="height: 60%"></div>
      <div class="w-8 bg-blue-500 rounded-t" style="height: 75%"></div>
      <div class="w-8 bg-blue-500 rounded-t" style="height: 45%"></div>
      <div class="w-8 bg-blue-500 rounded-t" style="height: 90%"></div>
      <div class="w-8 bg-blue-500 rounded-t" style="height: 70%"></div>
      <div class="w-8 bg-orange-500 rounded-t" style="height: 85%"></div>
    </div>
    <div class="flex justify-center gap-6 mt-4 text-sm">
      <span class="flex items-center gap-2">
        <span class="w-3 h-3 bg-blue-500 rounded"></span> GMV
      </span>
      <span class="flex items-center gap-2">
        <span class="w-3 h-3 bg-orange-500 rounded"></span> 주문수
      </span>
    </div>
  </div>
  
  <!-- Donut Chart Area -->
  <div class="bg-white rounded-xl p-6 shadow-sm border">
    <h4 class="font-bold mb-4">국가별 매출 비중</h4>
    <div class="flex items-center justify-center">
      <div class="relative w-40 h-40">
        <!-- Simplified donut -->
        <svg viewBox="0 0 100 100" class="w-full h-full -rotate-90">
          <circle cx="50" cy="50" r="40" fill="none" stroke="#3B82F6" stroke-width="20" 
                  stroke-dasharray="150 251" />
          <circle cx="50" cy="50" r="40" fill="none" stroke="#10B981" stroke-width="20" 
                  stroke-dasharray="60 251" stroke-dashoffset="-150" />
          <circle cx="50" cy="50" r="40" fill="none" stroke="#8B5CF6" stroke-width="20" 
                  stroke-dasharray="41 251" stroke-dashoffset="-210" />
        </svg>
        <div class="absolute inset-0 flex items-center justify-center">
          <span class="text-2xl font-bold">100%</span>
        </div>
      </div>
    </div>
    <div class="flex justify-center gap-4 mt-4 text-sm">
      <span class="flex items-center gap-2">
        <span class="w-3 h-3 bg-blue-500 rounded"></span> JP 60%
      </span>
      <span class="flex items-center gap-2">
        <span class="w-3 h-3 bg-green-500 rounded"></span> US 24%
      </span>
      <span class="flex items-center gap-2">
        <span class="w-3 h-3 bg-purple-500 rounded"></span> 기타 16%
      </span>
    </div>
  </div>
</div>
```

---

## 슬라이드 20: 반응형 & 다크모드

### 다양한 환경 지원

**반응형 브레이크포인트**
| 브레이크포인트 | 크기 | 용도 |
|--------------|------|------|
| sm | 640px | 모바일 |
| md | 768px | 태블릿 |
| lg | 1024px | 노트북 |
| xl | 1280px | 데스크탑 |
| 2xl | 1536px | 대형 모니터 |

**목업 코드 (HTML) - 다크모드**
```html
<!-- Light Mode -->
<div class="p-6 bg-white rounded-xl border shadow-sm">
  <div class="flex items-center gap-3 mb-4">
    <div class="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
      <span class="text-white text-sm">☀️</span>
    </div>
    <span class="font-bold">Light Mode</span>
  </div>
  <div class="space-y-2 text-sm">
    <p class="text-gray-900">Primary Text</p>
    <p class="text-gray-500">Secondary Text</p>
    <p class="text-gray-400">Muted Text</p>
  </div>
</div>

<!-- Dark Mode -->
<div class="p-6 bg-[#1A1A1A] rounded-xl border border-[#2A2A2E] shadow-lg">
  <div class="flex items-center gap-3 mb-4">
    <div class="w-8 h-8 bg-[#F5A05A] rounded-lg flex items-center justify-center">
      <span class="text-sm">🌙</span>
    </div>
    <span class="font-bold text-[#F5F5F5]">Dark Mode</span>
  </div>
  <div class="space-y-2 text-sm">
    <p class="text-[#F5F5F5]">Primary Text</p>
    <p class="text-[#A8A8B3]">Secondary Text</p>
    <p class="text-[#78788A]">Muted Text</p>
  </div>
</div>
```

---

## 슬라이드 21: 애니메이션 & 인터랙션

### 사용자 경험을 높이는 모션

**애니메이션 종류**
| 애니메이션 | 용도 | 지속시간 |
|-----------|------|----------|
| fadeIn | 페이지/모달 등장 | 200ms |
| slideUp | 모달/드로어 등장 | 300ms |
| pulse | 알림/강조 | 2s (반복) |
| shimmer | 로딩 스켈레톤 | 1.5s (반복) |
| hover-lift | 카드 호버 | 200ms |

**목업 코드 (HTML) - 인터랙션**
```html
<div class="p-6 space-y-6">
  <!-- Hover Lift Effect -->
  <div class="group">
    <p class="text-sm text-gray-500 mb-2">HOVER LIFT</p>
    <div class="bg-white rounded-xl p-6 border shadow-sm 
                transition-all duration-200 
                hover:-translate-y-1 hover:shadow-lg cursor-pointer">
      <p class="font-medium">마우스를 올려보세요</p>
      <p class="text-sm text-gray-500">카드가 위로 올라갑니다</p>
    </div>
  </div>
  
  <!-- Brand Glow Effect -->
  <div>
    <p class="text-sm text-gray-500 mb-2">BRAND GLOW</p>
    <button class="px-6 py-3 bg-orange-500 text-white rounded-xl font-semibold
                   transition-all duration-200
                   hover:shadow-[0_0_20px_rgba(247,140,58,0.4)]">
      Hover for Glow
    </button>
  </div>
  
  <!-- Loading Skeleton -->
  <div>
    <p class="text-sm text-gray-500 mb-2">LOADING SKELETON</p>
    <div class="bg-white rounded-xl p-4 border">
      <div class="animate-pulse space-y-3">
        <div class="h-4 bg-gray-200 rounded w-3/4"></div>
        <div class="h-4 bg-gray-200 rounded w-1/2"></div>
        <div class="h-20 bg-gray-200 rounded"></div>
      </div>
    </div>
  </div>
  
  <!-- Status Pulse -->
  <div>
    <p class="text-sm text-gray-500 mb-2">STATUS PULSE</p>
    <div class="flex items-center gap-3">
      <span class="relative flex h-3 w-3">
        <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
        <span class="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
      </span>
      <span class="text-sm">실시간 연결됨</span>
    </div>
  </div>
</div>
```

---

## 슬라이드 22: 기능 전체 맵

### 구현된 기능 분류

```
┌─────────────────────────────────────────────────────────────┐
│                    Global Business Hub                       │
├─────────────────────────────────────────────────────────────┤
│ [비즈니스 분석]     [운영 관리]      [마케팅]      [CS/품질] │
│ ├─ 메인 대시보드   ├─ 미입고 관리   ├─ 퍼포먼스   ├─ QC 관리│
│ ├─ 성과 분석      ├─ 물류 관제     ├─ 쿠폰생성   ├─ 소포수령│
│ ├─ 고객 분석      ├─ 배송 추적     ├─ 리뷰 분석  ├─ 통합검색│
│ └─ 작가 분석      └─ 비용 분석     └─ 주문패턴   └─ AI채팅 │
└─────────────────────────────────────────────────────────────┘
```

---

## 슬라이드 23: 메인 대시보드

### 핵심 KPI 한눈에 확인

**목업 코드 (HTML)**
```html
<!-- KPI 카드 섹션 -->
<div class="grid grid-cols-6 gap-4 p-6">
  <!-- GMV 카드 -->
  <div class="bg-white rounded-xl shadow p-4 border-l-4 border-orange-500">
    <div class="text-sm text-gray-500">GMV</div>
    <div class="text-2xl font-bold">₩123,456,789</div>
    <div class="text-sm text-green-500">+15.2% vs 전기간</div>
  </div>
  
  <!-- 주문 건수 카드 -->
  <div class="bg-white rounded-xl shadow p-4 border-l-4 border-blue-500">
    <div class="text-sm text-gray-500">주문 건수</div>
    <div class="text-2xl font-bold">1,234건</div>
    <div class="text-sm text-green-500">+8.3%</div>
  </div>
  
  <!-- AOV 카드 -->
  <div class="bg-white rounded-xl shadow p-4 border-l-4 border-purple-500">
    <div class="text-sm text-gray-500">AOV</div>
    <div class="text-2xl font-bold">₩85,000</div>
    <div class="text-sm text-red-500">-2.1%</div>
  </div>
</div>

<!-- 트렌드 차트 -->
<div class="bg-white rounded-xl shadow p-6 mt-4">
  <h3 class="font-bold mb-4">GMV & 주문 추세</h3>
  <div class="h-64 bg-gray-100 rounded flex items-center justify-center">
    [Chart.js 라인 차트]
  </div>
</div>
```

**데이터 조합**: order 집계 + users 필터 + 기간 비교

---

## 슬라이드 24: 물류 관제 센터

### 병목 구간 즉시 파악, 직관적 물류 흐름 시각화

**Google Sheets의 한계**
```
┌─────────────────────────────────────────────────────────────┐
│  [Google Sheets로 물류 현황 파악]                            │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  주문번호 | 상태    | 입고일 | 체류일 | 작가명 | ...        │
│  ─────────────────────────────────────────────────────────  │
│  001234  | 미입고  | -      | 15일   | 김작가 | ...        │
│  001235  | 국내배송| 01/10  | 3일    | 이작가 | ...        │
│  001236  | 검수대기| 01/12  | 1일    | 박작가 | ...        │
│  ...     | ...     | ...    | ...    | ...    | ...        │
│                                                              │
│  문제점:                                                     │
│  · 수천 건의 행을 일일이 스크롤하며 확인해야 함              │
│  · "어느 단계에서 병목인가?" → 필터 걸고 카운트 해야 앎      │
│  · "위험 건수가 몇 개?" → 조건부 서식 설정 필요              │
│  · 전체 흐름을 한눈에 파악 불가능                            │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**웹 앱으로 해결**
```
┌─────────────────────────────────────────────────────────────┐
│  [물류 관제 센터]                                            │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  한눈에 보이는 것:                                           │
│  ✓ 각 단계별 건수 (숫자로 즉시 파악)                         │
│  ✓ 병목 구간 (빨간색으로 하이라이트)                         │
│  ✓ 위험 건수 (체류일 초과 자동 계산)                         │
│  ✓ 흐름 방향 (화살표로 직관적 표현)                          │
│                                                              │
│  [미입고] → [국내배송] → [검수대기] → [포장/출고] → [국제배송]│
│    45건      23건         18건        31건         67건      │
│   🔴12위험   🟡5위험      🟢정상       -            -         │
│                                                              │
│  → 페이지 접속 즉시 "미입고 12건 위험" 파악 가능              │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**목업 코드 (HTML)**
```html
<!-- 물류 관제 센터 -->
<div class="p-6 bg-gray-50">
  <!-- 상단 요약 -->
  <div class="bg-white rounded-xl shadow-sm p-4 mb-6 border-l-4 border-red-500">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <span class="text-2xl">⚠️</span>
        <div>
          <p class="font-bold text-red-600">병목 감지: 미입고 단계</p>
          <p class="text-sm text-gray-500">12건이 7일 이상 체류 중 · 즉시 대응 필요</p>
        </div>
      </div>
      <button class="px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium">
        상세 보기 →
      </button>
    </div>
  </div>

  <!-- 파이프라인 -->
  <div class="bg-white rounded-xl shadow p-6">
    <h3 class="font-bold mb-6">물류 파이프라인</h3>
    
    <div class="flex items-center justify-between">
      <!-- 미입고 (병목) -->
      <div class="text-center flex-1 p-4 bg-red-50 rounded-xl border-2 border-red-200 relative">
        <div class="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
          병목
        </div>
        <div class="w-16 h-16 mx-auto bg-red-100 rounded-xl flex items-center justify-center">
          <span class="text-2xl">📦</span>
        </div>
        <div class="mt-2 text-2xl font-bold text-red-600">45</div>
        <div class="text-sm text-gray-500">미입고</div>
        <div class="text-xs text-red-500 font-medium">🔴 위험: 12건</div>
        <div class="text-xs text-gray-400 mt-1">평균 체류: 8.3일</div>
      </div>
      
      <div class="text-gray-300 text-2xl px-2">→</div>
      
      <!-- 국내배송 -->
      <div class="text-center flex-1 p-4">
        <div class="w-16 h-16 mx-auto bg-yellow-100 rounded-xl flex items-center justify-center">
          <span class="text-2xl">🚚</span>
        </div>
        <div class="mt-2 text-2xl font-bold">23</div>
        <div class="text-sm text-gray-500">국내배송</div>
        <div class="text-xs text-yellow-600">🟡 주의: 5건</div>
        <div class="text-xs text-gray-400 mt-1">평균 체류: 2.1일</div>
      </div>
      
      <div class="text-gray-300 text-2xl px-2">→</div>
      
      <!-- 검수대기 -->
      <div class="text-center flex-1 p-4">
        <div class="w-16 h-16 mx-auto bg-blue-100 rounded-xl flex items-center justify-center">
          <span class="text-2xl">🔍</span>
        </div>
        <div class="mt-2 text-2xl font-bold">18</div>
        <div class="text-sm text-gray-500">검수대기</div>
        <div class="text-xs text-green-600">🟢 정상</div>
        <div class="text-xs text-gray-400 mt-1">평균 체류: 0.5일</div>
      </div>
      
      <div class="text-gray-300 text-2xl px-2">→</div>
      
      <!-- 포장/출고 -->
      <div class="text-center flex-1 p-4">
        <div class="w-16 h-16 mx-auto bg-purple-100 rounded-xl flex items-center justify-center">
          <span class="text-2xl">📤</span>
        </div>
        <div class="mt-2 text-2xl font-bold">31</div>
        <div class="text-sm text-gray-500">포장/출고</div>
        <div class="text-xs text-green-600">🟢 정상</div>
        <div class="text-xs text-gray-400 mt-1">평균 체류: 1.2일</div>
      </div>
      
      <div class="text-gray-300 text-2xl px-2">→</div>
      
      <!-- 국제배송 -->
      <div class="text-center flex-1 p-4">
        <div class="w-16 h-16 mx-auto bg-green-100 rounded-xl flex items-center justify-center">
          <span class="text-2xl">✈️</span>
        </div>
        <div class="mt-2 text-2xl font-bold">67</div>
        <div class="text-sm text-gray-500">국제배송</div>
        <div class="text-xs text-green-600">🟢 정상</div>
        <div class="text-xs text-gray-400 mt-1">평균 체류: 5.8일</div>
      </div>
    </div>
  </div>
</div>
```

**핵심 가치**: 페이지 접속 즉시 병목 구간과 위험 건수 파악 → 대응 시간 단축

---

## 슬라이드 25: 미입고 관리

### 작가 연락 자동화 및 입고 요청 시스템

**Google Sheets의 한계**
```
[기존 미입고 관리 프로세스]

1. 시트에서 미입고 건 필터링
2. 작가별로 그룹화 (수동)
3. 작가 메일 주소 찾기 (별도 시트)
4. 메일 작성 및 발송 (수동)
5. 발송 이력 기록 (수동)

→ 미입고 안내 1건당 약 10-15분 소요
→ 누락 및 지연 발생
```

**웹 앱으로 해결**
| 기능 | 설명 | 상태 |
|------|------|------|
| 미입고 현황 대시보드 | 작가별/기간별 미입고 현황 즉시 파악 | ✅ 운영 중 |
| 위험 건 하이라이트 | 7일 이상 미입고 자동 표시 | ✅ 운영 중 |
| 작가 메일 연동 | Raw data의 작가 메일 자동 매핑 | 🔄 예정 |
| 자동 안내 발송 | 특정 시점마다 미입고 안내 자동 발송 | 🔄 예정 |
| 수동 입고 요청 | 관리자가 직접 선택하여 입고 요청 발송 | 🔄 예정 |
| 발송 이력 관리 | 안내 발송 이력 자동 기록 | 🔄 예정 |

**목업 코드 (HTML) - 미입고 관리 (확장 예정)**
```html
<!-- 미입고 관리 -->
<div class="p-6 bg-gray-50">
  <!-- 요약 카드 -->
  <div class="grid grid-cols-4 gap-4 mb-6">
    <div class="bg-white rounded-xl p-4 border-l-4 border-red-500">
      <p class="text-sm text-gray-500">총 미입고</p>
      <p class="text-2xl font-bold">45건</p>
    </div>
    <div class="bg-white rounded-xl p-4 border-l-4 border-orange-500">
      <p class="text-sm text-gray-500">7일 이상</p>
      <p class="text-2xl font-bold text-red-600">12건</p>
    </div>
    <div class="bg-white rounded-xl p-4 border-l-4 border-yellow-500">
      <p class="text-sm text-gray-500">3-7일</p>
      <p class="text-2xl font-bold text-yellow-600">18건</p>
    </div>
    <div class="bg-white rounded-xl p-4 border-l-4 border-green-500">
      <p class="text-sm text-gray-500">3일 미만</p>
      <p class="text-2xl font-bold text-green-600">15건</p>
    </div>
  </div>
  
  <!-- 작가별 미입고 목록 -->
  <div class="bg-white rounded-xl shadow">
    <div class="p-4 border-b flex justify-between items-center">
      <h3 class="font-bold">작가별 미입고 현황</h3>
      <div class="flex gap-2">
        <button class="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium">
          📧 선택 작가 안내 발송
        </button>
        <button class="px-4 py-2 border rounded-lg text-sm">
          ⚙️ 자동 발송 설정
        </button>
      </div>
    </div>
    
    <table class="w-full text-sm">
      <thead class="bg-gray-50">
        <tr>
          <th class="p-3 text-left">
            <input type="checkbox" class="rounded">
          </th>
          <th class="p-3 text-left">작가명</th>
          <th class="p-3 text-left">미입고 건수</th>
          <th class="p-3 text-left">최장 체류일</th>
          <th class="p-3 text-left">마지막 안내</th>
          <th class="p-3 text-left">상태</th>
          <th class="p-3 text-left">액션</th>
        </tr>
      </thead>
      <tbody>
        <tr class="border-t bg-red-50">
          <td class="p-3"><input type="checkbox" class="rounded"></td>
          <td class="p-3 font-medium">김작가</td>
          <td class="p-3">5건</td>
          <td class="p-3"><span class="text-red-600 font-bold">15일</span></td>
          <td class="p-3 text-gray-500">2026-01-05</td>
          <td class="p-3">
            <span class="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs">위험</span>
          </td>
          <td class="p-3">
            <button class="text-orange-500 hover:underline">입고 요청 →</button>
          </td>
        </tr>
        <tr class="border-t">
          <td class="p-3"><input type="checkbox" class="rounded"></td>
          <td class="p-3 font-medium">이작가</td>
          <td class="p-3">3건</td>
          <td class="p-3">5일</td>
          <td class="p-3 text-gray-500">-</td>
          <td class="p-3">
            <span class="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs">주의</span>
          </td>
          <td class="p-3">
            <button class="text-orange-500 hover:underline">입고 요청 →</button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
  
  <!-- 자동 발송 설정 모달 (예정) -->
  <div class="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
    <p class="text-sm text-blue-700">
      <span class="font-bold">🔜 예정 기능:</span> 
      미입고 발생 후 3일, 7일, 14일 시점에 자동 안내 메일 발송 설정
    </p>
  </div>
</div>
```

**확장 계획**
- 자동 발송 트리거: 미입고 발생 후 3일, 7일, 14일
- 발송 템플릿 관리: 시점별 다른 메시지
- Slack 연동: 발송 완료 알림

---

## 슬라이드 26: 성과 분석 - RFM

### 고객 세그먼트 분석

**목업 코드 (HTML)**
```html
<!-- RFM 분석 테이블 -->
<div class="bg-white rounded-xl shadow p-6">
  <h3 class="font-bold mb-4">RFM 고객 세그먼트</h3>
  
  <!-- 세그먼트 요약 카드 -->
  <div class="grid grid-cols-3 gap-4 mb-6">
    <div class="bg-purple-50 rounded-lg p-4 text-center">
      <div class="text-sm text-purple-600">VIP 고객</div>
      <div class="text-2xl font-bold text-purple-700">234명</div>
      <div class="text-xs text-gray-500">상위 10%</div>
    </div>
    <div class="bg-blue-50 rounded-lg p-4 text-center">
      <div class="text-sm text-blue-600">잠재 고객</div>
      <div class="text-2xl font-bold text-blue-700">567명</div>
      <div class="text-xs text-gray-500">전환 가능</div>
    </div>
    <div class="bg-red-50 rounded-lg p-4 text-center">
      <div class="text-sm text-red-600">이탈 위험</div>
      <div class="text-2xl font-bold text-red-700">89명</div>
      <div class="text-xs text-gray-500">180일+ 미구매</div>
    </div>
  </div>
  
  <!-- RFM 테이블 -->
  <table class="w-full text-sm">
    <thead class="bg-gray-50">
      <tr>
        <th class="p-3 text-left">고객ID</th>
        <th class="p-3 text-left">R (경과일)</th>
        <th class="p-3 text-left">F (구매횟수)</th>
        <th class="p-3 text-left">M (총금액)</th>
        <th class="p-3 text-left">세그먼트</th>
      </tr>
    </thead>
    <tbody>
      <tr class="border-t">
        <td class="p-3">12345</td>
        <td class="p-3">7일</td>
        <td class="p-3">12회</td>
        <td class="p-3">₩2,500,000</td>
        <td class="p-3"><span class="bg-purple-100 text-purple-700 px-2 py-1 rounded">VIP</span></td>
      </tr>
    </tbody>
  </table>
</div>
```

**데이터 조합**: order 집계(R, F, M 계산) + users 정보 + 세그먼트 분류 로직

---

## 슬라이드 27: 고객 360도 뷰

### Raw Data → 풍부한 고객 인사이트

**Google Sheets의 한계**
```
[기존 고객 분석 방식]

orders 시트에서 user_id로 필터 → 주문 이력 확인
users 시트에서 user_id로 검색 → 기본 정보 확인
logistics 시트에서 order_code로 검색 → 배송 상태 확인

→ 3개 시트를 오가며 수동으로 정보 조합
→ 고객의 전체 여정을 파악하기 어려움
→ 분석에 10분 이상 소요
```

**웹 앱: 고객 360도 뷰**
| 항목 | 기존 (시트) | 현재 (웹 앱) |
|------|------------|-------------|
| 기본 정보 | 별도 시트 검색 | 모달에서 즉시 확인 |
| 주문 이력 | 필터링 후 확인 | 타임라인으로 시각화 |
| RFM 점수 | 수동 계산 필요 | 자동 계산 및 표시 |
| 세그먼트 | 별도 분류 필요 | 자동 분류 (VIP/잠재/이탈) |
| 구매 패턴 | 엑셀 차트 별도 생성 | 실시간 차트 표시 |
| 배송 현황 | 3개 시트 조합 | 한 화면에서 확인 |

**목업 코드 (HTML) - 고객 360도 뷰 모달**
```html
<!-- 고객 360도 뷰 -->
<div class="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
  <div class="bg-white rounded-2xl w-[900px] max-h-[90vh] overflow-hidden">
    <!-- 헤더 -->
    <div class="bg-gradient-to-r from-orange-500 to-orange-400 p-6 text-white">
      <div class="flex justify-between items-start">
        <div>
          <p class="text-sm opacity-80">Customer ID: 12345</p>
          <h2 class="text-2xl font-bold">田中太郎</h2>
          <p class="text-sm opacity-80">tanaka@email.com · Japan</p>
        </div>
        <div class="text-right">
          <span class="px-3 py-1 bg-white/20 rounded-full text-sm">👑 VIP</span>
          <p class="text-sm mt-2 opacity-80">가입일: 2024-03-15</p>
        </div>
      </div>
    </div>
    
    <!-- 본문 -->
    <div class="p-6 overflow-y-auto" style="max-height: calc(90vh - 200px)">
      <!-- RFM 스코어 -->
      <div class="grid grid-cols-4 gap-4 mb-6">
        <div class="bg-purple-50 rounded-xl p-4 text-center">
          <p class="text-xs text-purple-600 font-medium">R (최근성)</p>
          <p class="text-2xl font-bold text-purple-700">7일</p>
          <div class="w-full bg-purple-200 rounded-full h-2 mt-2">
            <div class="bg-purple-500 h-2 rounded-full" style="width: 95%"></div>
          </div>
        </div>
        <div class="bg-blue-50 rounded-xl p-4 text-center">
          <p class="text-xs text-blue-600 font-medium">F (빈도)</p>
          <p class="text-2xl font-bold text-blue-700">12회</p>
          <div class="w-full bg-blue-200 rounded-full h-2 mt-2">
            <div class="bg-blue-500 h-2 rounded-full" style="width: 85%"></div>
          </div>
        </div>
        <div class="bg-green-50 rounded-xl p-4 text-center">
          <p class="text-xs text-green-600 font-medium">M (금액)</p>
          <p class="text-2xl font-bold text-green-700">₩2.5M</p>
          <div class="w-full bg-green-200 rounded-full h-2 mt-2">
            <div class="bg-green-500 h-2 rounded-full" style="width: 90%"></div>
          </div>
        </div>
        <div class="bg-orange-50 rounded-xl p-4 text-center">
          <p class="text-xs text-orange-600 font-medium">CLV 예측</p>
          <p class="text-2xl font-bold text-orange-700">₩5.2M</p>
          <p class="text-xs text-gray-500 mt-1">상위 5%</p>
        </div>
      </div>
      
      <!-- 구매 패턴 차트 -->
      <div class="bg-gray-50 rounded-xl p-4 mb-6">
        <h4 class="font-bold text-sm mb-3">월별 구매 추이</h4>
        <div class="h-24 flex items-end gap-2">
          <div class="flex-1 bg-orange-200 rounded-t" style="height: 30%"></div>
          <div class="flex-1 bg-orange-300 rounded-t" style="height: 45%"></div>
          <div class="flex-1 bg-orange-300 rounded-t" style="height: 40%"></div>
          <div class="flex-1 bg-orange-400 rounded-t" style="height: 60%"></div>
          <div class="flex-1 bg-orange-400 rounded-t" style="height: 55%"></div>
          <div class="flex-1 bg-orange-500 rounded-t" style="height: 80%"></div>
          <div class="flex-1 bg-orange-500 rounded-t" style="height: 100%"></div>
        </div>
        <div class="flex justify-between text-xs text-gray-400 mt-2">
          <span>7월</span><span>8월</span><span>9월</span><span>10월</span>
          <span>11월</span><span>12월</span><span>1월</span>
        </div>
      </div>
      
      <!-- 주문 타임라인 -->
      <div class="mb-6">
        <h4 class="font-bold text-sm mb-3">최근 주문 이력</h4>
        <div class="space-y-3">
          <div class="flex gap-4 p-3 bg-white border rounded-lg">
            <div class="w-12 h-12 bg-gray-100 rounded-lg"></div>
            <div class="flex-1">
              <div class="flex justify-between">
                <p class="font-medium">핸드메이드 실버 반지</p>
                <span class="text-sm text-green-600">배송완료</span>
              </div>
              <p class="text-sm text-gray-500">2026-01-07 · ₩45,000 · 김작가</p>
            </div>
          </div>
          <div class="flex gap-4 p-3 bg-white border rounded-lg">
            <div class="w-12 h-12 bg-gray-100 rounded-lg"></div>
            <div class="flex-1">
              <div class="flex justify-between">
                <p class="font-medium">도자기 머그컵 세트</p>
                <span class="text-sm text-blue-600">배송중</span>
              </div>
              <p class="text-sm text-gray-500">2025-12-20 · ₩78,000 · 이작가</p>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 인사이트 -->
      <div class="bg-blue-50 rounded-xl p-4 border border-blue-100">
        <h4 class="font-bold text-sm text-blue-700 mb-2">💡 AI 인사이트</h4>
        <ul class="text-sm text-blue-600 space-y-1">
          <li>• 주얼리 카테고리 선호도 높음 (구매의 60%)</li>
          <li>• 월초에 구매 집중 (급여일 추정)</li>
          <li>• 재구매 주기: 평균 23일</li>
        </ul>
      </div>
    </div>
  </div>
</div>
```

**핵심 가치**: 고객 1명에 대한 모든 정보를 한 화면에서 즉시 파악

---

## 슬라이드 28: 통합 검색 및 상세 모달

### 모든 데이터를 한 곳에서 검색

**목업 코드 (HTML)**
```html
<!-- 통합 검색 -->
<div class="bg-white rounded-xl shadow p-6">
  <!-- 검색 입력 -->
  <div class="flex gap-4 mb-6">
    <select class="border rounded-lg px-4 py-2">
      <option>주문번호</option>
      <option>고객ID</option>
      <option>이메일</option>
      <option>송장번호</option>
      <option>작가명</option>
    </select>
    <input type="text" placeholder="검색어 입력" 
           class="flex-1 border rounded-lg px-4 py-2">
    <button class="bg-indigo-500 text-white px-6 py-2 rounded-lg">검색</button>
  </div>
  
  <!-- 검색 결과 -->
  <div class="border rounded-lg">
    <div class="p-4 border-b hover:bg-gray-50 cursor-pointer">
      <div class="flex justify-between items-center">
        <div>
          <span class="font-bold">ORD-2026-001234</span>
          <span class="text-gray-500 ml-2">김고객</span>
        </div>
        <div class="text-sm text-gray-500">2026-01-10</div>
      </div>
      <div class="text-sm text-gray-500 mt-1">
        작품 3개 · ₩245,000 · 배송중
      </div>
    </div>
  </div>
</div>

<!-- 상세 모달 -->
<div class="fixed inset-0 bg-black/50 flex items-center justify-center">
  <div class="bg-white rounded-2xl w-[600px] max-h-[80vh] overflow-auto">
    <div class="p-6 border-b">
      <h3 class="text-xl font-bold">주문 상세</h3>
    </div>
    <div class="p-6">
      <!-- 주문 정보 -->
      <div class="grid grid-cols-2 gap-4 mb-6">
        <div>
          <div class="text-sm text-gray-500">주문번호</div>
          <div class="font-bold">ORD-2026-001234</div>
        </div>
        <div>
          <div class="text-sm text-gray-500">주문일시</div>
          <div>2026-01-10 14:30</div>
        </div>
      </div>
      
      <!-- 타임라인 -->
      <div class="border-l-2 border-indigo-200 pl-4 space-y-4">
        <div class="relative">
          <div class="absolute -left-6 w-4 h-4 bg-indigo-500 rounded-full"></div>
          <div class="text-sm font-medium">결제 완료</div>
          <div class="text-xs text-gray-500">2026-01-10 14:30</div>
        </div>
        <div class="relative">
          <div class="absolute -left-6 w-4 h-4 bg-indigo-500 rounded-full"></div>
          <div class="text-sm font-medium">작가 발송</div>
          <div class="text-xs text-gray-500">2026-01-11 09:00</div>
        </div>
      </div>
    </div>
  </div>
</div>
```

**데이터 조합**: order + logistics + users (전체 시트 조합)

---

## 슬라이드 29: 퍼포먼스 마케팅 도구

### 마케팅 소재 탐색 및 콘텐츠 생성

**목업 코드 (HTML)**
```html
<!-- 마케팅 대시보드 -->
<div class="grid grid-cols-3 gap-6 p-6">
  
  <!-- 트렌드 작품 -->
  <div class="bg-white rounded-xl shadow p-6">
    <h3 class="font-bold mb-4">🔥 트렌드 작품</h3>
    <div class="space-y-3">
      <div class="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
        <div class="w-12 h-12 bg-gray-200 rounded"></div>
        <div class="flex-1">
          <div class="font-medium">핸드메이드 목걸이</div>
          <div class="text-sm text-gray-500">김작가</div>
        </div>
        <div class="text-green-500 font-bold">+45%</div>
      </div>
      <div class="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
        <div class="w-12 h-12 bg-gray-200 rounded"></div>
        <div class="flex-1">
          <div class="font-medium">도자기 머그컵</div>
          <div class="text-sm text-gray-500">이작가</div>
        </div>
        <div class="text-green-500 font-bold">+32%</div>
      </div>
    </div>
  </div>
  
  <!-- 타겟 세그먼트 -->
  <div class="bg-white rounded-xl shadow p-6">
    <h3 class="font-bold mb-4">🎯 추천 타겟</h3>
    <div class="space-y-3">
      <div class="p-3 border rounded-lg">
        <div class="font-medium">일본 VIP 고객</div>
        <div class="text-sm text-gray-500">234명 · 평균 AOV ₩150,000</div>
      </div>
      <div class="p-3 border rounded-lg">
        <div class="font-medium">재구매 유도 대상</div>
        <div class="text-sm text-gray-500">567명 · 60일 이상 미구매</div>
      </div>
    </div>
  </div>
  
  <!-- 캠페인 성과 -->
  <div class="bg-white rounded-xl shadow p-6">
    <h3 class="font-bold mb-4">📊 캠페인 성과</h3>
    <div class="space-y-4">
      <div>
        <div class="flex justify-between text-sm mb-1">
          <span>이메일 캠페인</span>
          <span class="text-green-500">CTR 4.2%</span>
        </div>
        <div class="h-2 bg-gray-200 rounded-full">
          <div class="h-2 bg-green-500 rounded-full" style="width:42%"></div>
        </div>
      </div>
    </div>
  </div>
</div>
```

**데이터 조합**: order 트렌드 분석 + users 세그먼트 + 작품 정보

---

## 슬라이드 30: 작품 QC 관리

### 작품 품질 관리 및 검수 현황

**목업 코드 (HTML)**
```html
<!-- QC 대시보드 -->
<div class="p-6">
  <!-- 요약 카드 -->
  <div class="grid grid-cols-4 gap-4 mb-6">
    <div class="bg-white rounded-xl shadow p-4">
      <div class="text-sm text-gray-500">검수 대기</div>
      <div class="text-2xl font-bold">23건</div>
    </div>
    <div class="bg-white rounded-xl shadow p-4">
      <div class="text-sm text-gray-500">검수 완료</div>
      <div class="text-2xl font-bold text-green-600">156건</div>
    </div>
    <div class="bg-white rounded-xl shadow p-4">
      <div class="text-sm text-gray-500">반려</div>
      <div class="text-2xl font-bold text-red-600">8건</div>
    </div>
    <div class="bg-white rounded-xl shadow p-4">
      <div class="text-sm text-gray-500">검수율</div>
      <div class="text-2xl font-bold">95.1%</div>
    </div>
  </div>
  
  <!-- QC 목록 -->
  <div class="bg-white rounded-xl shadow">
    <table class="w-full">
      <thead class="bg-gray-50">
        <tr>
          <th class="p-3 text-left">작품명</th>
          <th class="p-3 text-left">작가</th>
          <th class="p-3 text-left">검수 항목</th>
          <th class="p-3 text-left">상태</th>
          <th class="p-3 text-left">액션</th>
        </tr>
      </thead>
      <tbody>
        <tr class="border-t">
          <td class="p-3">수제 가죽 지갑</td>
          <td class="p-3">박작가</td>
          <td class="p-3">
            <span class="bg-green-100 text-green-700 px-2 py-1 rounded text-xs">포장</span>
            <span class="bg-yellow-100 text-yellow-700 px-2 py-1 rounded text-xs">라벨</span>
          </td>
          <td class="p-3"><span class="text-yellow-600">대기</span></td>
          <td class="p-3">
            <button class="bg-indigo-500 text-white px-3 py-1 rounded text-sm">검수</button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</div>
```

**데이터 조합**: logistics 검수 상태 + artists 정보 + 작품 상세

---

## 슬라이드 31: 소포수령증 발급

### CS 업무 지원 - 수령증 자동 생성

**목업 코드 (HTML)**
```html
<!-- 소포수령증 발급 -->
<div class="p-6">
  <!-- 검색 -->
  <div class="bg-white rounded-xl shadow p-6 mb-6">
    <h3 class="font-bold mb-4">소포수령증 발급</h3>
    <div class="flex gap-4">
      <input type="text" placeholder="주문번호 또는 송장번호 입력" 
             class="flex-1 border rounded-lg px-4 py-2">
      <button class="bg-indigo-500 text-white px-6 py-2 rounded-lg">조회</button>
    </div>
  </div>
  
  <!-- 수령증 미리보기 -->
  <div class="bg-white rounded-xl shadow p-6">
    <div class="border-2 border-dashed border-gray-300 rounded-lg p-6">
      <div class="text-center mb-6">
        <h2 class="text-xl font-bold">소포 수령증</h2>
        <p class="text-sm text-gray-500">Parcel Receipt</p>
      </div>
      
      <div class="grid grid-cols-2 gap-4 text-sm">
        <div>
          <div class="text-gray-500">수령인</div>
          <div class="font-medium">田中太郎</div>
        </div>
        <div>
          <div class="text-gray-500">발송일</div>
          <div class="font-medium">2026-01-10</div>
        </div>
        <div>
          <div class="text-gray-500">송장번호</div>
          <div class="font-medium">1234567890</div>
        </div>
        <div>
          <div class="text-gray-500">내용물</div>
          <div class="font-medium">핸드메이드 액세서리 외 2건</div>
        </div>
      </div>
      
      <div class="mt-6 flex justify-end gap-2">
        <button class="border px-4 py-2 rounded-lg">PDF 다운로드</button>
        <button class="bg-indigo-500 text-white px-4 py-2 rounded-lg">인쇄</button>
      </div>
    </div>
  </div>
</div>
```

**데이터 조합**: order + logistics + users (배송 정보 조합)

---

# 섹션 5: 업무 적용 및 확장 계획

---

## 슬라이드 32: 정량적 효과

### 업무 시간 비교

| 업무 | 기존 | 현재 | 단축률 |
|------|------|------|-------|
| 일일 현황 파악 | 30분 | 1분 | 97% |
| 미입고 확인 | 30분 | 즉시 | - |
| 매출 리포트 작성 | 1시간 | 5분 | 92% |
| 고객 분석 (RFM) | 2시간 | 10분 | 92% |
| 고객 문의 대응 | 5분 | 10초 | 97% |
| 소포수령증 발급 | 10분 | 1분 | 90% |

**연간 추정 효과**
- 절감 시간: 약 400시간/년
- 데이터 정합성 이슈: 0건 (단일 소스)

---

## 슬라이드 33: 데이터 통합의 가치

### 분산 → 통합으로 얻은 것

**정합성 확보**
- 모든 팀이 동일한 숫자를 봄
- "어느 게 맞는 거예요?" 문제 해결

**확장 용이성**
- 새로운 분석 요구 시 기존 API 조합으로 빠른 구현
- 예: "국가별 + 작가별 + 기간별" 복합 필터 즉시 추가

**유지보수 효율**
- 데이터 수정 시 모든 화면에 자동 반영
- 분석 로직 중앙 관리

**확장된 업무 범위**
- 단순 분석 → 마케팅, QC, CS까지 확장

---

## 슬라이드 34: 현재 운영 중인 기능

### 비즈니스 분석을 넘어 업무 전반으로

**비즈니스 분석**
- 대시보드, 성과 분석, 고객 분석, 작가 분석
- 국가별/채널별/기간별 다차원 분석

**운영 관리**
- 미입고 관리, 물류 관제, 배송 추적
- 비용 분석, 정산 관리

**마케팅 지원**
- 퍼포먼스 마케팅 도구
- 쿠폰 생성기, 리뷰 분석
- 주문 패턴 분석

**CS/품질 관리**
- 작품 QC 관리
- 소포수령증 발급
- 통합 검색, AI 채팅

---

## 슬라이드 35: 확장 계획

### 향후 추가 예정 기능

**1단계: 자동화 (Q1-Q2 2026)**
| 기능 | 설명 |
|------|------|
| KR 작품 자동 번역 | 한국어 작품 정보 → 일본어/영어 자동 번역 |
| 자동 리포트 | 일일/주간 리포트 자동 생성 및 Notion 연동 |
| Slack 알림 | 이상 징후 발생 시 자동 알림 |

**2단계: CS 고도화 (Q3-Q4 2026)**
| 기능 | 설명 |
|------|------|
| AI 기반 CS 대응 | 고객 문의 유형 분류 및 답변 초안 생성 |
| FAQ 자동화 | 반복 문의 자동 응답 |
| 다국어 CS 지원 | 일본어/영어 문의 자동 번역 |

---

## 슬라이드 36: 각 부서별 적용 가능성

### 동일한 접근 방식 적용 가능

**이 프로젝트의 핵심 패턴**
```
분산된 데이터 → 단일 소스 통합 → API로 다양하게 활용
```

**다른 부서 적용 예시**

| 부서 | 현재 상황 | 적용 가능 |
|------|----------|----------|
| 마케팅 | 캠페인 결과 여러 시트 | 캠페인 통합 대시보드 |
| 재무 | 정산 데이터 분산 | 정산 통합 시스템 |
| HR | 인사 데이터 여러 파일 | 인사 현황 대시보드 |
| 기획 | 지표 수동 취합 | 자동 지표 모니터링 |

---

# 섹션 6: 향후 계획 및 Q&A

---

## 슬라이드 37: 로드맵

### 향후 개발 계획

```
2026 Q1 (현재)
├─ ✅ 핵심 기능 운영 중
├─ 🔄 AI 채팅 고도화
└─ 🔄 이상 징후 감지

2026 Q2
├─ KR 작품 자동 번역
├─ Slack 알림 연동
└─ 자동 리포트 생성

2026 Q3
├─ AI 기반 CS 대응
├─ 다국어 CS 지원
└─ 모바일 최적화

2026 Q4
├─ 다른 팀 지원 (템플릿화)
└─ 사내 가이드 배포
```

---

## 슬라이드 38: 마무리 및 Q&A

### 요약

**핵심 메시지**
> 분산된 데이터를 하나로 통합하고,
> 그 위에서 업무 전반으로 확장했습니다.

**3개 프로젝트 성과**
| 프로젝트 | 핵심 성과 |
|---------|----------|
| Global Business Hub | 4개 시트 → 20+ 기능, 연 400시간 절감 |
| Marketing Studio | 콘텐츠 제작 98% 시간 단축 |
| GB Translation | 번역 처리량 10배 증가 |

**핵심 접근 방식**
1. 반복 업무 식별 → 자동화 대상 선정
2. AI 코딩 도구로 빠르게 프로토타입
3. 업무 흐름(Flow)에 맞춘 인터페이스 설계
4. 점진적 기능 확장

**추가 문의**
- 담당: Global Business셀
- 시스템 접속, 유사 프로젝트 문의 환영

---

# 📎 부록

---

## 부록 A: 데이터 조합 상세

### Raw Data → 분석 데이터 변환 예시

**RFM 분석 데이터 생성 과정**

```javascript
// 1차: 고객별 주문 집계
const customerOrders = orders.reduce((acc, order) => {
  const userId = order.user_id;
  if (!acc[userId]) {
    acc[userId] = { orders: [], totalAmount: 0 };
  }
  acc[userId].orders.push(order);
  acc[userId].totalAmount += order.amount;
  return acc;
}, {});

// 2차: RFM 계산
const rfmData = Object.entries(customerOrders).map(([userId, data]) => {
  const lastOrder = Math.max(...data.orders.map(o => new Date(o.date)));
  const recency = Math.floor((now - lastOrder) / (1000 * 60 * 60 * 24));
  const frequency = data.orders.length;
  const monetary = data.totalAmount;
  
  return { userId, recency, frequency, monetary };
});

// 3차: 세그먼트 분류
const segmentedData = rfmData.map(customer => ({
  ...customer,
  segment: classifySegment(customer) // VIP, 잠재, 이탈위험
}));
```

---

## 부록 B: 프롬프트 예시

### 데이터 조합 요청 형식

**API 생성 요청**
```
[페이지명] API를 만들어줘.

[입력 데이터]
- order 시트: [사용할 컬럼들]
- users 시트: [사용할 컬럼들]

[출력 데이터]
- [원하는 집계/분석 결과]

[조건]
- [필터, 정렬 조건]

[참고]
- 기존 [유사 API] 스타일로
```

---

## 부록 C: 기술 스택 상세

| 영역 | 기술 | 용도 |
|------|------|------|
| Frontend | Next.js 14 | 페이지 라우팅, SSR |
| Frontend | React 18 | UI 컴포넌트 |
| Frontend | TypeScript | 타입 안전성 |
| Frontend | Tailwind CSS | 스타일링 |
| Frontend | React Query | 데이터 페칭/캐싱 |
| Backend | Express.js | API 서버 |
| Backend | TypeScript | 타입 안전성 |
| 데이터 | Google Sheets API | Raw Data 조회 |
| AI | OpenAI API | 채팅 기능 |
| 차트 | Chart.js, Recharts | 시각화 |
| 배포 | Vercel | 프론트엔드 |
| 배포 | Railway | 백엔드 |

---

## 부록 D: 페이지별 현황

| 페이지 | 완성도 | 데이터 조합 |
|--------|--------|-------------|
| 메인 대시보드 | 100% | order + users |
| 미입고 관리 | 100% | order + logistics |
| 물류 추적 | 100% | order + logistics |
| 물류 관제 센터 | 100% | order + logistics |
| 성과 분석 | 100% | 전체 시트 |
| 고객 분석 (RFM) | 100% | order + users |
| 통합 검색 | 100% | 전체 시트 |
| 비용 분석 | 100% | order + logistics |
| 작가 분석 | 100% | order + logistics + artists |
| 퍼포먼스 마케팅 | 100% | order + users + artists |
| 쿠폰 생성기 | 100% | order + users |
| 작품 QC | 100% | logistics + artists |
| 소포수령증 | 100% | order + logistics + users |
| AI 채팅 | 80% | 전체 시트 |
| Business Brain | 90% | 전체 시트 + AI |

---

# 섹션 A: 퍼포먼스 마케팅 자동화 (idus Marketing Studio)

**GitHub**: https://github.com/pos01204/performance-marketer
**배포**: https://performance-marketer.vercel.app

---

## 슬라이드 A-1: 퍼포먼스 마케팅 자동화 개요

### idus Marketing Studio

**프로젝트 목표**
마케팅 담당자의 반복 업무를 AI로 자동화

**해결한 문제**
```
[기존 마케팅 콘텐츠 제작 과정]

1. 작품 탐색 (아이디어스 사이트 직접 검색)     → 30분
2. 작품 정보 정리                            → 20분
3. SNS 콘텐츠 작성 (인스타, 트위터)           → 1시간
4. 다국어 번역 (KR/EN/JP)                   → 1시간
5. 해시태그 선정                             → 20분
6. CRM 푸시 메시지 작성                      → 30분

총 소요시간: 약 3.5시간/작품
```

**자동화 후**
```
1. 키워드 입력 → 작품 자동 탐색              → 1분
2. 작품 선택 → AI 콘텐츠 생성                → 2분
3. 다국어 동시 생성 (KR/EN/JP)              → 자동
4. 해시태그 자동 생성 (금지태그 필터링)       → 자동
5. CRM 카피 A/B 테스트안 생성               → 1분

총 소요시간: 약 5분/작품 (98% 단축)
```

---

## 슬라이드 A-2: 마케팅 자동화 흐름

### 업무 Flow 기반 설계

```
┌─────────────────────────────────────────────────────────────┐
│                    Marketing Studio                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  [Step 1]          [Step 2]           [Step 3]              │
│  작품 탐색    →    콘텐츠 생성    →    히스토리 저장         │
│                                                              │
│  ┌─────────┐      ┌─────────────┐     ┌─────────────┐       │
│  │키워드   │      │ AI 콘텐츠   │     │ 생성 기록   │       │
│  │검색     │ →    │ 자동 생성   │  →  │ 저장/재활용 │       │
│  │         │      │             │     │             │       │
│  │정렬     │      │ 플랫폼별    │     │ 마크다운    │       │
│  │필터링   │      │ 최적화      │     │ 내보내기    │       │
│  └─────────┘      └─────────────┘     └─────────────┘       │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**AI 에이전트 역할**
- Google Gemini 2.5 Flash 모델 활용
- 플랫폼별 최적화된 콘텐츠 생성 (인스타그램, 트위터)
- 다국어 동시 생성 (한/영/일)
- 해시태그 룰 시스템 적용 (금지태그 필터링, 필수태그 포함)

---

## 슬라이드 A-3: 작품 탐색 화면

### 1. Product Discovery

**목업 코드 (HTML)**
```html
<!-- 작품 탐색 화면 -->
<div class="p-6 bg-gray-50 min-h-screen">
  <!-- 검색 영역 -->
  <div class="bg-white rounded-xl shadow p-6 mb-6">
    <div class="flex gap-4 mb-4">
      <input type="text" placeholder="키워드로 작품 검색" 
             class="flex-1 border rounded-lg px-4 py-3 text-lg">
      <button class="bg-orange-500 text-white px-8 py-3 rounded-lg font-medium">
        검색
      </button>
    </div>
    
    <!-- 정렬/필터 -->
    <div class="flex gap-2">
      <button class="px-4 py-2 bg-orange-100 text-orange-600 rounded-full text-sm">인기순</button>
      <button class="px-4 py-2 bg-gray-100 text-gray-600 rounded-full text-sm">최신순</button>
      <button class="px-4 py-2 bg-gray-100 text-gray-600 rounded-full text-sm">가격순</button>
      <button class="px-4 py-2 bg-gray-100 text-gray-600 rounded-full text-sm">평점순</button>
    </div>
  </div>
  
  <!-- 작품 그리드 -->
  <div class="grid grid-cols-4 gap-4">
    <div class="bg-white rounded-xl shadow overflow-hidden cursor-pointer hover:shadow-lg">
      <div class="aspect-square bg-gray-200 relative">
        <div class="absolute top-2 left-2">
          <input type="checkbox" class="w-5 h-5 rounded">
        </div>
      </div>
      <div class="p-4">
        <h3 class="font-medium mb-1 truncate">핸드메이드 실버 반지</h3>
        <p class="text-sm text-gray-500">작가닉네임</p>
        <div class="flex justify-between items-center mt-2">
          <span class="font-bold text-orange-500">₩45,000</span>
          <span class="text-sm text-gray-400">⭐ 4.9</span>
        </div>
      </div>
    </div>
  </div>
  
  <!-- 선택된 작품 -->
  <div class="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg p-4">
    <div class="flex justify-between items-center max-w-6xl mx-auto">
      <span>선택된 작품: <b>3개</b> (최대 5개)</span>
      <button class="bg-orange-500 text-white px-8 py-3 rounded-lg font-medium">
        콘텐츠 생성 →
      </button>
    </div>
  </div>
</div>
```

---

## 슬라이드 A-4: 콘텐츠 스튜디오

### 2. AI 콘텐츠 자동 생성

**목업 코드 (HTML)**
```html
<!-- 콘텐츠 스튜디오 -->
<div class="p-6 bg-gray-50 min-h-screen">
  <!-- 생성 옵션 -->
  <div class="bg-white rounded-xl shadow p-6 mb-6">
    <h2 class="font-bold text-lg mb-4">콘텐츠 생성 옵션</h2>
    
    <div class="grid grid-cols-3 gap-6">
      <!-- 플랫폼 선택 -->
      <div>
        <label class="block text-sm font-medium mb-2">플랫폼</label>
        <div class="space-y-2">
          <label class="flex items-center gap-2">
            <input type="checkbox" checked class="w-4 h-4"> Instagram
          </label>
          <label class="flex items-center gap-2">
            <input type="checkbox" checked class="w-4 h-4"> X (Twitter)
          </label>
        </div>
      </div>
      
      <!-- 언어 선택 -->
      <div>
        <label class="block text-sm font-medium mb-2">언어</label>
        <div class="space-y-2">
          <label class="flex items-center gap-2">
            <input type="checkbox" checked class="w-4 h-4"> 한국어
          </label>
          <label class="flex items-center gap-2">
            <input type="checkbox" checked class="w-4 h-4"> English
          </label>
          <label class="flex items-center gap-2">
            <input type="checkbox" checked class="w-4 h-4"> 日本語
          </label>
        </div>
      </div>
      
      <!-- 콘텐츠 타입 -->
      <div>
        <label class="block text-sm font-medium mb-2">포맷</label>
        <div class="space-y-2">
          <label class="flex items-center gap-2">
            <input type="checkbox" checked class="w-4 h-4"> 피드 포스트
          </label>
          <label class="flex items-center gap-2">
            <input type="checkbox" class="w-4 h-4"> 캐러셀 (카드뉴스)
          </label>
          <label class="flex items-center gap-2">
            <input type="checkbox" class="w-4 h-4"> 릴스 대본
          </label>
        </div>
      </div>
    </div>
    
    <button class="mt-6 w-full bg-gradient-to-r from-orange-500 to-pink-500 text-white py-4 rounded-xl font-bold text-lg">
      ✨ AI 콘텐츠 생성
    </button>
  </div>
  
  <!-- 생성된 콘텐츠 미리보기 -->
  <div class="bg-white rounded-xl shadow p-6">
    <div class="flex border-b mb-4">
      <button class="px-4 py-2 border-b-2 border-orange-500 font-medium text-orange-500">Instagram</button>
      <button class="px-4 py-2 text-gray-500">X (Twitter)</button>
      <button class="px-4 py-2 text-gray-500">CRM Push</button>
    </div>
    
    <div class="flex gap-2 mb-4">
      <button class="px-3 py-1 bg-orange-500 text-white rounded-full text-sm">🇰🇷 한국어</button>
      <button class="px-3 py-1 bg-gray-100 rounded-full text-sm">🇺🇸 English</button>
      <button class="px-3 py-1 bg-gray-100 rounded-full text-sm">🇯🇵 日本語</button>
    </div>
    
    <div class="border rounded-lg p-4 bg-gray-50">
      <p class="whitespace-pre-line">
🌸 장인의 손끝에서 탄생한 특별한 작품

핸드메이드의 가치를 담은 실버 반지가 출시되었습니다.
하나하나 정성스럽게 만들어진 이 반지는...

#아이디어스 #핸드메이드 #실버반지
      </p>
      <div class="flex gap-2 mt-4">
        <button class="px-4 py-2 border rounded-lg text-sm">📋 복사</button>
        <button class="px-4 py-2 border rounded-lg text-sm">🔄 재생성</button>
      </div>
    </div>
  </div>
</div>
```

---

## 슬라이드 A-5: 해시태그 룰 시스템

### 자동 필터링 규칙

**금지 태그 (자동 제외)**
| 카테고리 | 예시 |
|---------|------|
| 경쟁사 | etsy, etsyfinds, minne, creema, amazon |
| 타 플랫폼 | 쿠팡, 네이버쇼핑, ebay, aliexpress |
| 스팸성 | followforfollow, likeforlike |

**필수 태그 (자동 포함)**
| 언어 | 필수 해시태그 |
|-----|--------------|
| 한국어 | #아이디어스, #핸드메이드 |
| 영어 | #idus, #handmade, #handcrafted |
| 일본어 | #アイディアス, #ハンドメイド |

**구현 코드**
```javascript
export const BLOCKLIST_TAGS = [
  'etsy', 'etsyfinds', 'minne', 'creema', 'amazon',
  '쿠팡', '네이버쇼핑', 'followforfollow'
];

export const REQUIRED_TAGS = {
  ko: ['아이디어스', '핸드메이드'],
  en: ['idus', 'handmade', 'handcrafted'],
  ja: ['アイディアス', 'ハンドメイド']
};
```

---

## 슬라이드 A-6: CRM 푸시 메시지

### A/B 테스트안 자동 생성

**목업 코드 (HTML)**
```html
<div class="bg-white rounded-xl shadow p-6">
  <h2 class="font-bold text-lg mb-4">CRM 푸시 메시지</h2>
  
  <div class="mb-6">
    <label class="block text-sm font-medium mb-2">트리거 유형</label>
    <select class="w-full border rounded-lg px-4 py-2">
      <option>장바구니 이탈 (30분 후)</option>
      <option>찜 후 미구매 (24시간 후)</option>
      <option>재구매 유도 (30일 경과)</option>
    </select>
  </div>
  
  <div class="grid grid-cols-2 gap-4">
    <!-- A안 -->
    <div class="border-2 border-blue-200 rounded-xl p-4 bg-blue-50">
      <span class="bg-blue-500 text-white px-2 py-1 rounded text-sm">A안</span>
      <div class="bg-white rounded-lg p-3 mt-3">
        <p class="font-medium text-sm">💕 잊지 않았어요</p>
        <p class="text-sm text-gray-600">장바구니에 담아둔 그 작품, 아직 기다리고 있어요</p>
      </div>
    </div>
    
    <!-- B안 -->
    <div class="border-2 border-green-200 rounded-xl p-4 bg-green-50">
      <span class="bg-green-500 text-white px-2 py-1 rounded text-sm">B안</span>
      <div class="bg-white rounded-lg p-3 mt-3">
        <p class="font-medium text-sm">⏰ 재고 알림</p>
        <p class="text-sm text-gray-600">장바구니 상품이 곧 품절될 수 있어요!</p>
      </div>
    </div>
  </div>
</div>
```

---

## 슬라이드 A-7: 기술 스택

### Marketing Studio 아키텍처

| 영역 | 기술 | 용도 |
|------|------|------|
| Frontend | React 19 + TypeScript | UI |
| Build | Vite | 빌드 도구 |
| Styling | Tailwind CSS | 스타일링 |
| Animation | Framer Motion | 애니메이션 |
| State | Zustand | 상태 관리 |
| AI | Gemini 2.5 Flash | 콘텐츠 생성 |
| API | Vercel Serverless | 크롤링 |
| Deploy | Vercel | 배포 |

---

# 섹션 B: 작품 번역 자동화 (GB Translation)

**GitHub**: https://github.com/pos01204/GB-translation

---

## 슬라이드 B-1: 번역 자동화 개요

### 글로벌 작품 번역 시스템

**프로젝트 목표**
한국 작가의 작품 정보를 일본어/영어로 자동 번역하여 글로벌 판매 지원

**해결한 문제**
```
[기존 번역 프로세스]

1. 작품 정보 수집 (이미지, 설명, 옵션)     → 10분
2. 번역 요청 (외부 번역가 또는 직접)       → 1-2일 대기
3. 번역 결과 검수                         → 30분
4. 플랫폼별 포맷 조정                      → 20분

총 소요시간: 1-2일/작품
```

**자동화 후**
```
1. 작품 ID 입력                           → 즉시
2. AI 자동 번역 (KR → JP/EN)              → 10초
3. 품질 검토 및 수정                       → 5분
4. 원클릭 내보내기                         → 즉시

총 소요시간: 5-10분/작품 (99% 단축)
```

---

## 슬라이드 B-2: 번역 업무 흐름

### Translation Workflow

```
┌─────────────────────────────────────────────────────────────┐
│                    GB Translation                            │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  [Input]           [Process]          [Output]              │
│                                                              │
│  ┌─────────┐      ┌─────────────┐     ┌─────────────┐       │
│  │작품 정보│      │  AI 번역    │     │ 번역 결과   │       │
│  │         │      │             │     │             │       │
│  │· 제목   │  →   │· 맥락 분석  │  →  │· 일본어     │       │
│  │· 설명   │      │· 톤앤매너   │     │· 영어       │       │
│  │· 옵션   │      │· 품질 검증  │     │· 중국어     │       │
│  │· 태그   │      │             │     │             │       │
│  └─────────┘      └─────────────┘     └─────────────┘       │
│                                                              │
│                          ↓                                   │
│                                                              │
│                   [검수 & 수정]                              │
│                   담당자 확인 후 업로드                      │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 슬라이드 B-3: 번역 화면 목업

### 작품 번역 인터페이스

**목업 코드 (HTML)**
```html
<div class="flex h-screen bg-gray-50">
  <!-- 좌측: 원본 -->
  <div class="w-1/2 p-6 border-r bg-white">
    <div class="flex justify-between items-center mb-4">
      <h2 class="font-bold text-lg">원본 (한국어)</h2>
      <span class="text-sm text-gray-500">작품 ID: 12345678</span>
    </div>
    
    <div class="aspect-square bg-gray-200 rounded-xl mb-4"></div>
    
    <div class="space-y-4">
      <div>
        <label class="text-sm text-gray-500">제목</label>
        <p class="font-medium">핸드메이드 실버 반지 - 별자리 시리즈</p>
      </div>
      <div>
        <label class="text-sm text-gray-500">설명</label>
        <p class="text-sm text-gray-700">
          장인의 손끝에서 탄생한 특별한 은반지입니다.
          순은 925를 사용하여 알러지 걱정 없이 착용 가능합니다.
        </p>
      </div>
      <div>
        <label class="text-sm text-gray-500">옵션</label>
        <div class="flex flex-wrap gap-2 mt-1">
          <span class="px-3 py-1 bg-gray-100 rounded-full text-sm">양자리</span>
          <span class="px-3 py-1 bg-gray-100 rounded-full text-sm">황소자리</span>
        </div>
      </div>
    </div>
  </div>
  
  <!-- 우측: 번역 결과 -->
  <div class="w-1/2 p-6">
    <div class="flex justify-between items-center mb-4">
      <div class="flex gap-2">
        <button class="px-4 py-2 bg-red-500 text-white rounded-lg text-sm">🇯🇵 日本語</button>
        <button class="px-4 py-2 bg-gray-200 rounded-lg text-sm">🇺🇸 English</button>
      </div>
      <button class="px-4 py-2 bg-indigo-500 text-white rounded-lg text-sm">🔄 재번역</button>
    </div>
    
    <div class="space-y-4">
      <div>
        <label class="text-sm text-gray-500">제목</label>
        <input type="text" 
               value="ハンドメイドシルバーリング - 星座シリーズ" 
               class="w-full border rounded-lg px-4 py-2">
      </div>
      <div>
        <label class="text-sm text-gray-500">설명</label>
        <textarea class="w-full border rounded-lg px-4 py-2 h-32">
職人の手から生まれた特別なシルバーリングです。
純銀925を使用しているため、アレルギーの心配なく着用できます。
        </textarea>
      </div>
      <div>
        <label class="text-sm text-gray-500">옵션</label>
        <div class="space-y-2 mt-1">
          <div class="flex items-center gap-2">
            <span class="text-sm text-gray-400 w-20">양자리 →</span>
            <input type="text" value="牡羊座" class="flex-1 border rounded px-3 py-1 text-sm">
          </div>
        </div>
      </div>
    </div>
    
    <div class="flex gap-2 mt-6">
      <button class="flex-1 py-3 border rounded-xl">📋 복사</button>
      <button class="flex-1 py-3 bg-green-500 text-white rounded-xl">✅ 완료</button>
    </div>
  </div>
</div>
```

---

## 슬라이드 B-4: 번역 품질 관리

### AI 번역 품질 향상 전략

**1. 프롬프트 엔지니어링**
```javascript
const translationPrompt = `
당신은 핸드메이드/공예품 전문 번역가입니다.

[번역 규칙]
1. 원본의 감성과 톤을 유지합니다
2. 공예/핸드메이드 관련 전문 용어는 현지화합니다
3. 가격, 크기 등 수치는 그대로 유지합니다
4. 브랜드명 'idus'는 번역하지 않습니다
5. 일본어: 존경어(敬語) 사용
`;
```

**2. 용어집 (Glossary) 적용**
| 한국어 | 일본어 | 영어 |
|-------|-------|------|
| 핸드메이드 | ハンドメイド | Handmade |
| 순은 925 | 純銀925 | Sterling Silver 925 |
| 주문 제작 | オーダーメイド | Made to Order |

---

## 슬라이드 B-5: 대량 번역 처리

### 배치 번역 인터페이스

**목업 코드 (HTML)**
```html
<div class="p-6 bg-gray-50 min-h-screen">
  <div class="bg-white rounded-xl shadow p-6">
    <h2 class="font-bold text-lg mb-4">대량 번역</h2>
    
    <div class="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center mb-6">
      <div class="text-4xl mb-2">📄</div>
      <p class="text-gray-600">CSV 파일을 드래그하거나 클릭하여 업로드</p>
    </div>
    
    <div class="mb-6">
      <div class="flex justify-between mb-2">
        <span class="text-sm text-gray-600">번역 진행률</span>
        <span class="text-sm font-medium">45 / 100</span>
      </div>
      <div class="h-3 bg-gray-200 rounded-full overflow-hidden">
        <div class="h-full bg-green-500 rounded-full" style="width: 45%"></div>
      </div>
    </div>
    
    <table class="w-full text-sm">
      <thead class="bg-gray-50">
        <tr>
          <th class="p-3 text-left">작품ID</th>
          <th class="p-3 text-left">제목</th>
          <th class="p-3 text-left">JP</th>
          <th class="p-3 text-left">EN</th>
          <th class="p-3 text-left">상태</th>
        </tr>
      </thead>
      <tbody>
        <tr class="border-t">
          <td class="p-3">12345678</td>
          <td class="p-3">핸드메이드 실버 반지</td>
          <td class="p-3">✅</td>
          <td class="p-3">✅</td>
          <td class="p-3"><span class="text-green-600">완료</span></td>
        </tr>
      </tbody>
    </table>
  </div>
</div>
```

---

## 슬라이드 B-6: 번역 효과 측정

### 정량적 효과

| 지표 | 기존 | 자동화 후 | 개선율 |
|------|------|----------|-------|
| 작품당 번역 시간 | 1-2일 | 5-10분 | 99%+ |
| 월간 처리량 | 30-50개 | 500개+ | 10배+ |
| 번역 일관성 | 번역가 의존 | 용어집 기반 | 표준화 |
| 비용 | 건당 5,000원+ | API 비용만 | 90%+ 절감 |

---

# 섹션 C: 3개 프로젝트 통합 비전

---

## 슬라이드 C-1: 통합 생태계

### 글로벌 비즈니스 자동화 생태계

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      Global Business Automation Ecosystem                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────┐    ┌─────────────────────┐    ┌─────────────────┐  │
│  │  Global Business    │    │  Marketing Studio   │    │ GB Translation  │  │
│  │       Hub           │    │                     │    │                 │  │
│  │                     │    │                     │    │                 │  │
│  │ · 데이터 통합      │ ←→ │ · SNS 콘텐츠 생성  │ ←→ │ · 작품 번역    │  │
│  │ · 비즈니스 분석    │    │ · CRM 자동화       │    │ · 다국어 지원  │  │
│  │ · 물류 관제        │    │ · 해시태그 관리    │    │ · 품질 관리    │  │
│  │ · QC/CS 지원       │    │                     │    │                 │  │
│  │                     │    │                     │    │                 │  │
│  │ [데이터 허브]       │    │ [마케팅 자동화]     │    │ [콘텐츠 현지화] │  │
│  └─────────────────────┘    └─────────────────────┘    └─────────────────┘  │
│           ↑                          ↑                          ↑           │
│           └──────────────────────────┼──────────────────────────┘           │
│                                      │                                       │
│                          ┌───────────┴───────────┐                          │
│                          │    Google Sheets      │                          │
│                          │    (Raw Data)         │                          │
│                          └───────────────────────┘                          │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 슬라이드 C-2: End-to-End 업무 흐름

### 신규 작품 등록부터 판매 분석까지

```
[신규 작품 등록]
      ↓
┌─────────────────────────────────────────────────────────────┐
│ 1. GB Translation                                            │
│    · 작품 정보 자동 번역 (KR → JP/EN)                        │
└───────────────────────────┬─────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. Marketing Studio                                          │
│    · 마케팅 콘텐츠 자동 생성                                 │
│    · SNS 포스팅, CRM 푸시 메시지                            │
└───────────────────────────┬─────────────────────────────────┘
                            ↓
[작품 판매 시작]
      ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. Global Business Hub                                       │
│    · 주문/물류 관리                                          │
│    · 성과 분석 (RFM, 국가별, 작가별)                         │
│    · QC/CS 지원                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 슬라이드 C-3: 3개 프로젝트 요약

### AI 코딩으로 실현한 업무 자동화

| 프로젝트 | 자동화 대상 | 핵심 기술 | 효과 |
|---------|------------|----------|------|
| Global Business Hub | 데이터 분석, 물류, CS | Next.js, Google Sheets API | 연 400시간+ 절감 |
| Marketing Studio | SNS 콘텐츠, CRM | React, Gemini AI | 98% 시간 단축 |
| GB Translation | 작품 번역, 현지화 | AI 번역, 용어집 | 10배+ 처리량 |

**공통된 접근 방식**
1. 반복적인 수작업 업무 식별
2. AI 코딩 도구로 자동화 시스템 구축
3. 업무 흐름에 맞춘 인터페이스 설계
4. 점진적 기능 확장

---

## 슬라이드 C-4: 프로젝트 링크

### 배포 및 소스 코드

**Global Business Hub**
- 배포: Vercel + Railway

**idus Marketing Studio**
- GitHub: https://github.com/pos01204/performance-marketer
- 배포: https://performance-marketer.vercel.app

**GB Translation**
- GitHub: https://github.com/pos01204/GB-translation

---

---

# 슬라이드 5: 6개월간의 여정 - Before & After

## 핵심 메시지
> "열심히 공부한 것이 아닙니다. AI와 함께 꾸준히 시도한 결과입니다."

---

## 6개월 전: Google Sheets + Apps Script 대시보드

**프로젝트명**: 소담상회 인사점 운영 전략 보고서 (2025.5 기준)

### 당시 구현했던 기능
| 기능 | 설명 |
|------|------|
| 📊 주요 KPI | 총 매출, 판매 수량, ASP, 재고 위험 상품 수 |
| 📈 일별 매출 추이 | 라인 차트 |
| 📍 위치별 매출 비중 | 스택드 바 차트 |
| 🏆 TOP 5 분석 | 상품, 작가, 위치별 순위 |
| 🤖 AI 운영 분석 | GPT 기반 전략 제안 |
| 📅 이벤트 성과 분석 | 전/중/후 비교 |
| 🔮 What-if 시뮬레이션 | 지표 변동 예측 |

### 당시 한계
- ⏱️ **속도**: 데이터 로딩에 10-30초 소요
- 📱 **반응형**: 모바일 대응 불가
- 🎨 **디자인**: Sheets UI 제약으로 제한적
- 🔗 **확장성**: 시트 간 연동 복잡
- 👥 **협업**: 동시 편집 시 충돌

---

## 6개월 후: Global Business Hub

### 발전 비교

| 항목 | 6개월 전 (Sheets) | 현재 (Web App) | 발전도 |
|------|------------------|----------------|--------|
| **데이터 로딩** | 10-30초 | 0.5-2초 | ⚡ **15배** 빠름 |
| **동시 접속** | 제한적 | 무제한 | ✅ |
| **모바일 대응** | ❌ | ✅ 완전 반응형 | ✅ |
| **기능 모듈** | 1개 (단일 대시보드) | 8개+ | 📈 **8배** |
| **UI/UX** | Sheets 기본 | 커스텀 디자인 시스템 | 🎨 |
| **자동화 범위** | 분석만 | 분석 + 마케팅 + 물류 + CS | 📊 |

### 새롭게 추가된 기능
- 🚚 **물류 관제 센터**: 5단계 파이프라인 실시간 시각화
- 👤 **고객 360도 뷰**: RFM 분석, CLV 예측
- 🔍 **통합 검색**: 주문/고객/작가 원클릭 조회
- 📱 **Marketing Studio**: SNS 콘텐츠 자동 생성
- 🌐 **번역 자동화**: 다국어 작품 설명 생성
- 📧 **미입고 안내**: 작가 자동 알림 (예정)

---

## 핵심 인사이트

### ❌ 아닌 것
```
"6개월 동안 열심히 개발 공부를 했다"
"프로그래밍 언어를 체계적으로 학습했다"
"부트캠프나 강의를 수강했다"
```

### ✅ 실제로 한 것
```
1. 업무에서 불편한 점을 발견
2. AI에게 "이거 해결할 수 있어?"라고 물어봄
3. 안 되면 다른 방식으로 다시 시도
4. 작은 성공 → 더 큰 시도로 확장
5. 반복
```

---

## 성장 타임라인

```
2025.01 ─────────────────────────────────────────────── 2026.01

[2025.01-05] 오프라인셀
├── Google Sheets + Apps Script
├── 소담상회 인사점 대시보드
└── "이 정도면 충분하지 않나?"

[2025.06] 글로벌 비즈니스셀 이동
├── 새로운 업무 환경
├── 더 복잡한 데이터 구조
└── "Sheets로는 한계가 있다"

[2025.07-09] 첫 번째 도전
├── Cursor + Gemini 시작
├── Next.js/Express 학습 (AI와 함께)
└── Global Business Hub v1

[2025.10-12] 기능 확장
├── 물류 관제, 고객 분석
├── Marketing Studio
└── 번역 자동화

[2026.01] 현재
├── 3개 프로젝트 운영 중
├── 연 400시간+ 업무 자동화
└── "이게 된다고?"
```

---

## 메시지

> ### "AI 시대에 중요한 것은 **코딩 실력**이 아니라 **시도하는 습관**입니다."
> 
> 6개월 전의 저도 Google Sheets로 나름의 대시보드를 만들었습니다.
> 그때도 AI(GPT)를 활용했고, 그 경험이 쌓여 지금의 프로젝트가 되었습니다.
> 
> **작은 시도 → 작은 성공 → 더 큰 시도**
> 
> 이 사이클을 반복한 것이 전부입니다.

---

### 목업 코드 (HTML) - 성장 비교 카드

```html
<div class="grid grid-cols-2 gap-8 p-8 bg-gray-50">
  <!-- Before -->
  <div class="bg-white rounded-2xl p-6 border-2 border-gray-200 relative">
    <div class="absolute -top-3 left-6 px-3 py-1 bg-gray-500 text-white text-sm rounded-full font-medium">
      6개월 전
    </div>
    <div class="mt-4">
      <div class="flex items-center gap-3 mb-4">
        <div class="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
          <span class="text-2xl">📊</span>
        </div>
        <div>
          <p class="font-bold text-lg">Google Sheets 대시보드</p>
          <p class="text-sm text-gray-500">소담상회 인사점</p>
        </div>
      </div>
      
      <div class="space-y-3 mb-6">
        <div class="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
          <span class="text-sm">데이터 로딩</span>
          <span class="font-bold text-red-500">10-30초</span>
        </div>
        <div class="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
          <span class="text-sm">기능 모듈</span>
          <span class="font-bold">1개</span>
        </div>
        <div class="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
          <span class="text-sm">모바일 대응</span>
          <span class="font-bold text-red-500">❌</span>
        </div>
        <div class="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
          <span class="text-sm">기술 스택</span>
          <span class="font-bold text-sm">Sheets + Apps Script</span>
        </div>
      </div>
      
      <div class="text-center text-gray-400 text-sm">
        "이 정도면 충분하지 않나?"
      </div>
    </div>
  </div>
  
  <!-- After -->
  <div class="bg-white rounded-2xl p-6 border-2 border-orange-400 relative shadow-lg">
    <div class="absolute -top-3 left-6 px-3 py-1 bg-orange-500 text-white text-sm rounded-full font-medium">
      현재
    </div>
    <div class="mt-4">
      <div class="flex items-center gap-3 mb-4">
        <div class="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
          <span class="text-2xl">🚀</span>
        </div>
        <div>
          <p class="font-bold text-lg">Global Business Hub</p>
          <p class="text-sm text-gray-500">+ Marketing Studio + 번역 자동화</p>
        </div>
      </div>
      
      <div class="space-y-3 mb-6">
        <div class="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
          <span class="text-sm">데이터 로딩</span>
          <div class="text-right">
            <span class="font-bold text-green-600">0.5-2초</span>
            <span class="text-xs text-green-500 ml-1">⚡15배↑</span>
          </div>
        </div>
        <div class="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
          <span class="text-sm">기능 모듈</span>
          <div class="text-right">
            <span class="font-bold text-green-600">8개+</span>
            <span class="text-xs text-green-500 ml-1">📈8배↑</span>
          </div>
        </div>
        <div class="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
          <span class="text-sm">모바일 대응</span>
          <span class="font-bold text-green-600">✅ 완전 반응형</span>
        </div>
        <div class="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
          <span class="text-sm">기술 스택</span>
          <span class="font-bold text-sm">Next.js + Express</span>
        </div>
      </div>
      
      <div class="text-center text-orange-500 font-medium text-sm">
        "이게 된다고?"
      </div>
    </div>
  </div>
</div>

<!-- 핵심 메시지 -->
<div class="mt-8 p-6 bg-gradient-to-r from-orange-500 to-amber-500 rounded-2xl text-white text-center">
  <p class="text-xl font-bold mb-2">💡 핵심은 "열심히 공부"가 아닙니다</p>
  <p class="text-white/90">AI와 함께 꾸준히 시도하고, 작은 성공을 쌓아간 결과입니다.</p>
</div>
```

---

# Genspark 발표자료 생성 가이드

## 발표 정보

**예상 발표 시간**: 약 50-60분 (Q&A 포함)
**슬라이드 수**: 40장 (기본) + 17장 (추가 프로젝트) + 부록
**대상**: 전 부서 (개발/비개발 구분 없음)

---

## 🎨 실제 구현 가능 HTML 목업

**스크린샷 없이 실제 UI를 렌더링할 수 있는 완전한 HTML 템플릿이 제공됩니다.**

📄 **참조 파일**: `PRESENTATION_MOCKUPS.md`

| 목업 | 설명 | 용도 |
|------|------|------|
| 메인 대시보드 | 전체 페이지 레이아웃 (헤더, 사이드바, KPI, 차트) | 슬라이드 23 |
| 물류 관제 센터 | 파이프라인, 알림, 위험 목록 테이블 | 슬라이드 24-25 |
| 고객 360도 뷰 | 모달 형태, RFM 스코어, 구매 이력 | 슬라이드 27 |
| Marketing Studio | 콘텐츠 생성 인터페이스 | 슬라이드 A-3~A-4 |

**사용 방법**:
1. `PRESENTATION_MOCKUPS.md` 파일의 HTML 코드 복사
2. Genspark의 HTML 렌더링 기능으로 실제 UI 표시
3. Tailwind CDN 포함으로 즉시 렌더링 가능

---

## 권장 설정

**테마**
- 스타일: 모던/심플
- 배경: 밝은 톤

**색상 스키마 (idus 브랜드)**
- Primary: #F78C3A (idus Orange)
- Secondary: #1F2937 (Dark Gray)
- Accent: #10B981 (Emerald)

**폰트**
- 제목: Pretendard Bold
- 본문: Pretendard Regular

## HTML 목업 활용 가이드

본 문서에 포함된 HTML 코드는 Tailwind CSS 기반입니다.
Genspark에서 목업 이미지 생성 시 해당 코드를 활용할 수 있습니다.

**포함된 목업**
- 슬라이드 17: 대시보드 KPI 카드
- 슬라이드 18: 물류 파이프라인
- 슬라이드 19: RFM 분석 테이블
- 슬라이드 20: 통합 검색 및 모달
- 슬라이드 21: 퍼포먼스 마케팅 도구
- 슬라이드 22: QC 관리
- 슬라이드 23: 소포수령증

## 슬라이드별 권장 레이아웃

| 슬라이드 | 레이아웃 |
|---------|---------|
| 1 | 타이틀 |
| 2-5 | 텍스트 + 다이어그램 |
| 6-10 | 데이터 흐름 다이어그램 |
| 11-15 | 프로세스 설명 |
| 16-23 | 목업 이미지 + 설명 |
| 24-28 | 표 + 인사이트 |
| 29-30 | 요약 |

## 스크린샷 첨부 권장 슬라이드

| 슬라이드 | 첨부할 스크린샷 |
|---------|----------------|
| 17 | 실제 메인 대시보드 화면 |
| 18 | 물류 관제 센터 화면 |
| 19 | 성과 분석 RFM 탭 |
| 20 | 통합 검색 + 모달 |
| 21 | 퍼포먼스 마케팅 페이지 |
| 22 | QC 관리 페이지 |
| 23 | 소포수령증 발급 화면 |

---

*본 발표자료는 분산된 데이터를 통합하고 이를 바탕으로 업무 전반으로 확장한 경험을 공유하여, 각 부서에서 유사한 접근 방식을 적용할 때 참고할 수 있도록 작성되었습니다.*
