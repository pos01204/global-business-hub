'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'

// 탭 타입 정의
type QCTab = 'upload' | 'text' | 'image' | 'artists' | 'archive'

export default function QCPage() {
  const [activeTab, setActiveTab] = useState<QCTab>('upload')

  return (
    <div>
      {/* 페이지 헤더 */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center shadow-lg">
            <span className="text-white text-2xl">✅</span>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">QC 관리</h1>
            <p className="text-gray-600 text-sm mt-1">일본어 작품 한글 번역 및 이미지 QC 관리</p>
          </div>
        </div>
      </div>

      {/* 탭 네비게이션 */}
      <div className="border-b mb-6">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-lg">📑</span>
          <h2 className="text-lg font-semibold">QC 기능</h2>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setActiveTab('upload')}
            className={`px-4 py-2.5 rounded-lg font-medium transition-all flex items-center gap-2 ${
              activeTab === 'upload'
                ? 'bg-primary text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <span>📤</span>
            <span>CSV 업로드</span>
          </button>
          <button
            onClick={() => setActiveTab('text')}
            className={`px-4 py-2.5 rounded-lg font-medium transition-all flex items-center gap-2 ${
              activeTab === 'text'
                ? 'bg-primary text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <span>📝</span>
            <span>텍스트 QC</span>
          </button>
          <button
            onClick={() => setActiveTab('image')}
            className={`px-4 py-2.5 rounded-lg font-medium transition-all flex items-center gap-2 ${
              activeTab === 'image'
                ? 'bg-primary text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <span>🖼️</span>
            <span>이미지 QC</span>
          </button>
          <button
            onClick={() => setActiveTab('artists')}
            className={`px-4 py-2.5 rounded-lg font-medium transition-all flex items-center gap-2 ${
              activeTab === 'artists'
                ? 'bg-primary text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <span>👥</span>
            <span>작가 알람 명단</span>
          </button>
          <button
            onClick={() => setActiveTab('archive')}
            className={`px-4 py-2.5 rounded-lg font-medium transition-all flex items-center gap-2 ${
              activeTab === 'archive'
                ? 'bg-primary text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <span>📚</span>
            <span>QC 아카이브</span>
          </button>
        </div>
      </div>

      {/* 탭 컨텐츠 */}
      <div>
        {activeTab === 'upload' && (
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">📤 CSV 파일 업로드</h2>
            <p className="text-gray-600 mb-4">
              Redash에서 다운로드한 CSV 파일을 업로드하여 QC 작업을 시작하세요.
            </p>
            <div className="space-y-6">
              {/* 텍스트 QC CSV 업로드 */}
              <div className="border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-2">텍스트 QC 데이터</h3>
                <p className="text-sm text-gray-600 mb-4">
                  텍스트 QC용 한글 포함 결과 CSV 파일을 업로드하세요.
                </p>
                <div className="flex items-center gap-4">
                  <input
                    type="file"
                    accept=".csv"
                    className="flex-1 border border-gray-300 rounded-lg px-4 py-2"
                    onChange={(e) => {
                      // TODO: 파일 업로드 처리
                      console.log('텍스트 QC CSV 업로드:', e.target.files?.[0])
                    }}
                  />
                  <button className="btn btn-primary px-6">업로드</button>
                </div>
              </div>

              {/* 이미지 QC CSV 업로드 */}
              <div className="border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-2">이미지 QC 데이터</h3>
                <p className="text-sm text-gray-600 mb-4">
                  이미지 QC용 한글 OCR 결과 CSV 파일을 업로드하세요.
                </p>
                <div className="flex items-center gap-4">
                  <input
                    type="file"
                    accept=".csv"
                    className="flex-1 border border-gray-300 rounded-lg px-4 py-2"
                    onChange={(e) => {
                      // TODO: 파일 업로드 처리
                      console.log('이미지 QC CSV 업로드:', e.target.files?.[0])
                    }}
                  />
                  <button className="btn btn-primary px-6">업로드</button>
                </div>
              </div>

              {/* 업로드 이력 */}
              <div className="border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">업로드 이력</h3>
                <div className="text-sm text-gray-600">
                  업로드 이력이 여기에 표시됩니다.
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'text' && (
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">📝 텍스트 QC</h2>
            <p className="text-gray-600 mb-4">
              일본어 원문과 한글 번역을 비교하여 QC를 진행하세요.
            </p>
            <div className="text-center py-12 text-gray-500">
              텍스트 QC 기능이 곧 구현될 예정입니다.
            </div>
          </div>
        )}

        {activeTab === 'image' && (
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">🖼️ 이미지 QC</h2>
            <p className="text-gray-600 mb-4">
              이미지와 OCR 결과를 확인하여 QC를 진행하세요.
            </p>
            <div className="text-center py-12 text-gray-500">
              이미지 QC 기능이 곧 구현될 예정입니다.
            </div>
          </div>
        )}

        {activeTab === 'artists' && (
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">👥 작가 알람 명단</h2>
            <p className="text-gray-600 mb-4">
              수정이 필요한 항목에 대해 알람을 보내야 할 작가 명단을 확인하세요.
            </p>
            <div className="text-center py-12 text-gray-500">
              작가 알람 명단 기능이 곧 구현될 예정입니다.
            </div>
          </div>
        )}

        {activeTab === 'archive' && (
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">📚 QC 아카이브</h2>
            <p className="text-gray-600 mb-4">
              완료된 QC 내역을 조회하고 통계를 확인하세요.
            </p>
            <div className="text-center py-12 text-gray-500">
              QC 아카이브 기능이 곧 구현될 예정입니다.
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

