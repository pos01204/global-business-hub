/**
 * 비즈니스 건강도 점수 계산기
 * 4개 차원(매출, 고객, 작가, 운영)의 건강도를 0-100으로 수치화
 */

import {
  BusinessHealthScore,
  DimensionScore,
  ScoreFactor,
} from './types'

interface HealthData {
  // 매출 관련
  currentGmv: number
  previousGmv: number
  currentAov: number
  previousAov: number
  dailyGmvValues: number[]  // 변동성 계산용
  targetGmv?: number

  // 고객 관련
  newCustomers: number
  previousNewCustomers: number
  repeatPurchaseRate: number
  previousRepeatRate: number
  vipRetentionRate: number
  atRiskCustomerRatio: number

  // 작가 관련
  activeArtists: number
  previousActiveArtists: number
  top5ArtistRevenueShare: number
  atRiskArtistCount: number
  newArtistsThisMonth: number

  // 운영 관련
  avgProcessingDays: number
  delayedOrderRatio: number
  qcPassRate: number
  customerComplaintRatio: number
}

export class HealthScoreCalculator {
  /**
   * Raw 주문 데이터에서 건강도 점수 계산
   */
  calculate(currentData: any[], previousData: any[]): BusinessHealthScore {
    const healthData = this.extractHealthData(currentData, previousData)
    return this.calculateFromHealthData(healthData)
  }

  /**
   * Raw 데이터에서 HealthData 추출
   */
  private extractHealthData(currentData: any[], previousData: any[]): HealthData {
    // 매출 관련
    const currentGmv = currentData.reduce((sum, row) => sum + (Number(row['Total GMV']) || 0), 0)
    const previousGmv = previousData.reduce((sum, row) => sum + (Number(row['Total GMV']) || 0), 0)
    const currentAov = currentData.length > 0 ? currentGmv / currentData.length : 0
    const previousAov = previousData.length > 0 ? previousGmv / previousData.length : 0

    // 일별 GMV 계산 (변동성용)
    const dailyGmvMap = new Map<string, number>()
    currentData.forEach(row => {
      const date = row.order_created?.split('T')[0] || row.order_created?.split(' ')[0]
      if (date) {
        dailyGmvMap.set(date, (dailyGmvMap.get(date) || 0) + (Number(row['Total GMV']) || 0))
      }
    })
    const dailyGmvValues = Array.from(dailyGmvMap.values())

    // 고객 관련
    const currentCustomers = new Set(currentData.map(row => row.user_id).filter(Boolean))
    const previousCustomers = new Set(previousData.map(row => row.user_id).filter(Boolean))
    const repeatCustomers = [...currentCustomers].filter(c => previousCustomers.has(c))
    const repeatPurchaseRate = currentCustomers.size > 0 ? repeatCustomers.length / currentCustomers.size : 0

    // 작가 관련
    const currentArtists = new Set(currentData.map(row => row['artist_name (kr)']).filter(Boolean))
    const previousArtists = new Set(previousData.map(row => row['artist_name (kr)']).filter(Boolean))

    // 작가별 매출 계산
    const artistRevenue = new Map<string, number>()
    currentData.forEach(row => {
      const artist = row['artist_name (kr)']
      if (artist) {
        artistRevenue.set(artist, (artistRevenue.get(artist) || 0) + (Number(row['Total GMV']) || 0))
      }
    })
    const sortedArtistRevenue = [...artistRevenue.entries()].sort((a, b) => b[1] - a[1])
    const top5Revenue = sortedArtistRevenue.slice(0, 5).reduce((sum, [, rev]) => sum + rev, 0)
    const top5ArtistRevenueShare = currentGmv > 0 ? top5Revenue / currentGmv : 0

    return {
      currentGmv,
      previousGmv,
      currentAov,
      previousAov,
      dailyGmvValues,
      newCustomers: currentCustomers.size,
      previousNewCustomers: previousCustomers.size,
      repeatPurchaseRate,
      previousRepeatRate: 0.3, // 기본값
      vipRetentionRate: 0.85, // 기본값
      atRiskCustomerRatio: 0.15, // 기본값
      activeArtists: currentArtists.size,
      previousActiveArtists: previousArtists.size,
      top5ArtistRevenueShare,
      atRiskArtistCount: 0, // 기본값
      newArtistsThisMonth: Math.max(0, currentArtists.size - previousArtists.size),
      avgProcessingDays: 10, // 기본값
      delayedOrderRatio: 0.1, // 기본값
      qcPassRate: 0.92, // 기본값
      customerComplaintRatio: 0.02, // 기본값
    }
  }

