# TypeScript 타입 안전성 가이드

## 📋 개요

이 문서는 Chart.js의 tooltip callback에서 발생할 수 있는 TypeScript 타입 오류를 방지하기 위한 가이드입니다.

## ⚠️ 문제점

Chart.js의 `context.parsed.y` 또는 `context.parsed.x`는 `number | null` 타입일 수 있습니다. 이를 `number`만 받는 함수에 직접 전달하면 TypeScript 오류가 발생합니다.

### 오류 예시
```typescript
// ❌ 잘못된 코드
const formatCurrency = (value: number) => {
  return `₩${Math.round(value).toLocaleString()}`
}

// tooltip callback에서
label: function (context) {
  return `매출: ${formatCurrency(context.parsed.y)}` // 오류: number | null을 number에 할당 불가
}
```

## ✅ 해결 방법

### 1. formatCurrency 함수 수정

```typescript
// ✅ 올바른 코드
const formatCurrency = (value: number | null | undefined): string => {
  if (value === null || value === undefined || isNaN(value)) {
    return '₩0'
  }
  return `₩${Math.round(value).toLocaleString()}`
}
```

### 2. tooltip callback에서 null 체크

```typescript
// ✅ 올바른 코드
tooltip: {
  callbacks: {
    label: function (context) {
      const value = context.parsed.y
      if (value === null || value === undefined) return '매출: N/A'
      return `매출: ${formatCurrency(value)}`
    },
  },
}
```

### 3. 간단한 값 표시의 경우

```typescript
// ✅ 올바른 코드
tooltip: {
  callbacks: {
    label: function (context) {
      const value = context.parsed.y
      if (value === null || value === undefined) return '0건'
      return `${value}건`
    },
  },
}
```

### 4. 계산이 필요한 경우

```typescript
// ✅ 올바른 코드
tooltip: {
  callbacks: {
    label: function (context) {
      const parsed = context.parsed
      if (parsed === null || parsed === undefined) {
        return `${context.label}: 0건 (0%)`
      }
      const total = context.dataset.data.reduce((a: any, b: any) => (a || 0) + (b || 0), 0)
      const percentage = total > 0 ? ((parsed / total) * 100).toFixed(1) : '0'
      return `${context.label}: ${parsed}건 (${percentage}%)`
    },
  },
}
```

## 🔍 체크리스트

새로운 차트를 추가하거나 tooltip callback을 작성할 때 다음을 확인하세요:

- [ ] `formatCurrency` 함수에 `number | null | undefined` 타입 허용
- [ ] `context.parsed.y` 또는 `context.parsed.x` 사용 시 null 체크
- [ ] 계산 전에 null/undefined 확인
- [ ] reduce 함수 사용 시 null 값 처리 (`(a || 0) + (b || 0)`)
- [ ] 나눗셈 전에 0 체크

## 📝 패턴 모음

### 패턴 1: formatCurrency 사용
```typescript
label: function (context) {
  const value = context.parsed.y
  if (value === null || value === undefined) return '매출: N/A'
  return `매출: ${formatCurrency(value)}`
}
```

### 패턴 2: 숫자 직접 표시
```typescript
label: function (context) {
  const value = context.parsed.y
  if (value === null || value === undefined) return '0건'
  return `${value}건`
}
```

### 패턴 3: 비율 계산
```typescript
label: function (context) {
  const parsed = context.parsed
  if (parsed === null || parsed === undefined) {
    return `${context.label}: 0건 (0%)`
  }
  const total = context.dataset.data.reduce((a: any, b: any) => (a || 0) + (b || 0), 0)
  const percentage = total > 0 ? ((parsed / total) * 100).toFixed(1) : '0'
  return `${context.label}: ${parsed}건 (${percentage}%)`
}
```

### 패턴 4: 복합 축 (yGmv, yOrders 등)
```typescript
label: function (context) {
  if (context.parsed.y === null) return ''
  if (context.dataset.yAxisID === 'yGmv') {
    return `매출: ${formatCurrency(context.parsed.y)}`
  } else {
    return `주문: ${context.parsed.y}건`
  }
}
```

## 🚨 주의사항

1. **모든 tooltip callback에 null 체크 필수**
   - Chart.js는 데이터가 없을 때 `null`을 반환할 수 있습니다.

2. **reduce 함수 사용 시 주의**
   ```typescript
   // ❌ 잘못된 코드
   const total = context.dataset.data.reduce((a, b) => a + b, 0)
   
   // ✅ 올바른 코드
   const total = context.dataset.data.reduce((a: any, b: any) => (a || 0) + (b || 0), 0)
   ```

3. **나눗셈 전 0 체크**
   ```typescript
   // ❌ 잘못된 코드
   const percentage = ((parsed / total) * 100).toFixed(1)
   
   // ✅ 올바른 코드
   const percentage = total > 0 ? ((parsed / total) * 100).toFixed(1) : '0'
   ```

## 📚 참고 파일

- `frontend/app/analytics/page.tsx`: 모든 차트 tooltip callback 예시
- `frontend/app/dashboard/page.tsx`: formatCurrency 함수 정의

## 🔄 업데이트 이력

- 2025-01-XX: 초기 작성 - formatCurrency 및 tooltip callback 타입 안전성 강화

