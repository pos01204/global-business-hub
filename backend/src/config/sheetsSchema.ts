/**
 * Google Sheets 스키마 정의
 * AI 어시스턴트가 데이터 분석 시 참조하는 시트 및 컬럼 정보
 */

export interface SheetColumn {
  name: string
  type: 'string' | 'number' | 'date' | 'boolean'
  description: string
  examples?: string[]
}

export interface SheetSchema {
  name: string
  displayName: string
  description: string
  columns: SheetColumn[]
  primaryKey?: string
  foreignKeys?: Array<{ column: string; references: { sheet: string; column: string } }>
}

/**
 * 전체 시트 스키마 정의
 */
export const SHEETS_SCHEMA: Record<string, SheetSchema> = {
  // ==================== 핵심 비즈니스 데이터 ====================
  order: {
    name: 'order',
    displayName: '주문',
    description: '주문 정보 (결제 완료된 주문 목록)',
    primaryKey: 'order_code',
    columns: [
      { name: 'order_code', type: 'string', description: '주문 코드 (고유 식별자)', examples: ['ORD-2024-001'] },
      { name: 'order_created', type: 'date', description: '주문 생성 일시', examples: ['2024-11-15 14:30:00'] },
      { name: 'user_id', type: 'number', description: '사용자 ID', examples: ['12345'] },
      { name: 'Total GMV', type: 'number', description: '총 거래액 (USD)', examples: ['150.00'] },
      { name: 'platform', type: 'string', description: '주문 플랫폼', examples: ['iOS', 'Android', 'Web'] },
      { name: 'PG사', type: 'string', description: '결제 대행사', examples: ['Stripe', 'PayPal'] },
      { name: 'method', type: 'string', description: '결제 방법', examples: ['card', 'paypal'] },
    ],
    foreignKeys: [
      { column: 'user_id', references: { sheet: 'users', column: 'ID' } },
    ],
  },

  logistics: {
    name: 'logistics',
    displayName: '물류',
    description: '물류 추적 정보 (주문별 상품 배송 현황)',
    primaryKey: 'shipment_id',
    columns: [
      { name: 'order_code', type: 'string', description: '주문 코드', examples: ['ORD-2024-001'] },
      { name: 'order_created', type: 'date', description: '주문 생성 일시', examples: ['2024-11-15'] },
      { name: 'shipment_id', type: 'string', description: '배송 ID', examples: ['SHP-001'] },
      { name: 'product_id', type: 'string', description: '상품 ID', examples: ['PROD-001'] },
      { name: 'product_name', type: 'string', description: '상품명', examples: ['핸드메이드 가죽 지갑'] },
      { name: 'artist_name (kr)', type: 'string', description: '작가명 (한글)', examples: ['김작가'] },
      { name: 'country', type: 'string', description: '배송 국가 코드', examples: ['JP', 'US', 'TW', 'HK'] },
      { name: 'logistics', type: 'string', description: '물류 상태', examples: ['결제 완료', '입고 완료', '출고 완료', '배송 중', '배송 완료'] },
      { name: '처리상태', type: 'string', description: '처리 상태', examples: ['처리완료', '처리중', '미처리'] },
      { name: '구매수량', type: 'number', description: '구매 수량', examples: ['1', '2'] },
      { name: 'Total GMV', type: 'number', description: '총 거래액 (USD)', examples: ['150.00'] },
      { name: 'user_id', type: 'number', description: '사용자 ID', examples: ['12345'] },
      { name: '국제송장번호', type: 'string', description: '국제 배송 송장번호', examples: ['EJ123456789JP'] },
      { name: '국내송장번호', type: 'string', description: '국내 배송 송장번호', examples: ['1234567890'] },
    ],
    foreignKeys: [
      { column: 'order_code', references: { sheet: 'order', column: 'order_code' } },
      { column: 'user_id', references: { sheet: 'users', column: 'ID' } },
    ],
  },

  users: {
    name: 'users',
    displayName: '사용자',
    description: '사용자 정보 (고객 기본 정보)',
    primaryKey: 'ID',
    columns: [
      { name: 'ID', type: 'number', description: '사용자 ID (고유 식별자)', examples: ['12345'] },
      { name: 'NAME', type: 'string', description: '사용자 이름', examples: ['John Doe'] },
      { name: 'EMAIL', type: 'string', description: '이메일 주소', examples: ['user@example.com'] },
      { name: 'COUNTRY', type: 'string', description: '국가 코드', examples: ['JP', 'US', 'KR'] },
      { name: 'CREATED_AT', type: 'date', description: '가입 일시', examples: ['2024-01-15'] },
    ],
  },

  artists: {
    name: 'artists',
    displayName: '작가',
    description: '작가 정보 (판매자 기본 정보)',
    columns: [
      { name: '(KR)작가명', type: 'string', description: '작가명 (한글)', examples: ['김작가'] },
      { name: '(KR)Live 작품수', type: 'number', description: '한국 라이브 작품 수', examples: ['50'] },
      { name: '(Global)Live 작품수', type: 'number', description: '글로벌 라이브 작품 수', examples: ['30'] },
      { name: 'artist_id', type: 'string', description: '작가 ID', examples: ['ART-001'] },
      { name: 'email', type: 'string', description: '작가 이메일', examples: ['artist@example.com'] },
      { name: '작가 등록일 (Global)', type: 'date', description: '작가 글로벌 등록일 (I열)', examples: ['2024-01-15'] },
      { name: '삭제일', type: 'date', description: '작가 삭제일/이탈일 (L열)', examples: ['2024-11-20'] },
    ],
  },

  // ==================== 리뷰 데이터 ====================
  review: {
    name: 'review',
    displayName: '리뷰',
    description: '글로벌 구매 후기',
    columns: [
      { name: 'order_code', type: 'string', description: '주문 코드', examples: ['ORD-2024-001'] },
      { name: 'user_id', type: 'number', description: '사용자 ID', examples: ['12345'] },
      { name: 'product_id', type: 'string', description: '상품 ID', examples: ['PROD-001'] },
      { name: 'rating', type: 'number', description: '평점 (1-5)', examples: ['5'] },
      { name: 'review_text', type: 'string', description: '리뷰 내용', examples: ['정말 좋아요!'] },
      { name: 'review_date', type: 'date', description: '리뷰 작성일', examples: ['2024-11-20'] },
      { name: 'country', type: 'string', description: '리뷰어 국가', examples: ['JP', 'US'] },
      { name: 'has_image', type: 'boolean', description: '이미지 포함 여부', examples: ['true', 'false'] },
    ],
    foreignKeys: [
      { column: 'order_code', references: { sheet: 'order', column: 'order_code' } },
      { column: 'user_id', references: { sheet: 'users', column: 'ID' } },
    ],
  },

  // ==================== 물류비 정산 ====================
  settlement_records: {
    name: 'Settlement_records',
    displayName: '정산 기록',
    description: '물류비 정산 건별 상세 데이터',
    columns: [
      { name: 'period', type: 'string', description: '정산 기간', examples: ['2024-11'] },
      { name: 'shipment_id', type: 'string', description: '배송 ID', examples: ['SHP-001'] },
      { name: 'carrier', type: 'string', description: '운송사', examples: ['롯데글로벌', 'EMS', 'K-Packet'] },
      { name: 'country', type: 'string', description: '배송 국가', examples: ['JP', 'US'] },
      { name: 'weight', type: 'number', description: '중량 (kg)', examples: ['0.5', '1.2'] },
      { name: 'actual_cost', type: 'number', description: '실제 비용 (KRW)', examples: ['15000'] },
      { name: 'expected_cost', type: 'number', description: '예상 비용 (KRW)', examples: ['14500'] },
      { name: 'difference', type: 'number', description: '차이 (KRW)', examples: ['500'] },
    ],
    foreignKeys: [
      { column: 'shipment_id', references: { sheet: 'logistics', column: 'shipment_id' } },
    ],
  },

  // ==================== QC 관련 ====================
  qc_text: {
    name: '[QC] 한글_raw',
    displayName: 'QC 텍스트',
    description: '텍스트 QC 원본 데이터',
    columns: [
      { name: 'product_id', type: 'string', description: '상품 ID', examples: ['PROD-001'] },
      { name: 'artist_name', type: 'string', description: '작가명', examples: ['김작가'] },
      { name: 'text_content', type: 'string', description: '검수 대상 텍스트', examples: ['상품 설명...'] },
      { name: '처리 상태', type: 'string', description: '처리 상태', examples: ['대기', '완료', 'skip'] },
      { name: 'needs_revision', type: 'boolean', description: '수정 필요 여부', examples: ['true', 'false'] },
    ],
  },

  qc_image: {
    name: '[QC] OCR_결과_raw',
    displayName: 'QC 이미지',
    description: '이미지 QC OCR 결과 데이터',
    columns: [
      { name: 'product_id', type: 'string', description: '상품 ID', examples: ['PROD-001'] },
      { name: 'artist_name', type: 'string', description: '작가명', examples: ['김작가'] },
      { name: 'ocr_text', type: 'string', description: 'OCR 추출 텍스트', examples: ['이미지 내 텍스트...'] },
      { name: '처리 상태', type: 'string', description: '처리 상태', examples: ['대기', '완료', 'skip'] },
      { name: 'needs_revision', type: 'boolean', description: '수정 필요 여부', examples: ['true', 'false'] },
    ],
  },

  // ==================== 소포수령증 ====================
  sopo_tracking: {
    name: 'Sopo_tracking',
    displayName: '소포수령증 트래킹',
    description: '소포수령증 발급 트래킹',
    columns: [
      { name: 'period', type: 'string', description: '기간', examples: ['2024-11'] },
      { name: 'artist_name', type: 'string', description: '작가명', examples: ['김작가'] },
      { name: 'artist_id', type: 'string', description: '작가 ID', examples: ['ART-001'] },
      { name: 'email', type: 'string', description: '이메일', examples: ['artist@example.com'] },
      { name: '신청 상태', type: 'string', description: '신청 상태', examples: ['미신청', '신청완료', '발급완료'] },
      { name: 'shipment_count', type: 'number', description: '배송 건수', examples: ['5'] },
      { name: 'notification_sent', type: 'date', description: '알림 발송일', examples: ['2024-11-20'] },
    ],
  },

  // ==================== 사용자 지역 정보 ====================
  user_locale: {
    name: 'user_locale',
    displayName: '사용자 지역',
    description: '사용자별 지역/타임존 정보',
    columns: [
      { name: 'user_id', type: 'number', description: '사용자 ID', examples: ['12345'] },
      { name: 'country_code', type: 'string', description: '국가 코드', examples: ['JP', 'US'] },
      { name: 'region', type: 'string', description: '지역', examples: ['Tokyo', 'California'] },
      { name: 'timezone', type: 'string', description: '타임존', examples: ['Asia/Tokyo', 'America/Los_Angeles'] },
    ],
    foreignKeys: [
      { column: 'user_id', references: { sheet: 'users', column: 'ID' } },
    ],
  },

  // ==================== 요금표 ====================
  rate_lotte: {
    name: 'Rate_LotteGlobal',
    displayName: '롯데글로벌 요금표',
    description: '롯데글로벌 배송 요금표',
    columns: [
      { name: 'country', type: 'string', description: '국가 코드', examples: ['JP', 'US'] },
      { name: 'weight_from', type: 'number', description: '중량 시작 (kg)', examples: ['0'] },
      { name: 'weight_to', type: 'number', description: '중량 끝 (kg)', examples: ['0.5'] },
      { name: 'rate', type: 'number', description: '요금 (KRW)', examples: ['12000'] },
    ],
  },

  rate_ems: {
    name: 'Rate_EMS',
    displayName: 'EMS 요금표',
    description: 'EMS 배송 요금표',
    columns: [
      { name: 'country', type: 'string', description: '국가 코드', examples: ['JP', 'US'] },
      { name: 'weight_from', type: 'number', description: '중량 시작 (kg)', examples: ['0'] },
      { name: 'weight_to', type: 'number', description: '중량 끝 (kg)', examples: ['0.5'] },
      { name: 'rate', type: 'number', description: '요금 (KRW)', examples: ['18000'] },
    ],
  },

  rate_kpacket: {
    name: 'Rate_KPacket',
    displayName: 'K-Packet 요금표',
    description: 'K-Packet 배송 요금표',
    columns: [
      { name: 'country', type: 'string', description: '국가 코드', examples: ['JP', 'US'] },
      { name: 'weight_from', type: 'number', description: '중량 시작 (kg)', examples: ['0'] },
      { name: 'weight_to', type: 'number', description: '중량 끝 (kg)', examples: ['0.5'] },
      { name: 'rate', type: 'number', description: '요금 (KRW)', examples: ['8000'] },
    ],
  },
}

