# QC 데이터 관리 워크플로우 개선 가이드

## 🎯 개선 목표

CSV 업로드 타임아웃 문제를 해결하고, Google Sheets를 단일 소스로 사용하는 워크플로우로 전환합니다.

---

## 📋 새로운 워크플로우

### 권장 방식: Google Sheets 직접 사용

1. **Google Sheets에 데이터 추가**
   - `텍스트 QC & 이미지 QC` 시트에 직접 데이터 입력/업데이트
   - 또는 원본 시트(`1.설명글_한글_raw`, `1.OCR_결과_raw`)에서 데이터 복사

2. **허브에서 동기화**
   - QC 관리 페이지 → CSV 업로드 탭
   - "🔄 동기화" 버튼 클릭
   - Google Sheets의 최신 데이터가 허브에 반영됨

3. **QC 진행**
   - 텍스트 QC / 이미지 QC 탭에서 QC 진행
   - 승인/수정 필요/비대상 상태 변경
   - **자동으로 Google Sheets에 상태가 저장됨**

4. **완료 처리**
   - QC 완료 시 아카이브로 이동
   - **자동으로 `3.QC 완료 / 작가푸시` 시트에 저장됨**

---

## 🔄 CSV 업로드 (선택적, 작은 파일용)

### 개선 사항
- **배치 처리**: 여러 행을 한 번에 Google Sheets에 추가 (1000개씩)
- **비동기 처리**: 메모리 저장 후 백그라운드에서 Google Sheets 저장
- **타임아웃 방지**: 대용량 파일도 안정적으로 처리

### 사용 시나리오
- 소량 데이터 (100개 미만) 빠른 업로드
- 일회성 데이터 추가
- 테스트/개발 목적

### 제한 사항
- 대용량 파일(1000개 이상)은 Google Sheets 직접 사용 권장
- 타임아웃 가능성 (30초 제한)

---

## 🚀 주요 개선 사항

### 1. Google Sheets 동기화 API
```typescript
POST /api/qc/sync
```
- Google Sheets에서 최신 데이터 로드
- 통계 정보 반환 (추가된 항목 수 등)

### 2. 배치 처리 개선
- CSV 업로드 시 여러 행을 한 번에 처리
- Google Sheets API 호출 최소화
- Rate limit 방지를 위한 지연 처리

### 3. 자동 상태 저장
- QC 상태 변경 시 자동으로 Google Sheets 업데이트
- 완료 처리 시 자동으로 아카이브 시트에 저장
- 실패해도 메모리 업데이트는 유지

---

## 📊 데이터 흐름

### 기존 방식 (문제점)
```
CSV 업로드 → 메모리 저장 → 각 행마다 Google Sheets API 호출 → 타임아웃
```

### 개선된 방식
```
방법 1: Google Sheets 직접 사용 (권장)
Google Sheets 업데이트 → 동기화 버튼 → 메모리 로드 → QC 진행 → 자동 저장

방법 2: CSV 업로드 (개선됨)
CSV 업로드 → 메모리 저장 → 배치로 Google Sheets 저장 (1000개씩)
```

---

## 🎨 사용자 인터페이스

### CSV 업로드 탭
1. **Google Sheets 동기화 섹션** (최상단)
   - 파란색 배경으로 강조
   - "🔄 동기화" 버튼
   - 동기화 통계 표시

2. **CSV 업로드 섹션**
   - 텍스트 QC / 이미지 QC 업로드
   - 대용량 파일 경고 메시지
   - Google Sheets 동기화 권장 안내

---

## ⚙️ 기술적 세부사항

### 배치 처리 로직
```typescript
// Google Sheets Service
async appendRows(sheetName: string, rows: any[][]): Promise<void> {
  const BATCH_SIZE = 1000; // 1000개씩 배치 처리
  
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    await this.sheets.spreadsheets.values.append({...});
    
    // Rate limit 방지
    if (i + BATCH_SIZE < rows.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
}
```

### 동기화 엔드포인트
```typescript
POST /api/qc/sync
Response: {
  success: true,
  stats: {
    text: { before: 100, after: 150, added: 50 },
    image: { before: 200, after: 250, added: 50 },
    archive: { before: 50, after: 50, added: 0 }
  }
}
```

---

## 📝 사용 가이드

### 시나리오 1: 대용량 데이터 추가
1. Google Sheets에 직접 데이터 추가 (Excel/Google Sheets에서)
2. 허브에서 "🔄 동기화" 버튼 클릭
3. QC 진행

### 시나리오 2: 소량 데이터 빠른 추가
1. CSV 파일 준비
2. 허브에서 CSV 업로드
3. 자동으로 Google Sheets에 저장됨
4. QC 진행

### 시나리오 3: 기존 데이터 업데이트
1. Google Sheets에서 데이터 수정
2. 허브에서 "🔄 동기화" 버튼 클릭
3. 업데이트된 데이터로 QC 진행

---

## ⚠️ 주의사항

1. **Google Sheets 권한**
   - 서비스 계정에 쓰기 권한이 필요합니다
   - 환경 변수 확인: `GOOGLE_SHEETS_CLIENT_EMAIL`, `GOOGLE_SHEETS_PRIVATE_KEY`

2. **동기화 타이밍**
   - Google Sheets에 데이터 추가 후 동기화 버튼 클릭 필요
   - 자동 동기화는 없음 (수동 동기화)

3. **CSV 업로드 제한**
   - 파일 크기: 10MB 제한
   - 타임아웃: 30초 (대용량 파일은 Google Sheets 사용 권장)

4. **데이터 일관성**
   - 동시에 여러 사용자가 동기화하면 마지막 동기화가 우선
   - QC 상태 변경은 실시간으로 Google Sheets에 저장됨

---

## 🔍 문제 해결

### 동기화가 안 될 때
1. Google Sheets 권한 확인
2. 서버 로그 확인: `[QC] Google Sheets 동기화 시작...`
3. 네트워크 연결 확인

### CSV 업로드 타임아웃
1. 파일 크기 확인 (10MB 이하 권장)
2. Google Sheets 동기화 방식 사용
3. 파일을 여러 개로 분할

### 데이터가 보이지 않을 때
1. "🔄 동기화" 버튼 클릭
2. 페이지 새로고침
3. Google Sheets에서 데이터 확인

---

**마지막 업데이트**: 2025-01-XX
**작성자**: AI Assistant


