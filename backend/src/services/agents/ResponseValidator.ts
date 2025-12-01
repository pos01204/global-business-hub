/**
 * 응답 품질 검증기
 * LLM 응답의 품질을 검증하고 개선 제안
 */

export interface ValidationResult {
  isValid: boolean
  score: number // 0-100
  issues: string[]
  suggestions: string[]
  enhancedResponse?: string
}

export interface ValidationConfig {
  minLength: number
  maxLength: number
  requiredElements: string[]
  forbiddenPatterns: RegExp[]
  qualityThreshold: number
}

const DEFAULT_CONFIG: ValidationConfig = {
  minLength: 50,
  maxLength: 5000,
  requiredElements: [],
  forbiddenPatterns: [
    /undefined/gi,
    /null/gi,
    /NaN/gi,
    /\[object Object\]/gi,
    /error:/gi,
  ],
  qualityThreshold: 60,
}

export class ResponseValidator {
  private config: ValidationConfig

  constructor(config: Partial<ValidationConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  /**
   * 응답 검증
   */
  validate(response: string, context?: {
    query?: string
    intent?: string
    hasData?: boolean
  }): ValidationResult {
    const issues: string[] = []
    const suggestions: string[] = []
    let score = 100

    // 1. 길이 검증
    if (response.length < this.config.minLength) {
      issues.push('응답이 너무 짧습니다.')
      suggestions.push('더 상세한 분석 결과를 포함해주세요.')
      score -= 20
    }

    if (response.length > this.config.maxLength) {
      issues.push('응답이 너무 깁니다.')
      suggestions.push('핵심 내용만 간결하게 정리해주세요.')
      score -= 10
    }

    // 2. 금지 패턴 검사
    for (const pattern of this.config.forbiddenPatterns) {
      if (pattern.test(response)) {
        issues.push(`부적절한 내용 포함: ${pattern.source}`)
        score -= 15
      }
    }

    // 3. 필수 요소 검사
    for (const element of this.config.requiredElements) {
      if (!response.includes(element)) {
        issues.push(`필수 요소 누락: ${element}`)
        suggestions.push(`${element}를 포함해주세요.`)
        score -= 10
      }
    }

    // 4. 구조 검증 (섹션 구분)
    const hasStructure = this.checkStructure(response)
    if (!hasStructure) {
      issues.push('응답 구조가 불명확합니다.')
      suggestions.push('📊, 📈, 💡 등의 섹션 구분을 사용해주세요.')
      score -= 10
    }

    // 5. 숫자/데이터 포함 여부
    if (context?.hasData) {
      const hasNumbers = /\d+([,\.]\d+)?/.test(response)
      if (!hasNumbers) {
        issues.push('구체적인 수치가 없습니다.')
        suggestions.push('데이터에서 추출한 구체적인 숫자를 포함해주세요.')
        score -= 15
      }
    }

    // 6. 의도별 검증
    if (context?.intent) {
      const intentScore = this.validateByIntent(response, context.intent)
      score = Math.min(score, intentScore)
    }

    // 7. 반복 검사
    const repetitionScore = this.checkRepetition(response)
    if (repetitionScore < 80) {
      issues.push('내용이 반복됩니다.')
      score -= (100 - repetitionScore) / 2
    }

    // 점수 정규화
    score = Math.max(0, Math.min(100, score))

    return {
      isValid: score >= this.config.qualityThreshold,
      score,
      issues,
      suggestions,
    }
  }

  /**
   * 구조 검증
   */
  private checkStructure(response: string): boolean {
    // 이모지 섹션 구분 확인
    const sectionEmojis = ['📊', '📈', '💡', '🎯', '📋', '🔍']
    const hasSections = sectionEmojis.some((emoji) => response.includes(emoji))

    // 줄바꿈으로 구분된 섹션 확인
    const paragraphs = response.split('\n\n').filter((p) => p.trim().length > 0)
    const hasMultipleParagraphs = paragraphs.length >= 2

    return hasSections || hasMultipleParagraphs
  }

  /**
   * 의도별 검증
   */
  private validateByIntent(response: string, intent: string): number {
    let score = 100

    switch (intent) {
      case 'trend_analysis':
        if (!response.includes('추세') && !response.includes('트렌드') && !response.includes('변화')) {
          score -= 10
        }
        if (!/증가|감소|상승|하락|유지/.test(response)) {
          score -= 10
        }
        break

      case 'ranking':
        if (!/\d+위|상위|1\.|2\.|3\./.test(response)) {
          score -= 15
        }
        break

      case 'comparison':
        if (!response.includes('비교') && !response.includes('대비') && !response.includes('차이')) {
          score -= 10
        }
        break

      case 'aggregation':
        if (!/합계|총|평균|전체/.test(response)) {
          score -= 10
        }
        break
    }

    return score
  }

  /**
   * 반복 검사
   */
  private checkRepetition(response: string): number {
    const sentences = response.split(/[.!?]\s+/).filter((s) => s.length > 10)
    if (sentences.length < 2) return 100

    let repetitionCount = 0
    for (let i = 0; i < sentences.length; i++) {
      for (let j = i + 1; j < sentences.length; j++) {
        const similarity = this.calculateSimilarity(sentences[i], sentences[j])
        if (similarity > 0.7) {
          repetitionCount++
        }
      }
    }

    const maxPairs = (sentences.length * (sentences.length - 1)) / 2
    return 100 - (repetitionCount / maxPairs) * 100
  }

  /**
   * 문자열 유사도 계산 (간단한 Jaccard)
   */
  private calculateSimilarity(str1: string, str2: string): number {
    const words1 = new Set(str1.toLowerCase().split(/\s+/))
    const words2 = new Set(str2.toLowerCase().split(/\s+/))

    const intersection = new Set([...words1].filter((x) => words2.has(x)))
    const union = new Set([...words1, ...words2])

    return intersection.size / union.size
  }

  /**
   * 응답 개선 제안 생성
   */
  generateImprovementPrompt(
    originalResponse: string,
    validationResult: ValidationResult,
    context?: { query?: string; intent?: string }
  ): string {
    if (validationResult.isValid) {
      return originalResponse
    }

    const improvements = validationResult.suggestions.join('\n- ')

    return `다음 응답을 개선해주세요:

원본 응답:
${originalResponse}

개선 필요 사항:
- ${improvements}

${context?.query ? `원래 질문: ${context.query}` : ''}
${context?.intent ? `분석 유형: ${context.intent}` : ''}

개선된 응답을 작성해주세요. 기존 내용을 유지하면서 위 사항들을 보완해주세요.`
  }
}

// 데이터 분석용 검증기
export const dataAnalystValidator = new ResponseValidator({
  minLength: 100,
  maxLength: 3000,
  requiredElements: [],
  qualityThreshold: 60,
})

// 마케터용 검증기
export const marketerValidator = new ResponseValidator({
  minLength: 150,
  maxLength: 4000,
  requiredElements: [],
  qualityThreshold: 55,
})

// 비즈니스 매니저용 검증기
export const businessValidator = new ResponseValidator({
  minLength: 200,
  maxLength: 5000,
  requiredElements: [],
  qualityThreshold: 50,
})