  /**
   * HealthData에서 건강도 점수 계산
   */
  calculateFromHealthData(data: HealthData): BusinessHealthScore {
    const revenue = this.calculateRevenueHealth(data)
    const customer = this.calculateCustomerHealth(data)
    const artist = this.calculateArtistHealth(data)
    const operations = this.calculateOperationsHealth(data)

    // 가중 평균으로 종합 점수 계산
    const weights = {
      revenue: 0.35,
      customer: 0.25,
      artist: 0.20,
      operations: 0.20,
    }

    const overall = Math.round(
      revenue.score * weights.revenue +
      customer.score * weights.customer +
      artist.score * weights.artist +
      operations.score * weights.operations
    )

    return {
      overall,
      calculatedAt: new Date(),
      dimensions: {
        revenue,
        customer,
        artist,
        operations,
      },
    }
  }

  /**
   * 매출 건강도 (0-100)
   */
  private calculateRevenueHealth(data: HealthData): DimensionScore {
    const factors: ScoreFactor[] = []
    let score = 50 // 기본 점수

    // 1. 성장률 (+/- 20점)
    const growthRate = data.previousGmv > 0 
      ? (data.currentGmv - data.previousGmv) / data.previousGmv 
      : 0

    let growthContribution = 0
    let growthStatus: ScoreFactor['status'] = 'good'

    if (growthRate > 0.15) {
      growthContribution = 20
      growthStatus = 'good'
    } else if (growthRate > 0.05) {
      growthContribution = 10
      growthStatus = 'good'
    } else if (growthRate > 0) {
      growthContribution = 5
      growthStatus = 'warning'
    } else if (growthRate > -0.05) {
      growthContribution = -5
      growthStatus = 'warning'
    } else if (growthRate > -0.15) {
      growthContribution = -10
      growthStatus = 'critical'
    } else {
      growthContribution = -20
      growthStatus = 'critical'
    }

    score += growthContribution
    factors.push({
      name: '매출 성장률',
      value: growthRate,
      contribution: growthContribution,
      status: growthStatus,
    })

    // 2. AOV 트렌드 (+/- 10점)
    const aovChange = data.previousAov > 0
      ? (data.currentAov - data.previousAov) / data.previousAov
      : 0

    let aovContribution = 0
    let aovStatus: ScoreFactor['status'] = 'good'

    if (aovChange > 0.05) {
      aovContribution = 10
    } else if (aovChange > 0) {
      aovContribution = 5
    } else if (aovChange > -0.05) {
      aovContribution = -5
      aovStatus = 'warning'
    } else {
      aovContribution = -10
      aovStatus = 'critical'
    }

    score += aovContribution
    factors.push({
      name: 'AOV 변화',
      value: aovChange,
      contribution: aovContribution,
      status: aovStatus,
    })

    // 3. 변동성 (+/- 10점)
    const volatility = this.calculateVolatility(data.dailyGmvValues)
    let volatilityContribution = 0
    let volatilityStatus: ScoreFactor['status'] = 'good'

    if (volatility < 0.1) {
      volatilityContribution = 10
    } else if (volatility < 0.2) {
      volatilityContribution = 5
    } else if (volatility > 0.3) {
      volatilityContribution = -10
      volatilityStatus = 'warning'
    }

    score += volatilityContribution
    factors.push({
      name: '매출 안정성',
      value: 1 - volatility,
      contribution: volatilityContribution,
      status: volatilityStatus,
    })

    // 4. 목표 달성률 (+/- 10점)
    if (data.targetGmv && data.targetGmv > 0) {
      const achievement = data.currentGmv / data.targetGmv
      let achievementContribution = 0
      let achievementStatus: ScoreFactor['status'] = 'good'

      if (achievement >= 1.0) {
        achievementContribution = 10
      } else if (achievement >= 0.9) {
        achievementContribution = 5
      } else if (achievement < 0.7) {
        achievementContribution = -10
        achievementStatus = 'critical'
      }

      score += achievementContribution
      factors.push({
        name: '목표 달성률',
        value: achievement,
        contribution: achievementContribution,
        status: achievementStatus,
      })
    }

    // 트렌드 결정
    const trend = growthRate > 0.02 ? 'up' : growthRate < -0.02 ? 'down' : 'stable'

    return {
      score: Math.max(0, Math.min(100, score)),
      trend,
      change: growthRate,
      factors,
    }
  }

