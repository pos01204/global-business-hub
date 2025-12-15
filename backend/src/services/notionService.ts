import { Client } from '@notionhq/client';
import { notionConfig, isNotionConfigured } from '../config/notion';

/**
 * Notion API 서비스
 * 업무 관련 데이터 학습을 위한 Notion 페이지/데이터베이스 읽기 기능 제공
 */
class NotionService {
  private client: Client | null = null;
  private isConfigured: boolean;

  constructor() {
    this.isConfigured = isNotionConfigured;
    
    if (this.isConfigured) {
      try {
        this.client = new Client({
          auth: notionConfig.apiKey,
        });
        console.log('[Notion Service] Notion API 클라이언트 초기화 완료');
      } catch (error) {
        console.error('[Notion Service] 클라이언트 초기화 실패:', error);
        this.isConfigured = false;
      }
    } else {
      console.warn('[Notion Service] API 키가 설정되지 않아 Notion 연동 기능이 비활성화됩니다.');
    }
  }

  /**
   * 연결 상태 확인
   */
  async checkConnection(): Promise<{ connected: boolean; error?: string; details?: any }> {
    if (!this.isConfigured || !this.client) {
      return {
        connected: false,
        error: 'Notion API 키가 설정되지 않았습니다.',
        details: {
          configured: false,
        },
      };
    }

    try {
      // 사용자 정보 조회로 연결 테스트
      const response = await this.client.users.me();
      return {
        connected: true,
        details: {
          botId: response.id,
          name: response.name || 'Unknown',
          type: response.type,
        },
      };
    } catch (error: any) {
      console.error('[Notion Service] 연결 확인 실패:', error);
      return {
        connected: false,
        error: error.message || '연결 실패',
        details: {
          code: error.code,
          status: error.status,
        },
      };
    }
  }

  /**
   * 페이지 내용 읽기
   * @param pageId Notion 페이지 ID
   */
  async getPage(pageId: string): Promise<any> {
    if (!this.isConfigured || !this.client) {
      throw new Error('Notion API가 설정되지 않았습니다.');
    }

    try {
      const page = await this.client.pages.retrieve({ page_id: pageId });
      return page;
    } catch (error: any) {
      console.error(`[Notion Service] 페이지 조회 실패 (${pageId}):`, error);
      throw error;
    }
  }

  /**
   * 페이지의 모든 블록 읽기 (재귀적)
   * @param pageId Notion 페이지 ID
   */
  async getPageBlocks(pageId: string): Promise<any[]> {
    if (!this.isConfigured || !this.client) {
      throw new Error('Notion API가 설정되지 않았습니다.');
    }

    try {
      const blocks: any[] = [];
      let cursor: string | undefined = undefined;

      do {
        const response = await this.client.blocks.children.list({
          block_id: pageId,
          start_cursor: cursor,
        });

        blocks.push(...response.results);

        // 중첩된 블록도 재귀적으로 읽기
        for (const block of response.results) {
          if (block.has_children) {
            const childBlocks = await this.getBlockChildren(block.id);
            blocks.push(...childBlocks);
          }
        }

        cursor = response.next_cursor || undefined;
      } while (cursor);

      return blocks;
    } catch (error: any) {
      console.error(`[Notion Service] 블록 조회 실패 (${pageId}):`, error);
      throw error;
    }
  }

  /**
   * 블록의 자식 블록 읽기 (재귀적)
   * @param blockId 블록 ID
   */
  private async getBlockChildren(blockId: string): Promise<any[]> {
    if (!this.client) return [];

    try {
      const blocks: any[] = [];
      let cursor: string | undefined = undefined;

      do {
        const response = await this.client.blocks.children.list({
          block_id: blockId,
          start_cursor: cursor,
        });

        blocks.push(...response.results);

        // 중첩된 블록도 재귀적으로 읽기
        for (const block of response.results) {
          if (block.has_children) {
            const childBlocks = await this.getBlockChildren(block.id);
            blocks.push(...childBlocks);
          }
        }

        cursor = response.next_cursor || undefined;
      } while (cursor);

      return blocks;
    } catch (error: any) {
      console.error(`[Notion Service] 자식 블록 조회 실패 (${blockId}):`, error);
      return [];
    }
  }

