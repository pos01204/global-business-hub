'use client'

import { useState, useMemo } from 'react'
import { useMutation } from '@tanstack/react-query'
import { businessBrainApi } from '@/lib/api'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Icon } from '@/components/ui/Icon'
import { 
  FileText, Download, Loader2, CheckCircle, AlertCircle,
  Mail, Eye, Settings, BarChart3, Users, TrendingUp,
  AlertTriangle, Lightbulb, Target, Palette, Clock
} from 'lucide-react'
import { PDFReportGenerator } from '@/lib/reports/PDFGenerator'

// 리포트 템플릿 타입
interface ReportTemplate {
  id: string
  name: string
  description: string
  icon: any
  sections: string[]
  estimatedTime: string
}

// 섹션 타입
interface ReportSection {
  id: string
  name: string
  description: string
  icon: any
}

// 템플릿 정의
const reportTemplates: ReportTemplate[] = [
  {
    id: 'executive',
    name: '경영 요약',
    description: 'AI 브리핑, 건강도, 주요 인사이트, 권장 액션',
    icon: BarChart3,
    sections: ['overview', 'health-score', 'insights', 'recommendations'],
    estimatedTime: '5분'
  },
  {
    id: 'customer',
    name: '고객 분석',
    description: 'RFM 세그먼트, 이탈 예측, 재구매 분석',
    icon: Users,
    sections: ['rfm', 'churn', 'customer-insights'],
    estimatedTime: '3분'
  },
  {
    id: 'performance',
    name: '성과 리포트',
    description: '매출 트렌드, 예측, 코호트 분석',
    icon: TrendingUp,
    sections: ['trends', 'forecast', 'cohort'],
    estimatedTime: '4분'
  },
  {
    id: 'custom',
    name: '맞춤 리포트',
    description: '원하는 섹션을 직접 선택',
    icon: Settings,
    sections: [],
    estimatedTime: '직접 구성'
  }
]

// 섹션 정의
const availableSections: ReportSection[] = [
  { id: 'overview', name: '경영 브리핑', description: 'AI 생성 경영 요약', icon: FileText },
  { id: 'health-score', name: '건강도 점수', description: '비즈니스 건강도 평가', icon: Target },
  { id: 'insights', name: '주요 인사이트', description: '기회 및 리스크 분석', icon: Lightbulb },
  { id: 'recommendations', name: '권장 액션', description: '우선순위별 실행 제안', icon: AlertTriangle },
  { id: 'trends', name: '매출 트렌드', description: '매출 추이 분석', icon: TrendingUp },
  { id: 'rfm', name: 'RFM 분석', description: '고객 세그먼트 분석', icon: Users },
  { id: 'churn', name: '이탈 예측', description: '이탈 위험 고객 분석', icon: AlertTriangle },
  { id: 'artist-health', name: '작가 건강도', description: '작가별 성과 분석', icon: Palette },
]

// 템플릿 카드 컴포넌트
function TemplateCard({
  template,
  isSelected,
  onClick
}: {
  template: ReportTemplate
  isSelected: boolean
  onClick: () => void
}) {
  return (
    <div
      onClick={onClick}
      className={`
        p-5 rounded-xl border-2 cursor-pointer transition-all duration-200
        ${isSelected 
          ? 'border-idus-500 bg-idus-50 dark:bg-idus-900/20 shadow-md' 
          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600'
        }
      `}
    >
      <div className={`
        w-12 h-12 rounded-xl mb-4 flex items-center justify-center
        ${isSelected ? 'bg-idus-500 text-white' : 'bg-slate-100 dark:bg-slate-700'}
      `}>
        <Icon icon={template.icon} size="lg" className={isSelected ? 'text-white' : 'text-slate-600 dark:text-slate-300'} />
      </div>
      <h3 className="font-semibold text-slate-800 dark:text-slate-100 mb-1">
        {template.name}
      </h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">
        {template.description}
      </p>
      <div className="flex items-center gap-2 text-xs text-slate-400">
        <Icon icon={Clock} size="xs" />
        <span>{template.estimatedTime}</span>
      </div>
    </div>
  )
}

