/**
 * 비용 분석 및 손익 시뮬레이션 서비스
 */

import {
  COUNTRY_TIERS,
  SHIPPING_POLICIES,
  TAX_POLICIES,
  YAMATO_RATES,
  NEKOPOS_RATE,
  NEKOPOS_MAX_WEIGHT,
  NEKOPOS_MAX_HEIGHT,
  KPACKET_RATES,
  KPACKET_SURCHARGES,
  EMS_RATES,
  USPS_RATES,
  SF_RATES,
  EXCHANGE_RATES,
  CARRIER_AVAILABILITY,
  RECOMMENDED_CARRIERS,
  CarrierType,
} from '../config/shippingRates';

export interface ShippingRateResult {
  carrier: CarrierType;
  carrierName: string;
  rate: number;
  surcharge: number;
  totalRate: number;
  isRecommended: boolean;
  notes?: string;
}

export interface SimulationInput {
  country: string;
  productPriceKRW: number;
  weightKg: number;
  dimensions?: {
    lengthCm: number;
    widthCm: number;
    heightCm: number;
  };
  itemCount?: number;
  carrier?: CarrierType;
}

export interface SimulationResult {
  input: SimulationInput;
  country: {
    code: string;
    name: string;
    tier: number;
  };
  shippingPolicy: {
    customerShippingFeeKRW: number;
    isFreeShipping: boolean;
    freeShippingReason?: string;
  };
  logistics: {
    selectedCarrier: CarrierType;
    carrierName: string;
    actualShippingCost: number;
    surcharge: number;
    totalLogisticsCost: number;
    volumeWeight?: number;
    chargeableWeight: number;
  };
  tax: {
    applicable: boolean;
    estimatedTax: number;
    paidBy: string;
    notes?: string;
  };
  profitAnalysis: {
    revenue: number;
    customerShippingFee: number;
    totalRevenue: number;
    logisticsCost: number;
    taxCost: number;
    totalCost: number;
    grossProfit: number;
    grossMarginPercent: number;
    hiddenFeeNeeded: number;
    recommendedPrice?: number;
  };
  alternatives: ShippingRateResult[];
}

export interface CountryAnalysis {
  country: string;
  countryName: string;
  tier: number;
  orderCount: number;
  totalGMV: number;
  totalLogisticsCost: number;
  avgLogisticsCost: number;
  customerShippingRevenue: number;
  logisticsGap: number;
  profitMargin: number;
  avgOrderValue: number;
}

export interface DashboardSummary {
  period: { startDate: string; endDate: string };
  kpis: {
    totalGMV: number;
    totalLogisticsCost: number;
    logisticsCostRatio: number;
    customerShippingRevenue: number;
    netLogisticsCost: number;
    grossProfit: number;
    grossMarginPercent: number;
    avgOrderValue: number;
    avgLogisticsCost: number;
    orderCount: number;
  };
  byTier: {
    tier: number;
    orderCount: number;
    gmv: number;
    logisticsCost: number;
    profitMargin: number;
  }[];
  byCountry: CountryAnalysis[];
  topCountries: CountryAnalysis[];
  trends: {
    date: string;
    gmv: number;
    logisticsCost: number;
    orderCount: number;
  }[];
}

// 운송사 한글명
const CARRIER_NAMES: Record<CarrierType, string> = {
  'YAMATO': '야마토 (LOTTEGLOBAL)',
  'NEKOPOS': '네코포스',
  'KPACKET': 'K-Packet',
  'EMS': 'EMS',
  'SF': 'SF Express',
  'UPS': 'UPS',
  'USPS': 'USPS',
  'FEDEX': 'FedEx',
  'CXC': 'CXC Express',
};

/**
 * 부피중량 계산 (cm → kg)
 */
export function calculateVolumeWeight(lengthCm: number, widthCm: number, heightCm: number): number {
  return (lengthCm * widthCm * heightCm) / 5000;
}

/**
 * 청구중량 계산 (실중량 vs 부피중량 중 큰 값)
 */
export function calculateChargeableWeight(
  actualWeight: number,
  dimensions?: { lengthCm: number; widthCm: number; heightCm: number }
): { chargeableWeight: number; volumeWeight?: number } {
  if (!dimensions) {
    return { chargeableWeight: Math.ceil(actualWeight * 10) / 10 };
  }
  
  const volumeWeight = calculateVolumeWeight(dimensions.lengthCm, dimensions.widthCm, dimensions.heightCm);
  const chargeableWeight = Math.max(actualWeight, volumeWeight);
  
  return {
    chargeableWeight: Math.ceil(chargeableWeight * 10) / 10,
    volumeWeight: Math.round(volumeWeight * 100) / 100,
  };
}

/**
 * 특정 운송사의 운임 조회
 */
