# 실시간 물류 관제 센터 페이지 개선 계획서

## 1. 개요

### 1.1 목적
실시간 물류 관제 센터 페이지는 5단계 물류 파이프라인 현황을 모니터링하는 핵심 페이지입니다. 현재 구조와 흐름이 우수하여 대규모 변경보다는 **세심한 디테일 개선**을 통해 시각적 완성도와 사용자 경험을 한층 높이는 것을 목표로 합니다.

### 1.2 현재 상태 분석

#### 강점 (유지해야 할 요소)
- ✅ **5단계 파이프라인 구조**: 명확한 단계별 분류
- ✅ **파이프라인 흐름도**: 전체 흐름을 한눈에 파악
- ✅ **위험도 게이지**: 각 단계별 위험 수준 시각화
- ✅ **위험 주문 목록**: 긴급 주문 빠른 확인
- ✅ **합포장 이슈 분석**: 복합 주문 관리
- ✅ **범례 및 안내**: 기준일 설명

#### 개선 필요 사항 (세심한 개선)
- ⚠️ **다크 모드 미지원**: 대부분의 색상이 라이트 모드 전용
- ⚠️ **KPI 카드 스타일**: 다른 페이지와 스타일 불일치
- ⚠️ **파이프라인 흐름도**: 시각적 강조 부족, 정적인 느낌
- ⚠️ **파이프라인 카드**: 호버 효과 미흡, 정보 계층 불명확
- ⚠️ **위험 주문 목록**: 더 명확한 시각적 구분 필요
- ⚠️ **범례 영역**: 스타일 개선 여지
- ⚠️ **애니메이션**: 데이터 변화 시 애니메이션 부재

### 1.3 개선 목표
- **시각적 일관성**: 미입고 관리, 물류 추적 페이지와 디자인 통일
- **다크 모드 완벽 지원**: 모든 컴포넌트 다크 모드 대응
- **미세한 UX 개선**: 호버 효과, 애니메이션, 정보 계층
- **가독성 향상**: 핵심 지표의 시각적 강조

---

## 2. 디자인 개선안

### 2.1 전체 레이아웃 (유지)

현재 구조를 유지하되, 각 섹션의 스타일을 개선합니다.

```
┌─────────────────────────────────┐
│ 헤더 (idus 브랜드 스타일)         │ ← 다크 모드 지원 추가
├─────────────────────────────────┤
│ 핵심 지표 요약 (4개 카드)        │ ← 스타일 개선
├─────────────────────────────────┤
│ 합포장 이슈 패널 (확장 가능)     │ ← 스타일 개선
├─────────────────────────────────┤
│ 파이프라인 흐름도               │ ← 시각적 개선
├─────────────────────────────────┤
│ 파이프라인 상세 카드 (5개)       │ ← 호버 효과, 스타일 개선
├─────────────────────────────────┤
│ 범례 및 안내                    │ ← 스타일 개선
└─────────────────────────────────┘
```

---

## 3. 상세 개선안

### 3.1 헤더 영역 (미세 조정)

#### 3.1.1 현재 상태
- 기본적인 idus 브랜드 스타일 적용
- 다크 모드 미지원

#### 3.1.2 개선 사항
```tsx
// 다크 모드 지원 추가
<div className="relative bg-gradient-to-r from-idus-500 to-idus-600 dark:from-orange-600 dark:to-orange-700 rounded-2xl p-4 lg:p-6 mb-6 overflow-hidden shadow-lg dark:shadow-none">
  <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 dark:bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
  <div className="flex items-center gap-4">
    <div className="w-12 h-12 lg:w-14 lg:h-14 bg-white/20 dark:bg-white/10 backdrop-blur rounded-xl flex items-center justify-center shadow-lg dark:shadow-none">
      <Icon icon={Activity} size="xl" className="text-white" />
    </div>
    <div>
      <h1 className="text-xl lg:text-2xl font-extrabold text-white tracking-tight">실시간 물류 관제 센터</h1>
      <p className="text-idus-100 dark:text-orange-200/80 text-xs lg:text-sm font-medium">
        주문 단위로 5단계 물류 파이프라인 현황을 모니터링합니다
      </p>
    </div>
  </div>
</div>
```

### 3.2 핵심 지표 요약 (스타일 개선)

