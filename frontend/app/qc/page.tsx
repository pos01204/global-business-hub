'use client'

import { useState } from 'react'
import CSVUploadTab from './components/CSVUploadTab'
import TextQCTab from './components/TextQCTab'
import ImageQCTab from './components/ImageQCTab'
import ArtistsNotificationTab from './components/ArtistsNotificationTab'
import QCArchiveTab from './components/QCArchiveTab'
import { TabPanel } from '@/components/ui'

// 탭 타입 정의
type QCTab = 'upload' | 'text' | 'image' | 'artists' | 'archive'

const tabItems = [
  { id: 'upload', label: 'CSV 업로드', icon: <span>📤</span> },
  { id: 'text', label: '텍스트 QC', icon: <span>📝</span> },
  { id: 'image', label: '이미지 QC', icon: <span>🖼️</span> },
  { id: 'artists', label: '작가 알람 명단', icon: <span>👥</span> },
  { id: 'archive', label: 'QC 아카이브', icon: <span>📚</span> },
]

export default function QCPage() {
  const [activeTab, setActiveTab] = useState<QCTab>('upload')

  return (
    <div className="animate-fade-in">
      {/* 페이지 헤더 - idus 브랜드 스타일 */}
      <div className="relative bg-gradient-to-r from-idus-500 to-idus-600 rounded-2xl p-4 lg:p-6 mb-6 overflow-hidden shadow-orange">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 lg:w-14 lg:h-14 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center shadow-lg">
            <span className="text-2xl lg:text-3xl">✅</span>
          </div>
          <div>
            <h1 className="text-xl lg:text-2xl font-extrabold text-white tracking-tight">QC 관리</h1>
            <p className="text-idus-100 text-xs lg:text-sm font-medium">일본어 작품 한글 번역 및 이미지 QC 관리</p>
          </div>
        </div>
      </div>

      {/* 탭 네비게이션 - 모바일 최적화 */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-lg">📑</span>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">QC 기능</h2>
        </div>
        
        {/* 모바일: 가로 스크롤 탭 */}
        <div className="overflow-x-auto scrollbar-hide -mx-4 px-4 lg:mx-0 lg:px-0">
          <div className="flex gap-2 min-w-max lg:flex-wrap">
            {tabItems.map((item) => {
              const isActive = activeTab === item.id
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as QCTab)}
                  className={`
                    flex items-center gap-2 px-4 py-3 rounded-xl whitespace-nowrap
                    text-sm font-medium transition-all min-h-[48px]
                    ${isActive 
                      ? 'bg-[#F78C3A] text-white shadow-sm' 
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }
                  `}
                >
                  {item.icon}
                  <span className="hidden sm:inline">{item.label}</span>
                  <span className="sm:hidden">{item.label.split(' ')[0]}</span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* 탭 컨텐츠 */}
      <div>
        <TabPanel id="upload" activeTab={activeTab}>
          <CSVUploadTab />
        </TabPanel>

        <TabPanel id="text" activeTab={activeTab}>
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-2 text-slate-900 dark:text-slate-100">📝 텍스트 QC</h2>
            <p className="text-gray-600 dark:text-slate-400">
              일본어 원문과 한글 번역을 비교하여 QC를 진행하세요.
            </p>
          </div>
          <TextQCTab />
        </TabPanel>

        <TabPanel id="image" activeTab={activeTab}>
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-2 text-slate-900 dark:text-slate-100">🖼️ 이미지 QC</h2>
            <p className="text-gray-600 dark:text-slate-400">
              이미지와 OCR 결과를 확인하여 QC를 진행하세요. 이미지를 클릭하면 확대 보기가 가능합니다.
            </p>
          </div>
          <ImageQCTab />
        </TabPanel>

        <TabPanel id="artists" activeTab={activeTab}>
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-2 text-slate-900 dark:text-slate-100">👥 작가 알람 명단</h2>
            <p className="text-gray-600 dark:text-slate-400">
              수정이 필요한 항목에 대해 알람을 보내야 할 작가 명단을 확인하세요.
            </p>
          </div>
          <ArtistsNotificationTab />
        </TabPanel>

        <TabPanel id="archive" activeTab={activeTab}>
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-2 text-slate-900 dark:text-slate-100">📚 QC 아카이브</h2>
            <p className="text-gray-600 dark:text-slate-400">
              완료된 QC 내역을 조회하고 통계를 확인하세요.
            </p>
          </div>
          <QCArchiveTab />
        </TabPanel>
      </div>
    </div>
  )
}

