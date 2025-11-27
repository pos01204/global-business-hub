import express from 'express'
import { idusCrawler } from '../services/idusCrawler'
import { contentGenerator } from '../services/contentGenerator'
import { openaiService } from '../services/openaiService'
import { aiProductParser } from '../services/aiProductParser'
import { trendAnalysisService } from '../services/trendAnalysisService'
import { DiscoveryQuery, ContentGenerationRequest } from '../types/marketer'

const router = express.Router()

// OpenAI 연결 상태 확인
router.get('/health', async (req, res) => {
  try {
    const isConnected = await openaiService.checkConnection()
    const models = await openaiService.listModels()

    res.json({
      status: 'ok',
      openaiConnected: isConnected,
      configuredModel: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      availableModels: models,
      message: isConnected
        ? 'OpenAI 서비스가 정상적으로 연결되었습니다.'
        : 'OpenAI 서비스에 연결할 수 없습니다. OPENAI_API_KEY 환경 변수를 확인하세요.',
      troubleshooting: !isConnected ? [
        '1. OpenAI API 키 확인: https://platform.openai.com/api-keys 에서 키 발급',
        '2. 환경 변수 설정: backend/.env 파일에 OPENAI_API_KEY=sk-... 추가',
        '3. API 키 유효성 확인: 발급받은 키가 활성화되어 있는지 확인',
        '4. 모델 확인: OPENAI_MODEL 환경 변수로 사용할 모델 지정 (기본값: gpt-4o-mini)',
      ] : [],
    })
  } catch (error: any) {
    res.status(500).json({ 
      error: '서비스 상태 확인 중 오류가 발생했습니다.',
      message: error.message,
    })
  }
})

// 소재 탐색: 키워드로 작품 검색
router.get('/discovery/search', async (req, res) => {
  try {
    const query: DiscoveryQuery = {
      keyword: req.query.keyword as string,
      category: req.query.category as string,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 10,
    }

    const products = await idusCrawler.searchProducts(query)
    const results = await Promise.all(
      products.map((product) => idusCrawler.analyzeProduct(product))
    )

    res.json({
      success: true,
      data: results,
      count: results.length,
    })
  } catch (error) {
    console.error('소재 탐색 오류:', error)
    res.status(500).json({
      success: false,
      error: '소재 탐색 중 오류가 발생했습니다.',
    })
  }
})

// 소재 탐색: URL로 작품 정보 가져오기
router.post('/discovery/analyze', async (req, res) => {
  try {
    const { url } = req.body

    if (!url) {
      return res.status(400).json({
        success: false,
        error: 'URL이 필요합니다.',
      })
    }

    // 1단계: 일반 크롤링 시도
    let product = await idusCrawler.crawlProduct(url)
    
    // 2단계: 크롤링 실패 시 AI 파서 사용
    if (!product || !product.title || product.title.includes('작품명 없음') || product.title.includes('작품 ')) {
      console.log('크롤링 결과 불충분, AI 파서 사용 시도...')
      
      // OpenAI 연결 확인
      const isConnected = await openaiService.checkConnection()
      if (isConnected) {
        try {
          const aiProduct = await aiProductParser.parseProductFromUrl(url)
          if (aiProduct && aiProduct.title && !aiProduct.title.includes('작품명 없음')) {
            console.log('✅ AI 파서로 작품 정보 추출 성공')
            product = aiProduct
          }
        } catch (aiError: any) {
          console.warn('AI 파서 오류:', aiError.message)
        }
      } else {
        console.warn('OpenAI가 연결되지 않아 AI 파서를 사용할 수 없습니다.')
      }
    }

    if (!product) {
      return res.status(404).json({
        success: false,
        error: '작품 정보를 찾을 수 없습니다.',
      })
    }

    const result = await idusCrawler.analyzeProduct(product)

    res.json({
      success: true,
      data: result,
      source: product.title.includes('작품명 없음') || product.title.includes('작품 ') ? 'fallback' : 'crawled',
    })
  } catch (error) {
    console.error('작품 분석 오류:', error)
    res.status(500).json({
      success: false,
      error: '작품 분석 중 오류가 발생했습니다.',
    })
  }
})

// 트렌딩 키워드 분석
router.post('/trends/analyze', async (req, res) => {
  try {
    const { keyword } = req.body

    if (!keyword || !keyword.trim()) {
      return res.status(400).json({
        success: false,
        error: '키워드가 필요합니다.',
      })
    }

    const analysisResult = await trendAnalysisService.analyzeKeyword(keyword.trim())

    res.json({
      success: true,
      data: analysisResult,
    })
  } catch (error) {
    console.error('트렌드 분석 오류:', error)
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '트렌드 분석 중 오류가 발생했습니다.',
    })
  }
})

// 콘텐츠 생성
router.post('/content/generate', async (req, res) => {
  try {
    const request: ContentGenerationRequest = req.body

    // 필수 필드 검증
    if (!request.contentType || !request.platform || !request.language) {
      return res.status(400).json({
        success: false,
        error: 'contentType, platform, language는 필수 필드입니다.',
      })
    }

    // OpenAI 연결 확인 (경고만 표시, 폴백 사용)
    const isConnected = await openaiService.checkConnection()
    if (!isConnected) {
      console.warn('OpenAI 서비스에 연결할 수 없습니다. 기본 템플릿을 사용합니다.')
    }

    const content = await contentGenerator.generateContent(request)

    res.json({
      success: true,
      data: content,
    })
  } catch (error) {
    console.error('콘텐츠 생성 오류:', error)
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '콘텐츠 생성 중 오류가 발생했습니다.',
    })
  }
})

// 트렌딩 키워드 분석
router.post('/trend/analyze', async (req, res) => {
  try {
    const { keyword } = req.body

    if (!keyword || typeof keyword !== 'string' || !keyword.trim()) {
      return res.status(400).json({
        success: false,
        error: '키워드가 필요합니다.',
      })
    }

    const result = await trendAnalysisService.analyzeKeyword(keyword.trim())

    res.json({
      success: true,
      data: result,
    })
  } catch (error: any) {
    console.error('트렌딩 키워드 분석 오류:', error)
    res.status(500).json({
      success: false,
      error: error.message || '트렌딩 키워드 분석 중 오류가 발생했습니다.',
    })
  }
})

// 다국어 트렌딩 키워드 분석
router.post('/trend/analyze-multi', async (req, res) => {
  try {
    const { keyword } = req.body

    if (!keyword || typeof keyword !== 'string' || !keyword.trim()) {
      return res.status(400).json({
        success: false,
        error: '키워드가 필요합니다.',
      })
    }

    const result = await trendAnalysisService.analyzeKeywordMultiLanguage(keyword.trim())

    res.json({
      success: true,
      data: result,
    })
  } catch (error: any) {
    console.error('다국어 트렌딩 키워드 분석 오류:', error)
    res.status(500).json({
      success: false,
      error: error.message || '트렌딩 키워드 분석 중 오류가 발생했습니다.',
    })
  }
})

export default router
