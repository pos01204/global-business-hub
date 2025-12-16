/**
 * ABTestAnalyzer - A/B 테스트 분석 유틸리티
 * 통계적 유의성 검정 및 결과 해석
 */

import { statisticsEngine } from './StatisticsEngine'

// A/B 테스트 결과 타입
export interface ABTestResult {
  // 기본 통계
  controlMean: number
  treatmentMean: number
  controlStd: number
  treatmentStd: number
  controlSize: number
  treatmentSize: number
  
  // 효과 측정
  absoluteDifference: number
  relativeLift: number // 퍼센트
  
  // 통계 검정
  tStatistic: number
  pValue: number
  isSignificant: boolean
  confidenceLevel: number
  
  // 효과 크기
  effectSize: number // Cohen's d
  effectSizeInterpretation: 'negligible' | 'small' | 'medium' | 'large'
  
  // 신뢰 구간
  confidenceInterval: {
    lower: number
    upper: number
  }
  
  // 검정력 분석
  statisticalPower: number
  requiredSampleSize: number
  
  // 해석
  conclusion: string
  recommendation: string
}

// A/B 테스트 설정
export interface ABTestConfig {
  confidenceLevel?: number // 0.95 = 95%
  minimumDetectableEffect?: number // 최소 감지 효과 크기
  desiredPower?: number // 원하는 검정력 (0.8 = 80%)
  testType?: 'two-tailed' | 'one-tailed'
}

const DEFAULT_CONFIG: ABTestConfig = {
  confidenceLevel: 0.95,
  minimumDetectableEffect: 0.05,
  desiredPower: 0.8,
  testType: 'two-tailed',
}

export class ABTestAnalyzer {
  private config: ABTestConfig

