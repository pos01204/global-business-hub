# Business Brain 데이터 매핑 점검 및 개선 보고서

**작성일**: 2024-12-11  
**목적**: 고객 분석 페이지와 Business Brain의 데이터 소스 및 계산 방법 통일

---

## 🔍 문제점 분석

### 현재 상황

#### 고객 분석 페이지 (`/api/customer-analytics/conversion`)
- **데이터 소스**: 
  - `users` 시트: 전체 가입자 수 (기간 필터링 없음)
  - `logistics` 시트: 구매자 정보
- **계산 방법**:
  - 전체 가입자 수: `users` 시트의 `CREATED_AT` 필드 기준
  - 구매 전환: `logistics` 시트에서 구매한 고객 중 `users` 시트에 있는 고객
  - 전환율: 전체 가입자 대비 구매 고객 비율

#### Business Brain 신규 유저 유치 분석 (수정 전)
- **데이터 소스**: 
  - `logistics` 시트만 사용
  - `users` 시트 미사용
- **계산 방법**:
  - 가입자 수: 추정치 (방문 수 × 0.4)
  - 방문 수: 추정치 (첫 구매 고객 수 × 3)
  - 첫 구매: `logistics` 시트에서 첫 구매 고객

### 문제점
1. **데이터 소스 불일치**: Business Brain이 `users` 시트를 사용하지 않음
2. **가입자 수 불일치**: Business Brain이 추정치를 사용
3. **기간 필터링 차이**: Business Brain은 기간 필터링, 고객 분석은 전체 데이터

---

## ✅ 개선 사항

### 1. 데이터 소스 통일

#### 수정 전
```typescript
// NewUserAcquisitionAnalyzer.ts
async analyze() {
  const logisticsData = await this.sheetsService.getSheetDataAsJson(SHEET_NAMES.LOGISTICS, true)
  // users 시트 미사용
  const conversionFunnel = analyzeConversionFunnel(logisticsData, periodDays)
}
```

#### 수정 후
```typescript
// NewUserAcquisitionAnalyzer.ts
async analyze() {
  const logisticsData = await this.sheetsService.getSheetDataAsJson(SHEET_NAMES.LOGISTICS, true)
  
  // users 시트 로드 (고객 분석 페이지와 동일)
  let usersData: any[] = []
  try {
    usersData = await this.sheetsService.getSheetDataAsJson(SHEET_NAMES.USERS, false)
  } catch (e) {
    console.warn('[NewUserAcquisitionAnalyzer] Users data not available:', e)
  }
  
  const conversionFunnel = analyzeConversionFunnel(logisticsData, usersData, periodDays, startDate, endDate)
}
```

### 2. 가입자 수 계산 개선

#### 수정 전
```typescript
// 추정치 사용
const estimatedVisits = newUsersInPeriod.length * 3
const signups = Math.round(estimatedVisits * 0.4) // 추정
```

#### 수정 후
```typescript
// users 시트에서 실제 가입자 수 사용
const userCreatedMap = new Map<string, Date>()
usersData.forEach((user: any) => {
  const userId = String(user.ID || '')
  if (!userId) return
  const createdAt = new Date(user.CREATED_AT)
  if (!isNaN(createdAt.getTime())) {
    userCreatedMap.set(userId, createdAt)
  }
})

// 기간 내 가입자 필터링
const signupsInPeriod = Array.from(userCreatedMap.entries())
  .filter(([_, createdAt]) => createdAt >= startDate && createdAt <= endDate)

const signups = signupsInPeriod.length // 실제 데이터
```

### 3. 전환율 퍼널 개선

#### 수정 전
- 방문: 추정치 (첫 구매 고객 × 3)
- 가입: 추정치 (방문 × 0.4)
- 첫 구매: 실제 데이터

#### 수정 후
- 방문: 추정치 (가입자 / 0.4) - 실제 방문 데이터 없음
- 가입: **실제 데이터** (`users` 시트의 `CREATED_AT` 기준)
- 첫 구매: 실제 데이터 (`logistics` 시트 기준, 가입일이 기간 내인 고객)

### 4. 채널별 성과 분석 개선

#### 수정 전
- 채널별 신규 유저: `logistics` 시트만 사용
- 전환율: 랜덤 추정치 (30-50%)

#### 수정 후
- 채널별 신규 유저: `logistics` + `users` 시트 연동
- 전환율: `users` 시트 기반 가입자 수 사용
- 첫 구매 전환율: 실제 데이터 기반 (첫 구매 고객 / 가입자)

---

