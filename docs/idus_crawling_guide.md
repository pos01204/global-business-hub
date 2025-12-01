# idus 크롤링 구현 가이드

## ⚠️ 중요 사항

실제 idus 크롤링을 구현하기 전에 반드시 확인해야 할 사항들:

### 1. 법적 고려사항
- **이용약관 확인**: idus의 이용약관에서 크롤링/스크래핑 허용 여부 확인
- **robots.txt 확인**: `https://www.idus.com/robots.txt` 확인
- **저작권**: 작품 이미지 및 설명의 저작권 보호
- **개인정보**: 작가 정보 등 개인정보 수집 시 개인정보보호법 준수

### 2. 기술적 고려사항
- **Rate Limiting**: 서버 부하 방지를 위한 요청 제한
- **User-Agent**: 적절한 User-Agent 설정
- **에러 처리**: 네트워크 오류, 타임아웃 등 처리
- **캐싱**: 동일한 작품 정보 중복 요청 방지

## 구현 방법

### 옵션 1: Puppeteer 사용 (JavaScript 렌더링 필요 시)

```typescript
import puppeteer from 'puppeteer'

async crawlProductWithPuppeteer(url: string): Promise<IdusProduct | null> {
  const browser = await puppeteer.launch({ headless: true })
  const page = await browser.newPage()
  
  try {
    await page.goto(url, { waitUntil: 'networkidle2' })
    
    const product = await page.evaluate(() => {
      // DOM에서 정보 추출
      const title = document.querySelector('h1')?.textContent || ''
      const price = document.querySelector('.price')?.textContent || ''
      // ... 기타 정보 추출
      
      return { title, price, /* ... */ }
    })
    
    await browser.close()
    return product
  } catch (error) {
    await browser.close()
    throw error
  }
}
```

### 옵션 2: Axios + Cheerio 사용 (정적 HTML)

```typescript
import axios from 'axios'
import * as cheerio from 'cheerio'

async crawlProductWithCheerio(url: string): Promise<IdusProduct | null> {
  const response = await axios.get(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    },
    timeout: 10000,
  })
  
  const $ = cheerio.load(response.data)
  
  const title = $('h1.product-title').text().trim()
  const price = $('.price').text().trim()
  // ... 기타 정보 추출
  
  return { title, price, /* ... */ }
}
```

### 옵션 3: idus 공식 API 사용 (권장)

만약 idus에서 공식 API를 제공한다면, 크롤링 대신 API를 사용하는 것이 가장 좋습니다.

## Rate Limiting 구현

```typescript
class RateLimiter {
  private requests: number[] = []
  private maxRequests: number = 10
  private timeWindow: number = 60000 // 1분

  async waitIfNeeded(): Promise<void> {
    const now = Date.now()
    this.requests = this.requests.filter(time => now - time < this.timeWindow)
    
    if (this.requests.length >= this.maxRequests) {
      const oldestRequest = Math.min(...this.requests)
      const waitTime = this.timeWindow - (now - oldestRequest)
      await new Promise(resolve => setTimeout(resolve, waitTime))
    }
    
    this.requests.push(Date.now())
  }
}
```

## 사용 예시

```typescript
const rateLimiter = new RateLimiter()

async crawlProduct(url: string): Promise<IdusProduct | null> {
  await rateLimiter.waitIfNeeded()
  
  // 크롤링 로직 실행
  // ...
}
```

## 현재 상태

현재는 시뮬레이션 데이터를 사용하고 있습니다. 실제 크롤링을 활성화하려면:

1. `backend/src/services/idusCrawler.ts` 파일의 주석 처리된 크롤링 코드 활성화
2. 필요한 패키지 설치: `npm install puppeteer cheerio` (또는 둘 중 하나)
3. Rate limiting 구현
4. 에러 처리 강화
5. 테스트 및 검증

## 참고 자료

- [Puppeteer 문서](https://pptr.dev/)
- [Cheerio 문서](https://cheerio.js.org/)
- [웹 스크래핑 법적 고려사항](https://www.law.go.kr/)








