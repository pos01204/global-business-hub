'use client'

import React, { useState, useRef } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { businessBrainApi } from '@/lib/api'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { FileText, Download, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import { PDFReportGenerator } from '@/lib/reports/PDFGenerator'

// FadeIn 컴포넌트
function FadeIn({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  return (
    <div className={`animate-fade-in ${className}`} style={{ animationDelay: `${delay}ms` }}>
      {children}
    </div>
  )
}

interface ReportGeneratorProps {
  period: string
  healthScore?: any
  briefing?: any
  insights?: any[]
}

export function ReportGenerator({ period, healthScore, briefing, insights }: ReportGeneratorProps) {
  const [selectedSections, setSelectedSections] = useState<Array<
    'overview' | 'health-score' | 'insights' | 'trends' | 'rfm' | 'churn' | 'artist-health' | 'recommendations'
  >>(['overview', 'health-score', 'insights', 'recommendations'])
  const [isPdfGenerating, setIsPdfGenerating] = useState(false)
  const [pdfStatus, setPdfStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const reportContainerRef = useRef<HTMLDivElement>(null)

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

  // PDF 직접 생성 (jsPDF 사용)
  const handleDirectPdfDownload = async () => {
    if (selectedSections.length === 0) {
      alert('최소 하나 이상의 섹션을 선택해주세요.')
      return
    }

    setIsPdfGenerating(true)
    setPdfStatus('idle')

    try {
      const pdfGenerator = new PDFReportGenerator()
      
      // 기간 레이블 변환
      const periodLabels: Record<string, string> = {
        '7d': '최근 7일',
        '30d': '최근 30일',
        '90d': '최근 90일',
        '180d': '최근 180일',
        '365d': '최근 1년',
      }
      
      // ReportData 형식으로 변환
      const reportData = {
        title: 'Business Brain 경영 분석 리포트',
        subtitle: `분석 기간: ${periodLabels[period] || period}`,
        date: new Date().toLocaleDateString('ko-KR', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        }),
        summary: {
          keyMetrics: healthScore ? [
            { 
              label: '종합 건강도', 
              value: `${healthScore.overall || 0}점`, 
              change: healthScore.overall >= 70 ? '양호' : healthScore.overall >= 50 ? '주의' : '위험' 
            },
            { 
              label: '매출 건강도', 
              value: `${healthScore.dimensions?.revenue?.score || 0}점`, 
              change: `${healthScore.dimensions?.revenue?.change > 0 ? '+' : ''}${healthScore.dimensions?.revenue?.change || 0}%` 
            },
            { 
              label: '고객 건강도', 
              value: `${healthScore.dimensions?.customer?.score || 0}점`, 
              change: `${healthScore.dimensions?.customer?.change > 0 ? '+' : ''}${healthScore.dimensions?.customer?.change || 0}%` 
            },
            { 
              label: '작가 건강도', 
              value: `${healthScore.dimensions?.artist?.score || 0}점`, 
              change: `${healthScore.dimensions?.artist?.change > 0 ? '+' : ''}${healthScore.dimensions?.artist?.change || 0}%` 
            },
          ] : [],
          highlights: briefing?.summary ? [briefing.summary] : ['분석 데이터가 준비되지 않았습니다.'],
          concerns: insights?.filter((i: any) => i.type === 'critical' || i.type === 'warning').map((i: any) => i.title || i.description).slice(0, 3) || [],
        },
        sections: selectedSections.map(sectionId => ({
          title: sections.find(s => s.id === sectionId)?.label || sectionId,
          content: sections.find(s => s.id === sectionId)?.description || '',
        })),
        insights: (insights || []).slice(0, 5).map((insight: any) => ({
          type: insight.type === 'critical' ? 'negative' as const : 
                insight.type === 'opportunity' ? 'positive' as const : 'neutral' as const,
          title: insight.title || '인사이트',
          description: insight.description || '',
          impact: insight.impact || '',
        })),
        actions: (insights || [])
          .filter((i: any) => i.recommendation)
          .slice(0, 5)
          .map((insight: any) => ({
            priority: insight.priority === 1 ? 'high' as const : 
                      insight.priority === 2 ? 'medium' as const : 'low' as const,
            action: insight.recommendation || '',
            expectedImpact: insight.impact || '예상 효과 분석 중',
            timeline: '즉시 실행 권장',
          })),
        generatedBy: 'Business Brain AI',
      }

      await pdfGenerator.generateExecutiveReport(reportData)
      setPdfStatus('success')
      
      // 3초 후 상태 초기화
      setTimeout(() => setPdfStatus('idle'), 3000)
    } catch (error) {
      console.error('PDF 생성 오류:', error)
      setPdfStatus('error')
      setTimeout(() => setPdfStatus('idle'), 3000)
    } finally {
      setIsPdfGenerating(false)
    }
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
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleGenerateReport}
            disabled={generateReportMutation.isPending || selectedSections.length === 0}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {generateReportMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>생성 중...</span>
              </>
            ) : (
              <>
                <FileText className="w-4 h-4" />
                <span>HTML 리포트</span>
              </>
            )}
          </button>
          <button
            onClick={handleDirectPdfDownload}
            disabled={isPdfGenerating || selectedSections.length === 0}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isPdfGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>PDF 생성 중...</span>
              </>
            ) : pdfStatus === 'success' ? (
              <>
                <CheckCircle className="w-4 h-4" />
                <span>다운로드 완료!</span>
              </>
            ) : pdfStatus === 'error' ? (
              <>
                <AlertCircle className="w-4 h-4" />
                <span>생성 실패</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>PDF 다운로드</span>
              </>
            )}
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

