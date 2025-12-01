'use client'

import { useState, useMemo, useCallback } from 'react'
import { calendarApi } from '@/lib/api'
import StrategyModal from './StrategyModal'

// 국가 정보
const COUNTRIES: Record<string, { name: string; tier: number; flag: string; region: string }> = {
  'JP': { name: '일본', tier: 1, flag: '🇯🇵', region: 'asia' },
  'HK': { name: '홍콩', tier: 1, flag: '🇭🇰', region: 'asia' },
  'SG': { name: '싱가포르', tier: 1, flag: '🇸🇬', region: 'asia' },
  'ID': { name: '인도네시아', tier: 2, flag: '🇮🇩', region: 'asia' },
  'MY': { name: '말레이시아', tier: 2, flag: '🇲🇾', region: 'asia' },
  'TW': { name: '대만', tier: 2, flag: '🇹🇼', region: 'asia' },
  'VN': { name: '베트남', tier: 2, flag: '🇻🇳', region: 'asia' },
  'AU': { name: '호주', tier: 3, flag: '🇦🇺', region: 'oceania' },
  'CA': { name: '캐나다', tier: 3, flag: '🇨🇦', region: 'america' },
  'NZ': { name: '뉴질랜드', tier: 3, flag: '🇳🇿', region: 'oceania' },
  'US': { name: '미국', tier: 3, flag: '🇺🇸', region: 'america' },
  'AT': { name: '오스트리아', tier: 4, flag: '🇦🇹', region: 'europe' },
  'BE': { name: '벨기에', tier: 4, flag: '🇧🇪', region: 'europe' },
  'BR': { name: '브라질', tier: 4, flag: '🇧🇷', region: 'america' },
  'CH': { name: '스위스', tier: 4, flag: '🇨🇭', region: 'europe' },
  'CZ': { name: '체코', tier: 4, flag: '🇨🇿', region: 'europe' },
  'DE': { name: '독일', tier: 4, flag: '🇩🇪', region: 'europe' },
  'DK': { name: '덴마크', tier: 4, flag: '🇩🇰', region: 'europe' },
  'ES': { name: '스페인', tier: 4, flag: '🇪🇸', region: 'europe' },
  'FI': { name: '핀란드', tier: 4, flag: '🇫🇮', region: 'europe' },
  'FR': { name: '프랑스', tier: 4, flag: '🇫🇷', region: 'europe' },
  'GB': { name: '영국', tier: 4, flag: '🇬🇧', region: 'europe' },
  'HU': { name: '헝가리', tier: 4, flag: '🇭🇺', region: 'europe' },
  'IE': { name: '아일랜드', tier: 4, flag: '🇮🇪', region: 'europe' },
  'IL': { name: '이스라엘', tier: 4, flag: '🇮🇱', region: 'middleeast' },
  'IN': { name: '인도', tier: 4, flag: '🇮🇳', region: 'asia' },
  'IT': { name: '이탈리아', tier: 4, flag: '🇮🇹', region: 'europe' },
  'MX': { name: '멕시코', tier: 4, flag: '🇲🇽', region: 'america' },
  'NL': { name: '네덜란드', tier: 4, flag: '🇳🇱', region: 'europe' },
  'NO': { name: '노르웨이', tier: 4, flag: '🇳🇴', region: 'europe' },
  'PH': { name: '필리핀', tier: 4, flag: '🇵🇭', region: 'asia' },
  'PL': { name: '폴란드', tier: 4, flag: '🇵🇱', region: 'europe' },
  'PT': { name: '포르투갈', tier: 4, flag: '🇵🇹', region: 'europe' },
  'SE': { name: '스웨덴', tier: 4, flag: '🇸🇪', region: 'europe' },
  'TH': { name: '태국', tier: 4, flag: '🇹🇭', region: 'asia' },
  'TR': { name: '터키', tier: 4, flag: '🇹🇷', region: 'europe' },
  'AE': { name: 'UAE', tier: 4, flag: '🇦🇪', region: 'middleeast' },
  'ZA': { name: '남아공', tier: 4, flag: '🇿🇦', region: 'africa' },
  'CN': { name: '중국', tier: 4, flag: '🇨🇳', region: 'asia' },
  'RU': { name: '러시아', tier: 4, flag: '🇷🇺', region: 'europe' },
}

