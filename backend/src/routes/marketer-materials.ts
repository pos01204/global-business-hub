import express from 'express'
import multer from 'multer'
import { imageAnalysisService } from '../services/imageAnalysisService'
import { contentGenerator } from '../services/contentGenerator'
import { ContentGenerationRequest } from '../types/marketer'
import GoogleSheetsService from '../services/googleSheets'
import { sheetsConfig, SHEET_NAMES } from '../config/sheets'

const router = express.Router()
const sheetsService = new GoogleSheetsService(sheetsConfig)

// Multer 설정: 메모리 스토리지 사용 (base64 변환을 위해)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 20 * 1024 * 1024, // 20MB 제한
  },
  fileFilter: (req, file, cb) => {
    // 이미지 파일만 허용
    if (file.mimetype.startsWith('image/')) {
      cb(null, true)
    } else {
      cb(new Error('이미지 파일만 업로드 가능합니다.'))
    }
  },
})

// UUID 생성 함수
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

/**
 * 이미지 업로드 및 분석
 * POST /api/marketer/materials/analyze-image
 */
router.post('/analyze-image', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: '이미지 파일이 필요합니다.',
      })
    }

    // 이미지를 base64로 변환
    const imageBase64 = req.file.buffer.toString('base64')

    console.log(`[Material] 이미지 분석 시작 - 파일명: ${req.file.originalname}, 크기: ${req.file.size}bytes`)

    // 이미지 분석
    const analysisResult = await imageAnalysisService.analyzeImage(imageBase64)

    // 이미지 URL 생성 (임시로 base64 data URL 사용, 실제로는 저장소에 저장 후 URL 반환)
    const imageUrl = `data:${req.file.mimetype};base64,${imageBase64}`

    res.json({
      success: true,
      data: {
        imageUrl,
        visualAnalysis: analysisResult.visualAnalysis,
        marketingInsights: analysisResult.marketingInsights,
      },
    })
  } catch (error: any) {
    console.error('[Material] 이미지 분석 오류:', error)
    res.status(500).json({
      success: false,
      error: error.message || '이미지 분석 중 오류가 발생했습니다.',
    })
  }
})

/**
 * 소재 저장 (이미지 분석 결과 기반)
 * POST /api/marketer/materials
 */
router.post('/', async (req, res) => {
  try {
    const {
      imageUrl,
      visualAnalysis,
      marketingInsights,
      // 사용자가 수정한 정보
      title,
      description,
      price,
      category,
      tags,
      artist,
    } = req.body

    if (!marketingInsights || !visualAnalysis) {
      return res.status(400).json({
        success: false,
        error: '이미지 분석 결과가 필요합니다. 먼저 이미지를 분석해주세요.',
      })
    }

    const material = {
      id: generateUUID(),
      title: title || marketingInsights.title,
      description: description || marketingInsights.description,
      imageUrl: imageUrl || '',
      visualAnalysis,
      marketingInsights,
      price: price || 0,
      category: category || '기타',
      tags: tags || marketingInsights.hashtags || [],
      artist: artist || { name: '', url: '' },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    // Google Sheets에 저장 (marketer_materials 시트)
    try {
      await sheetsService.updateCell(
        'marketer_materials',
        `A${Date.now()}`, // 임시 위치, 실제로는 다음 빈 행 찾기
        JSON.stringify(material)
      )
    } catch (sheetsError) {
      console.warn('[Material] Google Sheets 저장 실패 (계속 진행):', sheetsError)
      // Sheets 저장 실패해도 소재는 반환
    }

    res.json({
      success: true,
      data: material,
    })
  } catch (error: any) {
    console.error('[Material] 소재 저장 오류:', error)
    res.status(500).json({
      success: false,
      error: error.message || '소재 저장 중 오류가 발생했습니다.',
    })
  }
})

/**
 * 이미지 분석 결과를 바탕으로 콘텐츠 생성
 * POST /api/marketer/materials/generate-content
 */
router.post('/generate-content', async (req, res) => {
  try {
    const {
      imageAnalysisResult,
      contentType,
      platform,
      language,
      tone,
      targetAudience,
    } = req.body

    if (!imageAnalysisResult || !contentType || !platform || !language) {
      return res.status(400).json({
        success: false,
        error: '필수 필드가 누락되었습니다.',
      })
    }

    const { visualAnalysis, marketingInsights } = imageAnalysisResult

    // 콘텐츠 생성 요청 구성
    const contentRequest: ContentGenerationRequest = {
      contentType: contentType as 'blog' | 'social' | 'email',
      platform: platform as 'blog' | 'instagram' | 'facebook' | 'twitter' | 'email',
      language: language as 'korean' | 'english' | 'japanese',
      tone: tone || '따뜻하고 감성적인',
      targetAudience: targetAudience || marketingInsights.targetAudience,
      additionalContext: `
**작품 정보:**
- 제목: ${marketingInsights.title}
- 설명: ${marketingInsights.description}
- 색상: ${visualAnalysis.colors.join(', ')}
- 재료: ${visualAnalysis.materials.join(', ')}
- 스타일: ${visualAnalysis.style}
- 감성: ${visualAnalysis.mood.join(', ')}
- 타겟 오디언스: ${marketingInsights.targetAudience.join(', ')}
- 사용 시나리오: ${marketingInsights.useCases.join(', ')}
- 판매 포인트: ${marketingInsights.sellingPoints.join(', ')}

**마케팅 카피:**
${marketingInsights.marketingCopy.map((copy: string) => `- ${copy}`).join('\n')}
      `.trim(),
    }

    // 콘텐츠 생성
    const generatedContent = await contentGenerator.generateContent(contentRequest)

    res.json({
      success: true,
      data: {
        content: generatedContent,
        sourceMaterial: {
          visualAnalysis,
          marketingInsights,
        },
      },
    })
  } catch (error: any) {
    console.error('[Material] 콘텐츠 생성 오류:', error)
    res.status(500).json({
      success: false,
      error: error.message || '콘텐츠 생성 중 오류가 발생했습니다.',
    })
  }
})

/**
 * 소재 목록 조회
 * GET /api/marketer/materials
 */
router.get('/', async (req, res) => {
  try {
    // Google Sheets에서 소재 목록 조회
    // 현재는 빈 배열 반환 (구현 예정)
    res.json({
      success: true,
      data: [],
      count: 0,
    })
  } catch (error: any) {
    console.error('[Material] 소재 목록 조회 오류:', error)
    res.status(500).json({
      success: false,
      error: error.message || '소재 목록 조회 중 오류가 발생했습니다.',
    })
  }
})

export default router

