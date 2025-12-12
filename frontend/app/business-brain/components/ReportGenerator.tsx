'use client'

import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { businessBrainApi } from '@/lib/api'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { FadeIn } from '@/components/ui/FadeIn'

interface ReportGeneratorProps {
  period: string
}

export function ReportGenerator({ period }: ReportGeneratorProps) {
  const [selectedSections, setSelectedSections] = useState<Array<
    'overview' | 'health-score' | 'insights' | 'trends' | 'rfm' | 'churn' | 'artist-health' | 'recommendations'
  >>(['overview', 'health-score', 'insights', 'recommendations'])

  const generateReportMutation = useMutation({
    mutationFn: (options: {
      period: '7d' | '30d' | '90d' | '180d' | '365d'
      sections: Array<'overview' | 'health-score' | 'insights' | 'trends' | 'rfm' | 'churn' | 'artist-health' | 'recommendations'>
      format?: 'pdf' | 'html'
    }) => businessBrainApi.generateReport(options),
    onSuccess: (data) => {
      if (data.html) {
        // 새 창에서 HTML 리포트 열기
        const newWindow = window.open('', '_blank')
        if (newWindow) {
          newWindow.document.write(data.html)
          newWindow.document.close()
          
          // PDF로 인쇄 옵션 제공
          setTimeout(() => {
            if (confirm('리포트를 PDF로 저장하시겠습니까?')) {
              newWindow.print()
            }
          }, 500)
        }
      }
    },
  })

  const handleGenerateReport = () => {
    if (selectedSections.length === 0) {
      alert('최소 하나 이상의 섹션을 선택해주세요.')
      return
    }

    generateReportMutation.mutate({
      period: period as any,
      sections: selectedSections,
      format: 'html',
    })
  }

  const handleDownloadPDF = () => {
    if (selectedSections.length === 0) {
      alert('최소 하나 이상의 섹션을 선택해주세요.')
      return
    }

    generateReportMutation.mutate({
      period: period as any,
      sections: selectedSections,
      format: 'html',
    })
  }

  const sections = [
    { id: 'overview' as const, label: '경영 브리핑', icon: '📊', description: '종합 현황 및 요약' },
    { id: 'health-score' as const, label: '건강도 점수', icon: '💚', description: '4차원 건강도 점수' },
    { id: 'insights' as const, label: '주요 인사이트', icon: '💡', description: '자동 발견된 인사이트' },
    { id: 'trends' as const, label: '장기 트렌드', icon: '📈', description: '트렌드 분석' },
    { id: 'rfm' as const, label: 'RFM 분석', icon: '👥', description: '고객 세분화 분석' },
    { id: 'churn' as const, label: '이탈 예측', icon: '🔮', description: '고객 이탈 예측' },
    { id: 'artist-health' as const, label: '작가 건강도', icon: '🎨', description: '작가별 건강도 점수' },
    { id: 'recommendations' as const, label: '액션 제안', icon: '📋', description: '우선순위별 액션 제안' },
  ]

  const toggleSection = (sectionId: typeof sections[0]['id']) => {
    if (selectedSections.includes(sectionId)) {
      setSelectedSections(selectedSections.filter((id) => id !== sectionId))
    } else {
      setSelectedSections([...selectedSections, sectionId])
    }
  }

  return (
    <FadeIn>
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">
          📄 리포트 생성
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
          Business Brain 분석 결과를 리포트로 생성하여 다운로드하거나 공유할 수 있습니다.
        </p>

        {/* 섹션 선택 */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
            포함할 섹션 선택
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {sections.map((section) => {
              const isSelected = selectedSections.includes(section.id)
              return (
                <button
                  key={section.id}
                  onClick={() => toggleSection(section.id)}
                  className={`p-3 rounded-lg border-2 transition-all text-left ${
                    isSelected
                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                      : 'border-slate-200 dark:border-slate-700 hover:border-indigo-300'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">{section.icon}</span>
                    <span className="text-sm font-medium text-slate-800 dark:text-slate-100">
                      {section.label}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    {section.description}
                  </p>
                </button>
              )
            })}
          </div>
        </div>

        {/* 액션 버튼 */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleGenerateReport}
            disabled={generateReportMutation.isPending || selectedSections.length === 0}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {generateReportMutation.isPending ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <span>생성 중...</span>
              </>
            ) : (
              <>
                <span>📄</span>
                <span>리포트 생성</span>
              </>
            )}
          </button>
          <button
            onClick={handleDownloadPDF}
            disabled={generateReportMutation.isPending || selectedSections.length === 0}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <span>💾</span>
            <span>PDF로 저장</span>
          </button>
        </div>

        {/* 안내 메시지 */}
        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <p className="text-xs text-blue-800 dark:text-blue-400">
            💡 리포트는 HTML 형식으로 생성되며, 브라우저의 인쇄 기능을 사용하여 PDF로 저장할 수 있습니다.
          </p>
        </div>

        {/* 에러 메시지 */}
        {generateReportMutation.isError && (
          <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
            <p className="text-sm text-red-800 dark:text-red-400">
              리포트 생성 중 오류가 발생했습니다. 다시 시도해주세요.
            </p>
          </div>
        )}
      </Card>
    </FadeIn>
  )
}