  /**
   * 고객 건강도 (0-100)
   */
  private calculateCustomerHealth(data: HealthData): DimensionScore {
    const factors: ScoreFactor[] = []
    let score = 50

    // 1. 신규 고객 유입 (+/- 15점)
    const newCustomerGrowth = data.previousNewCustomers > 0
      ? (data.newCustomers - data.previousNewCustomers) / data.previousNewCustomers
      : 0

    let newCustContribution = 0
    let newCustStatus: ScoreFactor['status'] = 'good'

    if (newCustomerGrowth > 0.2) {
      newCustContribution = 15
    } else if (newCustomerGrowth > 0.1) {
      newCustContribution = 10
    } else if (newCustomerGrowth > 0) {
      newCustContribution = 5
    } else {
      newCustContribution = -10
      newCustStatus = 'warning'
    }

    score += newCustContribution
    factors.push({
      name: '신규 고객 성장',
      value: newCustomerGrowth,
      contribution: newCustContribution,
      status: newCustStatus,
    })

    // 2. 재구매율 (+/- 15점)
    let repeatContribution = 0
    let repeatStatus: ScoreFactor['status'] = 'good'

    if (data.repeatPurchaseRate > 0.4) {
      repeatContribution = 15
    } else if (data.repeatPurchaseRate > 0.3) {
      repeatContribution = 10
    } else if (data.repeatPurchaseRate > 0.2) {
      repeatContribution = 5
    } else {
      repeatContribution = -10
      repeatStatus = 'warning'
    }

    score += repeatContribution
    factors.push({
      name: '재구매율',
      value: data.repeatPurchaseRate,
      contribution: repeatContribution,
      status: repeatStatus,
    })

    // 3. VIP 유지율 (+/- 10점)
    let vipContribution = 0
    let vipStatus: ScoreFactor['status'] = 'good'

    if (data.vipRetentionRate > 0.9) {
      vipContribution = 10
    } else if (data.vipRetentionRate > 0.8) {
      vipContribution = 5
    } else if (data.vipRetentionRate < 0.7) {
      vipContribution = -10
      vipStatus = 'critical'
    }

    score += vipContribution
    factors.push({
      name: 'VIP 유지율',
      value: data.vipRetentionRate,
      contribution: vipContribution,
      status: vipStatus,
    })

    // 4. 이탈 위험 고객 비율 (+/- 10점)
    let atRiskContribution = 0
    let atRiskStatus: ScoreFactor['status'] = 'good'

    if (data.atRiskCustomerRatio < 0.1) {
      atRiskContribution = 10
    } else if (data.atRiskCustomerRatio < 0.2) {
      atRiskContribution = 5
    } else if (data.atRiskCustomerRatio > 0.3) {
      atRiskContribution = -10
      atRiskStatus = 'critical'
    }

    score += atRiskContribution
    factors.push({
      name: '이탈 위험 비율',
      value: 1 - data.atRiskCustomerRatio,
      contribution: atRiskContribution,
      status: atRiskStatus,
    })

    // 트렌드 결정
    const repeatChange = data.repeatPurchaseRate - data.previousRepeatRate
    const trend = repeatChange > 0.02 ? 'up' : repeatChange < -0.02 ? 'down' : 'stable'

    return {
      score: Math.max(0, Math.min(100, score)),
      trend,
      change: repeatChange,
      factors,
    }
  }

  /**
   * 작가 건강도 (0-100)
   */
  private calculateArtistHealth(data: HealthData): DimensionScore {
    const factors: ScoreFactor[] = []
    let score = 50

    // 1. 활성 작가 수 변화 (+/- 15점)
    const artistGrowth = data.previousActiveArtists > 0
      ? (data.activeArtists - data.previousActiveArtists) / data.previousActiveArtists
      : 0

    let artistContribution = 0
    let artistStatus: ScoreFactor['status'] = 'good'

    if (artistGrowth > 0.1) {
      artistContribution = 15
    } else if (artistGrowth > 0) {
      artistContribution = 5
    } else if (artistGrowth > -0.05) {
      artistContribution = -5
      artistStatus = 'warning'
    } else {
      artistContribution = -15
      artistStatus = 'critical'
    }

    score += artistContribution
    factors.push({
      name: '활성 작가 성장',
      value: artistGrowth,
      contribution: artistContribution,
      status: artistStatus,
    })

    // 2. 집중도 리스크 (+/- 15점)
    let concentrationContribution = 0
    let concentrationStatus: ScoreFactor['status'] = 'good'

    if (data.top5ArtistRevenueShare < 0.3) {
      concentrationContribution = 15
    } else if (data.top5ArtistRevenueShare < 0.4) {
      concentrationContribution = 5
    } else if (data.top5ArtistRevenueShare > 0.5) {
      concentrationContribution = -15
      concentrationStatus = 'critical'
    }

    score += concentrationContribution
    factors.push({
      name: '매출 분산도',
      value: 1 - data.top5ArtistRevenueShare,
      contribution: concentrationContribution,
      status: concentrationStatus,
    })

    // 3. 이탈 위험 작가 (+/- 10점)
    let atRiskContribution = 0
    let atRiskStatus: ScoreFactor['status'] = 'good'

    if (data.atRiskArtistCount === 0) {
      atRiskContribution = 10
    } else if (data.atRiskArtistCount <= 2) {
      atRiskContribution = 5
    } else if (data.atRiskArtistCount > 5) {
      atRiskContribution = -10
      atRiskStatus = 'critical'
    }

    score += atRiskContribution
    factors.push({
      name: '이탈 위험 작가',
      value: data.atRiskArtistCount,
      contribution: atRiskContribution,
      status: atRiskStatus,
    })

    // 4. 신규 작가 온보딩 (+/- 10점)
    let newArtistContribution = 0
    let newArtistStatus: ScoreFactor['status'] = 'good'

    if (data.newArtistsThisMonth >= 5) {
      newArtistContribution = 10
    } else if (data.newArtistsThisMonth >= 2) {
      newArtistContribution = 5
    } else if (data.newArtistsThisMonth === 0) {
      newArtistContribution = -5
      newArtistStatus = 'warning'
    }

    score += newArtistContribution
    factors.push({
      name: '신규 작가 유입',
      value: data.newArtistsThisMonth,
      contribution: newArtistContribution,
      status: newArtistStatus,
    })

    const trend = artistGrowth > 0.02 ? 'up' : artistGrowth < -0.02 ? 'down' : 'stable'

    return {
      score: Math.max(0, Math.min(100, score)),
      trend,
      change: artistGrowth,
      factors,
    }
  }