type HolidayCategory = 'national' | 'religious' | 'cultural' | 'shopping' | 'seasonal' | 'family' | 'romantic'

interface GlobalHoliday {
  id: string
  name: { local: string; english: string; korean: string }
  countries: string[]
  date: { month: number; day: number; year?: number; rule?: string }
  category: HolidayCategory
  importance: 'major' | 'medium' | 'minor'
  marketing: {
    leadTimeDays: number
    giftGiving: boolean
    discountExpected: boolean
    recommendedCategories: string[]
    keyTrends: string[]
    targetAudience?: string[]
  }
  context: {
    description: string
    culturalNotes?: string
    doNots?: string[]
    colors?: string[]
    symbols?: string[]
  }
  daysUntil?: number
}

const CATEGORY_COLORS: Record<HolidayCategory, { bg: string; text: string; border: string }> = {
  national: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  religious: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  cultural: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  shopping: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
  seasonal: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
  family: { bg: 'bg-pink-50', text: 'text-pink-700', border: 'border-pink-200' },
  romantic: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
}

const CATEGORY_LABELS: Record<HolidayCategory, string> = {
  national: '국경일',
  religious: '종교',
  cultural: '문화',
  shopping: '쇼핑',
  seasonal: '시즌',
  family: '가족',
  romantic: '연인',
}

const MONTH_NAMES = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월']

