import type { SearchRequest, SearchResponse } from '@dailyuse/contracts/editor';
import type { Context } from '@dailyuse/contracts/shared';

export interface IRepositorySearchPort {
  search(request: SearchRequest, ctx: Context): Promise<SearchResponse>;
}
