import { Router } from 'express';
import GoogleSheetsService from '../services/googleSheets';
import { sheetsConfig, SHEET_NAMES, isGoogleSheetsConfigured } from '../config/sheets';

const router = Router();
const sheetsService = new GoogleSheetsService(sheetsConfig);

/**
 * Google Sheets 연결 상태 확인
 * GET /api/sheets/health
 */
router.get('/health', async (req, res) => {
  try {
    // 환경 변수 확인
    const envStatus = {
      spreadsheetId: !!sheetsConfig.spreadsheetId,
      clientEmail: !!sheetsConfig.clientEmail,
      privateKey: !!sheetsConfig.privateKey,
      allConfigured: isGoogleSheetsConfigured,
    };

    if (!isGoogleSheetsConfigured) {
      return res.json({
        success: false,
        connected: false,
        environment: envStatus,
        message: 'Google Sheets 환경 변수가 설정되지 않았습니다.',
        troubleshooting: [
          'Railway Variables에서 다음 환경 변수를 설정하세요:',
          '  - GOOGLE_SHEETS_SPREADSHEET_ID',
          '  - GOOGLE_SHEETS_CLIENT_EMAIL',
          '  - GOOGLE_SHEETS_PRIVATE_KEY',
        ],
      });
    }

    // 연결 테스트
    const connectionStatus = await sheetsService.checkConnection();
    
    if (!connectionStatus.connected) {
      return res.json({
        success: false,
        connected: false,
        environment: envStatus,
        error: connectionStatus.error,
        message: 'Google Sheets에 연결할 수 없습니다.',
        troubleshooting: [
          '1. 스프레드시트 ID가 올바른지 확인하세요.',
          '2. 서비스 계정 이메일이 올바른지 확인하세요.',
          '3. 개인 키가 올바르게 설정되었는지 확인하세요.',
          '4. 서비스 계정이 스프레드시트에 접근 권한이 있는지 확인하세요.',
        ],
      });
    }

    // 시트 존재 여부 확인
    const sheetChecks: Record<string, boolean> = {};
    for (const [key, sheetName] of Object.entries(SHEET_NAMES)) {
      try {
        sheetChecks[sheetName] = await sheetsService.checkSheetExists(sheetName);
      } catch (error) {
        sheetChecks[sheetName] = false;
      }
    }

    // 샘플 데이터 로드 테스트
    const sampleDataTest: Record<string, { success: boolean; rowCount?: number; error?: string }> = {};
    for (const [key, sheetName] of Object.entries(SHEET_NAMES)) {
      try {
        const data = await sheetsService.getSheetDataAsJson(sheetName, false);
        sampleDataTest[sheetName] = {
          success: true,
          rowCount: data.length,
        };
      } catch (error: any) {
        sampleDataTest[sheetName] = {
          success: false,
          error: error.message || '알 수 없는 오류',
        };
      }
    }

    res.json({
      success: true,
      connected: true,
      environment: envStatus,
      spreadsheetId: sheetsConfig.spreadsheetId,
      sheets: {
        exists: sheetChecks,
        dataTest: sampleDataTest,
      },
      message: 'Google Sheets 연결이 정상적으로 작동합니다.',
    });
  } catch (error: any) {
    console.error('[Sheets Health] 오류:', error);
    res.status(500).json({
      success: false,
      connected: false,
      error: error.message || '알 수 없는 오류',
      message: '연결 상태 확인 중 오류가 발생했습니다.',
    });
  }
});

export default router;


