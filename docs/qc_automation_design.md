# QC 업무 자동화 설계 문서

## 1. 현재 업무 프로세스 분석

### 1.1 업무 흐름
```
1. 데이터 업데이트
   ├─ Redash 쿼리 16118 실행 → 텍스트 QC용 한글 포함 결과 다운로드
   ├─ Redash 쿼리 16110 실행 → 이미지 QC용 한글 OCR 결과 다운로드
   └─ Google Sheets에 데이터 복사/붙여넣기

2. QC 진행
   ├─ 텍스트 QC 탭에서 검수 진행
   ├─ 이미지 QC 탭에서 검수 진행
   └─ 수정 필요한 항목은 I컬럼에 "O" 표기

3. 수정 대상 확인 & 작가 푸시 발송
   ├─ QC 완료 / 작가푸시 탭 확인
   └─ App Script 실행 → 작가 푸시 발송

4. 후속 대응
   └─ 작가 수정 현황 모니터링
```

### 1.2 데이터 구조 분석

#### 텍스트 QC 데이터 (`텍스트_QC용_한글_포함_결과_2025_11_27.csv`)
- **컬럼 구조**:
  - `global_product_id`: 글로벌 제품 ID
  - `kr_product_uuid`: 한국 제품 UUID
  - `global_artist_id`: 글로벌 작가 ID
  - `name`: 제품명 (일본어)
  - `pdp_descr`: 제품 상세 설명 (일본어)
  - `created_at`: 생성일시
  - `product_name`: 제품명 (한글)
  - `korean_place`: 한글 위치 (상세설명 등)

- **QC 포인트**:
  - 일본어 설명의 한글 번역 품질 확인
  - 번역 누락 여부 확인
  - 번역 오류 확인

#### 이미지 QC 데이터 (`이미지_QC_용_한글_ORC_결과_2025_11_27.csv`)
- **컬럼 구조**:
  - `artist_id`: 작가 ID
  - `product_id`: 제품 ID
  - `description_id`: 설명 ID
  - `detected_text`: OCR로 감지된 텍스트 (한글)
  - `image_url`: 이미지 URL
  - `page_name`: 페이지 유형 (list_image, detail_image 등)
  - `cmd_type`: 명령 유형 (NOCHANGE, NEW 등)
  - `product_name`: 제품명
  - `product_uuid`: 제품 UUID

- **QC 포인트**:
  - 이미지 내 한글 텍스트 OCR 정확도 확인
  - 이미지 URL 개별 클릭 필요 (현재 피로도 높음)
  - OCR 오인식 여부 확인

## 2. 자동화 가능 영역 분석

### 2.1 완전 자동화 가능 영역

#### ✅ 데이터 수집 및 업데이트
- **현재**: Redash 쿼리 수동 실행 → CSV 다운로드 → Google Sheets 복사/붙여넣기
- **자동화 방안**:
  - **CSV 파일 직접 업로드 방식** (Redash 연동 대신)
  - 업로드된 CSV 파일 파싱 및 검증
  - Google Sheets API를 통한 자동 업데이트
  - 주간 신규 QC 목록 자동 갱신

#### ✅ 기본 검증 로직
- **텍스트 QC**:
  - 한글 포함 여부 자동 검증
  - 번역 길이 비율 검증 (일본어 대비 한글 길이)
  - 특수문자/이모지 포함 여부 검증
  - 날짜/시간 형식 검증

- **이미지 QC**:
  - OCR 결과 빈 값 검증
  - OCR 결과 길이 검증 (너무 짧거나 긴 경우)
  - 특정 키워드 포함 여부 검증

### 2.2 반자동화 가능 영역 (기본 보조)

#### 📋 기본 이상 탐지 (AI 없이)
- **텍스트 QC**:
  - 번역 누락 여부 자동 감지
  - 기본적인 형식 오류 감지 (특수문자, 이모지 등)
  - 길이 비율 이상 감지

- **이미지 QC**:
  - OCR 결과 빈 값/이상 짧은 값 감지
  - 이미지 URL 유효성 검증

### 2.3 수동 검수 필수 영역

#### 👤 전문가 검수 필요
- 번역의 자연스러움 및 문맥 적합성
- 브랜드 톤앤매너 일관성
- 문화적 맥락 고려
- 최종 승인/거부 결정

## 3. 허브 연동 설계

### 3.1 새로운 페이지 구조

