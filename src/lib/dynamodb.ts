import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DeleteCommand,
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  QueryCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";

export const client = new DynamoDBClient({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export const dynamodb = DynamoDBDocumentClient.from(client);

// Table name
export const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME || "bookmark-manager";

// Entity types
export const ENTITY_TYPES = {
  USER: "USER",
  BOOKMARK: "BOOKMARK",
  CATEGORY: "CATEGORY",
  TAG: "TAG",
} as const;

// Key patterns for single-table design
export const createPK = (entityType: string, id: string) => `${entityType}#${id}`;
export const createSK = (entityType: string, id?: string) => (id ? `${entityType}#${id}` : entityType);

// GSI patterns
export const createGSI1PK = (userId: string) => `USER#${userId}`;
export const createGSI1SK = (entityType: string, createdAt?: string) =>
  createdAt ? `${entityType}#${createdAt}` : entityType;

// User operations
export async function createUser(userData: { id: string; email: string; name?: string; image?: string }) {
  const item = {
    PK: createPK(ENTITY_TYPES.USER, userData.id),
    SK: createSK(ENTITY_TYPES.USER),
    GSI1PK: createGSI1PK(userData.id),
    GSI1SK: createGSI1SK(ENTITY_TYPES.USER),
    entityType: ENTITY_TYPES.USER,
    id: userData.id,
    email: userData.email,
    name: userData.name,
    image: userData.image,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await dynamodb.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: item,
    }),
  );

  return item;
}

export async function getUser(userId: string) {
  const result = await dynamodb.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: createPK(ENTITY_TYPES.USER, userId),
        SK: createSK(ENTITY_TYPES.USER),
      },
    }),
  );

  return result.Item;
}

// Bookmark operations
export async function createBookmark(bookmarkData: {
  id: string;
  userId: string;
  url: string;
  title?: string;
  description?: string;
  image?: string;
  favicon?: string;
  domain?: string;
  categoryId?: string;
  tagIds?: string[];
  isFavorite?: boolean;
  searchTokens?: string[];
}) {
  const now = new Date().toISOString();

  const item = {
    PK: createPK(ENTITY_TYPES.BOOKMARK, bookmarkData.id),
    SK: createSK(ENTITY_TYPES.BOOKMARK),
    GSI1PK: createGSI1PK(bookmarkData.userId),
    GSI1SK: createGSI1SK(ENTITY_TYPES.BOOKMARK, now),
    entityType: ENTITY_TYPES.BOOKMARK,
    id: bookmarkData.id,
    userId: bookmarkData.userId,
    url: bookmarkData.url,
    title: bookmarkData.title,
    description: bookmarkData.description,
    image: bookmarkData.image,
    favicon: bookmarkData.favicon,
    domain: bookmarkData.domain,
    categoryId: bookmarkData.categoryId,
    tagIds: bookmarkData.tagIds || [],
    isFavorite: bookmarkData.isFavorite || false,
    searchTokens: bookmarkData.searchTokens || [],
    createdAt: now,
    updatedAt: now,
  };

  await dynamodb.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: item,
    }),
  );

  return item;
}

export async function getUserBookmarks(
  userId: string,
  options: {
    limit?: number;
    lastEvaluatedKey?: any;
    categoryId?: string;
    isFavorite?: boolean;
  } = {},
) {
  const params: any = {
    TableName: TABLE_NAME,
    IndexName: "GSI1",
    KeyConditionExpression: "GSI1PK = :gsi1pk AND begins_with(GSI1SK, :gsi1sk)",
    ExpressionAttributeValues: {
      ":gsi1pk": createGSI1PK(userId),
      ":gsi1sk": createGSI1SK(ENTITY_TYPES.BOOKMARK),
    },
    ScanIndexForward: false, // Sort by newest first
  };

  if (options.limit) {
    params.Limit = options.limit;
  }

  if (options.lastEvaluatedKey) {
    params.ExclusiveStartKey = options.lastEvaluatedKey;
  }

  // Add filters
  const filterExpressions = [];
  if (options.categoryId) {
    filterExpressions.push("categoryId = :categoryId");
    params.ExpressionAttributeValues[":categoryId"] = options.categoryId;
  }

  if (options.isFavorite !== undefined) {
    filterExpressions.push("isFavorite = :isFavorite");
    params.ExpressionAttributeValues[":isFavorite"] = options.isFavorite;
  }

  if (filterExpressions.length > 0) {
    params.FilterExpression = filterExpressions.join(" AND ");
  }

  const result = await dynamodb.send(new QueryCommand(params));
  return {
    items: result.Items || [],
    lastEvaluatedKey: result.LastEvaluatedKey,
  };
}

