'use client'

import { useState } from 'react'

interface MarketingStrategy {
  holidayId: string
  holidayName: string
  country: string
  countryName: string
  daysUntil: number
  categoryRecommendations: {
    rank: number
    categoryId: string
    categoryName: string
    reason: string
    expectedDemandScore: number
    suggestedProducts: string[]
  }[]
  promotionStrategy: {
    timeline: {
      phase: string
      phaseName: string
      startDate: string
      endDate: string
      actions: string[]
      channels: string[]
    }[]
    discountSuggestion?: {
      type: string
      value: number
      rationale: string
    }
    bundleSuggestion?: {
      theme: string
      products: string[]
    }
  }
  contentStrategy: {
    themes: string[]
    keyMessages: {
      korean: string
      english: string
      local?: string
    }
    visualGuidelines: string[]
    hashtags: string[]
    platforms: string[]
    contentIdeas: string[]
  }
  targetAudience: {
    primary: string
    secondary?: string
    behaviors: string[]
  }
  projectedImpact: {
    trafficIncrease: string
    conversionLift: string
    revenueOpportunity: string
    confidence: string
  }
  alerts: {
    type: string
    message: string
  }[]
  generatedAt: string
}

interface StrategyModalProps {
  strategy: MarketingStrategy
  onClose: () => void
}