export function getCarrierRate(carrier: CarrierType, country: string, weight: number): number | null {
  // 중량 반올림 (0.1kg 단위)
  const roundedWeight = Math.ceil(weight * 10) / 10;
  
  switch (carrier) {
    case 'YAMATO':
      if (country !== 'JP') return null;
      for (const tier of YAMATO_RATES) {
        if (roundedWeight <= tier.maxWeight) return tier.rate;
      }
      return null;
      
    case 'NEKOPOS':
      if (country !== 'JP' || roundedWeight > NEKOPOS_MAX_WEIGHT) return null;
      return NEKOPOS_RATE;
      
    case 'KPACKET':
      const kpacketRates = KPACKET_RATES[country];
      if (!kpacketRates) return null;
      for (const tier of kpacketRates) {
        if (roundedWeight <= tier.maxWeight) return tier.rate;
      }
      return null;
      
    case 'EMS':
      const emsRates = EMS_RATES[country];
      if (!emsRates) return null;
      for (const tier of emsRates) {
        if (roundedWeight <= tier.maxWeight) return tier.rate;
      }
      return null;
      
    case 'USPS':
      if (country !== 'US') return null;
      for (const tier of USPS_RATES) {
        if (roundedWeight <= tier.maxWeight) return tier.rate;
      }
      return null;
      
    case 'SF':
      const sfRates = SF_RATES[country];
      if (!sfRates) return null;
      for (const tier of sfRates) {
        if (roundedWeight <= tier.maxWeight) return tier.rate;
      }
      return null;
      
    default:
      return null;
  }
}

/**
 * 국가/중량별 모든 사용 가능한 운송사 요금 조회
 */
export function getAllAvailableRates(
  country: string,
  weight: number,
  heightCm?: number
): ShippingRateResult[] {
  const results: ShippingRateResult[] = [];
  const recommendedCarriers = RECOMMENDED_CARRIERS[country] || RECOMMENDED_CARRIERS['default'];
  
  for (const [carrier, countries] of Object.entries(CARRIER_AVAILABILITY)) {
    if (!countries.includes(country)) continue;
    
    const carrierType = carrier as CarrierType;
    
    // NEKOPOS 높이 제한 체크
    if (carrierType === 'NEKOPOS' && heightCm && heightCm > NEKOPOS_MAX_HEIGHT) {
      continue;
    }
    
    const rate = getCarrierRate(carrierType, country, weight);
    if (rate === null) continue;
    
    // K-Packet 특별운송수수료
    let surcharge = 0;
    if (carrierType === 'KPACKET') {
      surcharge = KPACKET_SURCHARGES[country] || KPACKET_SURCHARGES['default'];
    }
    
    results.push({
      carrier: carrierType,
      carrierName: CARRIER_NAMES[carrierType],
      rate,
      surcharge,
      totalRate: rate + surcharge,
      isRecommended: recommendedCarriers.includes(carrierType),
      notes: carrierType === 'NEKOPOS' ? '1kg 이하, 높이 2.5cm 이하만 가능' : undefined,
    });
  }
  
  // 총 요금 기준 오름차순 정렬
  results.sort((a, b) => a.totalRate - b.totalRate);
  
  return results;
}

/**
 * 무료배송 여부 판단
 */
export function checkFreeShipping(
  tier: number,
  priceUSD: number,
  itemCount: number
): { isFree: boolean; reason?: string } {
  const policy = SHIPPING_POLICIES[tier as 1 | 2 | 3 | 4];
  if (!policy) return { isFree: false };
  
  if (priceUSD >= policy.freeShippingThresholdUSD) {
    return { isFree: true, reason: `$${policy.freeShippingThresholdUSD} 이상 구매` };
  }
  
  if (policy.freeShippingItemCount && itemCount >= policy.freeShippingItemCount) {
    return { isFree: true, reason: `${policy.freeShippingItemCount}개 이상 구매` };
  }
  
  return { isFree: false };
}

/**
 * 단일 주문 손익 시뮬레이션
 */