```
/qc (QC 관리)
├─ /qc/upload (CSV 업로드)
│  ├─ 텍스트 QC CSV 업로드
│  ├─ 이미지 QC CSV 업로드
│  ├─ 업로드 이력 확인
│  └─ 중복 검사 (이미 QC 완료된 항목 제외)
│
├─ /qc/text (텍스트 QC)
│  ├─ 데이터 목록 (필터링, 검색)
│  │  ├─ 상태 필터: 전체 / 미검수 / 수정 필요 / 승인 완료
│  │  └─ 주간 신규 항목만 표시 옵션
│  ├─ QC 진행 화면
│  │  ├─ 일본어 원문 표시
│  │  ├─ 한글 번역 표시
│  │  ├─ 기본 검증 결과 표시
│  │  └─ 수정 필요 체크박스
│  ├─ 일괄 처리 기능
│  └─ QC 완료 처리 (아카이빙)
│
├─ /qc/image (이미지 QC)
│  ├─ 데이터 목록 (필터링, 검색)
│  │  ├─ 상태 필터: 전체 / 미검수 / 수정 필요 / 승인 완료
│  │  └─ 주간 신규 항목만 표시 옵션
│  ├─ QC 진행 화면
│  │  ├─ 이미지 미리보기 (썸네일 그리드)
│  │  ├─ 이미지 확대 보기 (모달)
│  │  ├─ OCR 결과 표시
│  │  ├─ 이미지 URL 자동 로드 (피로도 감소)
│  │  └─ 수정 필요 체크박스
│  ├─ 일괄 처리 기능
│  └─ QC 완료 처리 (아카이빙)
│
└─ /qc/archive (QC 아카이브)
   ├─ 완료된 QC 내역 조회
   ├─ 작가별 수정 현황
   ├─ 제품별 수정 이력
   └─ 통계 대시보드
```

### 3.2 백엔드 API 설계

#### 3.2.1 데이터 수집 API
```typescript
// CSV 파일 업로드
POST /api/qc/upload/text
// multipart/form-data: file (CSV)
// 응답: { success: boolean, imported: number, skipped: number, duplicates: number }

POST /api/qc/upload/image
// multipart/form-data: file (CSV)
// 응답: { success: boolean, imported: number, skipped: number, duplicates: number }

// 업로드 이력 조회
GET /api/qc/upload/history?type=text|image&limit=10

// Google Sheets 연동 (기존 워크플로우 호환)
GET /api/qc/data/text?sheetName=...
GET /api/qc/data/image?sheetName=...
```

#### 3.2.2 QC 진행 API
```typescript
// 텍스트 QC
GET /api/qc/text/list?status=pending&page=1&limit=50&weeklyOnly=true
// weeklyOnly: 주간 신규 항목만 필터링
GET /api/qc/text/:id
PUT /api/qc/text/:id/status  // { status: 'approved' | 'needs_revision' }
POST /api/qc/text/batch-update
POST /api/qc/text/:id/complete  // QC 완료 처리 (아카이빙)

// 이미지 QC
GET /api/qc/image/list?status=pending&page=1&limit=50&weeklyOnly=true
GET /api/qc/image/:id
PUT /api/qc/image/:id/status
POST /api/qc/image/batch-update
POST /api/qc/image/:id/complete  // QC 완료 처리 (아카이빙)

// 중복 검사 (QC 완료 여부 확인)
GET /api/qc/check-duplicates
// { type: 'text' | 'image', ids: string[] }
// 응답: { duplicates: string[] }  // 이미 QC 완료된 ID 목록
```

#### 3.2.3 아카이빙 및 주간 신규 목록 관리 API
```typescript
// QC 완료 처리 및 아카이빙
POST /api/qc/archive/text
POST /api/qc/archive/image
// { ids: string[], status: 'approved' | 'needs_revision' }

// 아카이브 조회
GET /api/qc/archive/text?page=1&limit=50&startDate=...&endDate=...
GET /api/qc/archive/image?page=1&limit=50&startDate=...&endDate=...

// 주간 신규 목록 업데이트
POST /api/qc/weekly/update
// 주간 목요일 실행 시, 완료된 항목을 아카이브로 이동하고 신규 목록 갱신

// 알람 발송 대상 확인 (중복 방지)
GET /api/qc/push-targets
// QC 완료되었지만 아직 알람이 발송되지 않은 항목만 반환
```

#### 3.2.4 Google Sheets 연동 API
```typescript
// QC 결과 업데이트 (I컬럼에 "O" 표기)
POST /api/qc/sheets/update
// { sheetName, rowIndex, column: 'I', value: 'O' }

// 일괄 업데이트
POST /api/qc/sheets/batch-update
// { sheetName, updates: [{ rowIndex, column: 'I', value: 'O' }] }

// 주간 신규 목록 시트 업데이트
POST /api/qc/sheets/update-weekly-list
// 완료된 항목 제거 및 신규 항목 추가
```

### 3.3 프론트엔드 컴포넌트 설계