/**
 * AI 어시스턴트용 시트 카테고리
 */
export const SHEET_CATEGORIES = {
  core: {
    name: '핵심 비즈니스',
    description: '주문, 물류, 사용자, 작가 데이터',
    sheets: ['order', 'logistics', 'users', 'artists'],
  },
  customer: {
    name: '고객 인사이트',
    description: '리뷰, 사용자 지역 정보',
    sheets: ['review', 'user_locale'],
  },
  operations: {
    name: '운영 관리',
    description: 'QC, 소포수령증, 정산',
    sheets: ['qc_text', 'qc_image', 'sopo_tracking', 'settlement_records'],
  },
  reference: {
    name: '참조 데이터',
    description: '요금표',
    sheets: ['rate_lotte', 'rate_ems', 'rate_kpacket'],
  },
}

/**
 * 시트 스키마를 프롬프트용 텍스트로 변환
 */
export function getSchemaSummaryForPrompt(sheetNames?: string[]): string {
  const targetSheets = sheetNames || Object.keys(SHEETS_SCHEMA)
  
  const lines: string[] = ['사용 가능한 데이터 소스:']
  
  for (const sheetKey of targetSheets) {
    const schema = SHEETS_SCHEMA[sheetKey]
    if (!schema) continue
    
    const columnList = schema.columns
      .map(c => `${c.name}(${c.type})`)
      .join(', ')
    
    lines.push(`- ${schema.name}: ${schema.description}`)
    lines.push(`  컬럼: ${columnList}`)
  }
  
  return lines.join('\n')
}

