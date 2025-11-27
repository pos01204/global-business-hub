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
  private clientEmail: string;
  private privateKey: string;
  private isConfigured: boolean;

  constructor(config: SheetConfig) {
    this.spreadsheetId = config.spreadsheetId;
    this.clientEmail = config.clientEmail;
    this.privateKey = config.privateKey;
    this.isConfigured = !!(config.spreadsheetId && config.clientEmail && config.privateKey);
    
    if (this.isConfigured) {
      // JWT 인증 설정 (읽기/쓰기 권한)
      this.auth = new JWT({
        email: config.clientEmail,
        key: config.privateKey.replace(/\\n/g, '\n'),
        scopes: [
          'https://www.googleapis.com/auth/spreadsheets.readonly',
          'https://www.googleapis.com/auth/spreadsheets',
        ],
      });

      this.sheets = google.sheets({ version: 'v4', auth: this.auth });
    } else {
      console.warn('Google Sheets Service: 환경 변수가 설정되지 않아 빈 데이터를 반환합니다.');
    }
  }

  /**
   * 연결 상태 확인
   */
  async checkConnection(): Promise<{ connected: boolean; error?: string; details?: any }> {
    if (!this.isConfigured || !this.sheets) {
      console.error('[Google Sheets] 환경 변수 미설정');
      console.error(`  - SPREADSHEET_ID: ${this.spreadsheetId ? '있음' : '없음'}`);
      console.error(`  - CLIENT_EMAIL: ${this.clientEmail ? '있음' : '없음'}`);
      console.error(`  - PRIVATE_KEY: ${this.privateKey ? '있음' : '없음'}`);
      return {
        connected: false,
        error: '환경 변수가 설정되지 않았습니다.',
        details: {
          spreadsheetId: !!this.spreadsheetId,
          clientEmail: !!this.clientEmail,
          privateKey: !!this.privateKey,
        },
      };
    }

    try {
      console.log('[Google Sheets] 연결 테스트 시작...');
      console.log(`  - 스프레드시트 ID: ${this.spreadsheetId.substring(0, 20)}...`);
      
      // 스프레드시트 메타데이터 조회로 연결 테스트
      const response = await this.sheets.spreadsheets.get({
        spreadsheetId: this.spreadsheetId,
      });
      
      console.log('[Google Sheets] 연결 성공');
      console.log(`  - 스프레드시트 제목: ${response.data.properties?.title || 'N/A'}`);
      console.log(`  - 시트 수: ${response.data.sheets?.length || 0}`);
      
      return { connected: true };
    } catch (error: any) {
      console.error('[Google Sheets] 연결 확인 실패');
      console.error(`  - 오류 코드: ${error.code || 'UNKNOWN'}`);
      console.error(`  - 오류 메시지: ${error.message || '알 수 없는 오류'}`);
      
      if (error.response) {
        console.error(`  - HTTP 상태: ${error.response.status}`);
        console.error(`  - 응답 데이터:`, JSON.stringify(error.response.data, null, 2));
      }
      
      let errorMessage = error.message || '연결 실패';
      let troubleshooting: string[] = [];
      
      if (error.code === 403) {
        errorMessage = '서비스 계정이 스프레드시트에 접근 권한이 없습니다.';
        troubleshooting = [
          '1. 스프레드시트를 열고 "공유" 버튼을 클릭하세요.',
          '2. 서비스 계정 이메일을 추가하고 "뷰어" 권한을 부여하세요.',
          `3. 서비스 계정 이메일: ${this.clientEmail}`,
        ];
      } else if (error.code === 404) {
        errorMessage = `스프레드시트를 찾을 수 없습니다. (ID: ${this.spreadsheetId})`;
        troubleshooting = [
          '1. GOOGLE_SHEETS_SPREADSHEET_ID 환경 변수를 확인하세요.',
          '2. 스프레드시트 URL에서 ID를 복사했는지 확인하세요.',
          '3. 스프레드시트가 삭제되지 않았는지 확인하세요.',
        ];
      } else if (error.code === 401) {
        errorMessage = '서비스 계정 인증에 실패했습니다.';
        troubleshooting = [
          '1. GOOGLE_SHEETS_CLIENT_EMAIL 환경 변수를 확인하세요.',
          '2. GOOGLE_SHEETS_PRIVATE_KEY 환경 변수를 확인하세요.',
          '3. PRIVATE_KEY가 큰따옴표로 감싸져 있고, \\n이 포함되어 있는지 확인하세요.',
        ];
      }
      
      return {
        connected: false,
        error: errorMessage,
        details: {
          code: error.code,
          message: error.message,
          troubleshooting,
        },
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

  /**
   * 시트에 행 추가
   */
  async appendRow(sheetName: string, values: any[]): Promise<void> {
    if (!this.isConfigured || !this.sheets) {
      console.warn(`Google Sheets Service: 환경 변수가 설정되지 않아 행 추가를 건너뜁니다. (${sheetName})`);
      return;
    }

    try {
      await this.sheets.spreadsheets.values.append({
        spreadsheetId: this.spreadsheetId,
        range: `${sheetName}!A:ZZ`,
        valueInputOption: 'RAW',
        insertDataOption: 'INSERT_ROWS',
        resource: {
          values: [values],
        },
      });
    } catch (error) {
      console.error(`Error appending row to ${sheetName}:`, error);
      throw error;
    }
  }

  /**
   * 시트에 여러 행 추가 (배치 처리)
   */
  async appendRows(sheetName: string, rows: any[][]): Promise<void> {
    if (!this.isConfigured || !this.sheets) {
      console.warn(`Google Sheets Service: 환경 변수가 설정되지 않아 행 추가를 건너뜁니다. (${sheetName})`);
      return;
    }

    if (rows.length === 0) return;

    // Google Sheets API는 한 번에 최대 10,000개 행까지 처리 가능
    // 하지만 안정성을 위해 1000개씩 배치 처리
    const BATCH_SIZE = 1000;
    
    try {
      for (let i = 0; i < rows.length; i += BATCH_SIZE) {
        const batch = rows.slice(i, i + BATCH_SIZE);
        await this.sheets.spreadsheets.values.append({
          spreadsheetId: this.spreadsheetId,
          range: `${sheetName}!A:ZZ`,
          valueInputOption: 'RAW',
          insertDataOption: 'INSERT_ROWS',
          resource: {
            values: batch,
          },
        });
        
        // API rate limit 방지를 위한 짧은 지연
        if (i + BATCH_SIZE < rows.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
      
      console.log(`[Google Sheets] ${rows.length}개 행 추가 완료: ${sheetName}`);
    } catch (error) {
      console.error(`Error appending rows to ${sheetName}:`, error);
      throw error;
    }
  }

  /**
   * 시트에서 특정 행 찾기 (ID 기반)
   */
  async findRowByColumn(
    sheetName: string,
    searchColumn: string,
    searchValue: string
  ): Promise<number | null> {
    if (!this.isConfigured || !this.sheets) {
      return null;
    }

    try {
      const data = await this.getSheetDataAsJson(sheetName, false);
      const headers = Object.keys(data[0] || {});
      const columnIndex = headers.indexOf(searchColumn);

      if (columnIndex === -1) return null;

      // 헤더 행을 고려하여 +2 (헤더 + 1-based index)
      for (let i = 0; i < data.length; i++) {
        const row = data[i];
        const cellValue = String(row[searchColumn] || '');
        if (cellValue === String(searchValue)) {
          return i + 2; // 1-based index + 헤더 행
        }
      }

      return null;
    } catch (error) {
      console.error(`Error finding row in ${sheetName}:`, error);
      return null;
    }
  }

  /**
   * 시트 헤더를 읽어서 컬럼 인덱스 반환 (A=1, B=2, ..., Z=26, AA=27, ...)
   */
  async getColumnIndex(sheetName: string, columnName: string): Promise<number | null> {
    if (!this.isConfigured || !this.sheets) {
      return null;
    }

    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: `${sheetName}!1:1`, // 첫 번째 행만 읽기
      });

      const headers = response.data.values?.[0] || [];
      const columnIndex = headers.findIndex((h: string) => 
        String(h).toLowerCase().trim() === columnName.toLowerCase().trim()
      );

      return columnIndex >= 0 ? columnIndex + 1 : null; // 1-based index
    } catch (error) {
      console.error(`Error getting column index in ${sheetName}:`, error);
      return null;
    }
  }

  /**
   * 숫자 인덱스를 Excel 컬럼 문자로 변환 (1=A, 2=B, ..., 27=AA, ...)
   */
  private numberToColumnLetter(num: number): string {
    let result = '';
    while (num > 0) {
      num--;
      result = String.fromCharCode(65 + (num % 26)) + result;
      num = Math.floor(num / 26);
    }
    return result;
  }

  /**
   * 컬럼 이름으로 셀 범위 생성 (예: 'status' -> 'Z2')
   */
  async getCellRange(sheetName: string, columnName: string, rowIndex: number): Promise<string | null> {
    const colIndex = await this.getColumnIndex(sheetName, columnName);
    if (!colIndex) return null;
    const columnLetter = this.numberToColumnLetter(colIndex);
    return `${columnLetter}${rowIndex}`;
  }
}

export default GoogleSheetsService;


