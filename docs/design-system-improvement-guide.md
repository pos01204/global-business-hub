# Global Business Hub 디자인 시스템 개선 가이드

## 1. 개요

### 1.1 목적
Global Business Hub의 전반적인 디자인과 UX/UI를 체계적으로 개선하기 위한 가이드 문서입니다.
순차적이고 정확한 작업을 위해 개선 가능한 카테고리와 요소들을 정의합니다.

### 1.2 현재 상태
- **프레임워크**: Next.js 14 + Tailwind CSS
- **디자인 시스템**: CSS Variables + Tailwind 확장
- **브랜드 컬러**: idus Orange (#F78C3A)
- **폰트**: Pretendard

---

## 2. 디자인 개선 카테고리

### 카테고리 A: 디자인 토큰 (Design Tokens)

| 요소 | 현재 상태 | 개선 가능 항목 |
|------|----------|---------------|
| **A1. 컬러 시스템** | CSS Variables 정의됨 | 시맨틱 컬러 확장, 다크모드 완성 |
| **A2. 타이포그래피** | Pretendard 기본 설정 | 폰트 스케일 체계화, 행간/자간 최적화 |
| **A3. 스페이싱** | Tailwind 기본값 사용 | 커스텀 스페이싱 스케일 정의 |
| **A4. 그림자** | 4단계 정의됨 | 용도별 그림자 세분화 |
| **A5. 보더 라디우스** | 5단계 정의됨 | 컴포넌트별 일관성 검토 |
| **A6. 애니메이션** | 기본 트랜지션 정의됨 | 마이크로 인터랙션 추가 |

### 카테고리 B: 레이아웃 (Layout)

| 요소 | 현재 상태 | 개선 가능 항목 |
|------|----------|---------------|
| **B1. 사이드바** | 고정 너비, 아이콘+텍스트 | 접기/펼치기, 반응형 개선 |
| **B2. 헤더** | 기본 헤더 구현 | 검색, 알림, 프로필 기능 강화 |
| **B3. 메인 컨텐츠** | 단일 컬럼 | 그리드 시스템 체계화 |
| **B4. 페이지 헤더** | 그라데이션 배경 | 일관된 패턴 적용 |
| **B5. 푸터** | 미구현 | 필요시 추가 |
| **B6. 반응형** | 부분 구현 | 모바일/태블릿 최적화 |

### 카테고리 C: 공통 컴포넌트 (Common Components)

| 요소 | 현재 상태 | 개선 가능 항목 |
|------|----------|---------------|
| **C1. 버튼** | 4종 정의 (primary, secondary, outline, ghost) | 크기 변형, 로딩 상태, 아이콘 버튼 |
| **C2. 카드** | 기본 카드 스타일 | 변형 추가 (elevated, outlined, filled) |
| **C3. 입력 필드** | 기본 스타일 | 에러 상태, 도움말, 접두사/접미사 |
| **C4. 셀렉트/드롭다운** | 기본 스타일 | 커스텀 드롭다운, 멀티셀렉트 |
| **C5. 모달** | 기본 구현 | 크기 변형, 애니메이션 개선 |
| **C6. 테이블** | 기본 스타일 | 정렬, 필터, 페이지네이션 |
| **C7. 탭** | 페이지별 개별 구현 | 공통 탭 컴포넌트화 |
| **C8. 뱃지** | 5종 정의 | 크기 변형, 닫기 버튼 |
| **C9. 툴팁** | 미구현 | 추가 필요 |
| **C10. 토스트/알림** | 미구현 | 추가 필요 |
| **C11. 로딩 상태** | 부분 구현 | 스켈레톤, 스피너 체계화 |
| **C12. 빈 상태** | 부분 구현 | 일관된 빈 상태 컴포넌트 |

### 카테고리 D: 데이터 시각화 (Data Visualization)

| 요소 | 현재 상태 | 개선 가능 항목 |
|------|----------|---------------|
| **D1. 차트 컬러** | 6색 팔레트 정의 | 접근성 검토, 확장 |
| **D2. KPI 카드** | 기본 구현 | 트렌드 표시, 비교 기능 |
| **D3. 차트 스타일** | Chart.js 기본 | 일관된 스타일 가이드 |
| **D4. 데이터 테이블** | 기본 구현 | 인라인 차트, 히트맵 |

### 카테고리 E: 네비게이션 (Navigation)

| 요소 | 현재 상태 | 개선 가능 항목 |
|------|----------|---------------|
| **E1. 사이드바 메뉴** | 그룹화 구현 | 아이콘 개선, 활성 상태 강화 |
| **E2. 브레드크럼** | 미구현 | 추가 필요 |
| **E3. 페이지 내 탭** | 개별 구현 | 공통화 |
| **E4. 페이지네이션** | 부분 구현 | 공통 컴포넌트화 |

### 카테고리 F: 폼 & 입력 (Forms & Inputs)

| 요소 | 현재 상태 | 개선 가능 항목 |
|------|----------|---------------|
| **F1. 텍스트 입력** | 기본 스타일 | 변형, 상태 추가 |
| **F2. 텍스트영역** | 기본 스타일 | 자동 높이 조절 |
| **F3. 체크박스** | 기본 스타일 | 커스텀 디자인 |
| **F4. 라디오 버튼** | 기본 스타일 | 커스텀 디자인 |
| **F5. 토글 스위치** | 미구현 | 추가 필요 |
| **F6. 날짜 선택기** | HTML 기본 | 커스텀 날짜 선택기 |
| **F7. 파일 업로드** | 기본 구현 | 드래그앤드롭, 미리보기 |
| **F8. 폼 검증** | 개별 구현 | 공통 검증 패턴 |

### 카테고리 G: 피드백 & 상태 (Feedback & States)

| 요소 | 현재 상태 | 개선 가능 항목 |
|------|----------|---------------|
| **G1. 로딩 스피너** | 부분 구현 | 통일된 스피너 |
| **G2. 스켈레톤** | CSS 정의됨 | 컴포넌트화 |
| **G3. 에러 상태** | 개별 구현 | 공통 에러 컴포넌트 |
| **G4. 성공 메시지** | 개별 구현 | 토스트 시스템 |
| **G5. 확인 다이얼로그** | 미구현 | 추가 필요 |
| **G6. 프로그레스 바** | 미구현 | 추가 필요 |

### 카테고리 H: 접근성 (Accessibility)

| 요소 | 현재 상태 | 개선 가능 항목 |
|------|----------|---------------|
| **H1. 키보드 네비게이션** | 부분 지원 | 전체 지원 |
| **H2. 스크린 리더** | 미검토 | ARIA 레이블 추가 |
| **H3. 색상 대비** | 미검토 | WCAG 기준 검토 |
| **H4. 포커스 표시** | 기본 구현 | 명확한 포커스 링 |

---

## 3. 페이지별 개선 항목

### 3.1 대시보드 (Dashboard)
- [ ] KPI 카드 레이아웃 최적화
- [ ] 차트 반응형 개선
- [ ] 빠른 액션 버튼 추가

### 3.2 고객 분석 (Customer Analytics)
- [ ] 세그먼트 카드 디자인 개선
- [ ] 차트 인터랙션 강화
- [ ] 필터 UI 개선

### 3.3 쿠폰 생성/발급 (Coupon Generator)
- [ ] 탭 디자인 일관성
- [ ] 폼 레이아웃 최적화
- [ ] 쿼리 미리보기 개선

### 3.4 작가 분석 (Artist Analytics)
- [ ] 테이블 디자인 개선
- [ ] 상세 모달 UX 개선
- [ ] 필터/정렬 UI 강화

### 3.5 AI 어시스턴트 (Chat)
- [ ] 채팅 버블 디자인
- [ ] 입력 영역 개선
- [ ] 응답 포맷팅

### 3.6 기타 페이지
- [ ] 물류 관제 센터
- [ ] QC 관리
- [ ] 정산 관리
- [ ] 리뷰 갤러리

---

## 4. 우선순위 매트릭스

### 높은 영향 + 낮은 노력 (Quick Wins)
1. 컬러 시스템 정리 (A1)
2. 버튼 컴포넌트 통일 (C1)
3. 로딩 상태 통일 (G1, G2)
4. 포커스 스타일 개선 (H4)

### 높은 영향 + 높은 노력 (Major Projects)
1. 공통 컴포넌트 라이브러리 구축 (C 전체)
2. 반응형 레이아웃 개선 (B6)
3. 토스트/알림 시스템 (C10, G4)
4. 접근성 전면 개선 (H 전체)

### 낮은 영향 + 낮은 노력 (Fill-ins)
1. 스페이싱 스케일 정리 (A3)
2. 애니메이션 미세 조정 (A6)
3. 스크롤바 스타일 (기 구현)

### 낮은 영향 + 높은 노력 (Consider Later)
1. 다크모드 완성 (A1)
2. 커스텀 날짜 선택기 (F6)
3. 고급 데이터 테이블 (D4)

---

## 5. 작업 진행 체크리스트

### Phase 1: 기반 정비 (Foundation)
- [x] 디자인 토큰 문서화 (globals.css에 CSS Variables 정의됨)
- [x] 컬러 팔레트 정리 (idus 브랜드 컬러 적용)
- [ ] 타이포그래피 스케일 정의
- [ ] 스페이싱 시스템 정의

### Phase 2: 공통 컴포넌트 (Components) ✅ 2025-12-02 완료
- [x] Button 컴포넌트 생성 (`components/ui/Button.tsx`)
- [x] Card 컴포넌트 생성 (`components/ui/Card.tsx`)
- [x] Input 컴포넌트 생성 (`components/ui/Input.tsx`)
- [x] Select 컴포넌트 생성 (`components/ui/Select.tsx`)
- [x] Modal 컴포넌트 개선 (`components/ui/Modal.tsx`)
- [x] ConfirmDialog 컴포넌트 생성 (`components/ui/ConfirmDialog.tsx`)
- [x] Toast 시스템 구축 (`components/ui/Toast.tsx`)
- [x] Loading 컴포넌트 생성 (`components/ui/Spinner.tsx`, `Skeleton.tsx`)
- [x] Tabs 컴포넌트 생성 (`components/ui/Tabs.tsx`)
- [x] Badge 컴포넌트 생성 (`components/ui/Badge.tsx`)
- [x] Tooltip 컴포넌트 생성 (`components/ui/Tooltip.tsx`)
- [x] EmptyState 컴포넌트 생성 (`components/ui/EmptyState.tsx`)
- [x] UI 컴포넌트 인덱스 생성 (`components/ui/index.ts`)

### Phase 3: 레이아웃 개선 (Layout) ✅ 2025-12-02 완료
- [x] Sidebar 개선 (활성 메뉴 인디케이터 바 + 브랜드 컬러 적용)
- [x] Header 개선 (검색 연결, 알림 드롭다운, 브랜드 컬러 적용)
- [ ] 반응형 브레이크포인트 정의
- [ ] 그리드 시스템 적용

### Phase 4: 페이지별 적용 (Pages)
- [ ] 대시보드 리디자인
- [x] 쿠폰 생성기 - 공통 Tabs 컴포넌트 적용
- [ ] 각 페이지 컴포넌트 교체
- [ ] 일관성 검토

### Phase 5: 마무리 (Polish)
- [ ] 접근성 검토
- [ ] 성능 최적화
- [ ] 문서화 완료

---

## 6. 파일 구조 (현재 구현 상태)

```
frontend/
├── components/
│   ├── ui/                    # ✅ 기본 UI 컴포넌트 (구현 완료)
│   │   ├── Badge.tsx          # ✅ 뱃지 (variant, size, dot, removable)
│   │   ├── Button.tsx         # ✅ 버튼 (variant, size, loading, icon)
│   │   ├── Card.tsx           # ✅ 카드 (variant, padding, interactive)
│   │   ├── ConfirmDialog.tsx  # ✅ 확인 다이얼로그 (default, danger)
│   │   ├── EmptyState.tsx     # ✅ 빈 상태 (프리셋 포함)
│   │   ├── Input.tsx          # ✅ 입력 필드 (label, error, hint, prefix/suffix)
│   │   ├── Modal.tsx          # ✅ 모달 (size, footer, 포커스 트랩)
│   │   ├── Select.tsx         # ✅ 셀렉트 (searchable, 키보드 네비게이션)
│   │   ├── Skeleton.tsx       # ✅ 스켈레톤 (variant, 프리셋)
│   │   ├── Spinner.tsx        # ✅ 스피너 (size, color, LoadingOverlay)
│   │   ├── Tabs.tsx           # ✅ 탭 (underline, pills, enclosed)
│   │   ├── Toast.tsx          # ✅ 토스트 (success, error, warning, info)
│   │   ├── Tooltip.tsx        # ✅ 툴팁 (position, delay)
│   │   └── index.ts           # ✅ 통합 export
│   ├── layout/                # 레이아웃 컴포넌트 (기존)
│   │   ├── Sidebar.tsx        # ✅ 활성 메뉴 스타일 개선됨
│   │   ├── Header.tsx
│   │   ├── PageHeader.tsx
│   │   └── Layout.tsx         # ✅ ToastProvider 적용됨
│   ├── data-display/          # 📋 TODO: 데이터 표시 컴포넌트
│   │   ├── KPICard.tsx
│   │   ├── DataTable.tsx
│   │   └── Chart.tsx
│   └── feedback/              # 📋 TODO: 피드백 컴포넌트
│       ├── Alert.tsx
│       └── Progress.tsx
├── styles/
│   └── globals.css            # ✅ 디자인 토큰 정의됨
└── lib/
    └── design-system/         # 📋 TODO: 디자인 시스템 유틸
        ├── cn.ts
        └── variants.ts
```

---

## 7. 변경 이력

| 버전 | 날짜 | 작성자 | 변경 내용 |
|------|------|--------|----------|
| 1.0 | 2025-12-02 | - | 초안 작성 |
| 1.1 | 2025-12-02 | - | Phase 2 공통 컴포넌트 구현 완료 (Button, Card, Input, Toast, Spinner, Skeleton, Tabs, EmptyState) |
| 1.2 | 2025-12-02 | - | Sidebar 활성 메뉴 스타일 개선, 쿠폰 생성기 Tabs 컴포넌트 적용 |
| 1.3 | 2025-12-02 | - | 추가 컴포넌트 구현 (Select, Modal, ConfirmDialog, Badge, Tooltip) |
| 1.4 | 2025-12-02 | - | Header 개선 (검색 연결, 알림 드롭다운, 브랜드 컬러), Input 타입 오류 수정 |
