'use client'

import { useState } from 'react'
import CSVUploadTab from './components/CSVUploadTab'
import TextQCTab from './components/TextQCTab'
import ImageQCTab from './components/ImageQCTab'
import ArtistsNotificationTab from './components/ArtistsNotificationTab'
import QCArchiveTab from './components/QCArchiveTab'
import { TabPanel } from '@/components/ui'
import { Icon } from '@/components/ui/Icon'
import { Upload, FileText, Image as ImageIcon, Users, BookOpen, CheckCircle, FileText as FileTextIcon } from 'lucide-react'
import PageHeader from '@/components/PageHeader'

// 탭 타입 정의
type QCTab = 'upload' | 'text' | 'image' | 'artists' | 'archive'

const tabItems = [
  { id: 'upload', label: 'CSV 업로드', icon: Upload },
  { id: 'text', label: '텍스트 QC', icon: FileText },
  { id: 'image', label: '이미지 QC', icon: ImageIcon },
  { id: 'artists', label: '작가 알람 명단', icon: Users },
  { id: 'archive', label: 'QC 아카이브', icon: BookOpen },
]

export default function QCPage() {
  const [activeTab, setActiveTab] = useState<QCTab>('upload')

  return (
    <div className="animate-fade-in">
      {/* 페이지 헤더 - 브랜드 일러스트 포함 */}
      <PageHeader
        title="QC 관리"
        description="일본어 작품 한글 번역 및 이미지 QC 관리"
        icon="✅"
        variant="support"
      />

      {/* 탭 네비게이션 - 모바일 최적화 */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Icon icon={FileTextIcon} size="md" className="text-slate-600 dark:text-slate-400" />
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
                  <Icon icon={item.icon} size="sm" className={isActive ? 'text-white' : 'text-slate-600 dark:text-slate-400'} />
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
            <h2 className="text-xl font-semibold mb-2 text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Icon icon={FileText} size="md" className="text-slate-600 dark:text-slate-400" />
              텍스트 QC
            </h2>
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