  constructor(config: Partial<ABTestConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  /**
   * 두 그룹 간 t-검정 수행
   */
  analyze(control: number[], treatment: number[]): ABTestResult {
    // 기본 통계 계산
    const controlStats = statisticsEngine.summarize(control)
    const treatmentStats = statisticsEngine.summarize(treatment)

    const controlMean = controlStats.mean
    const treatmentMean = treatmentStats.mean
    const controlStd = controlStats.std
    const treatmentStd = treatmentStats.std
    const n1 = control.length
    const n2 = treatment.length

    // 효과 측정
    const absoluteDifference = treatmentMean - controlMean
    const relativeLift = controlMean !== 0 
      ? ((treatmentMean - controlMean) / Math.abs(controlMean)) * 100 
      : 0

    // Welch's t-test (불등분산 가정)
    const pooledVariance = (controlStd ** 2 / n1) + (treatmentStd ** 2 / n2)
    const standardError = Math.sqrt(pooledVariance)
    const tStatistic = absoluteDifference / standardError

    // 자유도 (Welch-Satterthwaite 방정식)
    const df = this.welchDF(controlStd, treatmentStd, n1, n2)

    // p-value 계산 (근사)
    const pValue = this.calculatePValue(tStatistic, df)
    const isSignificant = pValue < (1 - this.config.confidenceLevel!)

    // Cohen's d (효과 크기)
    const pooledStd = Math.sqrt(
      ((n1 - 1) * controlStd ** 2 + (n2 - 1) * treatmentStd ** 2) / (n1 + n2 - 2)
    )
    const effectSize = pooledStd !== 0 ? absoluteDifference / pooledStd : 0
    const effectSizeInterpretation = this.interpretEffectSize(effectSize)

    // 신뢰 구간
    const criticalValue = this.getCriticalValue(this.config.confidenceLevel!)
    const marginOfError = criticalValue * standardError
    const confidenceInterval = {
      lower: absoluteDifference - marginOfError,
      upper: absoluteDifference + marginOfError,
    }

    // 검정력 계산
    const statisticalPower = this.calculatePower(effectSize, n1, n2)

    // 필요 샘플 크기 계산
    const requiredSampleSize = this.calculateRequiredSampleSize(
      this.config.minimumDetectableEffect!,
      controlStd,
      this.config.desiredPower!
    )

    // 결론 및 권장사항 생성
    const { conclusion, recommendation } = this.generateConclusion({
      isSignificant,
      pValue,
      relativeLift,
      effectSize,
      effectSizeInterpretation,
      statisticalPower,
      n1,
      n2,
      requiredSampleSize,
    })

    return {
      controlMean,
      treatmentMean,
      controlStd,
      treatmentStd,
      controlSize: n1,
      treatmentSize: n2,
      absoluteDifference,
      relativeLift,
      tStatistic,
      pValue,
      isSignificant,
      confidenceLevel: this.config.confidenceLevel!,
      effectSize,
      effectSizeInterpretation,
      confidenceInterval,
      statisticalPower,
      requiredSampleSize,
      conclusion,
      recommendation,
    }
  }

  /**
   * 전환율 비교 (비율 검정)
   */
  analyzeConversionRate(
    controlConversions: number,
    controlTotal: number,
    treatmentConversions: number,
    treatmentTotal: number
  ): ABTestResult {
    const controlRate = controlConversions / controlTotal
    const treatmentRate = treatmentConversions / treatmentTotal

    // 비율의 표준편차
    const controlStd = Math.sqrt(controlRate * (1 - controlRate))
    const treatmentStd = Math.sqrt(treatmentRate * (1 - treatmentRate))

    // 풀링된 비율
    const pooledRate = (controlConversions + treatmentConversions) / (controlTotal + treatmentTotal)
    const pooledStd = Math.sqrt(pooledRate * (1 - pooledRate))

    // Z-검정
    const standardError = pooledStd * Math.sqrt(1/controlTotal + 1/treatmentTotal)
    const zStatistic = (treatmentRate - controlRate) / standardError

    // p-value (정규 분포 근사)
    const pValue = 2 * (1 - this.normalCDF(Math.abs(zStatistic)))
    const isSignificant = pValue < (1 - this.config.confidenceLevel!)

    // 효과 크기 (Cohen's h)
    const effectSize = 2 * Math.asin(Math.sqrt(treatmentRate)) - 2 * Math.asin(Math.sqrt(controlRate))
    const effectSizeInterpretation = this.interpretEffectSize(effectSize)

    // 신뢰 구간
    const criticalValue = this.getCriticalValue(this.config.confidenceLevel!)
    const ciStdError = Math.sqrt(
      (controlRate * (1 - controlRate) / controlTotal) +
      (treatmentRate * (1 - treatmentRate) / treatmentTotal)
    )
    const marginOfError = criticalValue * ciStdError
    const confidenceInterval = {
      lower: (treatmentRate - controlRate) - marginOfError,
      upper: (treatmentRate - controlRate) + marginOfError,
    }

    // 검정력 및 필요 샘플 크기
    const statisticalPower = this.calculatePower(effectSize, controlTotal, treatmentTotal)
    const requiredSampleSize = this.calculateRequiredSampleSizeForProportion(
      controlRate,
      this.config.minimumDetectableEffect!,
      this.config.desiredPower!
    )

    const relativeLift = controlRate !== 0 
      ? ((treatmentRate - controlRate) / controlRate) * 100 
      : 0

    const { conclusion, recommendation } = this.generateConclusion({
      isSignificant,
      pValue,
      relativeLift,
      effectSize,
      effectSizeInterpretation,
      statisticalPower,
      n1: controlTotal,
      n2: treatmentTotal,
      requiredSampleSize,
    })

    return {
      controlMean: controlRate,
      treatmentMean: treatmentRate,
      controlStd,
      treatmentStd,
      controlSize: controlTotal,
      treatmentSize: treatmentTotal,
      absoluteDifference: treatmentRate - controlRate,
      relativeLift,
      tStatistic: zStatistic,
      pValue,
      isSignificant,
      confidenceLevel: this.config.confidenceLevel!,
      effectSize,
      effectSizeInterpretation,
      confidenceInterval,
      statisticalPower,
      requiredSampleSize,
      conclusion,
      recommendation,
    }
  }

  /**
   * Welch 자유도 계산
   */
  private welchDF(s1: number, s2: number, n1: number, n2: number): number {
    const v1 = s1 ** 2 / n1
    const v2 = s2 ** 2 / n2
    const numerator = (v1 + v2) ** 2
    const denominator = (v1 ** 2 / (n1 - 1)) + (v2 ** 2 / (n2 - 1))
    return numerator / denominator
  }

  /**
   * p-value 계산 (t-분포 근사)
   */
  private calculatePValue(t: number, df: number): number {
    // Student's t-분포 CDF 근사 (정규 분포로 근사)
    const absT = Math.abs(t)
    const x = df / (df + absT ** 2)
    const beta = this.incompleteBeta(x, df / 2, 0.5)
    const pOneTail = beta / 2

    return this.config.testType === 'two-tailed' ? 2 * pOneTail : pOneTail
  }

  /**
   * 불완전 베타 함수 근사
   */
  private incompleteBeta(x: number, a: number, b: number): number {
    // 간단한 근사 (정확도를 위해서는 더 정교한 구현 필요)
    const bt = x === 0 || x === 1 
      ? 0 
      : Math.exp(
          this.logGamma(a + b) - this.logGamma(a) - this.logGamma(b) +
          a * Math.log(x) + b * Math.log(1 - x)
        )
    
    if (x < (a + 1) / (a + b + 2)) {
      return bt * this.betaCF(x, a, b) / a
    }
    return 1 - bt * this.betaCF(1 - x, b, a) / b
  }

  /**
   * 베타 연속 분수
   */
  private betaCF(x: number, a: number, b: number): number {
    const maxIterations = 100
    const epsilon = 1e-10
    
    let qab = a + b
    let qap = a + 1
    let qam = a - 1
    let c = 1
    let d = 1 - qab * x / qap
    if (Math.abs(d) < epsilon) d = epsilon
    d = 1 / d
    let h = d
    
    for (let m = 1; m <= maxIterations; m++) {
      const m2 = 2 * m
      let aa = m * (b - m) * x / ((qam + m2) * (a + m2))
      d = 1 + aa * d
      if (Math.abs(d) < epsilon) d = epsilon
      c = 1 + aa / c
      if (Math.abs(c) < epsilon) c = epsilon
      d = 1 / d
      h *= d * c
      aa = -(a + m) * (qab + m) * x / ((a + m2) * (qap + m2))
      d = 1 + aa * d
      if (Math.abs(d) < epsilon) d = epsilon
      c = 1 + aa / c
      if (Math.abs(c) < epsilon) c = epsilon
      d = 1 / d
      const del = d * c
      h *= del
      if (Math.abs(del - 1) < epsilon) break
    }
    
    return h
  }

  /**
   * 로그 감마 함수
   */
  private logGamma(x: number): number {
    const coefficients = [
      76.18009172947146, -86.50532032941677, 24.01409824083091,
      -1.231739572450155, 0.1208650973866179e-2, -0.5395239384953e-5
    ]
    
    let y = x
    let tmp = x + 5.5
    tmp -= (x + 0.5) * Math.log(tmp)
    let ser = 1.000000000190015
    
    for (let j = 0; j < 6; j++) {
      ser += coefficients[j] / ++y
    }
    
    return -tmp + Math.log(2.5066282746310005 * ser / x)
  }

  /**
   * 정규 분포 CDF
   */
  private normalCDF(x: number): number {
    const a1 = 0.254829592
    const a2 = -0.284496736
    const a3 = 1.421413741
    const a4 = -1.453152027
    const a5 = 1.061405429
    const p = 0.3275911
    
    const sign = x < 0 ? -1 : 1
    x = Math.abs(x) / Math.sqrt(2)
    
    const t = 1 / (1 + p * x)
    const y = 1 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x)
    
    return 0.5 * (1 + sign * y)
  }