#### 3.2.1 현재 상태
- 기본 `.card` 클래스 사용
- 일관성 없는 색상 구분

#### 3.2.2 개선 방안

**A. 통합 KPI 카드 섹션**
```tsx
<div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 lg:p-6 mb-6 shadow-sm">
  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
    {/* 처리중 주문 */}
    <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-8 h-8 bg-slate-200 dark:bg-slate-700 rounded-lg flex items-center justify-center">
          <Icon icon={FileText} size="sm" className="text-slate-600 dark:text-slate-400" />
        </div>
        <p className="text-xs lg:text-sm text-slate-500 dark:text-slate-400 font-medium">처리중 주문</p>
      </div>
      <p className="text-xl lg:text-2xl font-bold text-slate-900 dark:text-slate-100">
        {totalOrders} <span className="text-sm font-normal text-slate-500 dark:text-slate-400">건</span>
      </p>
      <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">총 {totalItems}개 작품</p>
    </div>
    
    {/* 위험 주문 - 강조 색상 */}
    <div className={cn(
      'rounded-xl p-4 border',
      totalCriticals > 0 
        ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' 
        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
    )}>
      <div className="flex items-center gap-2 mb-2">
        <div className={cn(
          'w-8 h-8 rounded-lg flex items-center justify-center',
          totalCriticals > 0 
            ? 'bg-red-200 dark:bg-red-900/50' 
            : 'bg-slate-200 dark:bg-slate-700'
        )}>
          <Icon icon={AlertTriangle} size="sm" className={totalCriticals > 0 ? 'text-red-600 dark:text-red-400' : 'text-slate-600 dark:text-slate-400'} />
        </div>
        <p className={cn(
          'text-xs lg:text-sm font-medium',
          totalCriticals > 0 ? 'text-red-600 dark:text-red-400' : 'text-slate-500 dark:text-slate-400'
        )}>위험 주문</p>
      </div>
      <p className={cn(
        'text-xl lg:text-2xl font-bold',
        totalCriticals > 0 ? 'text-red-700 dark:text-red-300' : 'text-slate-900 dark:text-slate-100'
      )}>
        {totalCriticals} <span className="text-sm font-normal">건</span>
      </p>
      <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">기준일 초과</p>
    </div>
    
    {/* 최장 지연 */}
    <div className={cn(
      'rounded-xl p-4 border',
      maxDelayDays >= 14 
        ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800' 
        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
    )}>
      {/* ... 유사한 패턴 */}
    </div>
    
    {/* 합포장 이슈 */}
    <div className={cn(
      'rounded-xl p-4 border cursor-pointer transition-all hover:shadow-md',
      bundleAnalysis?.partiallyReceivedCount > 0 
        ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 hover:border-amber-300 dark:hover:border-amber-700' 
        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
    )}>
      {/* ... */}
    </div>
  </div>
</div>
```

### 3.3 파이프라인 흐름도 (시각적 개선)

#### 3.3.1 현재 상태
- 단순한 가로 배치
- 화살표가 텍스트로 표시 (`→`)
- 정적인 느낌

#### 3.3.2 개선 방안

