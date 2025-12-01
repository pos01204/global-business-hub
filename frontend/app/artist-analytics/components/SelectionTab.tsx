'use client'

import { useQuery } from '@tanstack/react-query'
import { artistAnalyticsApi } from '@/lib/api'
import { Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

export default function SelectionTab() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['artist-analytics-selection'],
    queryFn: () => artistAnalyticsApi.getSelection({ months: 12 }),
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600"></div>
      </div>
    )
  }

  if (error || !data?.success) {
    return <div className="card bg-red-50 p-6 text-red-600">데이터 로드 실패</div>
  }

  const { summary, monthlyTrend, churnReasons, onboarding, deletedArtists, recentRegistrations, noProductArtists, _debug } = data

  // 디버그 정보 콘솔 출력
  if (_debug) {
    console.log('[SelectionTab] Debug info:', _debug)
  }

  const formatCurrency = (value: number) => {
    if (value >= 10000) return `₩${(value / 10000).toFixed(0)}만`
    return `₩${value.toLocaleString()}`
  }

  // 월별 등록/이탈 차트
  const trendChartData = {
    labels: monthlyTrend.map((m: any) => m.month),
    datasets: [
      {
        label: '신규 등록',
        data: monthlyTrend.map((m: any) => m.registered),
        backgroundColor: '#10B981',
      },
      {
        label: '이탈',
        data: monthlyTrend.map((m: any) => -m.deleted),
        backgroundColor: '#EF4444',
      },
    ],
  }

  return (
    <div className="space-y-6">
      {/* 핵심 KPI */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card hover:shadow-lg transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">총 등록 작가</p>
              <p className="text-3xl font-bold text-gray-900">{summary.totalRegistered.toLocaleString()}<span className="text-lg font-normal text-gray-500">명</span></p>
            </div>
            <div className="w-12 h-12 bg-violet-100 rounded-xl flex items-center justify-center">
              <span className="text-2xl">👥</span>
            </div>
          </div>
        </div>

        <div className="card hover:shadow-lg transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">활성 작가</p>
              <p className="text-3xl font-bold text-emerald-600">{summary.activeArtists.toLocaleString()}<span className="text-lg font-normal text-gray-500">명</span></p>
              <p className="text-xs text-gray-400 mt-1">전체의 {Math.round((summary.activeArtists / summary.totalRegistered) * 100)}%</p>
            </div>
            <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
              <span className="text-2xl">✅</span>
            </div>
          </div>
        </div>

        <div className="card hover:shadow-lg transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">이탈 작가</p>
              <p className="text-3xl font-bold text-red-600">{summary.deletedArtists.toLocaleString()}<span className="text-lg font-normal text-gray-500">명</span></p>
              <p className="text-xs text-gray-400 mt-1">이탈률 {summary.churnRate}%</p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
              <span className="text-2xl">🚪</span>
            </div>
          </div>
        </div>

        <div className="card hover:shadow-lg transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">작품 미등록</p>
              <p className="text-3xl font-bold text-amber-600">{summary.noProductArtists.toLocaleString()}<span className="text-lg font-normal text-gray-500">명</span></p>
              <p className="text-xs text-gray-400 mt-1">온보딩 필요</p>
            </div>
            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
              <span className="text-2xl">📦</span>
            </div>
          </div>
        </div>
      </div>

      {/* 월별 등록/이탈 추이 */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4">📈 월별 작가 등록/이탈 추이</h3>
        <div className="h-64">
          <Bar
            data={trendChartData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: { position: 'bottom' },
                tooltip: {
                  callbacks: {
                    label: (context) => {
                      const value = Math.abs(context.raw as number)
                      return `${context.dataset.label}: ${value}명`
                    },
                  },
                },
              },
              scales: {
                x: { stacked: true },
                y: {
                  stacked: true,
                  title: { display: true, text: '작가 수' },
                },
              },
            }}
          />
        </div>
        <div className="mt-4 flex justify-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-emerald-500 rounded"></span>
            <span>순증감: </span>
            <span className="font-semibold">
              {monthlyTrend.reduce((sum: number, m: any) => sum + m.netChange, 0) >= 0 ? '+' : ''}
              {monthlyTrend.reduce((sum: number, m: any) => sum + m.netChange, 0)}명
            </span>
          </div>
        </div>
      </div>


      {/* 이탈 분석 & 온보딩 현황 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 이탈 사유 분포 */}
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">📊 이탈 사유 분석</h3>
          <div className="space-y-3">
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm font-medium text-gray-700">판매 없이 이탈</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-gray-900">{churnReasons.noSales.count}명</span>
                  <span className="text-xs text-gray-500 w-12 text-right">{churnReasons.noSales.rate}%</span>
                </div>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-gray-400 rounded-full" style={{ width: `${churnReasons.noSales.rate}%` }} />
              </div>
              <p className="text-xs text-gray-500 mt-1">등록만 하고 판매 실적 없이 이탈</p>
            </div>

            <div className="p-3 bg-amber-50 rounded-lg">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm font-medium text-gray-700">저조한 판매 후 이탈</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-gray-900">{churnReasons.lowSales.count}명</span>
                  <span className="text-xs text-gray-500 w-12 text-right">{churnReasons.lowSales.rate}%</span>
                </div>
              </div>
              <div className="h-2 bg-amber-200 rounded-full overflow-hidden">
                <div className="h-full bg-amber-500 rounded-full" style={{ width: `${churnReasons.lowSales.rate}%` }} />
              </div>
              <p className="text-xs text-gray-500 mt-1">판매 실적이 있었으나 저조</p>
            </div>

            <div className="p-3 bg-red-50 rounded-lg">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm font-medium text-gray-700">활발한 활동 후 이탈</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-gray-900">{churnReasons.activeThenChurn.count}명</span>
                  <span className="text-xs text-gray-500 w-12 text-right">{churnReasons.activeThenChurn.rate}%</span>
                </div>
              </div>
              <div className="h-2 bg-red-200 rounded-full overflow-hidden">
                <div className="h-full bg-red-500 rounded-full" style={{ width: `${churnReasons.activeThenChurn.rate}%` }} />
              </div>
              <p className="text-xs text-gray-500 mt-1">VIP/High 세그먼트였던 작가 ⚠️</p>
            </div>
          </div>
        </div>

        {/* 신규 작가 온보딩 현황 */}
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">🆕 신규 작가 온보딩 (최근 30일)</h3>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="text-center p-4 bg-blue-50 rounded-xl">
              <p className="text-2xl font-bold text-blue-600">{onboarding.recentCount}명</p>
              <p className="text-sm text-gray-600">신규 등록</p>
            </div>
            <div className="text-center p-4 bg-emerald-50 rounded-xl">
              <p className="text-2xl font-bold text-emerald-600">{onboarding.firstSaleConversionRate}%</p>
              <p className="text-sm text-gray-600">첫 판매 전환율</p>
            </div>
          </div>
          {onboarding.avgDaysToFirstSale !== null && (
            <div className="p-3 bg-gray-50 rounded-lg text-center">
              <p className="text-sm text-gray-600">첫 판매까지 평균</p>
              <p className="text-xl font-bold text-violet-600">{onboarding.avgDaysToFirstSale}일</p>
            </div>
          )}
          <div className="mt-4 p-3 bg-violet-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-2">작가당 평균 작품 수</p>
            <div className="flex justify-around">
              <div className="text-center">
                <p className="text-lg font-bold text-violet-600">{summary.avgProductsPerArtist.kr}개</p>
                <p className="text-xs text-gray-500">KR</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-violet-600">{summary.avgProductsPerArtist.global}개</p>
                <p className="text-xs text-gray-500">Global</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 신규 등록 & 이탈 작가 리스트 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 최근 등록 작가 */}
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">✨ 최근 등록 작가</h3>
          {recentRegistrations.length > 0 ? (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {recentRegistrations.map((artist: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between p-2 bg-emerald-50 rounded-lg">
                  <div>
                    <span className="font-medium">{artist.artistName}</span>
                    <span className="text-xs text-gray-500 ml-2">{artist.registrationDate}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {artist.hasSales ? (
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded text-xs">판매 시작</span>
                    ) : (
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">대기 중</span>
                    )}
                    <span className="text-xs text-gray-500">
                      {artist.products.global > 0 ? `${artist.products.global}개` : '작품 없음'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">최근 30일 내 신규 등록 작가가 없습니다.</p>
          )}
        </div>

        {/* 이탈 작가 */}
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">🚪 최근 이탈 작가</h3>
          {deletedArtists.length > 0 ? (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {deletedArtists.slice(0, 10).map((artist: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between p-2 bg-red-50 rounded-lg">
                  <div>
                    <span className="font-medium">{artist.artistName}</span>
                    <span className="text-xs text-gray-500 ml-2">삭제: {artist.deletionDate}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-xs ${
                      artist.churnReason === '활발한 활동 후 이탈' 
                        ? 'bg-red-100 text-red-700' 
                        : artist.churnReason === '저조한 판매 후 이탈'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-gray-100 text-gray-600'
                    }`}>
                      {artist.churnReason === '활발한 활동 후 이탈' ? '⚠️ ' : ''}{artist.churnReason}
                    </span>
                    {artist.totalGmv > 0 && (
                      <span className="text-xs text-gray-500">{formatCurrency(artist.totalGmv)}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">이탈 작가 데이터가 없습니다.</p>
          )}
        </div>
      </div>

      {/* 작품 미등록 작가 */}
      {noProductArtists.length > 0 && (
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">⚠️ 작품 미등록 작가 (온보딩 필요)</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-3">작가명</th>
                  <th className="text-center py-2 px-3">등록일</th>
                  <th className="text-center py-2 px-3">경과일</th>
                  <th className="text-center py-2 px-3">판매 여부</th>
                </tr>
              </thead>
              <tbody>
                {noProductArtists.slice(0, 10).map((artist: any, idx: number) => (
                  <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-2 px-3 font-medium">{artist.artistName}</td>
                    <td className="py-2 px-3 text-center text-gray-600">{artist.registrationDate || '-'}</td>
                    <td className="py-2 px-3 text-center">
                      {artist.daysSinceRegistration !== null ? (
                        <span className={artist.daysSinceRegistration > 30 ? 'text-red-600 font-medium' : ''}>
                          {artist.daysSinceRegistration}일
                        </span>
                      ) : '-'}
                    </td>
                    <td className="py-2 px-3 text-center">
                      {artist.hasSales ? (
                        <span className="text-emerald-600">✓</span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {noProductArtists.length > 10 && (
            <p className="text-sm text-gray-500 mt-3 text-center">
              외 {noProductArtists.length - 10}명 더 있음
            </p>
          )}
        </div>
      )}

      {/* 디버그 정보 (개발용) */}
      {_debug && (
        <details className="card">
          <summary className="cursor-pointer text-sm text-gray-500 font-medium">
            🔧 디버그 정보 (클릭하여 펼치기)
          </summary>
          <div className="mt-4 space-y-3 text-xs">
            <div>
              <p className="font-medium text-gray-700">Artists 시트 컬럼명:</p>
              <p className="text-gray-500 break-all">{_debug.artistsSheetColumns?.join(', ') || '없음'}</p>
            </div>
            <div>
              <p className="font-medium text-gray-700">샘플 데이터:</p>
              <pre className="bg-gray-100 p-2 rounded overflow-x-auto text-xs">
                {JSON.stringify(_debug.artistsSampleRow, null, 2)}
              </pre>
            </div>
            <div className="flex gap-4">
              <p><span className="font-medium">시트 내 작가 수:</span> {_debug.totalArtistsInSheet}</p>
              <p><span className="font-medium">판매 기록 있는 작가:</span> {_debug.logisticsArtistCount}</p>
            </div>
          </div>
        </details>
      )}
    </div>
  )
}
