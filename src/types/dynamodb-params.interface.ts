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