**A. 향상된 파이프라인 흐름도**
```tsx
<div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 mb-6 shadow-sm">
  <div className="flex items-center gap-2 mb-4">
    <Icon icon={GitBranch} size="sm" className="text-slate-500 dark:text-slate-400" />
    <h2 className="font-semibold text-slate-700 dark:text-slate-300">물류 파이프라인 흐름</h2>
  </div>
  
  <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
    {stages.map(([stageKey, stage], index) => {
      const meta = STAGE_META[stageKey]
      const hasIssue = stage.criticalCount > 0
      
      return (
        <div key={stageKey} className="flex items-center">
          {/* 단계 카드 */}
          <div className={cn(
            'py-3 px-4 rounded-xl whitespace-nowrap flex items-center gap-3 transition-all',
            'hover:shadow-md hover:-translate-y-0.5',
            hasIssue 
              ? 'bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800' 
              : 'bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700'
          )}>
            <div className={cn(
              'w-10 h-10 rounded-lg flex items-center justify-center',
              hasIssue 
                ? 'bg-red-100 dark:bg-red-900/50' 
                : 'bg-slate-100 dark:bg-slate-700'
            )}>
              <Icon 
                icon={meta.icon} 
                size="md" 
                className={hasIssue ? 'text-red-600 dark:text-red-400' : 'text-slate-600 dark:text-slate-400'} 
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className={cn(
                  'text-lg font-bold',
                  hasIssue ? 'text-red-700 dark:text-red-300' : 'text-slate-900 dark:text-slate-100'
                )}>
                  {stage.orderCount}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">주문</span>
                {hasIssue && (
                  <span className="text-xs bg-red-200 dark:bg-red-900/50 text-red-700 dark:text-red-400 px-1.5 py-0.5 rounded-full flex items-center gap-0.5 font-medium">
                    <Icon icon={AlertTriangle} size="xs" />
                    {stage.criticalCount}
                  </span>
                )}
              </div>
              <span className="text-xs text-slate-400 dark:text-slate-500">{stage.itemCount}개 작품</span>
            </div>
          </div>
          
          {/* 화살표 - SVG 아이콘으로 개선 */}
          {index < stages.length - 1 && (
            <div className="w-8 flex items-center justify-center">
              <Icon icon={ChevronRight} size="md" className="text-slate-400 dark:text-slate-500" />
            </div>
          )}
        </div>
      )
    })}
  </div>
</div>
```

**B. 파이프라인 흐름 애니메이션 (선택적)**
```css
/* 데이터 흐름 표시 애니메이션 */
@keyframes flow {
  0% { opacity: 0.3; }
  50% { opacity: 1; }
  100% { opacity: 0.3; }
}

.flow-indicator {
  animation: flow 2s ease-in-out infinite;
}
```

### 3.4 파이프라인 상세 카드 (호버 효과, 스타일 개선)

#### 3.4.1 현재 상태
- 기본 `.card` 클래스 사용
- 호버 효과 미흡
- 다크 모드 미지원

#### 3.4.2 개선 방안