  /**
   * 운영 효율성 (0-100)
   */
  private calculateOperationsHealth(data: HealthData): DimensionScore {
    const factors: ScoreFactor[] = []
    let score = 50

    // 1. 평균 처리 시간 (+/- 15점)
    let processingContribution = 0
    let processingStatus: ScoreFactor['status'] = 'good'

    if (data.avgProcessingDays < 7) {
      processingContribution = 15
    } else if (data.avgProcessingDays < 10) {
      processingContribution = 10
    } else if (data.avgProcessingDays < 14) {
      processingContribution = 5
    } else if (data.avgProcessingDays > 21) {
      processingContribution = -15
      processingStatus = 'critical'
    }

    score += processingContribution
    factors.push({
      name: '처리 속도',
      value: 1 / (data.avgProcessingDays || 1),
      contribution: processingContribution,
      status: processingStatus,
    })

    // 2. 지연 건수 비율 (+/- 15점)
    let delayContribution = 0
    let delayStatus: ScoreFactor['status'] = 'good'

    if (data.delayedOrderRatio < 0.05) {
      delayContribution = 15
    } else if (data.delayedOrderRatio < 0.1) {
      delayContribution = 10
    } else if (data.delayedOrderRatio > 0.2) {
      delayContribution = -15
      delayStatus = 'critical'
    }

    score += delayContribution
    factors.push({
      name: '정시 처리율',
      value: 1 - data.delayedOrderRatio,
      contribution: delayContribution,
      status: delayStatus,
    })

    // 3. 검수 통과율 (+/- 10점)
    let qcContribution = 0
    let qcStatus: ScoreFactor['status'] = 'good'

    if (data.qcPassRate > 0.95) {
      qcContribution = 10
    } else if (data.qcPassRate > 0.9) {
      qcContribution = 5
    } else if (data.qcPassRate < 0.85) {
      qcContribution = -10
      qcStatus = 'critical'
    }

    score += qcContribution
    factors.push({
      name: 'QC 통과율',
      value: data.qcPassRate,
      contribution: qcContribution,
      status: qcStatus,
    })

    // 4. 고객 불만 비율 (+/- 10점)
    let complaintContribution = 0
    let complaintStatus: ScoreFactor['status'] = 'good'

    if (data.customerComplaintRatio < 0.01) {
      complaintContribution = 10
    } else if (data.customerComplaintRatio < 0.02) {
      complaintContribution = 5
    } else if (data.customerComplaintRatio > 0.05) {
      complaintContribution = -10
      complaintStatus = 'critical'
    }

    score += complaintContribution
    factors.push({
      name: '고객 만족도',
      value: 1 - data.customerComplaintRatio,
      contribution: complaintContribution,
      status: complaintStatus,
    })

    // 트렌드는 지연율 기준
    const trend = data.delayedOrderRatio < 0.1 ? 'up' : data.delayedOrderRatio > 0.15 ? 'down' : 'stable'

    return {
      score: Math.max(0, Math.min(100, score)),
      trend,
      change: -data.delayedOrderRatio,
      factors,
    }
  }

  /**
   * 변동성 계산 (변동계수)
   */
  private calculateVolatility(values: number[]): number {
    if (values.length < 2) return 0

    const mean = values.reduce((a, b) => a + b, 0) / values.length
    if (mean === 0) return 0

    const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length
    return Math.sqrt(variance) / Math.abs(mean)
  }
}
