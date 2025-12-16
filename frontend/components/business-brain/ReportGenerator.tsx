/**
 * ReportGenerator - 리포트 생성 UI
 * Business Brain 분석 결과를 PDF/Excel로 내보내기
 */

'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Icon } from '@/components/ui/Icon'
import { 
  FileText, Download, Loader2, CheckCircle,
  FileSpreadsheet, Settings, Calendar
} from 'lucide-react'
import { pdfGenerator, type ReportData } from '@/lib/reports/PDFGenerator'

interface ReportGeneratorProps {
  analysisData?: any
  className?: string
  onGenerate?: (type: 'pdf' | 'excel', blob: Blob) => void
}

type ReportType = 'executive' | 'detailed' | 'data'

const reportTypes: Array<{
  id: ReportType
  name: string
  description: string
  icon: typeof FileText
  format: 'pdf' | 'excel'
}> = [
  {
    id: 'executive',
    name: '경영진 요약 리포트',
    description: '핵심 지표와 인사이트가 포함된 간결한 요약',
    icon: FileText,
    format: 'pdf',
  },
  {
    id: 'detailed',
    name: '상세 분석 리포트',
    description: '모든 차트와 데이터가 포함된 종합 리포트',
    icon: FileText,
    format: 'pdf',
  },
  {
    id: 'data',
    name: '데이터 내보내기',
    description: '원본 데이터를 Excel 형식으로 내보내기',
    icon: FileSpreadsheet,
    format: 'excel',
  },
]