  /**
   * 페이지 내용을 텍스트로 추출
   * @param pageId Notion 페이지 ID
   */
  async getPageContent(pageId: string): Promise<{
    title: string;
    content: string;
    blocks: any[];
    metadata: any;
  }> {
    if (!this.isConfigured || !this.client) {
      throw new Error('Notion API가 설정되지 않았습니다.');
    }

    try {
      const page = await this.getPage(pageId);
      const blocks = await this.getPageBlocks(pageId);

      // 페이지 제목 추출
      let title = 'Untitled';
      if (page.properties?.title) {
        if (Array.isArray(page.properties.title.title)) {
          title = page.properties.title.title
            .map((t: any) => t.plain_text || '')
            .join('');
        }
      } else if (page.properties?.['이름']) {
        if (Array.isArray(page.properties['이름'].title)) {
          title = page.properties['이름'].title
            .map((t: any) => t.plain_text || '')
            .join('');
        }
      }

      // 블록 내용을 텍스트로 변환
      const content = this.extractTextFromBlocks(blocks);

      return {
        title,
        content,
        blocks,
        metadata: {
          id: page.id,
          createdTime: page.created_time,
          lastEditedTime: page.last_edited_time,
          url: page.url,
          properties: page.properties,
        },
      };
    } catch (error: any) {
      console.error(`[Notion Service] 페이지 내용 추출 실패 (${pageId}):`, error);
      throw error;
    }
  }

  /**
   * 블록 배열에서 텍스트 추출
   */
  private extractTextFromBlocks(blocks: any[]): string {
    const texts: string[] = [];

    for (const block of blocks) {
      const text = this.extractTextFromBlock(block);
      if (text) {
        texts.push(text);
      }
    }

    return texts.join('\n\n');
  }

  /**
   * 단일 블록에서 텍스트 추출
   */
  private extractTextFromBlock(block: any): string {
    const type = block.type;
    const content = block[type];

    if (!content) return '';

    switch (type) {
      case 'paragraph':
      case 'heading_1':
      case 'heading_2':
      case 'heading_3':
      case 'bulleted_list_item':
      case 'numbered_list_item':
      case 'to_do':
      case 'toggle':
      case 'quote':
      case 'callout':
        if (content.rich_text) {
          return content.rich_text
            .map((t: any) => t.plain_text || '')
            .join('');
        }
        break;

      case 'code':
        if (content.rich_text) {
          const code = content.rich_text
            .map((t: any) => t.plain_text || '')
            .join('');
          return `\`\`\`${content.language || ''}\n${code}\n\`\`\``;
        }
        break;

      case 'table':
        // 테이블은 별도 처리 필요
        return '[Table]';

      case 'image':
      case 'video':
      case 'file':
        return `[${type}: ${content.caption?.[0]?.plain_text || 'Media'}]`;

      default:
        return '';
    }

    return '';
  }

  /**
   * 데이터베이스 조회
   * @param databaseId 데이터베이스 ID
   */
  async getDatabase(databaseId: string): Promise<any> {
    if (!this.isConfigured || !this.client) {
      throw new Error('Notion API가 설정되지 않았습니다.');
    }

    try {
      const database = await this.client.databases.retrieve({
        database_id: databaseId,
      });
      return database;
    } catch (error: any) {
      console.error(`[Notion Service] 데이터베이스 조회 실패 (${databaseId}):`, error);
      throw error;
    }
  }

