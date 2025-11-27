'use client'

import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { qcApi } from '@/lib/api'

export default function CSVUploadTab() {
  const [textFile, setTextFile] = useState<File | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [uploadHistory, setUploadHistory] = useState<Array<{
    type: 'text' | 'image'
    fileName: string
    timestamp: Date
    result?: any
  }>>([])

  const syncMutation = useMutation({
    mutationFn: () => qcApi.sync(),
    onSuccess: (data) => {
      const stats = data.stats
      alert(
        `Google Sheets 동기화 완료!\n\n` +
        `텍스트 QC: ${stats.text.added > 0 ? `+${stats.text.added}개 추가` : '변경 없음'}\n` +
        `이미지 QC: ${stats.image.added > 0 ? `+${stats.image.added}개 추가` : '변경 없음'}\n` +
        `아카이브: ${stats.archive.added > 0 ? `+${stats.archive.added}개 추가` : '변경 없음'}`
      )
      // 페이지 새로고침하여 최신 데이터 반영
      window.location.reload()
    },
    onError: (error: any) => {
      console.error('[QC] 동기화 오류:', error);
      const errorMessage = error.response?.data?.message || error.message || '알 수 없는 오류';
      const statusCode = error.response?.status;
      alert(`동기화 실패: ${errorMessage}${statusCode ? ` (${statusCode})` : ''}`)
    },
  })

  const textUploadMutation = useMutation({
    mutationFn: (file: File) => qcApi.uploadText(file),
    onSuccess: (data, file) => {
      setUploadHistory((prev) => [
        {
          type: 'text',
          fileName: file.name,
          timestamp: new Date(),
          result: data,
        },
        ...prev,
      ])
      setTextFile(null)
      alert(`업로드 완료!\n- 가져온 항목: ${data.imported}개\n- 스킵된 항목: ${data.skipped}개\n- 중복 항목: ${data.duplicates}개`)
    },
    onError: (error: any) => {
      alert(`업로드 실패: ${error.response?.data?.message || error.message}`)
    },
  })

  const imageUploadMutation = useMutation({
    mutationFn: (file: File) => qcApi.uploadImage(file),
    onSuccess: (data, file) => {
      setUploadHistory((prev) => [
        {
          type: 'image',
          fileName: file.name,
          timestamp: new Date(),
          result: data,
        },
        ...prev,
      ])
      setImageFile(null)
      const message = data.updated 
        ? `업로드 완료!\n- 가져온 항목: ${data.imported}개\n- 업데이트된 항목: ${data.updated}개\n- 스킵된 항목: ${data.skipped}개\n- 중복 항목: ${data.duplicates}개`
        : `업로드 완료!\n- 가져온 항목: ${data.imported}개\n- 스킵된 항목: ${data.skipped}개\n- 중복 항목: ${data.duplicates}개`
      alert(message)
    },
    onError: (error: any) => {
      alert(`업로드 실패: ${error.response?.data?.message || error.message}`)
    },
  })

  const handleTextUpload = () => {
    if (!textFile) {
      alert('파일을 선택해주세요.')
      return
    }
    textUploadMutation.mutate(textFile)
  }

  const handleImageUpload = () => {
    if (!imageFile) {
      alert('파일을 선택해주세요.')
      return
    }
    imageUploadMutation.mutate(imageFile)
  }

  return (
    <div className="space-y-6">
      {/* Google Sheets 동기화 */}
      <div className="card bg-blue-50 border-blue-200">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">🔄</span>
              <h3 className="text-lg font-semibold">Google Sheets 동기화</h3>
            </div>
            <p className="text-sm text-gray-600">
              Google Sheets에 직접 업데이트한 데이터를 허브에 동기화합니다. 
              CSV 업로드 대신 Google Sheets를 사용하는 것을 권장합니다.
            </p>
          </div>
          <button
            onClick={() => syncMutation.mutate()}
            disabled={syncMutation.isPending}
            className="btn btn-primary px-6 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
          >
            {syncMutation.isPending ? '동기화 중...' : '🔄 동기화'}
          </button>
        </div>
      </div>

      {/* 텍스트 QC CSV 업로드 */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-2xl">📝</span>
          <h3 className="text-lg font-semibold">텍스트 QC 데이터</h3>
        </div>
        <p className="text-sm text-gray-600 mb-4">
          텍스트 QC용 한글 포함 결과 CSV 파일을 업로드하세요. 
          <span className="text-orange-600 font-medium"> (대용량 파일의 경우 Google Sheets 동기화를 권장합니다)</span>
        </p>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <input
              type="file"
              accept=".csv"
              onChange={(e) => setTextFile(e.target.files?.[0] || null)}
              className="flex-1 border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-primary focus:border-primary transition-all"
              disabled={textUploadMutation.isPending}
            />
            <button
              onClick={handleTextUpload}
              disabled={!textFile || textUploadMutation.isPending}
              className="btn btn-primary px-6 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {textUploadMutation.isPending ? '업로드 중...' : '업로드'}
            </button>
          </div>
          {textFile && (
            <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
              선택된 파일: <span className="font-medium">{textFile.name}</span> (
              {(textFile.size / 1024).toFixed(2)} KB)
            </div>
          )}
        </div>
      </div>

      {/* 이미지 QC CSV 업로드 */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-2xl">🖼️</span>
          <h3 className="text-lg font-semibold">이미지 QC 데이터</h3>
        </div>
        <p className="text-sm text-gray-600 mb-4">
          이미지 QC용 한글 OCR 결과 CSV 파일을 업로드하세요. 
          <span className="text-orange-600 font-medium"> (대용량 파일의 경우 Google Sheets 동기화를 권장합니다)</span>
        </p>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <input
              type="file"
              accept=".csv"
              onChange={(e) => setImageFile(e.target.files?.[0] || null)}
              className="flex-1 border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-primary focus:border-primary transition-all"
              disabled={imageUploadMutation.isPending}
            />
            <button
              onClick={handleImageUpload}
              disabled={!imageFile || imageUploadMutation.isPending}
              className="btn btn-primary px-6 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {imageUploadMutation.isPending ? '업로드 중...' : '업로드'}
            </button>
          </div>
          {imageFile && (
            <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
              선택된 파일: <span className="font-medium">{imageFile.name}</span> (
              {(imageFile.size / 1024).toFixed(2)} KB)
            </div>
          )}
        </div>
      </div>

      {/* 업로드 이력 */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xl">📋</span>
          <h3 className="text-lg font-semibold">업로드 이력</h3>
        </div>
        {uploadHistory.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            업로드 이력이 없습니다.
          </div>
        ) : (
          <div className="space-y-3">
            {uploadHistory.map((history, index) => (
              <div
                key={index}
                className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">
                      {history.type === 'text' ? '📝' : '🖼️'}
                    </span>
                    <span className="font-medium">{history.fileName}</span>
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                      {history.type === 'text' ? '텍스트 QC' : '이미지 QC'}
                    </span>
                  </div>
                  <span className="text-sm text-gray-500">
                    {history.timestamp.toLocaleString('ko-KR')}
                  </span>
                </div>
                {history.result && (
                  <div className={`grid gap-4 mt-3 text-sm ${history.result.updated ? 'grid-cols-4' : 'grid-cols-3'}`}>
                    <div className="bg-green-50 p-2 rounded">
                      <div className="text-gray-600">가져온 항목</div>
                      <div className="font-semibold text-green-700">
                        {history.result.imported || 0}개
                      </div>
                    </div>
                    {history.result.updated !== undefined && history.result.updated > 0 && (
                      <div className="bg-purple-50 p-2 rounded">
                        <div className="text-gray-600">업데이트된 항목</div>
                        <div className="font-semibold text-purple-700">
                          {history.result.updated}개
                        </div>
                      </div>
                    )}
                    <div className="bg-yellow-50 p-2 rounded">
                      <div className="text-gray-600">스킵된 항목</div>
                      <div className="font-semibold text-yellow-700">
                        {history.result.skipped || 0}개
                      </div>
                    </div>
                    <div className="bg-blue-50 p-2 rounded">
                      <div className="text-gray-600">중복 항목</div>
                      <div className="font-semibold text-blue-700">
                        {history.result.duplicates || 0}개
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