export function ReportGenerator({ 
  analysisData, 
  className = '',
  onGenerate 
}: ReportGeneratorProps) {
  const [selectedType, setSelectedType] = useState<ReportType>('executive')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedFile, setGeneratedFile] = useState<Blob | null>(null)
  const [includeCharts, setIncludeCharts] = useState(true)
  const [dateRange, setDateRange] = useState('last30days')

  const handleGenerate = async () => {
    setIsGenerating(true)
    setGeneratedFile(null)

    try {
      const reportData = buildReportData(analysisData, selectedType)
      
      let blob: Blob

      if (selectedType === 'data') {
        // Excel 내보내기 (CSV로 대체)
        blob = await generateCSV(analysisData)
      } else {
        // PDF 생성
        blob = await pdfGenerator.generateExecutiveReport(reportData)
      }

      setGeneratedFile(blob)
      onGenerate?.(selectedType === 'data' ? 'excel' : 'pdf', blob)
    } catch (error) {
      console.error('Report generation failed:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleDownload = () => {
    if (!generatedFile) return

    const url = URL.createObjectURL(generatedFile)
    const a = document.createElement('a')
    a.href = url
    a.download = `business-brain-report-${new Date().toISOString().split('T')[0]}.${
      selectedType === 'data' ? 'csv' : 'pdf'
    }`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <Card className={`p-6 ${className}`}>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
          <Icon icon={FileText} size="md" className="text-white" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
            리포트 생성
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            분석 결과를 PDF 또는 Excel로 내보내기
          </p>
        </div>
      </div>

      {/* 리포트 타입 선택 */}
      <div className="space-y-3 mb-6">
        {reportTypes.map((type) => (
          <div
            key={type.id}
            onClick={() => setSelectedType(type.id)}
            className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
              selectedType === type.id
                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                selectedType === type.id
                  ? 'bg-indigo-500 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}>
                <Icon icon={type.icon} size="md" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-slate-700 dark:text-slate-300">
                  {type.name}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {type.description}
                </p>
              </div>
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                type.format === 'pdf'
                  ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                  : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
              }`}>
                {type.format.toUpperCase()}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* 옵션 */}
      <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Icon icon={Settings} size="sm" className="text-slate-500" />
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
            옵션
          </span>
        </div>
        
        <div className="space-y-3">
          {/* 기간 선택 */}
          <div className="flex items-center justify-between">
            <label className="text-sm text-slate-600 dark:text-slate-400">
              데이터 기간
            </label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-3 py-1.5 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="last7days">최근 7일</option>
              <option value="last30days">최근 30일</option>
              <option value="last90days">최근 90일</option>
              <option value="thisMonth">이번 달</option>
              <option value="lastMonth">지난 달</option>
            </select>
          </div>

          {/* 차트 포함 */}
          {selectedType !== 'data' && (
            <div className="flex items-center justify-between">
              <label className="text-sm text-slate-600 dark:text-slate-400">
                차트 포함
              </label>
              <button
                onClick={() => setIncludeCharts(!includeCharts)}
                className={`w-12 h-6 rounded-full transition-colors ${
                  includeCharts ? 'bg-indigo-500' : 'bg-slate-300 dark:bg-slate-600'
                }`}
              >
                <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${
                  includeCharts ? 'translate-x-6' : 'translate-x-0.5'
                }`} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 생성 버튼 */}
      <div className="flex gap-3">
        <button
          onClick={handleGenerate}
          disabled={isGenerating}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-indigo-400 transition-colors font-medium"
        >
          {isGenerating ? (
            <>
              <Icon icon={Loader2} size="sm" className="animate-spin" />
              생성 중...
            </>
          ) : (
            <>
              <Icon icon={FileText} size="sm" />
              리포트 생성
            </>
          )}
        </button>

        {generatedFile && (
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 px-4 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium"
          >
            <Icon icon={Download} size="sm" />
            다운로드
          </button>
        )}
      </div>

      {/* 생성 완료 메시지 */}
      {generatedFile && (
        <div className="mt-4 p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg flex items-center gap-2">
          <Icon icon={CheckCircle} size="sm" className="text-emerald-600" />
          <span className="text-sm text-emerald-700 dark:text-emerald-300">
            리포트가 성공적으로 생성되었습니다!
          </span>
        </div>
      )}
    </Card>
  )
}

// 리포트 데이터 빌드
function buildReportData(analysisData: any, type: ReportType): ReportData {
  const now = new Date()
  
  return {
    title: 'Business Brain Analysis Report',
    subtitle: type === 'executive' ? 'Executive Summary' : 'Detailed Analysis',
    date: now.toLocaleDateString('ko-KR', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    }),
    summary: {
      keyMetrics: [
        { label: '총 매출', value: '$125.4K', change: '+12.5%' },
        { label: '주문 수', value: '1,234', change: '+8.2%' },
        { label: '평균 주문액', value: '$101.6', change: '+3.8%' },
        { label: '신규 고객', value: '156', change: '+15.3%' },
      ],
      highlights: [
        '전월 대비 매출 12.5% 증가',
        'VIP 고객 재구매율 85% 달성',
        '신규 고객 유입 15% 증가',
      ],
      concerns: [
        '이탈 위험 고객 28명 식별',
        '평균 배송 기간 2일 증가',
      ],
    },
    sections: [],
    insights: [
      {
        type: 'positive',
        title: '매출 성장세 지속',
        description: '3개월 연속 두 자릿수 성장을 기록하고 있습니다.',
        impact: '연간 목표 달성 가능성 85%',
      },
      {
        type: 'negative',
        title: '이탈 위험 고객 증가',
        description: '30일 이상 미구매 고객이 전월 대비 15% 증가했습니다.',
        impact: '예상 손실 매출 $12,500',
      },
      {
        type: 'neutral',
        title: '시장 트렌드 변화',
        description: '핸드메이드 주얼리 카테고리 수요 증가 추세입니다.',
        impact: '신규 작가 영입 기회',
      },
    ],
    actions: [
      {
        priority: 'high',
        action: '이탈 위험 고객 대상 리텐션 캠페인 실행',
        expectedImpact: '이탈률 20% 감소',
        timeline: '이번 주',
      },
      {
        priority: 'medium',
        action: '주얼리 카테고리 작가 영입 확대',
        expectedImpact: '카테고리 매출 30% 증가',
        timeline: '2주 내',
      },
      {
        priority: 'low',
        action: '배송 프로세스 개선 검토',
        expectedImpact: '고객 만족도 향상',
        timeline: '1개월 내',
      },
    ],
    generatedBy: 'Business Brain AI',
  }
}

// CSV 생성 (Excel 대체)
async function generateCSV(data: any): Promise<Blob> {
  // 샘플 데이터
  const rows = [
    ['날짜', '매출', '주문수', '평균주문액'],
    ['2024-01-01', '4250', '42', '101.2'],
    ['2024-01-02', '3890', '38', '102.4'],
    ['2024-01-03', '5120', '51', '100.4'],
    // ... 더 많은 데이터
  ]

  const csvContent = rows.map(row => row.join(',')).join('\n')
  return new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
}

export default ReportGenerator

