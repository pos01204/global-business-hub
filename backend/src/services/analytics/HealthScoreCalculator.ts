/**
 * 비즈니스 건강도 점수 계산기
 * 4개 차원(매출, 고객, 작가, 운영)의 건강도를 0-100으로 수치화
 * 
 * v2.0: 하드코딩 제거, 실제 데이터 기반 계산
 */

import {
  BusinessHealthScore,
  DimensionScore,
  ScoreFactor,
} from './types'

export interface HealthData {
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

// 물류 상태 정의
const DELAYED_STATUSES = ['14일+ 미입고', '7-14일 미입고', '지연', 'delayed', 'overdue']
const QC_FAIL_STATUSES = ['반품', '불량', 'QC실패', 'rejected', 'defective']

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
   * v2.0: 하드코딩 제거, 실제 데이터 기반 계산
   */
  private extractHealthData(currentData: any[], previousData: any[]): HealthData {
    // ==================== 매출 관련 ====================
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

    // ==================== 고객 관련 ====================
    const currentCustomers = new Set(currentData.map(row => row.user_id).filter(Boolean))
    const previousCustomers = new Set(previousData.map(row => row.user_id).filter(Boolean))
    
    // 재구매 고객 (현재 기간에 구매한 고객 중 이전 기간에도 구매한 고객)
    const repeatCustomers = [...currentCustomers].filter(c => previousCustomers.has(c))
    const repeatPurchaseRate = currentCustomers.size > 0 ? repeatCustomers.length / currentCustomers.size : 0
    
    // 이전 기간 재구매율 계산 (60일 전 데이터가 있다면)
    const previousRepeatRate = previousCustomers.size > 0 ? repeatCustomers.length / previousCustomers.size : 0.3

    // VIP 고객 정의: 구매 금액 상위 20%
    const customerSpending = new Map<string, number>()
    currentData.forEach(row => {
      const customerId = row.user_id
      if (customerId) {
        customerSpending.set(customerId, (customerSpending.get(customerId) || 0) + (Number(row['Total GMV']) || 0))
      }
    })
    const sortedCustomerSpending = [...customerSpending.entries()].sort((a, b) => b[1] - a[1])
    const vipThreshold = Math.ceil(sortedCustomerSpending.length * 0.2)
    const currentVips = new Set(sortedCustomerSpending.slice(0, vipThreshold).map(([id]) => id))

    // 이전 기간 VIP 계산
    const prevCustomerSpending = new Map<string, number>()
    previousData.forEach(row => {
      const customerId = row.user_id
      if (customerId) {
        prevCustomerSpending.set(customerId, (prevCustomerSpending.get(customerId) || 0) + (Number(row['Total GMV']) || 0))
      }
    })
    const sortedPrevSpending = [...prevCustomerSpending.entries()].sort((a, b) => b[1] - a[1])
    const prevVipThreshold = Math.ceil(sortedPrevSpending.length * 0.2)
    const previousVips = new Set(sortedPrevSpending.slice(0, prevVipThreshold).map(([id]) => id))

    // VIP 유지율: 이전 VIP 중 현재도 VIP인 비율
    const retainedVips = [...previousVips].filter(v => currentVips.has(v))
    const vipRetentionRate = previousVips.size > 0 ? retainedVips.length / previousVips.size : 0.85

    // 이탈 위험 고객: 이전 기간에 구매했으나 현재 기간에 구매 없는 고객
    const atRiskCustomers = [...previousCustomers].filter(c => !currentCustomers.has(c))
    const atRiskCustomerRatio = previousCustomers.size > 0 ? atRiskCustomers.length / previousCustomers.size : 0

    // ==================== 작가 관련 ====================
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

    // 이탈 위험 작가: 이전 기간 활동했으나 현재 기간 활동 없는 작가
    const atRiskArtists = [...previousArtists].filter(a => !currentArtists.has(a))
    const atRiskArtistCount = atRiskArtists.length

    // 신규 작가: 현재 기간에만 있는 작가
    const newArtists = [...currentArtists].filter(a => !previousArtists.has(a))
    const newArtistsThisMonth = newArtists.length

    // ==================== 운영 관련 ====================
    // 물류 처리 시간 계산 (order_created → 현재 상태까지)
    let totalProcessingDays = 0
    let processedOrders = 0
    let delayedOrders = 0
    let qcFailedOrders = 0
    let complaintOrders = 0

    currentData.forEach(row => {
      // 처리 시간 계산
      const orderDate = new Date(row.order_created)
      const statusDate = row.status_updated ? new Date(row.status_updated) : new Date()
      if (!isNaN(orderDate.getTime())) {
        const processingDays = Math.floor((statusDate.getTime() - orderDate.getTime()) / (1000 * 60 * 60 * 24))
        if (processingDays >= 0 && processingDays < 365) {  // 합리적인 범위
          totalProcessingDays += processingDays
          processedOrders += 1
        }
      }

      // 지연 건수 확인
      const status = String(row.status || row.logistics_status || '').toLowerCase()
      if (DELAYED_STATUSES.some(s => status.includes(s.toLowerCase()))) {
        delayedOrders += 1
      }

      // QC 실패 확인
      if (QC_FAIL_STATUSES.some(s => status.includes(s.toLowerCase()))) {
        qcFailedOrders += 1
      }

      // 고객 불만 확인 (비고나 상태에서)
      const note = String(row.note || row.remarks || '').toLowerCase()
      if (note.includes('불만') || note.includes('클레임') || note.includes('complaint')) {
        complaintOrders += 1
      }
    })

    const avgProcessingDays = processedOrders > 0 ? totalProcessingDays / processedOrders : 10
    const delayedOrderRatio = currentData.length > 0 ? delayedOrders / currentData.length : 0
    const qcPassRate = currentData.length > 0 ? 1 - (qcFailedOrders / currentData.length) : 0.92
    const customerComplaintRatio = currentData.length > 0 ? complaintOrders / currentData.length : 0

    return {
      currentGmv,
      previousGmv,
      currentAov,
      previousAov,
      dailyGmvValues,
      newCustomers: currentCustomers.size,
      previousNewCustomers: previousCustomers.size,
      repeatPurchaseRate,
      previousRepeatRate,
      vipRetentionRate,
      atRiskCustomerRatio,
      activeArtists: currentArtists.size,
      previousActiveArtists: previousArtists.size,
      top5ArtistRevenueShare,
      atRiskArtistCount,
      newArtistsThisMonth,
      avgProcessingDays,
      delayedOrderRatio,
      qcPassRate,
      customerComplaintRatio,
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
