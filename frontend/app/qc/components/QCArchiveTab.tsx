'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { qcApi } from '@/lib/api'

export default function QCArchiveTab() {
  const [typeFilter, setTypeFilter] = useState<'all' | 'text' | 'image'>('all')
  const [page, setPage] = useState(1)
  const limit = 20

  // TODO: 아카이브 API가 구현되면 활성화
  // const { data, isLoading, error } = useQuery({
  //   queryKey: ['qc', 'archive', typeFilter, page],
  //   queryFn: () => qcApi.getArchive({ type: typeFilter, page, limit }),
  // })

  return (
    <div className="space-y-6">
      {/* 필터 */}
      <div className="card">
        <div className="flex items-center gap-4 flex-wrap">
          <div>
            <label className="block text-sm font-medium mb-2">타입 필터</label>
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value as 'all' | 'text' | 'image')
                setPage(1)
              }}
              className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary focus:border-primary"
            >
              <option value="all">전체</option>
              <option value="text">텍스트 QC</option>
              <option value="image">이미지 QC</option>
            </select>
          </div>
        </div>
      </div>

      {/* 안내 */}
      <div className="card bg-blue-50 border-blue-200">
        <div className="flex items-start gap-3">
          <div className="text-2xl">💡</div>
          <div className="flex-1">
            <h3 className="font-semibold text-blue-900 mb-1">QC 아카이브 안내</h3>
            <p className="text-sm text-blue-700">
              완료된 QC 내역이 여기에 표시됩니다. 아카이브 기능은 향후 구현될 예정입니다.
            </p>
          </div>
        </div>
      </div>

      {/* 아카이브 목록 */}
      <div className="card text-center py-12 text-gray-500">
        QC 아카이브 기능이 곧 구현될 예정입니다.
      </div>
    </div>
  )
}