**A. 향상된 파이프라인 카드**
```tsx
<div
  key={stageKey}
  className={cn(
    'bg-white dark:bg-slate-900 rounded-xl border-2 p-5 transition-all',
    'hover:shadow-lg hover:-translate-y-1',
    stage.criticalCount > 0 
      ? 'border-l-4 border-l-red-500 border-red-200 dark:border-red-800/50' 
      : 'border-l-4 border-l-green-500 border-slate-200 dark:border-slate-800'
  )}
>
  {/* 헤더 - 아이콘 강조 */}
  <div className="flex items-start gap-3 mb-4">
    <div className={cn(
      'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0',
      stage.criticalCount > 0 
        ? 'bg-red-100 dark:bg-red-900/30' 
        : `bg-${meta.color}-100 dark:bg-${meta.color}-900/30`
    )}>
      <Icon icon={meta.icon} size="lg" className={cn(
        stage.criticalCount > 0 
          ? 'text-red-600 dark:text-red-400' 
          : `text-${meta.color}-600 dark:text-${meta.color}-400`
      )} />
    </div>
    <div className="flex-1 min-w-0">
      <h3 className="font-bold text-slate-900 dark:text-slate-100">{stage.title}</h3>
      <p className="text-xs mt-0.5">
        {stage.criticalCount > 0 ? (
          <span className="text-red-600 dark:text-red-400 font-medium flex items-center gap-1">
            <Icon icon={AlertTriangle} size="xs" />
            {stage.criticalCount}건 {meta.criticalDays}일+ 지연
          </span>
        ) : (
          <span className="text-green-600 dark:text-green-400 flex items-center gap-1">
            <Icon icon={CheckCircle} size="xs" />
            정상 운영
          </span>
        )}
      </p>
    </div>
  </div>

  {/* 핵심 메트릭 - 숫자 강조 */}
  <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 mb-4">
    <div className="text-center">
      <div className="text-4xl font-extrabold text-slate-900 dark:text-slate-100">{stage.orderCount}</div>
      <div className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-1">주문</div>
    </div>
    <div className="text-center text-xs text-slate-400 dark:text-slate-500 mt-1">
      (작품 {stage.itemCount}개)
    </div>
  </div>

  {/* 위험도 게이지 - 개선 */}
  {stage.orderCount > 0 && (
    <div className="mb-4">
      <div className="flex justify-between text-xs mb-1.5">
        <span className="font-medium text-slate-600 dark:text-slate-400">위험도</span>
        <span className={cn(
          'font-bold',
          criticalPercentage > 50 ? 'text-red-600 dark:text-red-400' 
            : criticalPercentage > 20 ? 'text-orange-600 dark:text-orange-400' 
            : 'text-green-600 dark:text-green-400'
        )}>
          {Math.round(criticalPercentage)}%
        </span>
      </div>
      <div className="h-2.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
        <div
          className={cn(
            'h-full transition-all duration-700 ease-out rounded-full',
            criticalPercentage > 50 ? 'bg-gradient-to-r from-red-400 to-red-600' 
              : criticalPercentage > 20 ? 'bg-gradient-to-r from-orange-300 to-orange-500' 
              : 'bg-gradient-to-r from-green-400 to-green-600'
          )}
          style={{ width: `${Math.max(criticalPercentage, 3)}%` }}
        />
      </div>
    </div>
  )}

  {/* 위험 주문 목록 - 개선 */}
  {stage.criticals.length > 0 && (
    <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
      <div className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2 flex items-center gap-1">
        <Icon icon={AlertTriangle} size="xs" className="text-red-500" />
        위험 주문 목록
      </div>
      <ul className={cn('space-y-2', isExpanded ? 'max-h-48 overflow-y-auto' : '')}>
        {stage.criticals.slice(0, isExpanded ? undefined : 3).map((critical, idx) => (
          <li key={idx} className="bg-red-50 dark:bg-red-900/20 rounded-lg p-2.5 border border-red-200 dark:border-red-800/50">
            <div className="flex items-center justify-between">
              <button
                onClick={() => openOrderDetailModal(critical.orderCode)}
                className="text-xs text-slate-700 dark:text-slate-300 hover:text-idus-500 dark:hover:text-idus-400 hover:underline truncate flex-1 text-left font-medium"
                title={critical.orderCode}
              >
                {critical.orderCode.length > 18 
                  ? critical.orderCode.slice(0, 18) + '...'
                  : critical.orderCode}
              </button>
              <span className="ml-2 px-2 py-0.5 bg-red-200 dark:bg-red-900/50 text-red-700 dark:text-red-300 text-xs font-bold rounded-full">
                {critical.days}일
              </span>
            </div>
            {critical.detail && (
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-1.5 flex items-center gap-1">
                <Icon icon={AlertTriangle} size="xs" />
                {critical.detail}
              </p>
            )}
          </li>
        ))}
      </ul>
      {showMoreButton && (
        <button
          onClick={() => toggleCriticalList(stageKey)}
          className="w-full mt-2 py-2 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors font-medium"
        >
          {isExpanded ? '접기 ▲' : `+${stage.criticals.length - 3}건 더보기 ▼`}
        </button>
      )}
    </div>
  )}

  {/* 푸터 - 액션 버튼 개선 */}
  <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
    {stage.criticalCount > 0 && (
      <span className="text-xs text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1">
        <Icon icon={Zap} size="xs" />
        {meta.action}
      </span>
    )}
    <Link 
      href={meta.link} 
      className="text-xs text-idus-500 hover:text-idus-600 dark:text-idus-400 dark:hover:text-idus-300 font-semibold flex items-center gap-1 ml-auto"
    >
      상세보기
      <Icon icon={ChevronRight} size="xs" />
    </Link>
  </div>
</div>
```

### 3.5 합포장 이슈 패널 (스타일 개선)

#### 3.5.1 현재 상태
- 기본적인 스타일
- 다크 모드 미지원

