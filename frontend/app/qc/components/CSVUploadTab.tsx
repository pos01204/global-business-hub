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
      alert(`업로드 완료!\n- 가져온 항목: ${data.imported}개\n- 스킵된 항목: ${data.skipped}개\n- 중복 항목: ${data.duplicates}개`)
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
      {/* 텍스트 QC CSV 업로드 */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-2xl">📝</span>
          <h3 className="text-lg font-semibold">텍스트 QC 데이터</h3>
        </div>
        <p className="text-sm text-gray-600 mb-4">
          텍스트 QC용 한글 포함 결과 CSV 파일을 업로드하세요.
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
                  <div className="grid grid-cols-3 gap-4 mt-3 text-sm">
                    <div className="bg-green-50 p-2 rounded">
                      <div className="text-gray-600">가져온 항목</div>
                      <div className="font-semibold text-green-700">
                        {history.result.imported}개
                      </div>
                    </div>
                    <div className="bg-yellow-50 p-2 rounded">
                      <div className="text-gray-600">스킵된 항목</div>
                      <div className="font-semibold text-yellow-700">
                        {history.result.skipped}개
                      </div>
                    </div>
                    <div className="bg-blue-50 p-2 rounded">
                      <div className="text-gray-600">중복 항목</div>
                      <div className="font-semibold text-blue-700">
                        {history.result.duplicates}개
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

