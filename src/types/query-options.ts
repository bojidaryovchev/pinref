export interface QueryOptions {
  limit?: number;
  lastEvaluatedKey?: Record<string, unknown>;
  categoryId?: string;
  isFavorite?: boolean;
}
