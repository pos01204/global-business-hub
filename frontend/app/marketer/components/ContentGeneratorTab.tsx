'use client'

export default function ContentGeneratorTab() {
  const handleOpenMarketer = () => {
    window.open('https://copy-of-575034978140.us-west1.run.app/', '_blank')
  }

  return (
    <div className="space-y-6">
      {/* 메인 카드 */}
      <div className="card max-w-2xl mx-auto">
        <div className="text-center py-12 px-6">
          {/* 아이콘 */}
          <div className="mb-6">
            <div className="w-24 h-24 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto shadow-lg">
              <span className="text-5xl">✍️</span>
            </div>
          </div>

          {/* 제목 및 설명 */}
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            AI 콘텐츠 생성 도구
          </h2>
          <p className="text-gray-600 mb-8 max-w-md mx-auto">
            idus 소재 탐색, 마케팅 콘텐츠 생성, 캠페인 관리 등
            마케팅 업무를 위한 전문 도구를 사용하세요.
          </p>

          {/* 기능 목록 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 text-left">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-2xl mb-2">🔍</div>
              <h3 className="font-semibold text-gray-900 mb-1">소재 탐색</h3>
              <p className="text-sm text-gray-600">
                idus 플랫폼에서 트렌드 소재를 빠르게 발견
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-2xl mb-2">🖼️</div>
              <h3 className="font-semibold text-gray-900 mb-1">이미지 분석</h3>
              <p className="text-sm text-gray-600">
                AI 기반 제품 이미지 분석 및 콘텐츠 생성
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-2xl mb-2">📊</div>
              <h3 className="font-semibold text-gray-900 mb-1">다국어 지원</h3>
              <p className="text-sm text-gray-600">
                한/영/일 다국어 마케팅 콘텐츠 생성
              </p>
            </div>
          </div>

          {/* 메인 버튼 */}
          <button
            onClick={handleOpenMarketer}
            className="btn btn-primary text-lg px-8 py-4 inline-flex items-center gap-3 group hover:scale-105 transition-transform duration-200"
          >
            <span>콘텐츠 생성 도구 열기</span>
            <svg
              className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-200"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
          </button>

          {/* 안내 메시지 */}
          <p className="text-sm text-gray-500 mt-6">
            새 창에서 AI 콘텐츠 생성 도구가 열립니다
          </p>
        </div>
      </div>

      {/* 추가 정보 카드 */}
      <div className="card max-w-2xl mx-auto">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">💡</span>
            </div>
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 mb-2">사용 안내</h3>
            <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
              <li>콘텐츠 생성 도구는 별도의 서비스로 운영됩니다</li>
              <li>새 창에서 열리며, 독립적으로 사용할 수 있습니다</li>
              <li>생성한 콘텐츠와 캠페인은 자동으로 저장됩니다</li>
              <li>마케팅 캘린더와 연동하여 시즌별 콘텐츠 전략을 수립하세요</li>
            </ul>
          </div>
        </div>
      </div>

      {/* 빠른 팁 */}
      <div className="grid md:grid-cols-2 gap-4 max-w-2xl mx-auto">
        <div className="card bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-xl">🎯</span>
            <h4 className="font-semibold text-green-800">활용 팁</h4>
          </div>
          <p className="text-sm text-green-700">
            마케팅 캘린더에서 다가오는 기념일을 확인하고, 해당 시즌에 맞는 콘텐츠를 미리 준비하세요.
          </p>
        </div>
        <div className="card bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-xl">✨</span>
            <h4 className="font-semibold text-purple-800">추천 워크플로우</h4>
          </div>
          <p className="text-sm text-purple-700">
            1. 캘린더에서 기념일 선택 → 2. 추천 카테고리 확인 → 3. 콘텐츠 생성 도구로 제작
          </p>
        </div>
      </div>
    </div>
  )
}

