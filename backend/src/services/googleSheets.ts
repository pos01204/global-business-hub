import { google } from 'googleapis';
import { JWT } from 'google-auth-library';

interface SheetConfig {
  spreadsheetId: string;
  clientEmail: string;
  privateKey: string;
}

class GoogleSheetsService {
  private auth: JWT | null = null;
  private sheets: any = null;
  private spreadsheetId: string;
  private isConfigured: boolean;

  constructor(config: SheetConfig) {
    this.spreadsheetId = config.spreadsheetId;
    this.isConfigured = !!(config.spreadsheetId && config.clientEmail && config.privateKey);
    
    if (this.isConfigured) {
      // JWT 인증 설정
      this.auth = new JWT({
        email: config.clientEmail,
        key: config.privateKey.replace(/\\n/g, '\n'),
        scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
      });

      this.sheets = google.sheets({ version: 'v4', auth: this.auth });
    } else {
      console.warn('Google Sheets Service: 환경 변수가 설정되지 않아 빈 데이터를 반환합니다.');
    }
  }

  /**
   * 연결 상태 확인
   */
  async checkConnection(): Promise<{ connected: boolean; error?: string }> {
    if (!this.isConfigured || !this.sheets) {
      return {
        connected: false,
        error: '환경 변수가 설정되지 않았습니다.',
      };
    }

    try {
      // 스프레드시트 메타데이터 조회로 연결 테스트
      await this.sheets.spreadsheets.get({
        spreadsheetId: this.spreadsheetId,
      });
      return { connected: true };
    } catch (error: any) {
      console.error('Google Sheets 연결 확인 실패:', error);
      return {
        connected: false,
        error: error.message || '연결 실패',
      };
    }
  }

  /**
   * 시트 존재 여부 확인
   */
  async checkSheetExists(sheetName: string): Promise<boolean> {
    if (!this.isConfigured || !this.sheets) {
      return false;
    }

    try {
      const response = await this.sheets.spreadsheets.get({
        spreadsheetId: this.spreadsheetId,
      });
      const sheets = response.data.sheets || [];
      return sheets.some((sheet: any) => sheet.properties?.title === sheetName);
    } catch (error) {
      console.error(`시트 존재 확인 실패 (${sheetName}):`, error);
      return false;
    }
  }

  /**
   * 시트 데이터를 JSON 배열로 가져오기
   * @param sheetName 시트 이름
   * @param enableFillDown order_code 기준으로 빈 셀 채우기 여부
   */
  async getSheetDataAsJson(
    sheetName: string,
    enableFillDown: boolean = false
  ): Promise<any[]> {
    if (!this.isConfigured || !this.sheets) {
      console.warn(`Google Sheets Service: 환경 변수가 설정되지 않아 빈 데이터를 반환합니다. (시트: ${sheetName})`);
      console.warn(`  - SPREADSHEET_ID: ${this.spreadsheetId ? '있음' : '없음'}`);
      return [];
    }

    try {
      console.log(`[Google Sheets] 데이터 로드 시작: ${sheetName}`);
      
      // 시트 존재 여부 확인
      const sheetExists = await this.checkSheetExists(sheetName);
      if (!sheetExists) {
        console.error(`[Google Sheets] 시트를 찾을 수 없습니다: ${sheetName}`);
        console.error(`  사용 가능한 시트를 확인하려면 스프레드시트를 확인하세요.`);
        return [];
      }

      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: `${sheetName}!A:ZZ`,
      });

      const rows = response.data.values;
      if (!rows || rows.length === 0) {
        console.warn(`[Google Sheets] 시트에 데이터가 없습니다: ${sheetName}`);
        return [];
      }

      console.log(`[Google Sheets] 데이터 로드 성공: ${sheetName} (${rows.length}행)`);

      const headers = rows[0];
      const dataRows = rows.slice(1).filter((row: any[]) => 
        row.join('').length > 0
      );

