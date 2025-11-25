/**
 * 택배사별 추적 URL 생성
 */
export function getTrackingUrl(courier: string | null | undefined, trackingNumber: string | null | undefined): string {
  if (!courier || !trackingNumber) return '#';
  
  const courierLower = String(courier).toLowerCase();
  
  if (courierLower.includes('cj')) {
    return `https://www.cjlogistics.com/ko/tool/parcel/tracking?gnbInvcNo=${trackingNumber}`;
  } else if (courierLower.includes('lotte')) {
    return `https://www.lotteglogis.com/home/reservation/tracking/index?invcno=${trackingNumber}`;
  } else if (courierLower.includes('ups')) {
    return `https://www.ups.com/track?loc=en_US&tracknum=${trackingNumber}`;
  } else if (courierLower.includes('postal')) {
    return `https://service.epost.go.kr/trace/RetrieveDomRigiTraceList.comm?sid1=${trackingNumber}`;
  }
  
  return '#';
}

/**
 * 상품 페이지 URL 생성
 */
export function getProductUrl(country: string | null | undefined, productId: string | null | undefined): string {
  if (!productId) return '#';
  
  const lang = country === 'JP' ? 'jp' : 'en';
  return `https://global.idus.com/${lang}/product/${productId}`;
}