  /**
   * 임계값 계산 (정규 분포)
   */
  private getCriticalValue(confidenceLevel: number): number {
    // 일반적인 신뢰 수준에 대한 임계값
    const criticalValues: Record<number, number> = {
      0.90: 1.645,
      0.95: 1.96,
      0.99: 2.576,
    }
    return criticalValues[confidenceLevel] || 1.96
  }

  /**
   * 효과 크기 해석
   */
  private interpretEffectSize(d: number): 'negligible' | 'small' | 'medium' | 'large' {
    const absD = Math.abs(d)
    if (absD < 0.2) return 'negligible'
    if (absD < 0.5) return 'small'
    if (absD < 0.8) return 'medium'
    return 'large'
  }

  /**
   * 검정력 계산
   */
  private calculatePower(effectSize: number, n1: number, n2: number): number {
    const criticalValue = this.getCriticalValue(this.config.confidenceLevel!)
    const harmonicN = (2 * n1 * n2) / (n1 + n2)
    const ncp = effectSize * Math.sqrt(harmonicN / 2) // 비중심 모수
    
    // 검정력 근사
    const power = 1 - this.normalCDF(criticalValue - ncp)
    return Math.min(Math.max(power, 0), 1)
  }

  /**
   * 필요 샘플 크기 계산
   */
  private calculateRequiredSampleSize(
    mde: number,
    std: number,
    power: number
  ): number {
    const alpha = 1 - this.config.confidenceLevel!
    const zAlpha = this.getCriticalValue(this.config.confidenceLevel!)
    const zBeta = this.getZForPower(power)
    
    const n = 2 * ((zAlpha + zBeta) ** 2) * (std ** 2) / (mde ** 2)
    return Math.ceil(n)
  }

