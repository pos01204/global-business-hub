'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { reviewsApi } from '@/lib/api'

export default function ReviewsPage() {
  const [selectedCountry, setSelectedCountry] = useState<string>('')
  const [showImageOnly, setShowImageOnly] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedReview, setSelectedReview] = useState<any>(null)

  // 하이라이트 리뷰 (상단 쇼케이스)
  const { data: highlightsData } = useQuery({
    queryKey: ['reviews-highlights'],
    queryFn: () => reviewsApi.getHighlights(8),
    staleTime: 5 * 60 * 1000,
  })

  // 갤러리 데이터
  const { data: galleryData, isLoading } = useQuery({
    queryKey: ['reviews-gallery', selectedCountry, showImageOnly, currentPage],
    queryFn: () => reviewsApi.getGallery({
      country: selectedCountry || undefined,
      hasImage: showImageOnly || undefined,
      page: currentPage,
      pageSize: 20,
    }),
    staleTime: 3 * 60 * 1000,
  })

  // 통계
  const { data: statsData } = useQuery({
    queryKey: ['reviews-stats'],
    queryFn: reviewsApi.getStats,
    staleTime: 5 * 60 * 1000,
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-rose-50 to-violet-50">
      {/* 히어로 섹션 */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-rose-400/20 via-purple-400/20 to-indigo-400/20 blur-3xl" />
        <div className="relative max-w-7xl mx-auto px-6 py-16">
          <div className="text-center">
            <h1 className="text-5xl font-bold bg-gradient-to-r from-rose-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent mb-4">
              Global Customer Reviews
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              전 세계 고객들의 소중한 후기를 만나보세요 ✨
            </p>
            
            {/* 통계 배지 */}
            {statsData?.data && (
              <div className="flex justify-center gap-6 flex-wrap">
                <StatBadge 
                  icon="💬" 
                  value={statsData.data.totalReviews.toLocaleString()} 
                  label="Total Reviews" 
                  color="rose"
                />
                <StatBadge 
                  icon="⭐" 
                  value={statsData.data.avgRating} 
                  label="Average Rating" 
                  color="amber"
                />
                <StatBadge 
                  icon="📸" 
                  value={`${statsData.data.imageReviewRate}%`} 
                  label="Photo Reviews" 
                  color="purple"
                />
                <StatBadge 
                  icon="🌍" 
                  value={statsData.data.countries?.length || 0} 
                  label="Countries" 
                  color="indigo"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 하이라이트 섹션 */}
      {highlightsData?.data && highlightsData.data.length > 0 && (
        <div className="max-w-7xl mx-auto px-6 py-12">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
            <span className="text-3xl">✨</span>
            Featured Reviews
          </h2>
          <div className="grid grid-cols-4 gap-4">
            {highlightsData.data.slice(0, 4).map((review: any, idx: number) => (
              <HighlightCard 
                key={review.id} 
                review={review} 
                featured={idx === 0}
                onClick={() => setSelectedReview(review)}
              />
            ))}
          </div>
        </div>
      )}

      {/* 필터 바 */}
      <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-lg border-y border-gray-200/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            {/* 국가 필터 */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              <button
                onClick={() => { setSelectedCountry(''); setCurrentPage(1); }}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                  !selectedCountry 
                    ? 'bg-gradient-to-r from-rose-500 to-purple-500 text-white shadow-md' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                🌏 All
              </button>
              {galleryData?.data?.filters?.countries?.slice(0, 8).map((c: any) => (
                <button
                  key={c.code}
                  onClick={() => { setSelectedCountry(c.code); setCurrentPage(1); }}
                  className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                    selectedCountry === c.code 
                      ? 'bg-gradient-to-r from-rose-500 to-purple-500 text-white shadow-md' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {c.emoji} {c.name}
                  <span className="ml-1 text-xs opacity-70">({c.count})</span>
                </button>
              ))}
            </div>

            {/* 이미지 필터 */}
            <button
              onClick={() => { setShowImageOnly(!showImageOnly); setCurrentPage(1); }}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
                showImageOnly 
                  ? 'bg-purple-100 text-purple-700 ring-2 ring-purple-300' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              📷 Photo Only
            </button>
          </div>
        </div>
      </div>

      {/* 갤러리 그리드 */}
      <div className="max-w-7xl mx-auto px-6 py-10">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="w-12 h-12 border-4 border-rose-200 border-t-rose-500 rounded-full animate-spin" />
          </div>
        ) : galleryData?.data?.reviews?.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {galleryData.data.reviews.map((review: any) => (
                <ReviewCard 
                  key={review.id} 
                  review={review} 
                  onClick={() => setSelectedReview(review)}
                />
              ))}
            </div>

            {/* 페이지네이션 */}
            {galleryData.data.pagination.totalPages > 1 && (
              <div className="flex justify-center items-center gap-4 mt-12">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-6 py-3 bg-white rounded-xl shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  ← Previous
                </button>
                <div className="flex items-center gap-2">
                  {Array.from({ length: Math.min(5, galleryData.data.pagination.totalPages) }, (_, i) => {
                    const page = currentPage <= 3 ? i + 1 : currentPage - 2 + i;
                    if (page > galleryData.data.pagination.totalPages) return null;
                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`w-10 h-10 rounded-xl font-medium transition-all ${
                          currentPage === page
                            ? 'bg-gradient-to-r from-rose-500 to-purple-500 text-white shadow-md'
                            : 'bg-white text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}
                </div>
                <button
                  onClick={() => setCurrentPage(p => Math.min(galleryData.data.pagination.totalPages, p + 1))}
                  disabled={currentPage === galleryData.data.pagination.totalPages}
                  className="px-6 py-3 bg-white rounded-xl shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  Next →
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-20 text-gray-500">
            <div className="text-6xl mb-4">📭</div>
            <p>아직 등록된 리뷰가 없습니다</p>
          </div>
        )}
      </div>

      {/* 리뷰 상세 모달 */}
      {selectedReview && (
        <ReviewModal review={selectedReview} onClose={() => setSelectedReview(null)} />
      )}
    </div>
  )
}

// 통계 배지
function StatBadge({ icon, value, label, color }: { icon: string; value: string | number; label: string; color: string }) {
  const colorClasses: Record<string, string> = {
    rose: 'from-rose-400 to-rose-600',
    amber: 'from-amber-400 to-amber-600',
    purple: 'from-purple-400 to-purple-600',
    indigo: 'from-indigo-400 to-indigo-600',
  }

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl px-6 py-4 shadow-lg border border-white/50">
      <div className="flex items-center gap-3">
        <span className="text-2xl">{icon}</span>
        <div>
          <p className={`text-2xl font-bold bg-gradient-to-r ${colorClasses[color]} bg-clip-text text-transparent`}>
            {value}
          </p>
          <p className="text-xs text-gray-500 uppercase tracking-wider">{label}</p>
        </div>
      </div>
    </div>
  )
}

// 하이라이트 카드
function HighlightCard({ review, featured, onClick }: { review: any; featured?: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`group relative overflow-hidden rounded-2xl bg-white shadow-lg hover:shadow-2xl transition-all duration-300 text-left ${
        featured ? 'col-span-2 row-span-2' : ''
      }`}
    >
      {review.imageUrl && (
        <div className={`relative overflow-hidden ${featured ? 'h-80' : 'h-48'}`}>
          <img 
            src={review.imageUrl} 
            alt="" 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        </div>
      )}
      <div className={`${review.imageUrl ? 'absolute bottom-0 left-0 right-0' : ''} p-4 ${review.imageUrl ? 'text-white' : ''}`}>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-lg">{review.countryInfo?.emoji}</span>
          <span className="text-sm opacity-80">{review.countryInfo?.name}</span>
          <span className="px-2 py-0.5 bg-amber-400/90 text-amber-900 rounded text-xs font-medium">
            ★ {review.rating}
          </span>
        </div>
        <p className={`line-clamp-2 text-sm ${featured ? 'line-clamp-3' : ''}`}>
          "{review.contents}"
        </p>
      </div>
    </button>
  )
}

// 리뷰 카드
function ReviewCard({ review, onClick }: { review: any; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="group bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden text-left"
    >
      {review.imageUrl && (
        <div className="relative h-48 overflow-hidden">
          <img 
            src={review.imageUrl} 
            alt="" 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute top-3 right-3">
            <span className="px-2 py-1 bg-white/90 backdrop-blur-sm rounded-full text-xs font-medium text-amber-600 shadow">
              ★ {review.rating}
            </span>
          </div>
        </div>
      )}
      <div className="p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">{review.countryInfo?.emoji}</span>
            <span className="text-sm text-gray-500">{review.countryInfo?.name}</span>
          </div>
          {!review.imageUrl && (
            <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">
              ★ {review.rating}
            </span>
          )}
        </div>
        <p className="text-gray-700 text-sm leading-relaxed line-clamp-3 mb-3">
          "{review.contents || '...'}"
        </p>
        <div className="pt-3 border-t border-gray-100">
          <p className="text-xs text-gray-400 truncate">🎨 {review.artistName}</p>
          <p className="text-xs text-gray-500 truncate mt-1 font-medium">{review.productName}</p>
        </div>
      </div>
    </button>
  )
}

// 리뷰 상세 모달
function ReviewModal({ review, onClose }: { review: any; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div 
        className="relative bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* 이미지 */}
        {review.imageUrl && (
          <div className="relative h-80">
            <img 
              src={review.imageUrl} 
              alt="" 
              className="w-full h-full object-cover"
            />
            <button
              onClick={onClose}
              className="absolute top-4 right-4 w-10 h-10 bg-black/50 backdrop-blur-sm rounded-full text-white hover:bg-black/70 transition-colors flex items-center justify-center"
            >
              ✕
            </button>
            <div className="absolute bottom-4 left-4 flex items-center gap-2">
              <span className="px-3 py-1.5 bg-white/90 backdrop-blur-sm rounded-full text-amber-600 font-semibold shadow">
                ★ {review.rating}/10
              </span>
            </div>
          </div>
        )}

        {/* 컨텐츠 */}
        <div className="p-8">
          {!review.imageUrl && (
            <button
              onClick={onClose}
              className="absolute top-4 right-4 w-10 h-10 bg-gray-100 rounded-full text-gray-500 hover:bg-gray-200 transition-colors flex items-center justify-center"
            >
              ✕
            </button>
          )}

          {/* 국가 & 날짜 */}
          <div className="flex items-center gap-3 mb-4">
            <span className="text-3xl">{review.countryInfo?.emoji}</span>
            <div>
              <p className="font-semibold text-gray-800">{review.countryInfo?.name}</p>
              <p className="text-sm text-gray-400">{review.date}</p>
            </div>
            {!review.imageUrl && (
              <span className="ml-auto px-3 py-1.5 bg-amber-100 text-amber-700 rounded-full font-semibold">
                ★ {review.rating}/10
              </span>
            )}
          </div>

          {/* 리뷰 내용 */}
          <div className="bg-gradient-to-br from-gray-50 to-rose-50/30 rounded-2xl p-6 mb-6">
            <p className="text-gray-700 leading-relaxed text-lg">
              "{review.contents || '...'}"
            </p>
          </div>

          {/* 상품 정보 */}
          <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
            <div className="w-12 h-12 bg-gradient-to-br from-rose-400 to-purple-500 rounded-xl flex items-center justify-center text-white text-xl">
              🎨
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-800 truncate">{review.productName}</p>
              <p className="text-sm text-gray-500">by {review.artistName}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