  /**
   * 데이터베이스 쿼리 (페이지 목록 조회)
   * @param databaseId 데이터베이스 ID
   * @param filter 필터 조건 (선택)
   * @param sorts 정렬 조건 (선택)
   */
  async queryDatabase(
    databaseId: string,
    filter?: any,
    sorts?: any[]
  ): Promise<any[]> {
    if (!this.isConfigured || !this.client) {
      throw new Error('Notion API가 설정되지 않았습니다.');
    }

    try {
      const pages: any[] = [];
      let cursor: string | undefined = undefined;

      do {
        const response = await this.client.databases.query({
          database_id: databaseId,
          filter,
          sorts,
          start_cursor: cursor,
        });

        pages.push(...response.results);
        cursor = response.next_cursor || undefined;
      } while (cursor);

      return pages;
    } catch (error: any) {
      console.error(`[Notion Service] 데이터베이스 쿼리 실패 (${databaseId}):`, error);
      throw error;
    }
  }

  /**
   * 데이터베이스 내용을 구조화된 데이터로 추출
   * @param databaseId 데이터베이스 ID
   */
  async getDatabaseContent(databaseId: string): Promise<{
    schema: any;
    rows: any[];
    totalCount: number;
  }> {
    if (!this.isConfigured || !this.client) {
      throw new Error('Notion API가 설정되지 않았습니다.');
    }

    try {
      const database = await this.getDatabase(databaseId);
      const pages = await this.queryDatabase(databaseId);

      // 스키마 정보 추출
      const schema = database.properties;

      // 각 페이지를 구조화된 데이터로 변환
      const rows = pages.map((page) => {
        const row: any = {
          id: page.id,
          url: page.url,
          createdTime: page.created_time,
          lastEditedTime: page.last_edited_time,
        };

        // 속성 값 추출
        for (const [key, prop] of Object.entries(page.properties)) {
          row[key] = this.extractPropertyValue(prop as any);
        }

        return row;
      });

      return {
        schema,
        rows,
        totalCount: rows.length,
      };
    } catch (error: any) {
      console.error(`[Notion Service] 데이터베이스 내용 추출 실패 (${databaseId}):`, error);
      throw error;
    }
  }

  /**
   * 속성 값 추출
   */
  private extractPropertyValue(prop: any): any {
    const type = prop.type;

    switch (type) {
      case 'title':
        return prop.title
          .map((t: any) => t.plain_text || '')
          .join('');

      case 'rich_text':
        return prop.rich_text
          .map((t: any) => t.plain_text || '')
          .join('');

      case 'number':
        return prop.number;

      case 'select':
        return prop.select?.name || null;

      case 'multi_select':
        return prop.multi_select.map((s: any) => s.name);

      case 'date':
        return prop.date ? {
          start: prop.date.start,
          end: prop.date.end,
        } : null;

      case 'checkbox':
        return prop.checkbox;

      case 'url':
        return prop.url;

      case 'email':
        return prop.email;

      case 'phone_number':
        return prop.phone_number;

      case 'people':
        return prop.people.map((p: any) => ({
          id: p.id,
          name: p.name || 'Unknown',
        }));

      case 'files':
        return prop.files.map((f: any) => ({
          name: f.name,
          url: f.file?.url || f.external?.url,
        }));

      case 'relation':
        return prop.relation.map((r: any) => r.id);

      case 'formula':
        return prop.formula;

      case 'rollup':
        return prop.rollup;

      default:
        return null;
    }
  }

  /**
   * 검색 (페이지 및 데이터베이스)
   * @param query 검색어 (선택)
   * @param filter 필터 (선택)
   */
  async search(query?: string, filter?: any): Promise<any[]> {
    if (!this.isConfigured || !this.client) {
      throw new Error('Notion API가 설정되지 않았습니다.');
    }

    try {
      const results: any[] = [];
      let cursor: string | undefined = undefined;

      do {
        const response = await this.client.search({
          query,
          filter,
          start_cursor: cursor,
        });

        results.push(...response.results);
        cursor = response.next_cursor || undefined;
      } while (cursor);

      return results;
    } catch (error: any) {
      console.error('[Notion Service] 검색 실패:', error);
      throw error;
    }
  }
}

export const notionService = new NotionService();
export default notionService;