#### 3.5.2 개선 방안
```tsx
{showBundleAnalysis && bundleAnalysis && bundleAnalysis.partiallyReceivedOrders.length > 0 && (
  <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl border-2 border-amber-200 dark:border-amber-800 p-5 mb-6 shadow-sm">
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-amber-200 dark:bg-amber-900/50 rounded-xl flex items-center justify-center">
          <Icon icon={Package} size="md" className="text-amber-600 dark:text-amber-400" />
        </div>
        <div>
          <h3 className="font-bold text-amber-800 dark:text-amber-200">합포장 일부입고 주문</h3>
          <p className="text-xs text-amber-600 dark:text-amber-400">미입고 작품으로 인해 전체 주문 출고가 지연되고 있습니다</p>
        </div>
      </div>
      <button 
        onClick={() => setShowBundleAnalysis(false)}
        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-amber-200 dark:hover:bg-amber-900/50 transition-colors"
      >
        <Icon icon={X} size="sm" className="text-amber-600 dark:text-amber-400" />
      </button>
    </div>
    
    <div className="space-y-2">
      {bundleAnalysis.partiallyReceivedOrders.map((order, idx) => (
        <div 
          key={idx} 
          className="flex items-center justify-between bg-white dark:bg-slate-900 rounded-xl p-4 border border-amber-200 dark:border-amber-800/50 hover:border-amber-300 dark:hover:border-amber-700 transition-all hover:shadow-md"
        >
          <div className="flex-1">
            <button
              onClick={() => openOrderDetailModal(order.orderCode)}
              className="text-sm font-bold text-amber-800 dark:text-amber-200 hover:underline"
            >
              {order.orderCode}
            </button>
            <div className="flex gap-3 mt-2 text-xs flex-wrap">
              <span className="text-slate-600 dark:text-slate-400">총 {order.totalItems}개 작품</span>
              <span className="text-red-600 dark:text-red-400 font-medium flex items-center gap-1 bg-red-50 dark:bg-red-900/30 px-2 py-0.5 rounded-full">
                <Icon icon={Package} size="xs" />
                미입고 {order.unreceivedItems}개
              </span>
              {order.inspectedItems > 0 && (
                <span className="text-green-600 dark:text-green-400 flex items-center gap-1 bg-green-50 dark:bg-green-900/30 px-2 py-0.5 rounded-full">
                  <Icon icon={CheckCircle} size="xs" />
                  검수완료 {order.inspectedItems}개
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-400 px-3 py-1.5 rounded-lg font-semibold">
              작가 연락 필요
            </span>
            <button
              onClick={() => openOrderDetailModal(order.orderCode)}
              className="text-xs text-idus-500 hover:text-idus-600 dark:text-idus-400 font-semibold flex items-center gap-1"
            >
              상세보기 <Icon icon={ChevronRight} size="xs" />
            </button>
          </div>
        </div>
      ))}
    </div>
  </div>
)}
```

### 3.6 범례 및 안내 (스타일 개선)

#### 3.6.1 현재 상태
- 기본적인 스타일
- 다크 모드 미지원

#### 3.6.2 개선 방안
```tsx
<div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 p-5 mt-6">
  <div className="flex items-center gap-2 mb-4">
    <div className="w-8 h-8 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex items-center justify-center">
      <Icon icon={Lightbulb} size="sm" className="text-amber-500" />
    </div>
    <h3 className="font-bold text-slate-700 dark:text-slate-300">물류 관제 센터 안내</h3>
  </div>
  
  <div className="grid md:grid-cols-2 gap-6">
    {/* 상태별 위험 기준 */}
    <div>
      <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-3 flex items-center gap-2">
        <Icon icon={BarChart3} size="sm" className="text-slate-500" />
        상태별 위험 기준
      </p>
      <div className="space-y-2">
        {[
          { icon: Package, label: '미입고', days: 7, color: 'amber' },
          { icon: Truck, label: '국내배송', days: 5, color: 'blue' },
          { icon: Search, label: '검수대기', days: 2, color: 'purple' },
          { icon: CheckCircle, label: '포장대기', days: 3, color: 'green' },
          { icon: Activity, label: '국제배송', days: 14, color: 'indigo' },
        ].map((item, idx) => (
          <div key={idx} className="flex items-center gap-3 text-xs">
            <div className={`w-7 h-7 bg-${item.color}-100 dark:bg-${item.color}-900/30 rounded-lg flex items-center justify-center`}>
              <Icon icon={item.icon} size="xs" className={`text-${item.color}-600 dark:text-${item.color}-400`} />
            </div>
            <span className="text-slate-600 dark:text-slate-400">
              {item.label}: 결제 후 <strong className="text-slate-800 dark:text-slate-200">{item.days}일+</strong> 경과 시 위험
            </span>
          </div>
        ))}
      </div>
    </div>
    
    {/* 처리 로직 */}
    <div>
      <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-3 flex items-center gap-2">
        <Icon icon={FileText} size="sm" className="text-slate-500" />
        처리 로직
      </p>
      <div className="space-y-3 text-xs text-slate-600 dark:text-slate-400">
        <p className="flex items-start gap-2">
          <span className="w-5 h-5 bg-slate-200 dark:bg-slate-700 rounded text-center leading-5 text-slate-700 dark:text-slate-300 font-bold flex-shrink-0">1</span>
          <span><strong className="text-slate-800 dark:text-slate-200">주문 단위 분류:</strong> 각 카드의 숫자는 주문 수를 의미하며, 상세 모달에서 개별 작품 상태를 확인할 수 있습니다.</span>
        </p>
        <p className="flex items-start gap-2">
          <span className="w-5 h-5 bg-slate-200 dark:bg-slate-700 rounded text-center leading-5 text-slate-700 dark:text-slate-300 font-bold flex-shrink-0">2</span>
          <span><strong className="text-slate-800 dark:text-slate-200">포장/출고 대기:</strong> 합포장 포함 모든 작품이 검수 완료된 주문만 해당 상태로 분류됩니다.</span>
        </p>
        <p className="flex items-start gap-2">
          <span className="w-5 h-5 bg-slate-200 dark:bg-slate-700 rounded text-center leading-5 text-slate-700 dark:text-slate-300 font-bold flex-shrink-0">3</span>
          <span><strong className="text-slate-800 dark:text-slate-200">합포장 이슈:</strong> 일부 작품만 입고된 합포장 주문은 별도 알림으로 표시됩니다.</span>
        </p>
      </div>
    </div>
  </div>
</div>
```