## 📊 데이터 매핑 상세

### 시트별 필드 매핑

#### `users` 시트
- **필드**: `ID` (user_id), `CREATED_AT` (가입일)
- **용도**: 
  - 전체 가입자 수 계산
  - 기간 내 가입자 필터링
  - 가입 → 첫 구매 전환율 계산

#### `logistics` 시트
- **필드**: `user_id`, `order_created`, `Total GMV`, `channel` (또는 `source`)
- **용도**:
  - 첫 구매 고객 추적
  - 채널별 성과 분석
  - 구매액 및 주문 수 집계

### 계산 로직

#### 1. 전체 가입자 수
```typescript
// 고객 분석 페이지와 동일
const totalSignups = userCreatedMap.size // users 시트 전체
```

#### 2. 기간 내 가입자 수
```typescript
// Business Brain 분석용
const signupsInPeriod = Array.from(userCreatedMap.entries())
  .filter(([_, createdAt]) => createdAt >= startDate && createdAt <= endDate)
```

#### 3. 기간 내 첫 구매 고객
```typescript
// 가입일이 기간 내이고, 첫 구매일도 기간 내인 고객
const firstPurchasesInPeriod = Array.from(customerFirstPurchase.entries())
  .filter(([customerId, firstPurchaseDate]) => {
    const userCreatedAt = userCreatedMap.get(customerId)
    return userCreatedAt && 
           userCreatedAt >= startDate && 
           userCreatedAt <= endDate &&
           firstPurchaseDate >= startDate &&
           firstPurchaseDate <= endDate
  })
```

#### 4. 방문 수 (추정치)
```typescript
// 실제 방문 데이터가 없으므로 추정치 사용
// 가입 전환율을 약 40%로 가정
const estimatedVisits = signups > 0 ? Math.round(signups / 0.4) : 0
```

---

## 🔄 기간 필터링 정책

### 고객 분석 페이지
- **전체 데이터 기준**: 기간 필터링 없음
- **목적**: 전체 비즈니스 현황 파악

### Business Brain
- **기간 필터링 적용**: 선택한 기간(7d, 30d, 90d, 180d, 365d) 내 데이터만 분석
- **목적**: 특정 기간의 성과 분석 및 트렌드 파악

### 통일 방안
- **데이터 소스**: 동일하게 `users` 시트와 `logistics` 시트 사용
- **계산 방법**: 동일한 로직 사용
- **기간 필터링**: Business Brain은 기간 필터링 유지 (기능상 필요)

---

## ✅ 검증 체크리스트

### 데이터 소스
- [x] `users` 시트 로드 추가
- [x] `logistics` 시트와 `users` 시트 연동
- [x] 에러 처리 (users 시트 없을 경우)

### 계산 로직
- [x] 가입자 수: `users` 시트의 `CREATED_AT` 기준
- [x] 첫 구매 고객: `logistics` 시트 + `users` 시트 매칭
- [x] 전환율: 실제 데이터 기반 계산
- [x] 방문 수: 추정치 (실제 데이터 없음) - 명확히 표시

### 신뢰도 정보
- [x] 가입자 수: 실제 데이터 (`users` 시트)
- [x] 첫 구매: 실제 데이터 (`logistics` 시트)
- [x] 방문 수: 추정치 - `dataSource: 'estimated'` 표시

---

## 📝 주의사항

### 1. 방문 데이터 부재
- 실제 방문 데이터가 없으므로 추정치 사용
- UI에서 명확히 "추정치"로 표시
- 신뢰도 배지에 "추정치" 표시

### 2. 기간 필터링 차이
- 고객 분석 페이지: 전체 데이터
- Business Brain: 기간 필터링 적용
- 이는 기능상 의도된 차이 (Business Brain은 기간별 분석이 목적)

### 3. 채널 정보 부재
- `logistics` 시트에 `channel` 또는 `source` 필드가 없을 수 있음
- 기본값으로 'organic' 사용
- 향후 마케팅 데이터 연동 시 개선 필요

---

## 🚀 향후 개선 사항

### 1. 방문 데이터 연동
- Google Analytics 또는 다른 분석 도구와 연동
- 실제 방문 데이터 사용

### 2. 채널 정보 보강
- 마케팅 데이터 시트 추가
- UTM 파라미터 추적

### 3. 데이터 품질 모니터링
- `users` 시트와 `logistics` 시트 간 일관성 검증
- 누락된 데이터 자동 감지

---

**작성 완료일**: 2024-12-11  
**검증 상태**: 코드 수정 완료, 테스트 필요


