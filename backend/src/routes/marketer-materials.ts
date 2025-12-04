import express from 'express'
import multer from 'multer'
import { imageAnalysisService } from '../services/imageAnalysisService'
import { contentGenerator } from '../services/contentGenerator'
import { ContentGenerationRequest } from '../types/marketer'

const router = express.Router()

// Multer 설정: 메모리 스토리지 사용 (base64 변환을 위해)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 4 * 1024 * 1024, // 4MB 제한
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

// 이미지 분석 API
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
    const mimeType = req.file.mimetype || 'image/jpeg'

    // 이미지 분석 수행
    const analysisResult = await imageAnalysisService.analyzeImage(imageBase64, mimeType)

    res.json({
      success: true,
      data: analysisResult,
    })
  } catch (error: any) {
    console.error('이미지 분석 오류:', error)
    res.status(500).json({
      success: false,
      error: error.message || '이미지 분석 중 오류가 발생했습니다.',
    })
  }
})

// 이미지 기반 콘텐츠 생성 API
router.post('/generate-from-image', upload.array('images', 5), async (req, res) => {
  try {
    if (!req.files || (req.files as Express.Multer.File[]).length === 0) {
      return res.status(400).json({
        success: false,
        error: '이미지 파일이 필요합니다.',
      })
    }

    const {
      platforms = ['meta', 'x'],
      languages = ['korean', 'english', 'japanese'],
      tone = '따뜻하고 감성적인',
      includeReasoning = false,
    } = req.body

    const images = req.files as Express.Multer.File[]
    const imageBase64s = images.map((file) => ({
      base64: file.buffer.toString('base64'),
      mimeType: file.mimetype || 'image/jpeg',
    }))

    // 첫 번째 이미지로 분석 수행
    const analysisResult = await imageAnalysisService.analyzeImage(imageBase64s[0].base64, imageBase64s[0].mimeType)

    // 플랫폼 및 언어별 콘텐츠 생성
    const platformMap: Record<string, 'instagram' | 'facebook' | 'twitter' | 'blog'> = {
      meta: 'instagram',
      x: 'twitter',
    }

    const languageMap: Record<string, 'korean' | 'english' | 'japanese'> = {
      korean: 'korean',
      english: 'english',
      japanese: 'japanese',
    }

    const generatedContents: any = {}

    for (const lang of languages) {
      const language = languageMap[lang] || 'korean'
      generatedContents[language] = {}

      for (const platform of platforms) {
        const platformType = platformMap[platform] || 'instagram'

        const request: ContentGenerationRequest = {
          contentType: 'social',
          platform: platformType,
          language,
          tone,
          additionalContext: `${analysisResult.marketingInsights.title}. ${analysisResult.marketingInsights.description}`,
          targetAudience: analysisResult.marketingInsights.targetAudience,
        }

        const content = await contentGenerator.generateContent(request)

        generatedContents[language][platform] = {
          caption: content.content,
          hashtags: content.metadata.hashtags,
        }
      }
    }

    res.json({
      success: true,
      data: {
        analysis: analysisResult,
        marketingContent: generatedContents,
        reasoning: includeReasoning ? {
          korean: '이미지 분석 결과를 바탕으로 소비자의 감성을 자극하는 마케팅 콘텐츠를 생성했습니다.',
          english: 'Generated marketing content based on image analysis to appeal to consumer emotions.',
          japanese: '画像分析結果に基づいて、消費者の感情に訴えるマーケティングコンテンツを生成しました。',
        } : null,
      },
    })
  } catch (error: any) {
    console.error('이미지 기반 콘텐츠 생성 오류:', error)
    res.status(500).json({
      success: false,
      error: error.message || '콘텐츠 생성 중 오류가 발생했습니다.',
    })
  }
})

export default router







