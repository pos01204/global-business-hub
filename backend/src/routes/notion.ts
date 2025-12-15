import express, { Request, Response } from 'express';
import notionService from '../services/notionService';

const router = express.Router();

/**
 * Notion 연결 상태 확인
 * GET /api/notion/health
 */
router.get('/health', async (req: Request, res: Response) => {
  try {
    const status = await notionService.checkConnection();
    res.json(status);
  } catch (error: any) {
    console.error('[Notion Route] Health check 실패:', error);
    res.status(500).json({
      connected: false,
      error: error.message || 'Health check 실패',
    });
  }
});

/**
 * 페이지 내용 조회
 * GET /api/notion/pages/:pageId
 */
router.get('/pages/:pageId', async (req: Request, res: Response) => {
  try {
    const { pageId } = req.params;
    const includeBlocks = req.query.includeBlocks === 'true';

    if (includeBlocks) {
      // 블록 포함 전체 내용
      const content = await notionService.getPageContent(pageId);
      res.json(content);
    } else {
      // 페이지 메타데이터만
      const page = await notionService.getPage(pageId);
      res.json(page);
    }
  } catch (error: any) {
    console.error('[Notion Route] 페이지 조회 실패:', error);
    res.status(500).json({
      error: error.message || '페이지 조회 실패',
      code: error.code,
    });
  }
});

/**
 * 페이지 블록 조회
 * GET /api/notion/pages/:pageId/blocks
 */
router.get('/pages/:pageId/blocks', async (req: Request, res: Response) => {
  try {
    const { pageId } = req.params;
    const blocks = await notionService.getPageBlocks(pageId);
    res.json({
      pageId,
      blocks,
      count: blocks.length,
    });
  } catch (error: any) {
    console.error('[Notion Route] 블록 조회 실패:', error);
    res.status(500).json({
      error: error.message || '블록 조회 실패',
      code: error.code,
    });
  }
});

/**
 * 데이터베이스 조회
 * GET /api/notion/databases/:databaseId
 */
router.get('/databases/:databaseId', async (req: Request, res: Response) => {
  try {
    const { databaseId } = req.params;
    const includeContent = req.query.includeContent === 'true';

    if (includeContent) {
      // 데이터 포함 전체 내용
      const content = await notionService.getDatabaseContent(databaseId);
      res.json(content);
    } else {
      // 스키마만
      const database = await notionService.getDatabase(databaseId);
      res.json(database);
    }
  } catch (error: any) {
    console.error('[Notion Route] 데이터베이스 조회 실패:', error);
    res.status(500).json({
      error: error.message || '데이터베이스 조회 실패',
      code: error.code,
    });
  }
});

/**
 * 데이터베이스 쿼리
 * POST /api/notion/databases/:databaseId/query
 */
router.post('/databases/:databaseId/query', async (req: Request, res: Response) => {
  try {
    const { databaseId } = req.params;
    const { filter, sorts } = req.body;

    const pages = await notionService.queryDatabase(databaseId, filter, sorts);
    res.json({
      databaseId,
      pages,
      count: pages.length,
    });
  } catch (error: any) {
    console.error('[Notion Route] 데이터베이스 쿼리 실패:', error);
    res.status(500).json({
      error: error.message || '데이터베이스 쿼리 실패',
      code: error.code,
    });
  }
});

/**
 * 검색
 * GET /api/notion/search?query=검색어
 * POST /api/notion/search (필터 포함)
 */
router.get('/search', async (req: Request, res: Response) => {
  try {
    const { query } = req.query;
    const results = await notionService.search(query as string);
    res.json({
      query,
      results,
      count: results.length,
    });
  } catch (error: any) {
    console.error('[Notion Route] 검색 실패:', error);
    res.status(500).json({
      error: error.message || '검색 실패',
      code: error.code,
    });
  }
});

router.post('/search', async (req: Request, res: Response) => {
  try {
    const { query, filter } = req.body;
    const results = await notionService.search(query, filter);
    res.json({
      query,
      filter,
      results,
      count: results.length,
    });
  } catch (error: any) {
    console.error('[Notion Route] 검색 실패:', error);
    res.status(500).json({
      error: error.message || '검색 실패',
      code: error.code,
    });
  }
});

/**
 * 학습용 데이터 추출 (페이지)
 * GET /api/notion/learn/pages/:pageId
 * 페이지 내용을 학습 가능한 형식으로 추출
 */
router.get('/learn/pages/:pageId', async (req: Request, res: Response) => {
  try {
    const { pageId } = req.params;
    const content = await notionService.getPageContent(pageId);

    // 학습용 형식으로 변환
    const learningData = {
      type: 'page',
      id: content.metadata.id,
      title: content.title,
      text: content.content,
      metadata: {
        url: content.metadata.url,
        createdTime: content.metadata.createdTime,
        lastEditedTime: content.metadata.lastEditedTime,
        properties: content.metadata.properties,
      },
      blocks: content.blocks.map((block: any) => {
        // 블록에서 텍스트 추출 (간단한 방법)
        let text = '';
        const blockType = block.type;
        const blockContent = block[blockType];
        if (blockContent?.rich_text) {
          text = blockContent.rich_text
            .map((t: any) => t.plain_text || '')
            .join('');
        }
        return {
          type: block.type,
          id: block.id,
          text,
        };
      }),
    };

    res.json(learningData);
  } catch (error: any) {
    console.error('[Notion Route] 학습 데이터 추출 실패:', error);
    res.status(500).json({
      error: error.message || '학습 데이터 추출 실패',
      code: error.code,
    });
  }
});

/**
 * 학습용 데이터 추출 (데이터베이스)
 * GET /api/notion/learn/databases/:databaseId
 * 데이터베이스 내용을 학습 가능한 형식으로 추출
 */
router.get('/learn/databases/:databaseId', async (req: Request, res: Response) => {
  try {
    const { databaseId } = req.params;
    const content = await notionService.getDatabaseContent(databaseId);

    // 학습용 형식으로 변환
    const learningData = {
      type: 'database',
      id: databaseId,
      schema: content.schema,
      rows: content.rows,
      totalCount: content.totalCount,
      // 텍스트 형식으로도 변환
      text: content.rows.map((row: any, index: number) => {
        const rowText = Object.entries(row)
          .filter(([key]) => key !== 'id' && key !== 'url' && key !== 'createdTime' && key !== 'lastEditedTime')
          .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
          .join(', ');
        return `Row ${index + 1}: ${rowText}`;
      }).join('\n'),
    };

    res.json(learningData);
  } catch (error: any) {
    console.error('[Notion Route] 학습 데이터 추출 실패:', error);
    res.status(500).json({
      error: error.message || '학습 데이터 추출 실패',
      code: error.code,
    });
  }
});

export default router;

