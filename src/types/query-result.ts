export interface QueryResult<T> {
  items: T[];
  lastEvaluatedKey?: Record<string, unknown>;
}
