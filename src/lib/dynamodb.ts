import {
  DeleteCommand,
  GetCommand,
  PutCommand,
  QueryCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import { ENTITY_TYPES, TABLE_NAME, SEARCH_RESULTS_LIMIT } from "@/constants";
import type { BookmarkData } from "@/types/bookmark-data.interface";
import type { BookmarkUpdateData } from "@/types/bookmark-update-data.interface";
import type { BookmarkWithScore } from "@/types/bookmark-with-score.interface";
import type { CategoryData } from "@/types/category-data.interface";
import type { DynamoDBParams } from "@/types/dynamodb-params.interface";
import type { QueryOptions } from "@/types/query-options.interface";
import type { QueryResult } from "@/types/query-result.interface";
import type { TagData } from "@/types/tag-data.interface";
import type { UserData } from "@/types/user-data.interface";
import { dynamoDocClient } from "./db-client";

// Use the shared DynamoDB document client
export const dynamodb = dynamoDocClient;

// Key patterns for single-table design
export const createPK = (entityType: string, id: string) => `${entityType}#${id}`;
export const createSK = (entityType: string, id?: string) => (id ? `${entityType}#${id}` : entityType);

// GSI patterns
export const createGSI1PK = (userId: string) => `USER#${userId}`;
export const createGSI1SK = (entityType: string, createdAt?: string) =>
  createdAt ? `${entityType}#${createdAt}` : entityType;

// User operations
export const createUser = async (userData: UserData) => {
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
};

export const getUser = async (userId: string) => {
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
};

// Bookmark operations
export const createBookmark = async (bookmarkData: BookmarkData) => {
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

export const getUserBookmarks = async (
  userId: string,
  options: QueryOptions = {},
): Promise<QueryResult<unknown>> => {
  const params: DynamoDBParams = {
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
  const filterExpressions: string[] = [];
  if (options.categoryId) {
    filterExpressions.push("categoryId = :categoryId");
    if (!params.ExpressionAttributeValues) {
      params.ExpressionAttributeValues = {};
    }
    params.ExpressionAttributeValues[":categoryId"] = options.categoryId;
  }

  if (options.isFavorite !== undefined) {
    filterExpressions.push("isFavorite = :isFavorite");
    if (!params.ExpressionAttributeValues) {
      params.ExpressionAttributeValues = {};
    }
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

export const updateBookmark = async (
  bookmarkId: string,
  updates: BookmarkUpdateData,
) => {
  const updateExpressions: string[] = [];
  const expressionAttributeValues: Record<string, unknown> = {};
  const expressionAttributeNames: Record<string, string> = {};

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

export const deleteBookmark = async (bookmarkId: string) => {
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

// Get a bookmark by ID
export const getBookmarkById = async (bookmarkId: string): Promise<unknown | null> => {
  const result = await dynamodb.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: createPK(ENTITY_TYPES.BOOKMARK, bookmarkId),
        SK: createSK(ENTITY_TYPES.BOOKMARK),
      },
    }),
  );

  return result.Item || null;
};

// Category operations
export const createCategory = async (categoryData: CategoryData) => {
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

export const getUserCategories = async (userId: string) => {
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

// Update category
export const updateCategory = async (
  categoryId: string,
  updates: Partial<{ name: string; icon: string; color: string }>,
) => {
  const updateExpressions: string[] = [];
  const expressionAttributeValues: Record<string, unknown> = {};
  const expressionAttributeNames: Record<string, string> = {};

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
        PK: createPK(ENTITY_TYPES.CATEGORY, categoryId),
        SK: createSK(ENTITY_TYPES.CATEGORY),
      },
      UpdateExpression: `SET ${updateExpressions.join(", ")}`,
      ExpressionAttributeValues: expressionAttributeValues,
      ExpressionAttributeNames: expressionAttributeNames,
      ReturnValues: "ALL_NEW",
    }),
  );

  return result.Attributes;
};

// Delete category
export const deleteCategory = async (categoryId: string) => {
  await dynamodb.send(
    new DeleteCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: createPK(ENTITY_TYPES.CATEGORY, categoryId),
        SK: createSK(ENTITY_TYPES.CATEGORY),
      },
    }),
  );
};

// Tag operations
export const createTag = async (tagData: TagData) => {
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

export const getUserTags = async (userId: string) => {
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

// Update tag
export const updateTag = async (
  tagId: string,
  updates: Partial<{ name: string; icon: string }>,
) => {
  const updateExpressions: string[] = [];
  const expressionAttributeValues: Record<string, unknown> = {};
  const expressionAttributeNames: Record<string, string> = {};

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
        PK: createPK(ENTITY_TYPES.TAG, tagId),
        SK: createSK(ENTITY_TYPES.TAG),
      },
      UpdateExpression: `SET ${updateExpressions.join(", ")}`,
      ExpressionAttributeValues: expressionAttributeValues,
      ExpressionAttributeNames: expressionAttributeNames,
      ReturnValues: "ALL_NEW",
    }),
  );

  return result.Attributes;
};

// Delete tag
export const deleteTag = async (tagId: string) => {
  await dynamodb.send(
    new DeleteCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: createPK(ENTITY_TYPES.TAG, tagId),
        SK: createSK(ENTITY_TYPES.TAG),
      },
    }),
  );
};

// Enhanced search functionality with n-gram matching - uses DynamoDB's contains operator
export const searchBookmarks = async (userId: string, searchTokens: string[]): Promise<BookmarkWithScore[]> => {
  if (!searchTokens.length) return [];

  // We'll use DynamoDB's FilterExpression to find items where searchTokens contains at least one of our search tokens
  // This approach leverages DynamoDB's native filtering capabilities instead of loading all items
  
  const params: DynamoDBParams = {
    TableName: TABLE_NAME,
    IndexName: "GSI1",
    KeyConditionExpression: "GSI1PK = :gsi1pk AND begins_with(GSI1SK, :gsi1sk)",
    ExpressionAttributeValues: {
      ":gsi1pk": createGSI1PK(userId),
      ":gsi1sk": createGSI1SK(ENTITY_TYPES.BOOKMARK),
    },
    ScanIndexForward: false, // Sort by newest first
    Limit: SEARCH_RESULTS_LIMIT,
  };

  // Build the search filter expression using contains()
  if (searchTokens.length > 0) {
    // Create filter expressions for each token
    const tokenFilters = searchTokens.map((token, index) => {
      params.ExpressionAttributeValues![`:token${index}`] = token;
      return `contains(searchTokens, :token${index})`;
    });

    // Combine with OR logic - any match is a hit
    params.FilterExpression = tokenFilters.join(" OR ");
  }

  const result = await dynamodb.send(new QueryCommand(params));
  const items = result.Items || [];

  // Import here to avoid circular dependencies
  const { applySearchScoring, sortBySearchScore } = await import('./search-utils');
  
  // Apply scoring algorithm and sort by relevance
  const scoredResults = sortBySearchScore(applySearchScoring(items, searchTokens));
  
  return scoredResults;
}

// Get a category by ID
export const getCategoryById = async (categoryId: string): Promise<unknown | null> => {
  const result = await dynamodb.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: createPK(ENTITY_TYPES.CATEGORY, categoryId),
        SK: createSK(ENTITY_TYPES.CATEGORY),
      },
    }),
  );

  return result.Item || null;
};

// Get a tag by ID
export const getTagById = async (tagId: string): Promise<unknown | null> => {
  const result = await dynamodb.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: createPK(ENTITY_TYPES.TAG, tagId),
        SK: createSK(ENTITY_TYPES.TAG),
      },
    }),
  );

  return result.Item || null;
};
