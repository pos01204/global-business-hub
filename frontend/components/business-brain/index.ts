/**
 * Business Brain 컴포넌트 모음
 * v5.0: 고급 분석 및 시각화 컴포넌트
 * v5.1: UX 혁신 - Command Center, Action Hub, Deep Dive
 * v5.2: 시뮬레이션 결과, 네비게이션
 */

// 차트 컴포넌트
export * from './charts'

// 분석 컴포넌트
export { default as AnalysisDetailDrawer } from './AnalysisDetailDrawer'
export { default as ChartDrillDownModal } from './ChartDrillDownModal'

// 신뢰도 및 데이터 품질
export { default as ConfidenceBadge } from './ConfidenceBadge'
export { default as ConfidenceInterval } from './ConfidenceInterval'
export { default as DataQualityIndicator } from './DataQualityIndicator'

// 고급 분석 대시보드
export { default as CLVDashboard } from './CLVDashboard'
export { default as ChurnRiskList } from './ChurnRiskList'
export { default as ForecastPerformance } from './ForecastPerformance'
export { default as SimulationResults } from './SimulationResults'

// 리포트 생성
export { default as ReportGenerator } from './ReportGenerator'

// UX 혁신 뷰 (v5.1, v5.2)
export { default as CommandCenter } from './CommandCenter'
export { default as ActionHub } from './ActionHub'
export { default as DeepDive } from './DeepDive'
export { default as Navigation, NavigationTabs } from './Navigation'

// 위젯
export { default as BrainWidget } from './BrainWidget'

// 에러 처리
export { default as ErrorBoundary } from './ErrorBoundary'

