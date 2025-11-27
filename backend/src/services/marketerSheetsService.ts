import GoogleSheetsService from './googleSheets'
import { sheetsConfig, SHEET_NAMES } from '../config/sheets'
import { GeneratedContent } from '../types/marketer'

/**
 * 마케터 콘텐츠를 Google Sheets에 저장하는 서비스
 * 현재는 인메모리 저장소와 병행 사용
 */
export class MarketerSheetsService {
  private sheetsService: GoogleSheetsService
  private sheetName: string

  constructor() {
    this.sheetsService = new GoogleSheetsService(sheetsConfig)
    this.sheetName = SHEET_NAMES.MARKETER_CONTENT
  }

  /**
   * 시트가 존재하는지 확인하고 없으면 생성
   * 실제 구현 시에는 시트 생성 로직 필요
   */
  async ensureSheetExists(): Promise<boolean> {
    try {
      // 시트 존재 확인 시도
      await this.sheetsService.getSheetDataAsJson(this.sheetName, false)
      return true
    } catch (error: any) {
      // 시트가 없으면 false 반환 (실제로는 시트 생성 로직 필요)
      console.warn(`시트 ${this.sheetName}이 존재하지 않습니다. Google Sheets에서 수동으로 생성해주세요.`)
      return false
    }
  }

  /**
   * 콘텐츠를 Google Sheets에 저장
   * 현재는 구조만 정의 (실제 쓰기 권한 필요)
   */
  async saveContent(content: GeneratedContent & { savedAt: string }): Promise<void> {
    // 실제 구현 시:
    // 1. 시트 존재 확인
    // 2. 헤더 확인 (없으면 생성)
    // 3. 새 행 추가
    // 
    // 현재는 구조만 정의
    console.log('Google Sheets 저장 기능은 쓰기 권한 설정 후 활성화됩니다.')
    console.log('저장할 콘텐츠:', {
      id: content.id,
      title: content.title,
      savedAt: content.savedAt,
    })
  }

  /**
   * 저장된 콘텐츠 목록 조회
   */
  async getSavedContents(): Promise<(GeneratedContent & { savedAt: string })[]> {
    try {
      const exists = await this.ensureSheetExists()
      if (!exists) {
        return []
      }

      const data = await this.sheetsService.getSheetDataAsJson(this.sheetName, false)
      
      // 데이터를 GeneratedContent 형식으로 변환
      return data.map((row: any) => ({
        id: row.id || '',
        title: row.title || '',
        content: row.content || '',
        metadata: {
          seoKeywords: row.seoKeywords ? JSON.parse(row.seoKeywords) : [],
          hashtags: row.hashtags ? JSON.parse(row.hashtags) : [],
          images: row.images ? JSON.parse(row.images) : [],
          callToAction: row.callToAction || '',
        },
        createdAt: row.createdAt || new Date().toISOString(),
        savedAt: row.savedAt || new Date().toISOString(),
      }))
    } catch (error) {
      console.error('저장된 콘텐츠 조회 오류:', error)
      return []
    }
  }
}

export const marketerSheetsService = new MarketerSheetsService()