export default function StrategyModal({ strategy, onClose }: StrategyModalProps) {
  const [activeSection, setActiveSection] = useState<'overview' | 'timeline' | 'content' | 'impact'>('overview')

  const phaseColors: Record<string, string> = {
    awareness: 'bg-blue-100 border-blue-300 text-blue-800',
    consideration: 'bg-purple-100 border-purple-300 text-purple-800',
    conversion: 'bg-green-100 border-green-300 text-green-800',
    retention: 'bg-amber-100 border-amber-300 text-amber-800',
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content large max-w-4xl" onClick={(e) => e.stopPropagation()}>
        {/* 헤더 */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-500 text-white p-6 rounded-t-xl">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">🤖</span>
                <h2 className="text-xl font-bold">AI 마케팅 전략</h2>
              </div>
              <p className="text-white/80">
                {strategy.holidayName} • {strategy.countryName}
              </p>
            </div>
            <div className="text-right">
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                strategy.daysUntil <= 7 ? 'bg-red-500' :
                strategy.daysUntil <= 14 ? 'bg-orange-500' :
                'bg-white/20'
              }`}>
                D-{strategy.daysUntil}
              </div>
              <button onClick={onClose} className="mt-2 text-white/60 hover:text-white">
                ✕ 닫기
              </button>
            </div>
          </div>
        </div>

        {/* 알림 섹션 */}
        {strategy.alerts.length > 0 && (
          <div className="px-6 pt-4">
            {strategy.alerts.map((alert, idx) => (
              <div key={idx} className={`flex items-start gap-3 p-3 rounded-lg mb-2 ${
                alert.type === 'warning' ? 'bg-amber-50 border border-amber-200' :
                alert.type === 'tip' ? 'bg-green-50 border border-green-200' :
                'bg-blue-50 border border-blue-200'
              }`}>
                <span>{alert.type === 'warning' ? '⚠️' : alert.type === 'tip' ? '💡' : 'ℹ️'}</span>
                <p className="text-sm">{alert.message}</p>
              </div>
            ))}
          </div>
        )}

        {/* 탭 네비게이션 */}
        <div className="px-6 pt-4 border-b">
          <div className="flex gap-1">
            {[
              { id: 'overview', label: '📊 개요', },
              { id: 'timeline', label: '📅 타임라인' },
              { id: 'content', label: '✍️ 콘텐츠' },
              { id: 'impact', label: '📈 예상효과' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveSection(tab.id as any)}
                className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                  activeSection === tab.id
                    ? 'bg-white border border-b-0 border-gray-200 text-gray-900'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* 콘텐츠 */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {/* 개요 섹션 */}
          {activeSection === 'overview' && (
            <div className="space-y-6">
              {/* 추천 카테고리 */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <span>🏷️</span> 추천 카테고리 TOP 5
                </h3>
                <div className="grid gap-3">
                  {strategy.categoryRecommendations.map((cat) => (
                    <div key={cat.categoryId} className="flex items-center gap-4 bg-gray-50 rounded-lg p-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-idus-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                        {cat.rank}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{cat.categoryName}</span>
                          <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full">
                            수요 {cat.expectedDemandScore}점
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 mt-0.5">{cat.reason}</p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {cat.suggestedProducts.map((prod, idx) => (
                            <span key={idx} className="text-xs px-2 py-0.5 bg-white border rounded">
                              {prod}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 타겟 오디언스 */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <span>👥</span> 타겟 오디언스
                </h3>
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-lg">🎯</span>
                    <div>
                      <span className="font-medium">주요 타겟: </span>
                      <span>{strategy.targetAudience.primary}</span>
                    </div>
                  </div>
                  {strategy.targetAudience.secondary && (
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-lg">🎯</span>
                      <div>
                        <span className="font-medium">보조 타겟: </span>
                        <span>{strategy.targetAudience.secondary}</span>
                      </div>
                    </div>
                  )}
                  <div className="flex flex-wrap gap-2 mt-3">
                    {strategy.targetAudience.behaviors.map((behavior, idx) => (
                      <span key={idx} className="px-3 py-1 bg-white rounded-full text-sm">
                        {behavior}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* 프로모션 제안 */}
              {strategy.promotionStrategy.discountSuggestion && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <span>💰</span> 프로모션 제안
                  </h3>
                  <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-lg p-4 border border-red-100">
                    <div className="flex items-center gap-3">
                      <div className="text-3xl font-bold text-red-600">
                        {strategy.promotionStrategy.discountSuggestion.type === 'percentage' 
                          ? `${strategy.promotionStrategy.discountSuggestion.value}%`
                          : strategy.promotionStrategy.discountSuggestion.type === 'freeShipping'
                          ? '무료배송'
                          : `${strategy.promotionStrategy.discountSuggestion.value}원`
                        }
                      </div>
                      <div className="text-sm text-gray-600">
                        {strategy.promotionStrategy.discountSuggestion.rationale}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 번들 제안 */}
              {strategy.promotionStrategy.bundleSuggestion && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <span>🎁</span> 번들 세트 제안
                  </h3>
                  <div className="bg-purple-50 rounded-lg p-4 border border-purple-100">
                    <p className="font-medium text-purple-800 mb-2">
                      {strategy.promotionStrategy.bundleSuggestion.theme}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {strategy.promotionStrategy.bundleSuggestion.products.map((prod, idx) => (
                        <span key={idx} className="px-3 py-1 bg-white rounded-full text-sm">
                          {prod}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 타임라인 섹션 */}
          {activeSection === 'timeline' && (
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 mb-4">📅 캠페인 타임라인</h3>
              
              <div className="relative">
                {/* 타임라인 연결선 */}
                <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200"></div>
                
                {strategy.promotionStrategy.timeline.map((phase, idx) => (
                  <div key={idx} className="relative flex gap-4 pb-6">
                    {/* 점 */}
                    <div className={`relative z-10 w-12 h-12 rounded-full flex items-center justify-center ${
                      phaseColors[phase.phase] || 'bg-gray-100'
                    }`}>
                      {phase.phase === 'awareness' ? '📢' :
                       phase.phase === 'consideration' ? '🔍' :
                       phase.phase === 'conversion' ? '💳' : '🔄'}
                    </div>
                    
                    {/* 내용 */}
                    <div className="flex-1 bg-white border rounded-lg p-4 shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold">{phase.phaseName}</h4>
                        <span className="text-sm text-gray-500">
                          {phase.startDate} ~ {phase.endDate}
                        </span>
                      </div>
                      
                      <div className="space-y-2">
                        <div>
                          <p className="text-xs text-gray-500 mb-1">주요 액션</p>
                          <ul className="text-sm space-y-1">
                            {phase.actions.map((action, aIdx) => (
                              <li key={aIdx} className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full"></span>
                                {action}
                              </li>
                            ))}
                          </ul>
                        </div>
                        
                        <div className="flex items-center gap-2 pt-2">
                          <span className="text-xs text-gray-500">채널:</span>
                          {phase.channels.map((channel, cIdx) => (
                            <span key={cIdx} className="text-xs px-2 py-0.5 bg-gray-100 rounded">
                              {channel}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 콘텐츠 섹션 */}
          {activeSection === 'content' && (
            <div className="space-y-6">
              {/* 키 메시지 */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <span>💬</span> 핵심 메시지
                </h3>
                <div className="space-y-2">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <span className="text-xs text-gray-500">🇰🇷 한국어</span>
                    <p className="font-medium mt-1">{strategy.contentStrategy.keyMessages.korean}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <span className="text-xs text-gray-500">🇺🇸 영어</span>
                    <p className="font-medium mt-1">{strategy.contentStrategy.keyMessages.english}</p>
                  </div>
                  {strategy.contentStrategy.keyMessages.local && (
                    <div className="bg-gray-50 rounded-lg p-3">
                      <span className="text-xs text-gray-500">🌏 현지어</span>
                      <p className="font-medium mt-1">{strategy.contentStrategy.keyMessages.local}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* 테마 & 트렌드 */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <span>🔥</span> 테마 & 트렌드
                </h3>
                <div className="flex flex-wrap gap-2">
                  {strategy.contentStrategy.themes.map((theme, idx) => (
                    <span key={idx} className="px-3 py-1.5 bg-gradient-to-r from-idus-500/10 to-pink-500/10 rounded-full font-medium">
                      #{theme}
                    </span>
                  ))}
                </div>
              </div>

              {/* 비주얼 가이드 */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <span>🎨</span> 비주얼 가이드라인
                </h3>
                <div className="flex flex-wrap gap-2">
                  {strategy.contentStrategy.visualGuidelines.map((guide, idx) => (
                    <span key={idx} className="px-3 py-1 bg-gray-100 rounded-lg text-sm">
                      {guide}
                    </span>
                  ))}
                </div>
              </div>

              {/* 해시태그 */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <span>#️⃣</span> 추천 해시태그
                </h3>
                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    {strategy.contentStrategy.hashtags.join(' ')}
                  </p>
                  <button 
                    onClick={() => navigator.clipboard.writeText(strategy.contentStrategy.hashtags.join(' '))}
                    className="mt-2 text-xs text-blue-600 hover:underline"
                  >
                    📋 복사하기
                  </button>
                </div>
              </div>

              {/* 콘텐츠 아이디어 */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <span>💡</span> 콘텐츠 아이디어
                </h3>
                <div className="space-y-2">
                  {strategy.contentStrategy.contentIdeas.map((idea, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-3 bg-white border rounded-lg">
                      <span className="text-lg">{idx === 0 ? '📝' : idx === 1 ? '📸' : idx === 2 ? '🎬' : '📊'}</span>
                      <span className="text-sm">{idea}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 플랫폼 */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <span>📱</span> 추천 플랫폼
                </h3>
                <div className="flex gap-3">
                  {strategy.contentStrategy.platforms.map((platform, idx) => (
                    <div key={idx} className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg">
                      <span>
                        {platform === 'Instagram' ? '📷' : 
                         platform === 'Facebook' ? '👥' : 
                         platform === 'Blog' ? '✍️' :
                         platform === 'Email' ? '📧' :
                         platform === 'Push' ? '🔔' : '📱'}
                      </span>
                      <span className="text-sm font-medium">{platform}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 예상 효과 섹션 */}
          {activeSection === 'impact' && (
            <div className="space-y-6">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <span>📈</span> 예상 성과
              </h3>
              
              <div className="grid md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 text-center">
                  <div className="text-3xl mb-2">📊</div>
                  <div className="text-2xl font-bold text-blue-700">
                    {strategy.projectedImpact.trafficIncrease}
                  </div>
                  <div className="text-sm text-blue-600 mt-1">트래픽 증가</div>
                </div>
                
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 text-center">
                  <div className="text-3xl mb-2">💳</div>
                  <div className="text-2xl font-bold text-green-700">
                    {strategy.projectedImpact.conversionLift}
                  </div>
                  <div className="text-sm text-green-600 mt-1">전환율 상승</div>
                </div>
                
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 text-center">
                  <div className="text-3xl mb-2">💰</div>
                  <div className="text-2xl font-bold text-purple-700">
                    {strategy.projectedImpact.revenueOpportunity}
                  </div>
                  <div className="text-sm text-purple-600 mt-1">매출 기회</div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">예측 신뢰도</span>
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${
                      strategy.projectedImpact.confidence === 'high' ? 'bg-green-500' :
                      strategy.projectedImpact.confidence === 'medium' ? 'bg-yellow-500' :
                      'bg-red-500'
                    }`}></div>
                    <span className="font-medium">
                      {strategy.projectedImpact.confidence === 'high' ? '높음' :
                       strategy.projectedImpact.confidence === 'medium' ? '중간' : '낮음'}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  * 예측치는 과거 데이터와 시장 트렌드를 기반으로 산출되었습니다.
                </p>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <h4 className="font-semibold text-amber-800 mb-2">📋 체크리스트</h4>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <input type="checkbox" className="rounded border-amber-300" />
                    <span>캠페인 기획서 작성</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <input type="checkbox" className="rounded border-amber-300" />
                    <span>콘텐츠 에셋 제작</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <input type="checkbox" className="rounded border-amber-300" />
                    <span>프로모션 설정</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <input type="checkbox" className="rounded border-amber-300" />
                    <span>채널별 배포 스케줄 확정</span>
                  </li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* 푸터 */}
        <div className="border-t p-4 bg-gray-50 rounded-b-xl flex items-center justify-between">
          <p className="text-xs text-gray-500">
            생성일시: {new Date(strategy.generatedAt).toLocaleString('ko-KR')}
          </p>
          <div className="flex gap-2">
            <button className="btn btn-secondary text-sm">
              📄 리포트 내보내기
            </button>
            <button className="btn btn-primary text-sm">
              📋 캠페인 등록
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