export function simulateOrder(input: SimulationInput): SimulationResult {
  const countryInfo = COUNTRY_TIERS[input.country];
  if (!countryInfo) {
    throw new Error(`지원하지 않는 국가입니다: ${input.country}`);
  }
  
  const tier = countryInfo.tier;
  const policy = SHIPPING_POLICIES[tier as 1 | 2 | 3 | 4];
  const usdRate = EXCHANGE_RATES['USD'];
  
  // 청구중량 계산
  const { chargeableWeight, volumeWeight } = calculateChargeableWeight(
    input.weightKg,
    input.dimensions
  );
  
  // 무료배송 체크
  const priceUSD = input.productPriceKRW / usdRate;
  const freeShippingCheck = checkFreeShipping(tier, priceUSD, input.itemCount || 1);
  
  // 고객 배송비
  const customerShippingFeeKRW = freeShippingCheck.isFree
    ? 0
    : Math.round(policy.customerShippingFeeUSD * usdRate);
  
  // 운송사별 요금 조회
  const availableRates = getAllAvailableRates(
    input.country,
    chargeableWeight,
    input.dimensions?.heightCm
  );
  
  if (availableRates.length === 0) {
    throw new Error(`해당 국가/중량에 대한 운송 옵션이 없습니다.`);
  }
  
  // 선택된 운송사 (지정 or 최저가)
  let selectedRate: ShippingRateResult;
  if (input.carrier) {
    const found = availableRates.find(r => r.carrier === input.carrier);
    if (!found) throw new Error(`선택한 운송사(${input.carrier})를 사용할 수 없습니다.`);
    selectedRate = found;
  } else {
    selectedRate = availableRates[0]; // 최저가
  }
  
  // 관부가세 계산
  const taxPolicy = TAX_POLICIES[input.country];
  let estimatedTax = 0;
  let taxApplicable = false;
  let taxNotes = '';
  
  if (taxPolicy) {
    const localCurrency = taxPolicy.dutyFreeThresholdCurrency;
    const exchangeRate = EXCHANGE_RATES[localCurrency] || 1;
    const priceInLocal = input.productPriceKRW / exchangeRate;
    
    if (priceInLocal > taxPolicy.dutyFreeThresholdLocal || taxPolicy.dutyFreeThresholdLocal === 0) {
      taxApplicable = true;
      estimatedTax = Math.round(input.productPriceKRW * taxPolicy.vatRate);
      taxNotes = taxPolicy.notes || '';
    }
  }
  
  // 손익 분석
  const revenue = input.productPriceKRW;
  const totalRevenue = revenue + customerShippingFeeKRW;
  const logisticsCost = selectedRate.totalRate;
  const taxCost = taxPolicy?.paidBy === 'backpacker' ? estimatedTax : 0;
  const totalCost = logisticsCost + taxCost;
  const grossProfit = totalRevenue - totalCost;
  const grossMarginPercent = (grossProfit / revenue) * 100;
  const hiddenFeeNeeded = Math.max(0, logisticsCost - customerShippingFeeKRW);
  
  // 권장 판매가 (마진 70% 확보 기준)
  const targetMargin = 0.70;
  const recommendedPrice = Math.ceil((totalCost / (1 - targetMargin)) / 1000) * 1000;
  
  return {
    input,
    country: {
      code: input.country,
      name: countryInfo.name,
      tier,
    },
    shippingPolicy: {
      customerShippingFeeKRW,
      isFreeShipping: freeShippingCheck.isFree,
      freeShippingReason: freeShippingCheck.reason,
    },
    logistics: {
      selectedCarrier: selectedRate.carrier,
      carrierName: selectedRate.carrierName,
      actualShippingCost: selectedRate.rate,
      surcharge: selectedRate.surcharge,
      totalLogisticsCost: selectedRate.totalRate,
      volumeWeight,
      chargeableWeight,
    },
    tax: {
      applicable: taxApplicable,
      estimatedTax,
      paidBy: taxPolicy?.paidBy || 'customer',
      notes: taxNotes,
    },
    profitAnalysis: {
      revenue,
      customerShippingFee: customerShippingFeeKRW,
      totalRevenue,
      logisticsCost,
      taxCost,
      totalCost,
      grossProfit,
      grossMarginPercent: Math.round(grossMarginPercent * 10) / 10,
      hiddenFeeNeeded,
      recommendedPrice: grossMarginPercent < 60 ? recommendedPrice : undefined,
    },
    alternatives: availableRates.filter(r => r.carrier !== selectedRate.carrier).slice(0, 4),
  };
}

/**
 * 국가 목록 조회
 */
export function getCountryList(): { code: string; name: string; tier: number }[] {
  return Object.entries(COUNTRY_TIERS)
    .map(([code, info]) => ({
      code,
      name: info.name,
      tier: info.tier,
    }))
    .sort((a, b) => a.tier - b.tier || a.name.localeCompare(b.name, 'ko'));
}

/**
 * Tier별 정책 조회
 */
export function getShippingPolicies() {
  return Object.values(SHIPPING_POLICIES);
}

/**
 * 운송사 목록 조회
 */
export function getCarrierList(): { carrier: CarrierType; name: string; countries: string[] }[] {
  return Object.entries(CARRIER_NAMES).map(([carrier, name]) => ({
    carrier: carrier as CarrierType,
    name,
    countries: CARRIER_AVAILABILITY[carrier as CarrierType] || [],
  }));
}

export default {
  simulateOrder,
  getAllAvailableRates,
  getCountryList,
  getShippingPolicies,
  getCarrierList,
  calculateVolumeWeight,
  calculateChargeableWeight,
  checkFreeShipping,
};




