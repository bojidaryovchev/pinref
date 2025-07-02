export interface QueryOptions {
  limit?: number;
  lastEvaluatedKey?: Record<string, unknown>;
  categoryId?: string;
  isFavorite?: boolean;
}

export interface QueryResult<T> {
  items: T[];
  lastEvaluatedKey?: Record<string, unknown>;
}

export interface DynamoDBParams {
  TableName: string;
  IndexName?: string;
  KeyConditionExpression?: string;
  ExpressionAttributeValues?: Record<string, unknown>;
  ExpressionAttributeNames?: Record<string, string>;
  FilterExpression?: string;
  ScanIndexForward?: boolean;
  Limit?: number;
  ExclusiveStartKey?: Record<string, unknown>;
}

export interface BookmarkWithScore extends Record<string, unknown> {
  id: string;
  searchTokens?: string[];
  searchScore: number;
}