---

## 4. 기능 개선안

### 4.1 실시간 업데이트 (선택적)

#### 4.1.1 자동 새로고침
```tsx
const { data, isLoading, error } = useQuery<ControlTowerData>({
  queryKey: ['control-tower'],
  queryFn: () => controlTowerApi.getData(),
  refetchInterval: 60000, // 1분마다 자동 새로고침
})
```

#### 4.1.2 수동 새로고침 버튼
```tsx
<button
  onClick={() => refetch()}
  disabled={isFetching}
  className="px-3 py-1.5 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1"
>
  <Icon icon={RefreshCw} size="sm" className={isFetching ? 'animate-spin' : ''} />
  새로고침
</button>
```

### 4.2 알림 기능 (선택적)

#### 4.2.1 위험 주문 알림
- 위험 주문 수가 특정 임계값 초과 시 시각적 알림
- 브라우저 알림 (선택적)

### 4.3 필터 기능 (선택적)

#### 4.3.1 단계별 필터
- 특정 단계만 표시/숨김
- 위험 주문만 필터링

### 4.4 데이터 내보내기 (선택적)

#### 4.4.1 위험 주문 목록 내보내기
- CSV 형식으로 위험 주문 목록 내보내기
- 단계별 내보내기

---

## 5. UX/UI 개선안

### 5.1 시각적 일관성

#### 5.1.1 색상 시스템 통일
```typescript
const stageColors = {
  unreceived: {
    light: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-600', icon: 'text-amber-500' },
    dark: { bg: 'bg-amber-900/20', border: 'border-amber-800', text: 'text-amber-400', icon: 'text-amber-400' },
  },
  artistShipping: {
    light: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-600', icon: 'text-blue-500' },
    dark: { bg: 'bg-blue-900/20', border: 'border-blue-800', text: 'text-blue-400', icon: 'text-blue-400' },
  },
  // ... 나머지 단계
}
```

### 5.2 애니메이션 개선

#### 5.2.1 페이지 진입 애니메이션
```css
.animate-fade-in-up {
  animation: fadeInUp 0.3s ease-out;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

#### 5.2.2 숫자 카운트 애니메이션 (선택적)
- 데이터 변경 시 숫자 카운트 애니메이션
- react-countup 또는 framer-motion 사용

### 5.3 접근성 개선

#### 5.3.1 ARIA 속성
```tsx
<div
  role="region"
  aria-label="물류 파이프라인 상세"
  aria-live="polite"
>
  {/* 파이프라인 카드 */}