#### 3.3.1 CSV 업로드 컴포넌트
```typescript
// CSVUploadView.tsx
- 파일 선택 (드래그 앤 드롭 지원)
- 업로드 진행률 표시
- 중복 검사 결과 표시
  - 이미 QC 완료된 항목 수
  - 신규 항목 수
  - 스킵된 항목 목록
- 업로드 이력 표시
```

#### 3.3.2 텍스트 QC 컴포넌트
```typescript
// TextQCView.tsx
- 좌측: 일본어 원문
- 우측: 한글 번역
- 하단: 기본 검증 결과 (한글 포함 여부, 길이 비율 등)
- 액션: 승인 / 수정 필요 / 건너뛰기
- 상태 표시: 미검수 / 수정 필요 / 승인 완료
- 필터: 주간 신규만 보기 옵션
```

#### 3.3.3 이미지 QC 컴포넌트
```typescript
// ImageQCView.tsx
- 그리드 레이아웃: 이미지 썸네일 (4-6열)
- 클릭 시 모달: 이미지 확대 + OCR 결과
- 이미지 자동 로드 (피로도 감소)
- 액션: 승인 / 수정 필요 / 건너뛰기
- 상태 표시: 미검수 / 수정 필요 / 승인 완료
- 필터: 주간 신규만 보기 옵션
```

#### 3.3.4 이미지 미리보기 최적화
```typescript
// ImageGrid.tsx
- Lazy loading (스크롤 시 로드)
- 이미지 캐싱
- 썸네일 + 원본 이미지 분리
- 모달에서 원본 이미지 로드
```

#### 3.3.5 QC 아카이브 컴포넌트
```typescript
// QCArchiveView.tsx
- 완료된 QC 내역 목록
- 검색 및 필터링 (날짜, 작가, 제품 등)
- 통계 대시보드
  - 주간 완료 건수
  - 수정 필요 비율
  - 작가별 통계
```

## 4. UX/UI 개선 방안

### 4.1 이미지 URL 클릭 피로도 감소

#### 현재 문제점
- 각 이미지 URL을 개별적으로 클릭해야 함
- 새 탭/창이 열려서 작업 흐름이 끊김
- 이미지와 OCR 결과를 동시에 확인하기 어려움

#### 개선 방안

**1. 이미지 그리드 뷰**
```
┌─────────┬─────────┬─────────┬─────────┐
│ [IMG]   │ [IMG]   │ [IMG]   │ [IMG]   │
│ OCR:... │ OCR:... │ OCR:... │ OCR:... │
│ [✓] [✗] │ [✓] [✗] │ [✓] [✗] │ [✓] [✗] │
└─────────┴─────────┴─────────┴─────────┘
```
- 썸네일 이미지 자동 표시
- OCR 결과 하단 표시
- 승인/거부 버튼 바로 표시

**2. 모달 확대 보기**
- 썸네일 클릭 시 모달 팝업
- 원본 이미지 + OCR 결과 동시 표시
- 키보드 네비게이션 (← → 화살표로 다음/이전)

**3. 일괄 처리 기능**
- 체크박스로 여러 항목 선택
- 일괄 승인/거부
- 필터링: 수정 필요만 보기

### 4.2 텍스트 QC 효율화

**1. 비교 뷰**
```
┌─────────────────┬─────────────────┐
│ 일본어 원문      │ 한글 번역        │
│                 │                 │
│ [원문 표시]     │ [번역 표시]     │
│                 │                 │
│ [검증 결과]      │ [이슈 목록]     │
│ ✓ 한글 포함     │ - 누락 없음     │
│ ✓ 길이 적정     │ - 형식 정상     │
└─────────────────┴─────────────────┘
```

**2. 기본 검증 하이라이트**
- 한글 미포함 항목 표시
- 번역 길이 이상 항목 표시
- 특수문자/이모지 포함 여부 표시

**3. 키보드 단축키**
- `A`: 승인 (Approve)
- `R`: 수정 필요 (Revision)
- `N`: 다음 항목 (Next)
- `P`: 이전 항목 (Previous)

## 5. 구현 우선순위

### Phase 1: 기본 기능 (1-2주)
1. ✅ CSV 업로드 기능
   - 파일 업로드 UI
   - CSV 파싱 및 검증
   - 중복 검사 (아카이브와 비교)
2. ✅ 데이터 목록 표시
   - 텍스트 QC 목록
   - 이미지 QC 목록
   - 상태 필터링
3. ✅ 텍스트 QC 기본 화면
   - 일본어/한글 비교 뷰
   - 기본 검증 결과 표시
   - 승인/수정 필요 처리
4. ✅ 이미지 QC 그리드 뷰
   - 썸네일 그리드
   - 모달 확대 보기
5. ✅ Google Sheets 연동 (읽기/쓰기)
   - I컬럼 업데이트
   - 주간 신규 목록 관리