  /**
   * 비율 검정용 필요 샘플 크기
   */
  private calculateRequiredSampleSizeForProportion(
    baseRate: number,
    mde: number,
    power: number
  ): number {
    const p1 = baseRate
    const p2 = baseRate * (1 + mde)
    const pBar = (p1 + p2) / 2
    
    const zAlpha = this.getCriticalValue(this.config.confidenceLevel!)
    const zBeta = this.getZForPower(power)
    
    const n = (
      (zAlpha * Math.sqrt(2 * pBar * (1 - pBar)) +
       zBeta * Math.sqrt(p1 * (1 - p1) + p2 * (1 - p2))) ** 2
    ) / ((p2 - p1) ** 2)
    
    return Math.ceil(n)
  }

  /**
   * 검정력에 대한 Z 값
   */
  private getZForPower(power: number): number {
    const powerZValues: Record<number, number> = {
      0.80: 0.84,
      0.85: 1.04,
      0.90: 1.28,
      0.95: 1.645,
    }
    return powerZValues[power] || 0.84
  }

  /**
   * 결론 및 권장사항 생성
   */
  private generateConclusion(params: {
    isSignificant: boolean
    pValue: number
    relativeLift: number
    effectSize: number
    effectSizeInterpretation: string
    statisticalPower: number
    n1: number
    n2: number
    requiredSampleSize: number
  }): { conclusion: string; recommendation: string } {
    let conclusion: string
    let recommendation: string

    if (params.isSignificant) {
      const direction = params.relativeLift > 0 ? '증가' : '감소'
      conclusion = `통계적으로 유의한 차이가 발견되었습니다 (p=${params.pValue.toFixed(4)}). ` +
        `처리군이 대조군 대비 ${Math.abs(params.relativeLift).toFixed(1)}% ${direction}했습니다. ` +
        `효과 크기는 ${params.effectSizeInterpretation} 수준입니다.`

      if (params.effectSizeInterpretation === 'large' || params.effectSizeInterpretation === 'medium') {
        recommendation = '실질적으로 의미 있는 효과가 확인되었습니다. 변경사항 적용을 권장합니다.'
      } else {
        recommendation = '통계적으로 유의하나 효과 크기가 작습니다. 비즈니스 영향을 추가로 검토하세요.'
      }
    } else {
      conclusion = `통계적으로 유의한 차이가 발견되지 않았습니다 (p=${params.pValue.toFixed(4)}).`

      if (params.statisticalPower < 0.8) {
        recommendation = `검정력이 낮습니다 (${(params.statisticalPower * 100).toFixed(0)}%). ` +
          `최소 ${params.requiredSampleSize.toLocaleString()}개의 샘플이 필요합니다. 테스트를 계속 진행하세요.`
      } else {
        recommendation = '충분한 검정력으로 테스트했으나 유의한 차이가 없습니다. 다른 가설을 검토하세요.'
      }
    }

    return { conclusion, recommendation }
  }
}

// 싱글톤 인스턴스
export const abTestAnalyzer = new ABTestAnalyzer()