      let processedData = dataRows;

      // Fill-down 로직 (logistics 시트용)
      if (enableFillDown) {
        const orderCodeIndex = headers.indexOf('order_code');
        let lastValues = new Array(headers.length).fill('');

        processedData = dataRows.map((row: any[]) => {
          // order_code가 새로 시작되면 lastValues 초기화
          if (
            orderCodeIndex !== -1 &&
            row[orderCodeIndex] !== '' &&
            row[orderCodeIndex] != null
          ) {
            lastValues = new Array(headers.length).fill('');
          }

          return row.map((cell: any, colIndex: number) => {
            if (cell !== '' && cell != null) {
              lastValues[colIndex] = cell;
              return cell;
            } else {
              return lastValues[colIndex];
            }
          });
        });
      }

      // JSON 객체로 변환
      return processedData.map((row: any[]) => {
        const obj: any = {};
        headers.forEach((header: string, index: number) => {
          if (header) {
            const cleanHeader = header.trim();
            obj[cleanHeader] = row[index];
          }
        });
        return obj;
      });
    } catch (error: any) {
      console.error(`[Google Sheets] 데이터 로드 실패: ${sheetName}`);
      console.error(`  오류 타입: ${error.code || 'UNKNOWN'}`);
      console.error(`  오류 메시지: ${error.message || '알 수 없는 오류'}`);
      
      if (error.code === 403) {
        console.error(`  권한 오류: 서비스 계정이 스프레드시트에 접근 권한이 없습니다.`);
        console.error(`  해결 방법: 스프레드시트를 공유하고 서비스 계정 이메일에 '뷰어' 권한을 부여하세요.`);
      } else if (error.code === 404) {
        console.error(`  스프레드시트를 찾을 수 없습니다: ${this.spreadsheetId}`);
        console.error(`  해결 방법: GOOGLE_SHEETS_SPREADSHEET_ID 환경 변수를 확인하세요.`);
      } else if (error.code === 401) {
        console.error(`  인증 오류: 서비스 계정 인증에 실패했습니다.`);
        console.error(`  해결 방법: GOOGLE_SHEETS_CLIENT_EMAIL과 GOOGLE_SHEETS_PRIVATE_KEY를 확인하세요.`);
      }
      
      throw error;
    }
  }

  /**
   * 특정 셀 범위 업데이트
   */
  async updateCell(
    sheetName: string,
    range: string,
    value: any
  ): Promise<void> {
    if (!this.isConfigured || !this.sheets) {
      console.warn(`Google Sheets Service: 환경 변수가 설정되지 않아 업데이트를 건너뜁니다. (${sheetName}!${range})`);
      return;
    }

    try {
      await this.sheets.spreadsheets.values.update({
        spreadsheetId: this.spreadsheetId,
        range: `${sheetName}!${range}`,
        valueInputOption: 'RAW',
        resource: {
          values: [[value]],
        },
      });
    } catch (error) {
      console.error(`Error updating cell ${sheetName}!${range}:`, error);
      throw error;
    }
  }

  /**
   * 여러 셀 업데이트
   */
  async updateCells(
    sheetName: string,
    updates: Array<{ range: string; value: any }>
  ): Promise<void> {
    if (!this.isConfigured || !this.sheets) {
      console.warn(`Google Sheets Service: 환경 변수가 설정되지 않아 업데이트를 건너뜁니다. (${sheetName})`);
      return;
    }

    try {
      const data = updates.map((update) => ({
        range: `${sheetName}!${update.range}`,
        values: [[update.value]],
      }));

      await this.sheets.spreadsheets.values.batchUpdate({
        spreadsheetId: this.spreadsheetId,
        resource: {
          valueInputOption: 'RAW',
          data,
        },
      });
    } catch (error) {
      console.error(`Error updating cells in ${sheetName}:`, error);
      throw error;
    }
  }
}

export default GoogleSheetsService;


