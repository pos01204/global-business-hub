# QC 시트 통합 가이드

## 📊 시트 구조

### 사용 중인 시트

1. **`[QC] 한글_raw`** - 텍스트 QC 원본 데이터
   - 모든 텍스트 QC 데이터 저장
   - 상태 컬럼(`status`)으로 QC 진행 상태 관리
   - `status` 값: `pending`, `approved`, `needs_revision`, `excluded`, `archived`

2. **`[QC] OCR_결과_raw`** - 이미지 QC 원본 데이터
   - 모든 이미지 QC 데이터 저장
   - 상태 컬럼(`status`)으로 QC 진행 상태 관리
   - `status` 값: `pending`, `approved`, `needs_revision`, `excluded`, `archived`

3. **`[QC] archiving`** - 완료된 QC 아카이브
   - QC 완료 처리된 항목 저장
   - 원본 데이터 + QC 결과 정보 포함

---

## 🔄 데이터 흐름

### 1. 데이터 로드 (서버 시작 시 또는 동기화 시)

```
[QC] 한글_raw → 텍스트 QC 메모리 저장소
[QC] OCR_결과_raw → 이미지 QC 메모리 저장소
[QC] archiving → 아카이브 메모리 저장소
```

- `status`가 `archived`인 항목은 아카이브 저장소에만 로드
- 나머지 항목은 활성 QC 저장소에 로드

### 2. QC 상태 업데이트

```
사용자 액션 → 메모리 업데이트 → 원본 시트 상태 컬럼 업데이트
```

- 승인/수정 필요/비대상 상태 변경 시
- 원본 시트(`[QC] 한글_raw` 또는 `[QC] OCR_결과_raw`)의 `status` 컬럼 업데이트
- `needsRevision`, `completedAt` 컬럼도 함께 업데이트

### 3. QC 완료 처리

```
사용자 액션 → 메모리 아카이브 이동 → 원본 시트 상태 'archived' 업데이트 → 아카이브 시트에 저장
```

- 완료 처리 시:
  1. 원본 시트의 `status`를 `archived`로 업데이트
  2. `completedAt` 컬럼 업데이트
  3. `[QC] archiving` 시트에 전체 데이터 저장

### 4. CSV 업로드

```
CSV 파일 → 메모리 저장 → 원본 시트에 배치 저장
```

- 텍스트 QC: `[QC] 한글_raw` 시트에 저장
- 이미지 QC: `[QC] OCR_결과_raw` 시트에 저장
- 배치 처리 (1000개씩)로 성능 최적화

---

## 📋 필수 컬럼 구조

### 원본 시트 (`[QC] 한글_raw`, `[QC] OCR_결과_raw`)

**기본 데이터 컬럼** (시트에 이미 존재):
- 텍스트 QC: `global_product_id`, `product_id`, `kr_product_uuid` 등
- 이미지 QC: `product_id`, `image_url`, `page_name` 등

**QC 상태 컬럼** (자동으로 추가/업데이트됨):
- `status` - QC 상태 (`pending`, `approved`, `needs_revision`, `excluded`, `archived`)
- `needsRevision` - 수정 필요 여부 (`TRUE`/`FALSE`)
- `completedAt` - 완료 시간 (ISO 8601 형식)

### 아카이브 시트 (`[QC] archiving`)

- 원본 데이터의 모든 컬럼
- 추가 컬럼:
  - `type` - QC 타입 (`text` 또는 `image`)
  - `status` - 최종 상태
  - `needsRevision` - 수정 필요 여부
  - `createdAt` - 생성 시간
  - `completedAt` - 완료 시간

---

## 🔧 동적 컬럼 찾기

시스템은 시트 헤더를 읽어서 컬럼 위치를 자동으로 찾습니다:

1. **ID 컬럼 찾기**:
   - 텍스트 QC: `global_product_id`, `product_id`, `kr_product_uuid` 순서로 시도
   - 이미지 QC: `product_id`, `image_url`, `page_name` 순서로 시도

2. **상태 컬럼 찾기**:
   - `status` 컬럼 자동 검색
   - `needsRevision` 또는 `needs_revision` 컬럼 자동 검색
   - `completedAt` 또는 `completed_at` 컬럼 자동 검색

3. **컬럼이 없을 경우**:
   - 경고 메시지 출력
   - 메모리 업데이트는 정상적으로 진행
   - 시트에 해당 컬럼을 수동으로 추가하면 자동으로 인식

---

## 📝 사용 가이드

### 시트 준비

1. **원본 시트에 상태 컬럼 추가** (선택사항, 자동 생성 가능):
   ```
   status | needsRevision | completedAt
   ```
   - 컬럼이 없어도 동작하지만, 상태 추적을 위해 추가 권장

2. **아카이브 시트 준비**:
   - 빈 시트 생성 또는 기존 데이터 유지
   - 헤더는 자동으로 추가됨

### 데이터 추가

**방법 1: Google Sheets 직접 사용 (권장)**
1. `[QC] 한글_raw` 또는 `[QC] OCR_결과_raw` 시트에 데이터 추가
2. 허브에서 "🔄 동기화" 버튼 클릭
3. QC 진행

**방법 2: CSV 업로드**
1. CSV 파일 준비
2. 허브에서 CSV 업로드
3. 자동으로 원본 시트에 저장됨
4. QC 진행

### QC 진행

1. 텍스트 QC / 이미지 QC 탭에서 항목 확인
2. 상태 변경 (승인/수정 필요/비대상)
3. **자동으로 원본 시트에 상태 저장됨**

### 완료 처리

1. QC 완료 버튼 클릭
2. **자동으로**:
   - 원본 시트의 `status`가 `archived`로 변경
   - `[QC] archiving` 시트에 전체 데이터 저장

---

## ⚠️ 주의사항

1. **컬럼 이름 대소문자**
   - 컬럼 이름은 대소문자를 구분하지 않음
   - `status`, `Status`, `STATUS` 모두 인식

2. **ID 컬럼 필수**
   - 각 행은 고유한 ID를 가져야 함
   - `global_product_id`, `product_id` 등 중 하나는 필수

3. **상태 컬럼 없을 때**
   - 상태 컬럼이 없어도 동작하지만, 상태 추적 불가
   - 시트에 `status` 컬럼 추가 권장

4. **동시 편집**
   - 여러 사용자가 동시에 편집하면 마지막 저장이 우선
   - 동기화 버튼으로 최신 데이터 반영

---

## 🔍 문제 해결

### 상태가 저장되지 않을 때
1. 시트에 `status` 컬럼이 있는지 확인
2. 서버 로그 확인: `[QC] 상태 업데이트 완료` 메시지
3. Google Sheets 권한 확인

### 동기화가 안 될 때
1. 시트 이름 확인: `[QC] 한글_raw`, `[QC] OCR_결과_raw`, `[QC] archiving`
2. 서버 로그 확인: `[QC] QC 데이터 초기화 시작...`
3. Google Sheets API 권한 확인

### 아카이브가 저장되지 않을 때
1. `[QC] archiving` 시트 존재 확인
2. 서버 로그 확인: `[QC] 아카이브 저장 완료`
3. 원본 시트에서 해당 행 찾기 실패 시 ID 컬럼 확인

---

**마지막 업데이트**: 2025-01-XX
**작성자**: AI Assistant




