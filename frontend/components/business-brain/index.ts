/**
 * Business Brain 컴포넌트 모음
 * v5.0: 고급 분석 및 시각화 컴포넌트
 * v5.1: UX 혁신 - Command Center, Action Hub, Deep Dive
 * v5.2: 시뮬레이션 결과, 네비게이션
 */

// 차트 컴포넌트
export * from './charts'

// 분석 컴포넌트
export { AnalysisDetailDrawer } from './AnalysisDetailDrawer'
export { ChartDrillDownModal } from './ChartDrillDownModal'

// 신뢰도 및 데이터 품질
export { ConfidenceBadge } from './ConfidenceBadge'
export { ConfidenceInterval } from './ConfidenceInterval'
export { DataQualityIndicator } from './DataQualityIndicator'

// 고급 분석 대시보드
export { CLVDashboard } from './CLVDashboard'
export { ChurnRiskList } from './ChurnRiskList'
export { ForecastPerformance } from './ForecastPerformance'
export { SimulationResults } from './SimulationResults'

// 리포트 생성
export { ReportGenerator } from './ReportGenerator'

// UX 혁신 뷰 (v5.1, v5.2)
export { CommandCenter } from './CommandCenter'
export { ActionHub } from './ActionHub'
export { DeepDive } from './DeepDive'
export { Navigation, NavigationTabs } from './Navigation'

// 위젯
export { BrainWidget } from './BrainWidget'

// 에러 처리
export { ErrorBoundary } from './ErrorBoundary'

