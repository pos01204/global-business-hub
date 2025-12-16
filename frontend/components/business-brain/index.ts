/**
 * Business Brain 컴포넌트 모음
 * v5.0: 고급 분석 및 시각화 컴포넌트
 * v5.1: UX 혁신 - Command Center, Action Hub, Deep Dive
 * v5.2: 시뮬레이션 결과, 네비게이션
 * v6.0: 통합 탭 시스템 - UX 개선 및 기능 통합
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

// UX 혁신 뷰 (v5.1, v5.2) - 레거시
export { CommandCenter } from './CommandCenter'
export { ActionHub } from './ActionHub'
export { DeepDive } from './DeepDive'
export { Navigation, NavigationTabs } from './Navigation'

// v6.0: 통합 탭 컴포넌트
export { UnifiedHome } from './UnifiedHome'
export { UnifiedCustomerTab } from './UnifiedCustomerTab'
export { UnifiedRevenueTab } from './UnifiedRevenueTab'
export { UnifiedInsightTab } from './UnifiedInsightTab'
export { UnifiedActionTab } from './UnifiedActionTab'
export { DataExplorer } from './DataExplorer'
export { UnifiedReportTab } from './UnifiedReportTab'
export { KeyboardShortcutHelp } from './KeyboardShortcutHelp'

// 위젯
export { BrainWidget } from './BrainWidget'

// 에러 처리
export { ErrorBoundary } from './ErrorBoundary'

