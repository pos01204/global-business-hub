import express from 'express'
import { GeneratedContent } from '../types/marketer'
import { marketerSheetsService } from '../services/marketerSheetsService'

const router = express.Router()

// 인메모리 저장소 (Google Sheets 연동과 병행)
let savedContents: (GeneratedContent & { savedAt: string })[] = []

// 저장된 콘텐츠 목록 조회
router.get('/', async (req, res) => {
  try {
    // 인메모리 저장소와 Google Sheets 모두 조회 시도
    const sheetsContents = await marketerSheetsService.getSavedContents()
    
    // 중복 제거 (id 기준)
    const allContents = [...savedContents, ...sheetsContents]
    const uniqueContents = Array.from(
      new Map(allContents.map((item) => [item.id, item])).values()
    )

    res.json({
      success: true,
      data: uniqueContents.sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime()),
      count: uniqueContents.length,
    })
  } catch (error) {
    console.error('콘텐츠 목록 조회 오류:', error)
    // 오류 시 인메모리 저장소만 반환
    res.json({
      success: true,
      data: savedContents.sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime()),
      count: savedContents.length,
    })
  }
})

// 콘텐츠 저장
router.post('/', async (req, res) => {
  try {
    const content: GeneratedContent = req.body

    if (!content.id || !content.title || !content.content) {
      return res.status(400).json({
        success: false,
        error: '필수 필드가 누락되었습니다.',
      })
    }

    const savedContent = {
      ...content,
      savedAt: new Date().toISOString(),
    }

    // 인메모리 저장소에 저장
    const existingIndex = savedContents.findIndex((c) => c.id === content.id)
    if (existingIndex >= 0) {
      savedContents[existingIndex] = savedContent
    } else {
      savedContents.push(savedContent)
    }

    // Google Sheets에도 저장 시도 (선택적)
    try {
      await marketerSheetsService.saveContent(savedContent)
    } catch (sheetsError) {
      console.warn('Google Sheets 저장 실패 (인메모리 저장소에만 저장됨):', sheetsError)
    }

    res.json({
      success: true,
      data: savedContent,
      message: '콘텐츠가 저장되었습니다.',
    })
  } catch (error) {
    console.error('콘텐츠 저장 오류:', error)
    res.status(500).json({
      success: false,
      error: '콘텐츠 저장 중 오류가 발생했습니다.',
    })
  }
})

// 콘텐츠 조회
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params
    const content = savedContents.find((c) => c.id === id)

    if (!content) {
      return res.status(404).json({
        success: false,
        error: '콘텐츠를 찾을 수 없습니다.',
      })
    }

    res.json({
      success: true,
      data: content,
    })
  } catch (error) {
    console.error('콘텐츠 조회 오류:', error)
    res.status(500).json({
      success: false,
      error: '콘텐츠를 불러오는 중 오류가 발생했습니다.',
    })
  }
})

// 콘텐츠 삭제
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params
    const index = savedContents.findIndex((c) => c.id === id)

    if (index < 0) {
      return res.status(404).json({
        success: false,
        error: '콘텐츠를 찾을 수 없습니다.',
      })
    }

    savedContents.splice(index, 1)

    res.json({
      success: true,
      message: '콘텐츠가 삭제되었습니다.',
    })
  } catch (error) {
    console.error('콘텐츠 삭제 오류:', error)
    res.status(500).json({
      success: false,
      error: '콘텐츠 삭제 중 오류가 발생했습니다.',
    })
  }
})

export default router

