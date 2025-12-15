'use client'

import { useState, useEffect, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { reviewsApi } from '@/lib/api'
import { Icon } from '@/components/ui/Icon'
import { EnhancedLoadingPage } from '@/components/ui'
import { Palette } from 'lucide-react'

// 국가별 테마 컬러 (그라데이션 제거)
const countryThemes: Record<string, { bg: string; accent: string }> = {
  JP: { bg: 'bg-pink-100', accent: 'text-pink-600' },
  US: { bg: 'bg-blue-100', accent: 'text-blue-600' },
  SG: { bg: 'bg-red-100', accent: 'text-red-600' },
  HK: { bg: 'bg-rose-100', accent: 'text-rose-600' },
  AU: { bg: 'bg-emerald-100', accent: 'text-emerald-600' },
  PL: { bg: 'bg-red-100', accent: 'text-red-600' },
  CA: { bg: 'bg-red-100', accent: 'text-red-600' },
  GB: { bg: 'bg-blue-100', accent: 'text-blue-700' },
  NL: { bg: 'bg-orange-100', accent: 'text-orange-600' },
  FR: { bg: 'bg-blue-100', accent: 'text-blue-600' },
  DEFAULT: { bg: 'bg-violet-100', accent: 'text-violet-600' },
}

export default function ReviewsPage() {
  const [selectedCountry, setSelectedCountry] = useState<string>('')
  const [showImageOnly, setShowImageOnly] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedReview, setSelectedReview] = useState<any>(null)
  const [featuredIndex, setFeaturedIndex] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortOption, setSortOption] = useState<'latest' | 'rating' | 'popular'>('latest')
  const featuredRef = useRef<HTMLDivElement>(null)

  // 하이라이트 리뷰
  const { data: highlightsData } = useQuery({
    queryKey: ['reviews-highlights'],
    queryFn: () => reviewsApi.getHighlights(12),
    staleTime: 5 * 60 * 1000,
  })

  // 갤러리 데이터
  const { data: galleryData, isLoading } = useQuery({
    queryKey: ['reviews-gallery', selectedCountry, showImageOnly, currentPage, searchQuery, sortOption],
    queryFn: () => reviewsApi.getGallery({
      country: selectedCountry || undefined,
      hasImage: showImageOnly || undefined,
      page: currentPage,
      pageSize: 24,
      minRating: 7,
      search: searchQuery || undefined,
      sort: sortOption,
    }),
    staleTime: 3 * 60 * 1000,
  })

  // 통계
  const { data: statsData } = useQuery({
    queryKey: ['reviews-stats'],
    queryFn: reviewsApi.getStats,
    staleTime: 5 * 60 * 1000,
  })

  // Featured 자동 슬라이드
  useEffect(() => {
    if (!highlightsData?.data?.length) return
    const timer = setInterval(() => {
      setFeaturedIndex(prev => (prev + 1) % Math.min(highlightsData.data.length, 6))
    }, 5000)
    return () => clearInterval(timer)
  }, [highlightsData])

  const getTheme = (country: string) => countryThemes[country] || countryThemes.DEFAULT

  return (
    <div className="min-h-screen bg-[#faf9f7]">
      {/* Hero Section with Featured Review */}
      <div className="relative overflow-hidden bg-gradient-to-br from-stone-900 via-stone-800 to-stone-900">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>

        <div className="relative max-w-7xl mx-auto px-6 py-16">
          {/* Header */}
          <div className="text-center mb-12">
            <p className="text-amber-400 text-sm font-medium tracking-widest uppercase mb-3">
              Global Customer Reviews
            </p>
            <h1 className="text-5xl md:text-6xl font-light text-white mb-4 tracking-tight">
              Stories from <span className="font-semibold">Around the World</span>
            </h1>
            <p className="text-stone-400 text-lg max-w-2xl mx-auto">
              전 세계 {statsData?.data?.countries?.length || 0}개국 고객들의 진솔한 이야기
            </p>
          </div>

          {/* Featured Carousel */}
          {highlightsData?.data && highlightsData.data.length > 0 && (
            <div className="relative" ref={featuredRef}>
              <div className="flex gap-6 items-stretch">
                {/* Main Featured */}
                <div className="flex-[2] relative group cursor-pointer" onClick={() => setSelectedReview(highlightsData.data[featuredIndex])}>
                  <div className="relative h-[400px] rounded-2xl overflow-hidden">
                    <img 
                      src={highlightsData.data[featuredIndex]?.imageUrl} 
                      alt="" 
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-8">
                      <div className="flex items-center gap-3 mb-4">
                        <span className="text-3xl">{highlightsData.data[featuredIndex]?.countryInfo?.emoji}</span>
                        <span className="text-white/80 text-sm">{highlightsData.data[featuredIndex]?.countryInfo?.name}</span>
                        <span className="px-2 py-1 bg-amber-500 text-amber-900 rounded text-xs font-bold">
                          ★ {highlightsData.data[featuredIndex]?.rating}
                        </span>
                      </div>
                      <p className="text-white text-xl leading-relaxed line-clamp-3 font-light">
                        "{highlightsData.data[featuredIndex]?.contents}"
                      </p>
                      <p className="text-white/60 text-sm mt-4">
                        {highlightsData.data[featuredIndex]?.productName}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Side Featured */}
                <div className="flex-1 flex flex-col gap-4">
                  {highlightsData.data.slice(1, 4).map((review: any, idx: number) => (
                    <button
                      key={review.id}
                      onClick={() => { setFeaturedIndex(idx + 1); setSelectedReview(review); }}
                      className={`relative h-[120px] rounded-xl overflow-hidden group text-left transition-all ${
                        featuredIndex === idx + 1 ? 'ring-2 ring-amber-400' : ''
                      }`}
                    >
                      <img 
                        src={review.imageUrl} 
                        alt="" 
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-transparent" />
                      <div className="absolute inset-0 p-4 flex flex-col justify-center">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-lg">{review.countryInfo?.emoji}</span>
                          <span className="text-amber-400 text-xs font-bold">★ {review.rating}</span>
                        </div>
                        <p className="text-white text-sm line-clamp-2 font-light">"{review.contents}"</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Carousel Indicators */}
              <div className="flex justify-center gap-2 mt-6">
                {highlightsData.data.slice(0, 6).map((_: any, idx: number) => (
                  <button
                    key={idx}
                    onClick={() => setFeaturedIndex(idx)}
                    className={`h-1 rounded-full transition-all ${
                      featuredIndex === idx ? 'w-8 bg-amber-400' : 'w-2 bg-white/30 hover:bg-white/50'
                    }`}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Stats */}
          {statsData?.data && (
            <div className="flex justify-center gap-12 mt-12 pt-8 border-t border-white/10">
              <div className="text-center">
                <p className="text-4xl font-light text-white">{statsData.data.totalReviews.toLocaleString()}</p>
                <p className="text-stone-500 text-sm uppercase tracking-wider">Reviews</p>
              </div>
              <div className="text-center">
                <p className="text-4xl font-light text-amber-400">{statsData.data.avgRating}</p>
                <p className="text-stone-500 text-sm uppercase tracking-wider">Avg Rating</p>
              </div>
              <div className="text-center">
                <p className="text-4xl font-light text-white">{statsData.data.imageReviewRate}%</p>
                <p className="text-stone-500 text-sm uppercase tracking-wider">With Photos</p>
              </div>
              <div className="text-center">
                <p className="text-4xl font-light text-white">{statsData.data.countries?.length || 0}</p>
                <p className="text-stone-500 text-sm uppercase tracking-wider">Countries</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-stone-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          {/* 상단: 검색 + 정렬 */}
          <div className="flex items-center gap-4 mb-4">
            {/* 검색 입력 */}
            <div className="flex-1 relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                placeholder="작가명, 상품명, 리뷰 내용 검색..."
                className="w-full pl-10 pr-4 py-2.5 rounded-full border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all"
              />
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400">🔍</span>
              {searchQuery && (
                <button
                  onClick={() => { setSearchQuery(''); setCurrentPage(1); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                >
                  ✕
                </button>
              )}
            </div>

            {/* 정렬 옵션 */}
            <div className="flex items-center gap-2 bg-stone-100 rounded-full p-1">
              <button
                onClick={() => { setSortOption('latest'); setCurrentPage(1); }}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  sortOption === 'latest'
                    ? 'bg-white text-stone-800 shadow-sm'
                    : 'text-stone-500 hover:text-stone-700'
                }`}
              >
                최신순
              </button>
              <button
                onClick={() => { setSortOption('rating'); setCurrentPage(1); }}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  sortOption === 'rating'
                    ? 'bg-white text-stone-800 shadow-sm'
                    : 'text-stone-500 hover:text-stone-700'
                }`}
              >
                평점순
              </button>
              <button
                onClick={() => { setSortOption('popular'); setCurrentPage(1); }}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  sortOption === 'popular'
                    ? 'bg-white text-stone-800 shadow-sm'
                    : 'text-stone-500 hover:text-stone-700'
                }`}
              >
                인기순
              </button>
            </div>
          </div>

          {/* 하단: 국가 필터 + 포토 필터 */}
          <div className="flex items-center justify-between gap-4">
            {/* Country Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
              <button
                onClick={() => { setSelectedCountry(''); setCurrentPage(1); }}
                className={`px-5 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                  !selectedCountry 
                    ? 'bg-stone-900 text-white shadow-lg' 
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                All Countries
              </button>
              {galleryData?.data?.filters?.countries?.slice(0, 8).map((c: any) => (
                <button
                  key={c.code}
                  onClick={() => { setSelectedCountry(c.code); setCurrentPage(1); }}
                  className={`px-4 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-all flex items-center gap-2 ${
                    selectedCountry === c.code 
                      ? 'bg-stone-900 text-white shadow-lg' 
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}
                >
                  <span className="text-base">{c.emoji}</span>
                  <span>{c.name}</span>
                  <span className="text-xs opacity-60">({c.count})</span>
                </button>
              ))}
            </div>

            {/* Photo Filter */}
            <button
              onClick={() => { setShowImageOnly(!showImageOnly); setCurrentPage(1); }}
              className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all flex items-center gap-2 shrink-0 ${
                showImageOnly 
                  ? 'bg-amber-100 text-amber-700 ring-2 ring-amber-300' 
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              <span>📷</span>
              <span>Photo Only</span>
            </button>
          </div>
        </div>
      </div>

      {/* Gallery Grid - Masonry Style */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        {isLoading ? (
          <EnhancedLoadingPage message="고객 리뷰를 불러오는 중..." variant="default" size="md" />
        ) : galleryData?.data?.reviews?.length > 0 ? (
          <>
            {/* Masonry Grid */}
            <div className="columns-1 md:columns-2 lg:columns-3 xl:columns-4 gap-5 space-y-5">
              {galleryData.data.reviews.map((review: any, idx: number) => (
                review.imageUrl ? (
                  <PhotoReviewCard 
                    key={review.id} 
                    review={review} 
                    onClick={() => setSelectedReview(review)}
                    delay={idx * 50}
                  />
                ) : (
                  <TextReviewCard 
                    key={review.id} 
                    review={review} 
                    theme={getTheme(review.country)}
                    onClick={() => setSelectedReview(review)}
                    delay={idx * 50}
                  />
                )
              ))}
            </div>

            {/* Pagination */}
            {galleryData.data.pagination.totalPages > 1 && (
              <div className="flex justify-center items-center gap-3 mt-16">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-6 py-3 bg-white rounded-full shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all text-stone-600"
                >
                  ← 이전
                </button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(7, galleryData.data.pagination.totalPages) }, (_, i) => {
                    let page: number;
                    const total = galleryData.data.pagination.totalPages;
                    if (total <= 7) {
                      page = i + 1;
                    } else if (currentPage <= 4) {
                      page = i + 1;
                    } else if (currentPage >= total - 3) {
                      page = total - 6 + i;
                    } else {
                      page = currentPage - 3 + i;
                    }
                    if (page < 1 || page > total) return null;
                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`w-10 h-10 rounded-full font-medium transition-all ${
                          currentPage === page
                            ? 'bg-stone-900 text-white shadow-lg'
                            : 'bg-white text-stone-600 hover:bg-stone-100'
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
                  className="px-6 py-3 bg-white rounded-full shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all text-stone-600"
                >
                  다음 →
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-20">
            <div className="text-7xl mb-6">📭</div>
            <h3 className="text-2xl font-light text-stone-800 mb-2">아직 등록된 리뷰가 없습니다</h3>
            <p className="text-stone-500">Google Sheets의 review 시트에 데이터를 추가해주세요</p>
          </div>
        )}
      </div>

      {/* Review Modal */}
      {selectedReview && (
        <ReviewModal review={selectedReview} onClose={() => setSelectedReview(null)} />
      )}
    </div>
  )
}

// 포토 리뷰 카드
function PhotoReviewCard({ review, onClick, delay }: { review: any; onClick: () => void; delay: number }) {
  const [isVisible, setIsVisible] = useState(false)
  
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay)
    return () => clearTimeout(timer)
  }, [delay])

  return (
    <button
      onClick={onClick}
      className={`break-inside-avoid w-full bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 text-left group ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`}
    >
      <div className="relative overflow-hidden">
        <img 
          src={review.imageUrl} 
          alt="" 
          className="w-full object-cover transition-transform duration-700 group-hover:scale-105"
          style={{ minHeight: '200px', maxHeight: '400px' }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Rating Badge */}
        <div className="absolute top-3 right-3">
          <span className="px-2.5 py-1 bg-white/95 backdrop-blur-sm rounded-full text-xs font-bold text-amber-600 shadow-lg">
            ★ {review.rating}
          </span>
        </div>

        {/* Country Flag */}
        <div className="absolute top-3 left-3">
          <span className="text-2xl drop-shadow-lg">{review.countryInfo?.emoji}</span>
        </div>

        {/* Hover Content */}
        <div className="absolute bottom-0 left-0 right-0 p-5 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
          <p className="text-white text-sm leading-relaxed line-clamp-3">
            "{review.contents}"
          </p>
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-center gap-2 text-stone-400 text-xs mb-2">
          <span>{review.countryInfo?.name}</span>
          <span>•</span>
          <span>{review.date}</span>
        </div>
        <p className="text-stone-600 text-sm line-clamp-2 leading-relaxed">
          "{review.contents || '...'}"
        </p>
        <div className="mt-3 pt-3 border-t border-stone-100">
          <p className="text-stone-400 text-xs truncate flex items-center gap-1">
            <Icon icon={Palette} size="xs" className="text-stone-400" />
            {review.artistName}
          </p>
          <p className="text-stone-600 text-xs truncate mt-0.5 font-medium">{review.productName}</p>
        </div>
      </div>
    </button>
  )
}

// 텍스트 리뷰 카드
function TextReviewCard({ review, theme, onClick, delay }: { review: any; theme: any; onClick: () => void; delay: number }) {
  const [isVisible, setIsVisible] = useState(false)
  
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay)
    return () => clearTimeout(timer)
  }, [delay])

  // 리뷰 길이에 따른 카드 크기
  const isLong = (review.contents?.length || 0) > 100

  return (
    <button
      onClick={onClick}
      className={`break-inside-avoid w-full rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 text-left group ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`}
    >
      <div className={`relative p-6 ${theme.bg} min-h-[200px] ${isLong ? 'min-h-[280px]' : ''}`}>
        {/* Decorative Quote */}
        <div className="absolute top-4 left-4 text-6xl font-serif text-black/5 leading-none select-none">
          "
        </div>
        <div className="absolute bottom-4 right-4 text-6xl font-serif text-black/5 leading-none select-none rotate-180">
          "
        </div>

        {/* Country Emoji Large */}
        <div className="absolute top-4 right-4">
          <span className="text-4xl opacity-80 group-hover:scale-110 transition-transform inline-block">
            {review.countryInfo?.emoji}
          </span>
        </div>

        {/* Content */}
        <div className="relative z-10 pt-8">
          <p className={`${theme.accent} text-lg leading-relaxed font-medium ${isLong ? 'line-clamp-6' : 'line-clamp-4'}`}>
            {review.contents || '...'}
          </p>
        </div>

        {/* Footer */}
        <div className="absolute bottom-4 left-6 right-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-stone-500 text-sm">{review.countryInfo?.name}</span>
              <span className="px-2 py-0.5 bg-white/60 rounded text-xs font-bold text-amber-600">
                ★ {review.rating}
              </span>
            </div>
            <span className="text-stone-400 text-xs">{review.date}</span>
          </div>
        </div>
      </div>

      <div className="bg-white p-4">
        <p className="text-stone-400 text-xs truncate">🎨 {review.artistName}</p>
        <p className="text-stone-600 text-xs truncate mt-0.5 font-medium">{review.productName}</p>
      </div>
    </button>
  )
}

// 리뷰 상세 모달
function ReviewModal({ review, onClose }: { review: any; onClose: () => void }) {
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      
      <div 
        className="relative bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Image */}
        {review.imageUrl && (
          <div className="relative h-72 md:h-96">
            <img 
              src={review.imageUrl} 
              alt="" 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
            <button
              onClick={onClose}
              className="absolute top-4 right-4 w-10 h-10 bg-black/30 backdrop-blur-sm rounded-full text-white hover:bg-black/50 transition-colors flex items-center justify-center text-lg"
            >
              ✕
            </button>
            <div className="absolute bottom-4 left-4 flex items-center gap-2">
              <span className="text-4xl">{review.countryInfo?.emoji}</span>
              <span className="px-3 py-1.5 bg-amber-500 text-amber-900 rounded-full text-sm font-bold shadow-lg">
                ★ {review.rating}/10
              </span>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="p-8">
          {!review.imageUrl && (
            <>
              <button
                onClick={onClose}
                className="absolute top-4 right-4 w-10 h-10 bg-stone-100 rounded-full text-stone-500 hover:bg-stone-200 transition-colors flex items-center justify-center"
              >
                ✕
              </button>
              <div className="flex items-center gap-3 mb-6">
                <span className="text-5xl">{review.countryInfo?.emoji}</span>
                <div>
                  <p className="font-semibold text-stone-800">{review.countryInfo?.name}</p>
                  <p className="text-sm text-stone-400">{review.date}</p>
                </div>
                <span className="ml-auto px-3 py-1.5 bg-amber-100 text-amber-700 rounded-full font-bold">
                  ★ {review.rating}/10
                </span>
              </div>
            </>
          )}

          {review.imageUrl && (
            <div className="flex items-center gap-3 mb-6">
              <div>
                <p className="font-semibold text-stone-800">{review.countryInfo?.name}</p>
                <p className="text-sm text-stone-400">{review.date}</p>
              </div>
            </div>
          )}

          {/* Review Text */}
          <div className="relative bg-stone-50 rounded-2xl p-6 mb-6">
            <span className="absolute -top-3 left-4 text-5xl text-stone-200 font-serif">"</span>
            <p className="text-stone-700 leading-relaxed text-lg pl-4">
              {review.contents || '...'}
            </p>
            <span className="absolute -bottom-3 right-4 text-5xl text-stone-200 font-serif rotate-180">"</span>
          </div>

          {/* Product Info */}
          <div className="flex items-center gap-4 p-4 bg-stone-100 rounded-xl">
            <div className="w-14 h-14 bg-amber-500 rounded-xl flex items-center justify-center shadow-lg">
              <Icon icon={Palette} size="lg" className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-stone-800 truncate">{review.productName}</p>
              <p className="text-sm text-stone-500">by {review.artistName}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
