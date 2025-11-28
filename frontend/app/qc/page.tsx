'use client'

import { useState } from 'react'
import CSVUploadTab from './components/CSVUploadTab'
import TextQCTab from './components/TextQCTab'
import ImageQCTab from './components/ImageQCTab'
import ArtistsNotificationTab from './components/ArtistsNotificationTab'
import QCArchiveTab from './components/QCArchiveTab'

// 탭 타입 정의
type QCTab = 'upload' | 'text' | 'image' | 'artists' | 'archive'

export default function QCPage() {
  const [activeTab, setActiveTab] = useState<QCTab>('upload')

  return (
    <div className="animate-fade-in">
      {/* 페이지 헤더 - idus 브랜드 스타일 */}
      <div className="relative bg-gradient-to-r from-idus-500 to-idus-600 rounded-2xl p-6 mb-6 overflow-hidden shadow-orange">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center shadow-lg">
            <span className="text-3xl">✅</span>
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">QC 관리</h1>
            <p className="text-idus-100 text-sm font-medium">일본어 작품 한글 번역 및 이미지 QC 관리</p>
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
        {activeTab === 'upload' && <CSVUploadTab />}

        {activeTab === 'text' && (
          <div>
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-2">📝 텍스트 QC</h2>
              <p className="text-gray-600">
                일본어 원문과 한글 번역을 비교하여 QC를 진행하세요.
              </p>
            </div>
            <TextQCTab />
          </div>
        )}

        {activeTab === 'image' && (
          <div>
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-2">🖼️ 이미지 QC</h2>
              <p className="text-gray-600">
                이미지와 OCR 결과를 확인하여 QC를 진행하세요. 이미지를 클릭하면 확대 보기가 가능합니다.
              </p>
            </div>
            <ImageQCTab />
          </div>
        )}

        {activeTab === 'artists' && (
          <div>
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-2">👥 작가 알람 명단</h2>
              <p className="text-gray-600">
                수정이 필요한 항목에 대해 알람을 보내야 할 작가 명단을 확인하세요.
              </p>
            </div>
            <ArtistsNotificationTab />
          </div>
        )}

        {activeTab === 'archive' && (
          <div>
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-2">📚 QC 아카이브</h2>
              <p className="text-gray-600">
                완료된 QC 내역을 조회하고 통계를 확인하세요.
              </p>
            </div>
            <QCArchiveTab />
          </div>
        )}
      </div>
    </div>
  )
}