### Phase 2: 아카이빙 및 중복 방지 (1주)
1. ✅ QC 완료 처리 및 아카이빙
   - 완료된 항목 아카이브 저장
   - 주간 신규 목록에서 제거
2. ✅ 중복 검사 강화
   - CSV 업로드 시 중복 검사
   - 알람 발송 전 중복 확인
3. ✅ 주간 신규 목록 관리
   - 목요일 기준 주간 목록 갱신
   - 완료된 항목 자동 제거

### Phase 3: UX 개선 (1주)
1. ✅ 이미지 모달 확대 보기
2. ✅ 키보드 단축키
3. ✅ 일괄 처리 기능
4. ✅ 필터링 및 검색
5. ✅ 주간 신규만 보기 옵션

### Phase 4: 모니터링 및 통계 (1주)
1. ✅ QC 아카이브 조회
2. ✅ 통계 대시보드
3. ✅ 작가별 수정 현황
4. ✅ 알람 발송 대상 관리

## 6. 기술 스택

### 백엔드
- **기존**: Express.js, TypeScript, Google Sheets API
- **추가**: 
  - CSV 파싱 라이브러리 (csv-parse)
  - 파일 업로드 처리 (multer)
  - 데이터베이스 또는 메모리 저장소 (QC 아카이브용)
  - 이미지 처리 라이브러리 (sharp, jimp) - 선택적

### 프론트엔드
- **기존**: Next.js 14, React 18, TypeScript, Tailwind CSS
- **추가**:
  - 이미지 뷰어 라이브러리 (react-image-gallery, react-image-viewer)
  - 가상화 (react-window) - 대량 데이터 처리
  - 키보드 이벤트 처리 (react-hotkeys)

### 데이터 저장
- **Google Sheets**: QC 결과 저장 (기존 워크플로우 유지)
  - I컬럼 업데이트 (수정 필요 표기)
  - 주간 신규 목록 관리
- **QC 아카이브**: 완료된 QC 내역 저장
  - 옵션 1: 별도 Google Sheets 시트 (권장)
  - 옵션 2: 데이터베이스 (PostgreSQL, MongoDB 등)
  - 옵션 3: JSON 파일 (소규모 데이터용)
- **중복 검사**: 아카이브와 비교하여 이미 QC 완료된 항목 제외

## 7. Google Sheets 연동 상세

### 7.1 시트 구조
```
[GB] 일본어 작품 - 한글 잔여 작품 시트
├─ 1.설명글_한글_raw (텍스트 QC 원본 데이터)
├─ 1.OCR_결과_raw (이미지 QC 원본 데이터)
├─ 텍스트 QC & 이미지 QC (QC 진행 시트)
│  └─ I컬럼: 수정 필요 표기 ("O")
└─ 3.QC 완료 / 작가푸시 (완료 데이터)
```

### 7.2 API 연동
- **읽기**: Google Sheets API를 통한 데이터 로드
- **쓰기**: I컬럼 업데이트 (수정 필요 표기)
- **권한**: 기존 Google Sheets 서비스 계정 활용

## 8. 예상 효과

### 효율성 향상
- **이미지 URL 클릭**: 개별 클릭 → 그리드 뷰로 80% 시간 절감
- **데이터 수집**: 수동 복사/붙여넣기 → CSV 업로드로 90% 시간 절감
- **중복 방지**: 아카이빙으로 중복 QC 및 알람 방지

### 품질 향상
- **일관성**: 기본 검증 로직으로 누락 감소
- **정확도**: 자동 검증 로직으로 오류 감소
- **추적성**: 모든 QC 이력 아카이브에 자동 기록
- **알람 관리**: 중복 알람 방지로 작가 경험 개선

## 9. 핵심 개선 사항 요약

### 변경된 요구사항 반영
1. ✅ **CSV 직접 업로드**: Redash 연동 대신 CSV 파일 업로드 방식 채택
2. ✅ **AI 제거**: 번역 품질 평가 AI 기능 제거 (토큰 사용량 우려)
3. ✅ **아카이빙 및 중복 방지**: 
   - QC 완료된 항목 아카이브 저장
   - 주간 신규 목록 자동 갱신
   - 중복 알람 방지 로직

### 주요 기능
- CSV 업로드 및 중복 검사
- 주간 신규 QC 목록 관리
- QC 완료 처리 및 아카이빙
- 알람 발송 전 중복 확인
- Google Sheets 연동 (기존 워크플로우 유지)

## 10. 다음 단계

1. ✅ **요구사항 확인**: 설계 문서 검토 및 피드백 반영 완료
2. **프로토타입 개발**: Phase 1 기본 기능 구현 시작
3. **사용자 테스트**: 실제 업무 환경에서 테스트
4. **반복 개선**: 피드백 기반 개선