export async function updateBookmark(
  bookmarkId: string,
  updates: {
    title?: string;
    description?: string;
    categoryId?: string;
    tagIds?: string[];
    isFavorite?: boolean;
  },
) {
  const updateExpressions = [];
  const expressionAttributeValues: any = {};
  const expressionAttributeNames: any = {};

  Object.entries(updates).forEach(([key, value]) => {
    if (value !== undefined) {
      updateExpressions.push(`#${key} = :${key}`);
      expressionAttributeValues[`:${key}`] = value;
      expressionAttributeNames[`#${key}`] = key;
    }
  });

  updateExpressions.push("#updatedAt = :updatedAt");
  expressionAttributeValues[":updatedAt"] = new Date().toISOString();
  expressionAttributeNames["#updatedAt"] = "updatedAt";

  const result = await dynamodb.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: createPK(ENTITY_TYPES.BOOKMARK, bookmarkId),
        SK: createSK(ENTITY_TYPES.BOOKMARK),
      },
      UpdateExpression: `SET ${updateExpressions.join(", ")}`,
      ExpressionAttributeValues: expressionAttributeValues,
      ExpressionAttributeNames: expressionAttributeNames,
      ReturnValues: "ALL_NEW",
    }),
  );

  return result.Attributes;
}

export async function deleteBookmark(bookmarkId: string) {
  await dynamodb.send(
    new DeleteCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: createPK(ENTITY_TYPES.BOOKMARK, bookmarkId),
        SK: createSK(ENTITY_TYPES.BOOKMARK),
      },
    }),
  );
}

// Category operations
export async function createCategory(categoryData: {
  id: string;
  userId: string;
  name: string;
  icon: string;
  color: string;
}) {
  const now = new Date().toISOString();

  const item = {
    PK: createPK(ENTITY_TYPES.CATEGORY, categoryData.id),
    SK: createSK(ENTITY_TYPES.CATEGORY),
    GSI1PK: createGSI1PK(categoryData.userId),
    GSI1SK: createGSI1SK(ENTITY_TYPES.CATEGORY, now),
    entityType: ENTITY_TYPES.CATEGORY,
    id: categoryData.id,
    userId: categoryData.userId,
    name: categoryData.name,
    icon: categoryData.icon,
    color: categoryData.color,
    createdAt: now,
    updatedAt: now,
  };

  await dynamodb.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: item,
    }),
  );

  return item;
}

export async function getUserCategories(userId: string) {
  const result = await dynamodb.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: "GSI1",
      KeyConditionExpression: "GSI1PK = :gsi1pk AND begins_with(GSI1SK, :gsi1sk)",
      ExpressionAttributeValues: {
        ":gsi1pk": createGSI1PK(userId),
        ":gsi1sk": createGSI1SK(ENTITY_TYPES.CATEGORY),
      },
    }),
  );

  return result.Items || [];
}

// Tag operations
export async function createTag(tagData: { id: string; userId: string; name: string; icon?: string }) {
  const now = new Date().toISOString();

  const item = {
    PK: createPK(ENTITY_TYPES.TAG, tagData.id),
    SK: createSK(ENTITY_TYPES.TAG),
    GSI1PK: createGSI1PK(tagData.userId),
    GSI1SK: createGSI1SK(ENTITY_TYPES.TAG, now),
    entityType: ENTITY_TYPES.TAG,
    id: tagData.id,
    userId: tagData.userId,
    name: tagData.name,
    icon: tagData.icon,
    createdAt: now,
    updatedAt: now,
  };

  await dynamodb.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: item,
    }),
  );

  return item;
}

export async function getUserTags(userId: string) {
  const result = await dynamodb.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: "GSI1",
      KeyConditionExpression: "GSI1PK = :gsi1pk AND begins_with(GSI1SK, :gsi1sk)",
      ExpressionAttributeValues: {
        ":gsi1pk": createGSI1PK(userId),
        ":gsi1sk": createGSI1SK(ENTITY_TYPES.TAG),
      },
    }),
  );

  return result.Items || [];
}

// Enhanced search functionality with n-gram matching
export async function searchBookmarks(userId: string, searchTokens: string[]) {
  if (!searchTokens.length) return [];

  const results = new Map();

  // Search through user's bookmarks and score matches
  const allBookmarks = await getUserBookmarks(userId, { limit: 1000 });

  for (const bookmark of allBookmarks.items) {
    let score = 0;
    const bookmarkTokens = bookmark.searchTokens || [];

    // Calculate match score based on token overlap
    for (const queryToken of searchTokens) {
      for (const bookmarkToken of bookmarkTokens) {
        if (bookmarkToken.includes(queryToken) || queryToken.includes(bookmarkToken)) {
          // Exact matches get higher score
          if (bookmarkToken === queryToken) {
            score += 10;
          } else if (bookmarkToken.startsWith(queryToken) || queryToken.startsWith(bookmarkToken)) {
            score += 5;
          } else {
            score += 1;
          }
        }
      }
    }

    if (score > 0) {
      results.set(bookmark.id, { ...bookmark, searchScore: score });
    }
  }

  // Sort by score (highest first) and return
  return Array.from(results.values())
    .sort((a, b) => b.searchScore - a.searchScore)
    .slice(0, 50); // Limit results
}
