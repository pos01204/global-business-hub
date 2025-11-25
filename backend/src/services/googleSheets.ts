import { google } from 'googleapis';
import { JWT } from 'google-auth-library';

interface SheetConfig {
  spreadsheetId: string;
  clientEmail: string;
  privateKey: string;
}

class GoogleSheetsService {
  private auth: JWT;
  private sheets: any;
  private spreadsheetId: string;

  constructor(config: SheetConfig) {
    this.spreadsheetId = config.spreadsheetId;
    
    // JWT 인증 설정
    this.auth = new JWT({
      email: config.clientEmail,
      key: config.privateKey.replace(/\\n/g, '\n'),
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

    this.sheets = google.sheets({ version: 'v4', auth: this.auth });
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
    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: `${sheetName}!A:ZZ`,
      });

      const rows = response.data.values;
      if (!rows || rows.length === 0) {
        return [];
      }

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
    } catch (error) {
      console.error(`Error fetching sheet ${sheetName}:`, error);
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