// 섹션 체크박스 컴포넌트
function SectionCheckbox({
  section,
  isChecked,
  onChange
}: {
  section: ReportSection
  isChecked: boolean
  onChange: (checked: boolean) => void
}) {
  return (
    <label className={`
      flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors
      ${isChecked 
        ? 'bg-idus-50 dark:bg-idus-900/20 border border-idus-200 dark:border-idus-800' 
        : 'bg-slate-50 dark:bg-slate-800/50 border border-transparent hover:bg-slate-100 dark:hover:bg-slate-800'
      }
    `}>
      <input
        type="checkbox"
        checked={isChecked}
        onChange={(e) => onChange(e.target.checked)}
        className="w-4 h-4 text-idus-500 rounded border-slate-300 focus:ring-idus-500"
      />
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
        isChecked ? 'bg-idus-100 dark:bg-idus-900/30' : 'bg-slate-200 dark:bg-slate-700'
      }`}>
        <Icon icon={section.icon} size="sm" className={isChecked ? 'text-idus-600' : 'text-slate-500'} />
      </div>
      <div className="flex-1">
        <p className="font-medium text-slate-800 dark:text-slate-100 text-sm">{section.name}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400">{section.description}</p>
      </div>
    </label>
  )
}

// 미리보기 컴포넌트
function ReportPreview({
  selectedSections,
  period,
  healthScore,
  briefing,
  insights
}: {
  selectedSections: string[]
  period: string
  healthScore?: any
  briefing?: any
  insights?: any[]
}) {
  const periodLabels: Record<string, string> = {
    '7d': '최근 7일',
    '30d': '최근 30일',
    '90d': '최근 90일',
    '180d': '최근 180일',
    '365d': '최근 1년',
  }

  if (selectedSections.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-slate-400 p-8">
        <Icon icon={FileText} size="xl" className="mb-4 opacity-50" />
        <p className="text-center">포함할 섹션을 선택하면<br/>미리보기가 표시됩니다</p>
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto p-6 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
      {/* 리포트 헤더 */}
      <div className="border-b border-slate-200 dark:border-slate-700 pb-4 mb-6">
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-1">
          Business Brain 경영 분석 리포트
        </h2>
        <p className="text-sm text-slate-500">
          분석 기간: {periodLabels[period] || period} | 생성일: {new Date().toLocaleDateString('ko-KR')}
        </p>
      </div>

      {/* 섹션 미리보기 */}
      <div className="space-y-6">
        {selectedSections.includes('overview') && briefing && (
          <div>
            <h3 className="font-semibold text-slate-700 dark:text-slate-200 mb-2 flex items-center gap-2">
              <Icon icon={FileText} size="sm" className="text-idus-500" />
              경영 브리핑
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 p-3 rounded-lg">
              {briefing.summary?.slice(0, 200)}...
            </p>
          </div>
        )}

        {selectedSections.includes('health-score') && healthScore && (
          <div>
            <h3 className="font-semibold text-slate-700 dark:text-slate-200 mb-2 flex items-center gap-2">
              <Icon icon={Target} size="sm" className="text-idus-500" />
              비즈니스 건강도
            </h3>
            <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-800 p-3 rounded-lg">
              <div className="text-3xl font-bold text-idus-600">{healthScore.overall}</div>
              <div className="text-sm text-slate-500">/ 100</div>
            </div>
          </div>
        )}

        {selectedSections.includes('insights') && insights && insights.length > 0 && (
          <div>
            <h3 className="font-semibold text-slate-700 dark:text-slate-200 mb-2 flex items-center gap-2">
              <Icon icon={Lightbulb} size="sm" className="text-idus-500" />
              주요 인사이트
            </h3>
            <ul className="space-y-2">
              {insights.slice(0, 3).map((insight, idx) => (
                <li key={idx} className="text-sm text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 p-2 rounded-lg">
                  • {insight.message?.slice(0, 80) || insight.title}...
                </li>
              ))}
            </ul>
          </div>
        )}

        {selectedSections.includes('trends') && (
          <div>
            <h3 className="font-semibold text-slate-700 dark:text-slate-200 mb-2 flex items-center gap-2">
              <Icon icon={TrendingUp} size="sm" className="text-idus-500" />
              매출 트렌드
            </h3>
            <div className="h-20 bg-slate-50 dark:bg-slate-800 rounded-lg flex items-center justify-center text-slate-400 text-sm">
              [차트 미리보기]
            </div>
          </div>
        )}

        {selectedSections.includes('rfm') && (
          <div>
            <h3 className="font-semibold text-slate-700 dark:text-slate-200 mb-2 flex items-center gap-2">
              <Icon icon={Users} size="sm" className="text-idus-500" />
              RFM 분석
            </h3>
            <div className="h-20 bg-slate-50 dark:bg-slate-800 rounded-lg flex items-center justify-center text-slate-400 text-sm">
              [세그먼트 분포 미리보기]
            </div>
          </div>
        )}
      </div>

      {/* 푸터 */}
      <div className="mt-8 pt-4 border-t border-slate-200 dark:border-slate-700 text-center text-xs text-slate-400">
        Generated by Business Brain • idus Global
      </div>
    </div>
  )
}

// 메인 통합 리포트 탭 컴포넌트
interface UnifiedReportTabProps {
  period: string
  healthScore?: any
  briefing?: any
  insights?: any[]
}

export function UnifiedReportTab({
  period,
  healthScore,
  briefing,
  insights
}: UnifiedReportTabProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<string>('executive')
  const [selectedSections, setSelectedSections] = useState<string[]>(['overview', 'health-score', 'insights', 'recommendations'])
  const [isPdfGenerating, setIsPdfGenerating] = useState(false)
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')

  // 템플릿 선택 시 섹션 자동 설정
  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId)
    const template = reportTemplates.find(t => t.id === templateId)
    if (template && template.id !== 'custom') {
      setSelectedSections(template.sections)
    }
  }

  // 섹션 토글
  const handleSectionToggle = (sectionId: string, checked: boolean) => {
    if (checked) {
      setSelectedSections([...selectedSections, sectionId])
    } else {
      setSelectedSections(selectedSections.filter(s => s !== sectionId))
    }
    // 맞춤 리포트로 전환
    setSelectedTemplate('custom')
  }

  // HTML 리포트 생성
  const generateReportMutation = useMutation({
    mutationFn: (options: {
      period: '7d' | '30d' | '90d' | '180d' | '365d'
      sections: string[]
      format?: 'pdf' | 'html'
    }) => businessBrainApi.generateReport(options as any),
    onSuccess: (data: any) => {
      if (data.html) {
        const newWindow = window.open('', '_blank')
        if (newWindow) {
          newWindow.document.write(data.html)
          newWindow.document.close()
        }
      }
      setStatus('success')
      setTimeout(() => setStatus('idle'), 3000)
    },
    onError: () => {
      setStatus('error')
      setTimeout(() => setStatus('idle'), 3000)
    }
  })

  // PDF 다운로드
  const handlePdfDownload = async () => {
    if (selectedSections.length === 0) {
      alert('최소 하나 이상의 섹션을 선택해주세요.')
      return
    }

    setIsPdfGenerating(true)
    setStatus('idle')

    try {
      const pdfGenerator = new PDFReportGenerator()
      
      const periodLabels: Record<string, string> = {
        '7d': '최근 7일',
        '30d': '최근 30일',
        '90d': '최근 90일',
        '180d': '최근 180일',
        '365d': '최근 1년',
      }
      
      const reportData = {
        title: 'Business Brain 경영 분석 리포트',
        subtitle: `분석 기간: ${periodLabels[period] || period}`,
        date: new Date().toLocaleDateString('ko-KR'),
        sections: selectedSections.map(sectionId => {
          const section = availableSections.find(s => s.id === sectionId)
          return {
            title: section?.name || sectionId,
            content: getSectionContent(sectionId)
          }
        })
      }

      await pdfGenerator.generateExecutiveReport(reportData)
      setStatus('success')
    } catch (error) {
      console.error('PDF 생성 오류:', error)
      setStatus('error')
    } finally {
      setIsPdfGenerating(false)
      setTimeout(() => setStatus('idle'), 3000)
    }
  }

  // 섹션 콘텐츠 가져오기
  const getSectionContent = (sectionId: string): string => {
    switch (sectionId) {
      case 'overview':
        return briefing?.summary || '브리핑 데이터 없음'
      case 'health-score':
        return healthScore ? `비즈니스 건강도: ${healthScore.overall}/100` : '건강도 데이터 없음'
      case 'insights':
        return insights?.map(i => `• ${i.message || i.title}`).join('\n') || '인사이트 데이터 없음'
      default:
        return '데이터 로딩 중...'
    }
  }

  // HTML 미리보기
  const handlePreview = () => {
    generateReportMutation.mutate({
      period: period as any,
      sections: selectedSections,
      format: 'html'
    })
  }

  return (
    <div className="space-y-6">
      {/* 템플릿 선택 */}
      <Card className="p-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
        <h3 className="font-semibold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
          <Icon icon={FileText} size="md" className="text-idus-500" />
          리포트 템플릿 선택
        </h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {reportTemplates.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              isSelected={selectedTemplate === template.id}
              onClick={() => handleTemplateSelect(template.id)}
            />
          ))}
        </div>
      </Card>

      {/* 섹션 선택 & 미리보기 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 섹션 선택 */}
        <Card className="p-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
          <h3 className="font-semibold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
            <Icon icon={Settings} size="md" className="text-slate-500" />
            포함 섹션
          </h3>
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {availableSections.map((section) => (
              <SectionCheckbox
                key={section.id}
                section={section}
                isChecked={selectedSections.includes(section.id)}
                onChange={(checked) => handleSectionToggle(section.id, checked)}
              />
            ))}
          </div>
          
          <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              선택된 섹션: <span className="font-medium text-slate-700 dark:text-slate-300">{selectedSections.length}개</span>
            </p>
          </div>
        </Card>

        {/* 미리보기 */}
        <Card className="p-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
          <h3 className="font-semibold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
            <Icon icon={Eye} size="md" className="text-slate-500" />
            미리보기
          </h3>
          <div className="h-80 overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700">
            <ReportPreview
              selectedSections={selectedSections}
              period={period}
              healthScore={healthScore}
              briefing={briefing}
              insights={insights}
            />
          </div>
        </Card>
      </div>

      {/* 액션 버튼 */}
      <Card className="p-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-2">
            {status === 'success' && (
              <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 flex items-center gap-1">
                <Icon icon={CheckCircle} size="xs" />
                생성 완료
              </Badge>
            )}
            {status === 'error' && (
              <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 flex items-center gap-1">
                <Icon icon={AlertCircle} size="xs" />
                오류 발생
              </Badge>
            )}
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={handlePreview}
              disabled={selectedSections.length === 0 || generateReportMutation.isPending}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors disabled:opacity-50 font-medium"
            >
              <Icon icon={Eye} size="sm" />
              미리보기
            </button>
            
            <button
              onClick={handlePdfDownload}
              disabled={selectedSections.length === 0 || isPdfGenerating}
              className="flex items-center gap-2 px-6 py-2.5 bg-idus-500 text-white rounded-xl hover:bg-idus-600 transition-colors disabled:opacity-50 font-medium"
            >
              {isPdfGenerating ? (
                <>
                  <Icon icon={Loader2} size="sm" className="animate-spin" />
                  생성 중...
                </>
              ) : (
                <>
                  <Icon icon={Download} size="sm" />
                  PDF 다운로드
                </>
              )}
            </button>
          </div>
        </div>
      </Card>
    </div>
  )
}

export default UnifiedReportTab