</div>
```

#### 5.3.2 키보드 네비게이션
- Tab 키로 카드 간 이동
- Enter 키로 상세보기 열기

---

## 6. 구현 우선순위

### Phase 1: 핵심 스타일 개선 (0.5일)
1. ✅ 헤더 다크 모드 지원
2. ✅ KPI 카드 스타일 개선 및 다크 모드
3. ✅ 파이프라인 흐름도 시각적 개선
4. ✅ 파이프라인 카드 호버 효과 및 다크 모드

### Phase 2: 상세 스타일 개선 (0.5일)
5. ✅ 위험 주문 목록 스타일 개선
6. ✅ 합포장 이슈 패널 스타일 개선
7. ✅ 범례 영역 스타일 개선
8. ✅ 전반적인 다크 모드 완성

### Phase 3: 기능 개선 (선택적)
9. 자동 새로고침 기능
10. 수동 새로고침 버튼
11. 필터 기능 (선택적)
12. 데이터 내보내기 (선택적)

### Phase 4: 고급 개선 (선택적)
13. 숫자 카운트 애니메이션
14. 브라우저 알림
15. 접근성 개선
16. 성능 최적화

---

## 7. 디자인 가이드라인

### 7.1 색상 시스템

```typescript
const riskColors = {
  critical: {
    light: 'bg-red-50 border-red-200 text-red-700',
    dark: 'dark:bg-red-900/20 dark:border-red-800 dark:text-red-300',
  },
  warning: {
    light: 'bg-orange-50 border-orange-200 text-orange-700',
    dark: 'dark:bg-orange-900/20 dark:border-orange-800 dark:text-orange-300',
  },
  normal: {
    light: 'bg-green-50 border-green-200 text-green-700',
    dark: 'dark:bg-green-900/20 dark:border-green-800 dark:text-green-300',
  },
}
```

### 7.2 타이포그래피

```typescript
const typography = {
  cardTitle: 'text-sm font-bold text-slate-900 dark:text-slate-100',
  cardSubtitle: 'text-xs text-slate-500 dark:text-slate-400',
  metric: 'text-3xl font-extrabold text-slate-900 dark:text-slate-100',
  metricLabel: 'text-xs font-semibold text-slate-500 dark:text-slate-400',
}
```

### 7.3 간격 및 패딩

```typescript
const spacing = {
  cardPadding: 'p-5',
  sectionGap: 'mb-6',
  itemGap: 'gap-4',
}
```

---

## 8. 반응형 디자인

### 8.1 모바일 (< 640px)
- 파이프라인 흐름도 가로 스크롤
- 파이프라인 카드 1열 배치
- KPI 카드 2열 배치

### 8.2 태블릿 (640px - 1024px)
- 파이프라인 카드 2-3열 배치
- KPI 카드 4열 배치

### 8.3 데스크톱 (> 1024px)
- 파이프라인 카드 5열 배치 (현재 구조 유지)
- 모든 정보 한 화면에 표시

---

## 9. 예상 효과

### 9.1 사용자 경험
- **시각적 일관성**: 다른 페이지들과 통일된 디자인
- **다크 모드**: 야간 작업 시 눈의 피로 감소
- **호버 효과**: 인터랙티브한 느낌 강화
- **정보 가독성**: 핵심 지표의 시각적 강조

### 9.2 비즈니스 가치
- **모니터링 효율성**: 빠른 상황 파악
- **문제 발견 속도**: 위험 주문 빠른 인지
- **운영 품질**: 세련된 UI로 전문성 향상

---

## 10. 결론

실시간 물류 관제 센터 페이지는 이미 우수한 구조를 갖추고 있어, **대규모 변경보다는 세심한 디테일 개선**을 통해 완성도를 높이는 것이 핵심입니다.

**핵심 개선 사항:**
- 다크 모드 완벽 지원
- KPI 카드 스타일 통일
- 파이프라인 흐름도 시각적 개선
- 파이프라인 카드 호버 효과 강화
- 위험 주문 목록 스타일 개선
- 범례 영역 스타일 개선

**유지해야 할 요소:**
- 5단계 파이프라인 구조
- 위험도 게이지
- 합포장 이슈 분석
- 범례 및 안내 내용

Phase 1, 2를 통해 핵심 스타일 개선을 완료하고, Phase 3, 4는 필요에 따라 선택적으로 구현하면 효율적으로 페이지 완성도를 높일 수 있습니다.

