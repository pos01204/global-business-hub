# 작가 메일 주소 통합 가이드

## 📧 작가 메일 주소 데이터 구조

### Google Sheets 컬럼
- **시트**: `artists`
- **컬럼**: `mail` (T열)
- **데이터 형식**: 이메일 주소 문자열

---

## 🔧 구현된 기능

### 1. 작가 정보 로드 시 메일 주소 포함
- **위치**: `backend/src/routes/qc.ts` - `loadArtists()`
- **기능**: 작가 정보 로드 시 `mail` 컬럼을 함께 읽어 메모리에 저장
- **지원 컬럼명**: `mail`, `email`, `artist_email`, `artist_email` (다양한 변형 지원)

### 2. 작가 정보 조회 헬퍼 함수
- **함수명**: `getArtistEmail()`, `getArtistInfo()`
- **기능**: 작가 ID로 메일 주소 조회
- **반환값**: 메일 주소 문자열 또는 `undefined`

### 3. QC 작가 알람 명단
- **위치**: `backend/src/routes/qc.ts` - `/api/qc/artists/notifications`
- **기능**: 작가 알람 명단에 메일 주소 포함
- **프론트엔드**: `frontend/app/qc/components/ArtistsNotificationTab.tsx`
  - 작가 정보에 메일 주소 표시
  - 메일 주소가 없을 경우 "메일 주소 없음" 표시

### 4. 작가 알람 발송 API
- **위치**: `backend/src/routes/qc.ts` - `/api/qc/artists/notify`
- **기능**: 알람 발송 시 작가 메일 주소 포함
- **응답**: `artistEmail` 필드 추가

### 5. 작가별 주문 내역 API
- **위치**: `backend/src/routes/artist.ts` - `/api/artist/:artistName/orders`
- **기능**: 작가별 주문 내역 조회 시 작가 정보(메일 포함) 반환
- **응답**: `artistInfo` 객체에 `email` 필드 포함

---

## 📋 활용 가능한 영역

### ✅ 구현 완료

1. **QC 관리 - 작가 알람 명단**
   - 작가 정보에 메일 주소 표시
   - 알람 발송 시 메일 주소 포함

2. **작가별 주문 내역 조회**
   - 작가 정보에 메일 주소 포함

### 🔄 향후 활용 가능한 영역

1. **주문 상세 정보**
   - 작가 정보 표시 시 메일 주소 포함
   - 작가에게 직접 연락 가능한 링크 제공

2. **물류 추적**
   - 작가별 물류 현황에 메일 주소 표시
   - 작가에게 물류 관련 알림 발송

3. **대시보드**
   - 작가 관련 통계에 메일 주소 표시
   - 작가별 성과 리포트 이메일 발송

4. **통합 검색**
   - 작가 검색 결과에 메일 주소 표시
   - 작가 정보 상세 모달에 메일 주소 포함

5. **성과 분석**
   - 작가별 성과 비교에 메일 주소 표시
   - 작가에게 성과 리포트 이메일 발송

6. **미입고 관리**
   - 작가별 미입고 현황에 메일 주소 표시
   - 작가에게 미입고 알림 이메일 발송

---

## 💻 코드 사용 예시

### 백엔드에서 작가 메일 주소 조회

```typescript
// 작가 메일 주소만 조회
const email = getArtistEmail(artistId);

// 작가 정보 전체 조회 (이름 + 메일)
const artistInfo = getArtistInfo(artistId);
// 반환값: { name: string, email?: string }
```

### 프론트엔드에서 작가 메일 표시

```tsx
{artist.artistEmail && (
  <p className="text-sm text-blue-600">
    📧 {artist.artistEmail}
  </p>
)}
{!artist.artistEmail && (
  <p className="text-sm text-gray-400 italic">메일 주소 없음</p>
)}
```

---

## 🔄 API 응답 형식

### 작가 알람 명단 조회
```json
{
  "artists": [
    {
      "artistId": "123",
      "artistName": "작가명",
      "artistEmail": "artist@example.com",  // 새로 추가됨
      "textQCItems": 5,
      "imageQCItems": 3,
      "items": [...]
    }
  ]
}
```

### 작가 알람 발송 응답
```json
{
  "success": true,
  "artistId": "123",
  "artistName": "작가명",
  "artistEmail": "artist@example.com",  // 새로 추가됨
  "sentItems": [...],
  "message": "작가명 작가에게 5개 항목에 대한 알람이 발송되었습니다. (메일: artist@example.com)"
}
```

### 작가별 주문 내역 조회
```json
{
  "orders": [...],
  "artistInfo": {
    "name": "작가명",
    "email": "artist@example.com",  // 새로 추가됨
    "artistId": "123"
  }
}
```

---

## 📝 향후 개선 사항

### 1. 이메일 발송 기능 구현
- **현재**: 알람 발송은 로그만 기록
- **개선**: 실제 이메일 발송 기능 추가
  - Gmail API 또는 SendGrid 연동
  - 템플릿 기반 이메일 발송
  - QC 수정 필요 항목 상세 정보 포함

### 2. 작가 정보 상세 페이지
- 작가 프로필 페이지 생성
- 작가 메일 주소 표시 및 복사 기능
- 작가에게 직접 이메일 보내기 링크

### 3. 작가 통신 이력 관리
- 작가에게 발송한 이메일 이력 저장
- 이메일 발송 상태 추적
- 이메일 발송 템플릿 관리

### 4. 알림 설정
- 작가별 알림 설정 (이메일 수신 여부)
- 알림 유형별 설정 (QC, 물류, 성과 등)
- 알림 빈도 설정

---

## 🔍 데이터 확인 방법

### Google Sheets에서 확인
1. `artists` 시트 열기
2. T열(`mail`) 확인
3. 작가별 메일 주소 확인

### 허브에서 확인
1. QC 관리 → 작가 알람 명단
2. 각 작가 카드에서 메일 주소 확인
3. 메일 주소가 없으면 "메일 주소 없음" 표시

---

## ⚠️ 주의사항

1. **메일 주소 형식**
   - 유효한 이메일 형식인지 확인 필요
   - 빈 값 또는 잘못된 형식 처리

2. **개인정보 보호**
   - 메일 주소는 민감한 정보이므로 접근 권한 관리 필요
   - 로그에 메일 주소가 노출되지 않도록 주의

3. **데이터 동기화**
   - 작가 정보는 서버 시작 시 로드됨
   - 최신 정보 반영을 위해 동기화 필요

---

**마지막 업데이트**: 2025-01-XX
**작성자**: AI Assistant



