import express from 'express'
import { ollamaService } from '../services/ollamaService'
import { aiProductParser } from '../services/aiProductParser'
import { idusCrawler } from '../services/idusCrawler'

const router = express.Router()

// Ollama 연결 테스트
router.get('/test/ollama', async (req, res) => {
  try {
    console.log('Ollama 연결 테스트 시작...')
    
    // 1. 기본 연결 확인
    const isConnected = await ollamaService.checkConnection()
    
    if (!isConnected) {
      return res.json({
        success: false,
        message: 'Ollama 서비스에 연결할 수 없습니다.',
        details: {
          baseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
          model: process.env.OLLAMA_MODEL || 'llama3',
        },
        troubleshooting: [
          '1. Ollama가 설치되어 있고 실행 중인지 확인하세요.',
          '2. `ollama list` 명령어로 모델이 다운로드되었는지 확인하세요.',
          '3. Ollama가 다른 포트에서 실행 중이라면 환경 변수를 확인하세요.',
        ],
      })
    }

    // 2. 모델 확인
    const models = await ollamaService.listModels()
    const configuredModel = process.env.OLLAMA_MODEL || 'llama3'
    const hasModel = models.some((m: string) => 
      m === configuredModel || m.includes(configuredModel.split(':')[0])
    )

    if (!hasModel) {
      return res.json({
        success: false,
        message: `모델 '${configuredModel}'이 설치되지 않았습니다.`,
        details: {
          baseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
          configuredModel,
          availableModels: models,
        },
        troubleshooting: [
          `모델 다운로드: ollama pull ${configuredModel}`,
          `또는 사용 가능한 모델 사용: ${models[0] || '없음'}`,
        ],
      })
    }

    // 3. 간단한 생성 테스트
    console.log('간단한 생성 테스트 시작...')
    const testPrompt = '다음 문장을 한국어로 번역하세요: "Hello, world"'
    
    try {
      const testResponse = await ollamaService.generate(testPrompt, {
        temperature: 0.7,
        maxTokens: 100,
      })

      res.json({
        success: true,
        message: 'Ollama 서비스가 정상적으로 작동합니다.',
        details: {
          baseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
          model: configuredModel,
          testResponse: testResponse.substring(0, 200),
          availableModels: models,
        },
      })
    } catch (generateError: any) {
      res.json({
        success: false,
        error: generateError.message || '콘텐츠 생성 중 오류가 발생했습니다.',
        details: {
          baseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
          model: configuredModel,
          availableModels: models,
        },
        troubleshooting: [
          '1. Ollama가 실행 중인지 확인: ollama list',
          `2. 모델이 설치되었는지 확인: ollama list | grep ${configuredModel}`,
          `3. 모델 재다운로드: ollama pull ${configuredModel}`,
          '4. Ollama 서비스 재시작',
        ],
      })
    }
  } catch (error: any) {
    console.error('Ollama 테스트 오류:', error)
    res.status(500).json({
      success: false,
      error: error.message || 'Ollama 테스트 중 오류가 발생했습니다.',
      details: {
        baseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
        model: process.env.OLLAMA_MODEL || 'llama3',
      },
    })
  }
})

// 크롤링 테스트
router.post('/test/crawl', async (req, res) => {
  try {
    const { url } = req.body

    if (!url) {
      return res.status(400).json({
        success: false,
        error: 'URL이 필요합니다.',
      })
    }

    console.log('크롤링 테스트 시작:', url)

    // 1. 일반 크롤링 시도
    const product = await idusCrawler.crawlProduct(url)

    if (product && product.title && !product.title.includes('작품명 없음') && !product.title.includes('작품 ')) {
      return res.json({
        success: true,
        method: 'crawler',
        data: product,
        message: '일반 크롤링으로 작품 정보를 성공적으로 가져왔습니다.',
      })
    }

    // 2. AI 파서 시도
    console.log('일반 크롤링 실패, AI 파서 시도...')
    const isOllamaConnected = await ollamaService.checkConnection()
    
    if (!isOllamaConnected) {
      return res.json({
        success: false,
        method: 'crawler',
        error: '일반 크롤링 실패, AI 파서를 사용하려면 Ollama가 필요합니다.',
        data: product,
        troubleshooting: [
          '1. Ollama를 설치하고 실행하세요.',
          '2. `ollama pull llama3` 명령어로 모델을 다운로드하세요.',
          '3. Ollama가 실행 중인지 확인하세요.',
        ],
      })
    }

    const aiProduct = await aiProductParser.parseProductFromUrl(url)

    if (aiProduct && aiProduct.title && !aiProduct.title.includes('작품명 없음')) {
      return res.json({
        success: true,
        method: 'ai-parser',
        data: aiProduct,
        message: 'AI 파서로 작품 정보를 성공적으로 가져왔습니다.',
      })
    }

    // 3. 둘 다 실패
    return res.json({
      success: false,
      methods: ['crawler', 'ai-parser'],
      error: '크롤링과 AI 파서 모두 실패했습니다.',
      fallbackData: product,
      troubleshooting: [
        '1. URL이 올바른지 확인하세요.',
        '2. 웹사이트가 접근 가능한지 확인하세요.',
        '3. Ollama가 실행 중인지 확인하세요.',
      ],
    })
  } catch (error: any) {
    console.error('크롤링 테스트 오류:', error)
    res.status(500).json({
      success: false,
      error: error.message || '크롤링 테스트 중 오류가 발생했습니다.',
    })
  }
})

export default router