/**
 * 특정 시트의 상세 스키마 정보
 */
export function getDetailedSchemaForSheet(sheetKey: string): string {
  const schema = SHEETS_SCHEMA[sheetKey]
  if (!schema) return `시트 '${sheetKey}'를 찾을 수 없습니다.`
  
  const lines: string[] = [
    `시트: ${schema.displayName} (${schema.name})`,
    `설명: ${schema.description}`,
    schema.primaryKey ? `기본키: ${schema.primaryKey}` : '',
    '',
    '컬럼 정보:',
  ]
  
  for (const col of schema.columns) {
    lines.push(`- ${col.name} (${col.type}): ${col.description}`)
    if (col.examples) {
      lines.push(`  예시: ${col.examples.join(', ')}`)
    }
  }
  
  if (schema.foreignKeys && schema.foreignKeys.length > 0) {
    lines.push('')
    lines.push('외래키 관계:')
    for (const fk of schema.foreignKeys) {
      lines.push(`- ${fk.column} → ${fk.references.sheet}.${fk.references.column}`)
    }
  }
  
  return lines.filter(l => l !== '').join('\n')
}

/**
 * AI 어시스턴트가 사용할 수 있는 시트 목록
 */
export const AI_ACCESSIBLE_SHEETS = [
  'order',
  'logistics', 
  'users',
  'artists',
  'review',
  'user_locale',
  'settlement_records',
  'sopo_tracking',
] as const

export type AIAccessibleSheet = typeof AI_ACCESSIBLE_SHEETS[number]