// 기념일 상세 모달
function HolidayDetailModal({ 
  holiday, 
  onClose, 
  onGenerateStrategy 
}: { 
  holiday: GlobalHoliday
  onClose: () => void
  onGenerateStrategy: (holiday: GlobalHoliday, country: string) => void
}) {
  const [selectedCountry, setSelectedCountry] = useState(holiday.countries[0])
  const categoryStyle = CATEGORY_COLORS[holiday.category]
  
  const daysUntil = useMemo(() => {
    if (holiday.daysUntil !== undefined) return holiday.daysUntil
    const today = new Date()
    const holidayDate = new Date(
      holiday.date.year || today.getFullYear(),
      holiday.date.month - 1,
      holiday.date.day
    )
    if (holidayDate < today) {
      holidayDate.setFullYear(holidayDate.getFullYear() + 1)
    }
    return Math.ceil((holidayDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  }, [holiday])

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            <span className="text-2xl">{holiday.marketing.giftGiving ? '🎁' : '🗓️'}</span>
            <span>{holiday.name.korean}</span>
            <span className="text-gray-400 font-normal text-base">({holiday.name.english})</span>
          </div>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body space-y-6">
          {/* 기본 정보 */}
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <span className="text-gray-500">📅</span>
              <span className="font-medium">{holiday.date.month}월 {holiday.date.day}일</span>
              {holiday.date.rule && (
                <span className="text-xs text-gray-500">({holiday.date.rule})</span>
              )}
            </div>
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${categoryStyle.bg} ${categoryStyle.text}`}>
              {CATEGORY_LABELS[holiday.category]}
            </div>
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${
              daysUntil <= 30 ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
            }`}>
              D-{daysUntil}
            </div>
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${
              holiday.importance === 'major' ? 'bg-yellow-100 text-yellow-700' :
              holiday.importance === 'medium' ? 'bg-gray-100 text-gray-600' :
              'bg-gray-50 text-gray-500'
            }`}>
              {holiday.importance === 'major' ? '⭐ 최고 중요' : 
               holiday.importance === 'medium' ? '중요' : '일반'}
            </div>
          </div>

          {/* 해당 국가 */}
          <div>
            <h3 className="text-sm font-semibold text-gray-500 mb-2">🌍 해당 국가 ({holiday.countries.length}개국)</h3>
            <div className="flex flex-wrap gap-2">
              {holiday.countries.map(code => (
                <span key={code} className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded text-sm">
                  <span>{COUNTRIES[code]?.flag}</span>
                  <span>{COUNTRIES[code]?.name || code}</span>
                </span>
              ))}
            </div>
          </div>

          {/* 설명 */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-500 mb-2">📝 설명</h3>
            <p className="text-gray-700">{holiday.context.description}</p>
            {holiday.context.culturalNotes && (
              <p className="text-sm text-gray-600 mt-2 italic">💡 {holiday.context.culturalNotes}</p>
            )}
          </div>

          {/* 주의사항 */}
          {holiday.context.doNots && holiday.context.doNots.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-red-700 mb-2">⚠️ 주의사항</h3>
              <ul className="text-sm text-red-600 space-y-1">
                {holiday.context.doNots.map((item, idx) => (
                  <li key={idx}>• {item}</li>
                ))}
              </ul>
            </div>
          )}

          {/* 마케팅 인사이트 */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-blue-700 mb-3">🎯 마케팅 인사이트</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">리드타임:</span>
                  <span className="font-medium">{holiday.marketing.leadTimeDays}일 전 준비 권장</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">선물 문화:</span>
                  <span className={`font-medium ${holiday.marketing.giftGiving ? 'text-green-600' : 'text-gray-400'}`}>
                    {holiday.marketing.giftGiving ? '✅ 있음' : '❌ 없음'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">할인 기대:</span>
                  <span className={`font-medium ${holiday.marketing.discountExpected ? 'text-red-600' : 'text-gray-400'}`}>
                    {holiday.marketing.discountExpected ? '🔥 높음' : '보통'}
                  </span>
                </div>
                {holiday.marketing.targetAudience && (
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">타겟:</span>
                    <span className="font-medium">{holiday.marketing.targetAudience.join(', ')}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-green-50 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-green-700 mb-3">🏷️ 추천 카테고리</h3>
              <div className="flex flex-wrap gap-2">
                {holiday.marketing.recommendedCategories.map((cat, idx) => (
                  <span key={idx} className="px-2 py-1 bg-white rounded border border-green-200 text-sm">
                    {cat}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* 키 트렌드 */}
          <div>
            <h3 className="text-sm font-semibold text-gray-500 mb-2">🔥 키 트렌드</h3>
            <div className="flex flex-wrap gap-2">
              {holiday.marketing.keyTrends.map((trend, idx) => (
                <span key={idx} className="px-3 py-1 bg-gradient-to-r from-idus-500/10 to-pink-500/10 rounded-full text-sm font-medium text-gray-700">
                  #{trend}
                </span>
              ))}
            </div>
          </div>

          {/* 상징 요소 */}
          <div className="grid md:grid-cols-2 gap-4">
            {holiday.context.colors && (
              <div>
                <h3 className="text-sm font-semibold text-gray-500 mb-2">🎨 상징 색상</h3>
                <div className="flex gap-2">
                  {holiday.context.colors.map((color, idx) => (
                    <div key={idx} className="flex items-center gap-2 px-3 py-1 bg-gray-100 rounded">
                      <div 
                        className="w-4 h-4 rounded-full border"
                        style={{ 
                          backgroundColor: color === 'pastel' ? '#FFE4E1' : 
                                          color === 'multicolor' ? 'linear-gradient(45deg, red, orange, yellow, green, blue, purple)' :
                                          color === 'rainbow' ? 'linear-gradient(45deg, red, orange, yellow, green, blue, purple)' :
                                          color 
                        }}
                      />
                      <span className="text-sm capitalize">{color}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {holiday.context.symbols && (
              <div>
                <h3 className="text-sm font-semibold text-gray-500 mb-2">✨ 상징 요소</h3>
                <div className="flex flex-wrap gap-2">
                  {holiday.context.symbols.map((symbol, idx) => (
                    <span key={idx} className="px-2 py-1 bg-gray-100 rounded text-sm">
                      {symbol}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 전략 생성 국가 선택 */}
          <div className="border-t pt-4">
            <h3 className="text-sm font-semibold text-gray-500 mb-2">🤖 AI 전략 생성 대상 국가</h3>
            <select
              value={selectedCountry}
              onChange={(e) => setSelectedCountry(e.target.value)}
              className="w-full md:w-auto px-4 py-2 border rounded-lg"
            >
              {holiday.countries.map(code => (
                <option key={code} value={code}>
                  {COUNTRIES[code]?.flag} {COUNTRIES[code]?.name || code}
                </option>
              ))}
            </select>
          </div>

          {/* 액션 버튼 */}
          <div className="flex gap-3 pt-4 border-t">
            <button 
              onClick={() => onGenerateStrategy(holiday, selectedCountry)}
              className="btn btn-primary flex-1"
            >
              🤖 AI 마케팅 전략 생성
            </button>
            <button className="btn btn-secondary">
              📋 캠페인 등록
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function MarketingCalendarTab() {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [selectedCountries, setSelectedCountries] = useState<string[]>([])
  const [selectedTier, setSelectedTier] = useState<number | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<HolidayCategory | null>(null)
  const [selectedHoliday, setSelectedHoliday] = useState<GlobalHoliday | null>(null)
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar')
  const [strategy, setStrategy] = useState<any>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [holidays, setHolidays] = useState<GlobalHoliday[]>([])
  const [upcomingHolidays, setUpcomingHolidays] = useState<GlobalHoliday[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // API에서 데이터 로드
  const loadHolidays = useCallback(async () => {
    try {
      setIsLoading(true)
      const [monthData, upcomingData] = await Promise.all([
        calendarApi.getHolidays({
          month: selectedMonth,
          countries: selectedCountries.length > 0 ? selectedCountries.join(',') : undefined,
          tier: selectedTier || undefined,
          category: selectedCategory || undefined,
        }),
        calendarApi.getUpcoming(30),
      ])
      
      setHolidays(monthData.data || [])
      setUpcomingHolidays(upcomingData.data || [])
    } catch (error) {
      console.error('기념일 로드 오류:', error)
      // 오류 시 빈 배열 설정
      setHolidays([])
      setUpcomingHolidays([])
    } finally {
      setIsLoading(false)
    }
  }, [selectedMonth, selectedCountries, selectedTier, selectedCategory])

  // 초기 로드 및 필터 변경 시 재로드
  useState(() => {
    loadHolidays()
  })

  // 필터 변경 시 재로드
  useMemo(() => {
    loadHolidays()
  }, [loadHolidays])

  // 전략 생성
  const handleGenerateStrategy = async (holiday: GlobalHoliday, country: string) => {
    try {
      setIsGenerating(true)
      const response = await calendarApi.generateStrategy({
        holidayId: holiday.id,
        country: country,
      })
      
      if (response.success) {
        setStrategy(response.data)
        setSelectedHoliday(null)
      } else {
        alert('전략 생성에 실패했습니다.')
      }
    } catch (error) {
      console.error('전략 생성 오류:', error)
      alert('전략 생성 중 오류가 발생했습니다.')
    } finally {
      setIsGenerating(false)
    }
  }

  const toggleCountry = (code: string) => {
    setSelectedCountries(prev => 
      prev.includes(code) 
        ? prev.filter(c => c !== code)
        : [...prev, code]
    )
  }

  // 캘린더 그리드 생성
  const calendarDays = useMemo(() => {
    const year = new Date().getFullYear()
    const firstDay = new Date(year, selectedMonth - 1, 1).getDay()
    const daysInMonth = new Date(year, selectedMonth, 0).getDate()
    
    const days: (number | null)[] = []
    for (let i = 0; i < firstDay; i++) days.push(null)
    for (let i = 1; i <= daysInMonth; i++) days.push(i)
    
    return days
  }, [selectedMonth])

  // 날짜별 기념일 매핑
  const holidaysByDay = useMemo(() => {
    const map: Record<number, GlobalHoliday[]> = {}
    holidays.forEach(h => {
      if (!map[h.date.day]) map[h.date.day] = []
      map[h.date.day].push(h)
    })
    return map
  }, [holidays])

  return (
    <div className="space-y-6">
      {/* 다가오는 기념일 알림 */}
      {upcomingHolidays.length > 0 && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xl">⏰</span>
            <h3 className="font-semibold text-amber-800">다가오는 주요 기념일</h3>
            <span className="bg-amber-100 text-amber-700 text-xs px-2 py-0.5 rounded-full">
              30일 이내 {upcomingHolidays.length}개
            </span>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {upcomingHolidays.slice(0, 5).map(holiday => (
              <button
                key={holiday.id}
                onClick={() => setSelectedHoliday(holiday)}
                className="flex-shrink-0 bg-white rounded-lg p-3 border border-amber-200 hover:border-amber-400 transition-colors min-w-[180px]"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">{holiday.name.korean}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    (holiday.daysUntil || 0) <= 7 ? 'bg-red-100 text-red-700' : 
                    (holiday.daysUntil || 0) <= 14 ? 'bg-orange-100 text-orange-700' : 
                    'bg-gray-100 text-gray-600'
                  }`}>
                    D-{holiday.daysUntil || '?'}
                  </span>
                </div>
                <div className="text-xs text-gray-500">
                  {holiday.date.month}/{holiday.date.day} • {holiday.countries.slice(0, 3).map(c => COUNTRIES[c]?.flag).join('')}
                  {holiday.countries.length > 3 && ` +${holiday.countries.length - 3}`}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 필터 영역 */}
      <div className="card">
        <div className="flex flex-wrap gap-4 items-center justify-between">
          {/* 월 선택 */}
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setSelectedMonth(m => m > 1 ? m - 1 : 12)}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              ◀
            </button>
            <span className="text-lg font-bold min-w-[80px] text-center">
              {MONTH_NAMES[selectedMonth - 1]}
            </span>
            <button 
              onClick={() => setSelectedMonth(m => m < 12 ? m + 1 : 1)}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              ▶
            </button>
          </div>

          {/* Tier 필터 */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Tier:</span>
            {[1, 2, 3, 4].map(tier => (
              <button
                key={tier}
                onClick={() => setSelectedTier(selectedTier === tier ? null : tier)}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                  selectedTier === tier
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Tier {tier}
              </button>
            ))}
          </div>

          {/* 카테고리 필터 */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">유형:</span>
            <select
              value={selectedCategory || ''}
              onChange={(e) => setSelectedCategory(e.target.value as HolidayCategory || null)}
              className="px-3 py-1.5 border rounded-lg text-sm"
            >
              <option value="">전체</option>
              {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>

          {/* 뷰 모드 */}
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-3 py-1 rounded text-sm ${
                viewMode === 'calendar' ? 'bg-white shadow text-gray-900' : 'text-gray-500'
              }`}
            >
              📅 캘린더
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1 rounded text-sm ${
                viewMode === 'list' ? 'bg-white shadow text-gray-900' : 'text-gray-500'
              }`}
            >
              📋 리스트
            </button>
          </div>
        </div>

        {/* 국가 빠른 필터 */}
        <div className="mt-4 pt-4 border-t">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm text-gray-500">국가 필터:</span>
            {selectedCountries.length > 0 && (
              <button
                onClick={() => setSelectedCountries([])}
                className="text-xs text-red-500 hover:underline"
              >
                초기화
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-1">
            {Object.entries(COUNTRIES)
              .sort((a, b) => a[1].tier - b[1].tier)
              .map(([code, info]) => (
                <button
                  key={code}
                  onClick={() => toggleCountry(code)}
                  className={`px-2 py-1 rounded text-xs transition-colors ${
                    selectedCountries.includes(code)
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {info.flag} {info.name}
                </button>
              ))}
          </div>
        </div>
      </div>

      {/* 로딩 상태 */}
      {isLoading ? (
        <div className="card text-center py-12">
          <div className="animate-spin text-4xl mb-4">🔄</div>
          <p className="text-gray-500">기념일 정보를 불러오는 중...</p>
        </div>
      ) : (
        <>
          {/* 캘린더 / 리스트 뷰 */}
          {viewMode === 'calendar' ? (
            <div className="card">
              {/* 요일 헤더 */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {['일', '월', '화', '수', '목', '금', '토'].map((day, idx) => (
                  <div key={day} className={`text-center text-sm font-medium py-2 ${
                    idx === 0 ? 'text-red-500' : idx === 6 ? 'text-blue-500' : 'text-gray-600'
                  }`}>
                    {day}
                  </div>
                ))}
              </div>
              
              {/* 캘린더 그리드 */}
              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((day, idx) => (
                  <div
                    key={idx}
                    className={`min-h-[100px] border rounded-lg p-1 ${
                      day ? 'bg-white' : 'bg-gray-50'
                    }`}
                  >
                    {day && (
                      <>
                        <div className={`text-sm font-medium mb-1 ${
                          idx % 7 === 0 ? 'text-red-500' : idx % 7 === 6 ? 'text-blue-500' : 'text-gray-700'
                        }`}>
                          {day}
                        </div>
                        <div className="space-y-1">
                          {holidaysByDay[day]?.slice(0, 3).map(holiday => (
                            <button
                              key={holiday.id}
                              onClick={() => setSelectedHoliday(holiday)}
                              className={`w-full text-left text-xs p-1 rounded truncate ${
                                CATEGORY_COLORS[holiday.category].bg
                              } ${CATEGORY_COLORS[holiday.category].text} hover:opacity-80 transition-opacity`}
                            >
                              {holiday.marketing.giftGiving && '🎁'} {holiday.name.korean}
                            </button>
                          ))}
                          {holidaysByDay[day]?.length > 3 && (
                            <div className="text-xs text-gray-400 text-center">
                              +{holidaysByDay[day].length - 3}개 더
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {holidays.length === 0 ? (
                <div className="card text-center py-12">
                  <span className="text-4xl mb-4 block">📭</span>
                  <p className="text-gray-500">해당 조건에 맞는 기념일이 없습니다.</p>
                </div>
              ) : (
                holidays.map(holiday => {
                  const categoryStyle = CATEGORY_COLORS[holiday.category]
                  return (
                    <button
                      key={holiday.id}
                      onClick={() => setSelectedHoliday(holiday)}
                      className="card w-full text-left hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center gap-4">
                        <div className="text-center min-w-[60px]">
                          <div className="text-2xl font-bold text-gray-900">{holiday.date.day}</div>
                          <div className="text-xs text-gray-500">{MONTH_NAMES[holiday.date.month - 1]}</div>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold">{holiday.name.korean}</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${categoryStyle.bg} ${categoryStyle.text}`}>
                              {CATEGORY_LABELS[holiday.category]}
                            </span>
                            {holiday.importance === 'major' && (
                              <span className="text-xs text-yellow-600">⭐</span>
                            )}
                          </div>
                          <div className="text-sm text-gray-500">
                            {holiday.countries.slice(0, 5).map(c => COUNTRIES[c]?.flag).join(' ')}
                            {holiday.countries.length > 5 && ` +${holiday.countries.length - 5}개국`}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex flex-wrap gap-1 justify-end">
                            {holiday.marketing.recommendedCategories.slice(0, 3).map((cat, idx) => (
                              <span key={idx} className="text-xs bg-gray-100 px-2 py-0.5 rounded">
                                {cat}
                              </span>
                            ))}
                          </div>
                          <div className="text-xs text-gray-400 mt-1">
                            {holiday.marketing.giftGiving && '🎁 선물'} 
                            {holiday.marketing.discountExpected && ' 🔥 할인'}
                          </div>
                        </div>
                      </div>
                    </button>
                  )
                })
              )}
            </div>
          )}
        </>
      )}

      {/* 기념일 상세 모달 */}
      {selectedHoliday && (
        <HolidayDetailModal
          holiday={selectedHoliday}
          onClose={() => setSelectedHoliday(null)}
          onGenerateStrategy={handleGenerateStrategy}
        />
      )}

      {/* 전략 생성 로딩 */}
      {isGenerating && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 text-center">
            <div className="animate-spin text-5xl mb-4">🤖</div>
            <h3 className="text-lg font-semibold mb-2">AI 마케팅 전략 생성 중...</h3>
            <p className="text-gray-500 text-sm">잠시만 기다려주세요</p>
          </div>
        </div>
      )}

      {/* 전략 모달 */}
      {strategy && (
        <StrategyModal
          strategy={strategy}
          onClose={() => setStrategy(null)}
        />
      )}
    </div>
  )
}
