import { ENTITY_TYPES, SEARCH_RESULTS_LIMIT, TABLE_NAME } from "@/constants";
import type { BookmarkData } from "@/types/bookmark-data.interface";
import type { BookmarkUpdateData } from "@/types/bookmark-update-data.interface";
import type { BookmarkWithScore } from "@/types/bookmark-with-score.interface";
import type { CategoryData } from "@/types/category-data.interface";
import type { DynamoDBParams } from "@/types/dynamodb-params.interface";
import type { QueryOptions } from "@/types/query-options.interface";
import type { QueryResult } from "@/types/query-result.interface";
import type { TagData } from "@/types/tag-data.interface";
import type { UserData } from "@/types/user-data.interface";
import {
  BatchWriteCommand,
  DeleteCommand,
  GetCommand,
  PutCommand,
  QueryCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
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

// Search index patterns
export const createSearchIndexPK = (userId: string, token: string) => `${userId}#${token}`;
export const createSearchIndexSK = (bookmarkId: string) => `BOOKMARK#${bookmarkId}`;

/**
 * Create search index entries for a bookmark
 * This implements an inverted index pattern similar to Elasticsearch
 */
export const createSearchIndexEntries = async (userId: string, bookmarkId: string, tokens: string[]) => {
  // Deduplicate tokens
  const uniqueTokens = [...new Set(tokens)];

  // Batch size for DynamoDB (25 is the max for batch operations)
  const BATCH_SIZE = 25;

  // Process tokens in batches to avoid exceeding DynamoDB limits
  for (let i = 0; i < uniqueTokens.length; i += BATCH_SIZE) {
    const batch = uniqueTokens.slice(i, i + BATCH_SIZE);

    // Create batch request items
    const putRequests = batch.map((token) => ({
      PutRequest: {
        Item: {
          PK: createPK(ENTITY_TYPES.SEARCH_INDEX, `${userId}#${token}`),
          SK: createSK(ENTITY_TYPES.SEARCH_INDEX, bookmarkId),
          GSI1PK: createGSI1PK(userId),
          GSI1SK: createGSI1SK(ENTITY_TYPES.SEARCH_INDEX, new Date().toISOString()),
          userId, // For the GSI
          token, // For the GSI
          bookmarkId,
          entityType: ENTITY_TYPES.SEARCH_INDEX,
          createdAt: new Date().toISOString(),
        },
      },
    }));

    // Execute batch write
    await dynamodb.send(
      new BatchWriteCommand({
        RequestItems: {
          [TABLE_NAME]: putRequests,
        },
      }),
    );
  }
};

/**
 * Delete search index entries for a bookmark
 */
export const deleteSearchIndexEntries = async (userId: string, bookmarkId: string) => {
  // Query search index entries using GSI1
  const params: DynamoDBParams = {
    TableName: TABLE_NAME,
    IndexName: "GSI1",
    KeyConditionExpression: "GSI1PK = :gsi1pk AND begins_with(GSI1SK, :gsi1sk)",
    FilterExpression: "bookmarkId = :bookmarkId",
    ExpressionAttributeValues: {
      ":gsi1pk": createGSI1PK(userId),
      ":gsi1sk": createGSI1SK(ENTITY_TYPES.SEARCH_INDEX),
      ":bookmarkId": bookmarkId,
    },
  };

  // Get all index entries
  const result = await dynamodb.send(new QueryCommand(params));
  const items = result.Items || [];

  // Delete in batches
  const BATCH_SIZE = 25;
  for (let i = 0; i < items.length; i += BATCH_SIZE) {
    const batch = items.slice(i, i + BATCH_SIZE);

    const deleteRequests = batch.map((item) => ({
      DeleteRequest: {
        Key: {
          PK: item.PK,
          SK: item.SK,
        },
      },
    }));

    if (deleteRequests.length > 0) {
      await dynamodb.send(
        new BatchWriteCommand({
          RequestItems: {
            [TABLE_NAME]: deleteRequests,
          },
        }),
      );
    }
  }
};

/**
 * Create a new user
 */
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

  // Extract search tokens for the inverted index
  const searchTokens = bookmarkData.searchTokens || [];

  // Create the main bookmark item without storing searchTokens in the main record
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
    createdAt: now,
    updatedAt: now,
  };

  // Create the main bookmark record
  await dynamodb.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: item,
    }),
  );

  // Create search index entries in parallel (inverted index pattern)
  await createSearchIndexEntries(bookmarkData.userId, bookmarkData.id, searchTokens);

  return item;
};

export const getUserBookmarks = async (userId: string, options: QueryOptions = {}): Promise<QueryResult<unknown>> => {
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
};

export const updateBookmark = async (bookmarkId: string, updates: BookmarkUpdateData) => {
  // Check if we need to update the search index (if searchTokens are being updated)
  const updateSearchIndex = updates.searchTokens !== undefined;

  // First get the existing bookmark to get userId and potentially old search tokens
  const existingBookmark = (await getBookmarkById(bookmarkId)) as BookmarkData | null;

  if (!existingBookmark) {
    throw new Error(`Bookmark with ID ${bookmarkId} not found`);
  }

  const updateExpressions: string[] = [];
  const expressionAttributeValues: Record<string, unknown> = {};
  const expressionAttributeNames: Record<string, string> = {};

  // Only include fields that are being updated
  Object.entries(updates).forEach(([key, value]) => {
    if (value !== undefined && key !== "searchTokens") {
      // Don't store searchTokens in the main item
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

  // Update search index if needed
  if (updateSearchIndex && updates.searchTokens && existingBookmark.userId) {
    // First delete old search index entries
    await deleteSearchIndexEntries(existingBookmark.userId, bookmarkId);

    // Then create new ones
    await createSearchIndexEntries(existingBookmark.userId, bookmarkId, updates.searchTokens);
  }

  return result.Attributes;
};

export const deleteBookmark = async (bookmarkId: string) => {
  // Get the bookmark details first to get userId for removing index entries
  const bookmark = (await getBookmarkById(bookmarkId)) as BookmarkData | null;

  // Delete the main bookmark record
  await dynamodb.send(
    new DeleteCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: createPK(ENTITY_TYPES.BOOKMARK, bookmarkId),
        SK: createSK(ENTITY_TYPES.BOOKMARK),
      },
    }),
  );

  // Remove associated search index entries if bookmark exists
  if (bookmark?.userId) {
    await deleteSearchIndexEntries(bookmark.userId, bookmarkId);
  }
};

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
};

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
};

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
};

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
};

// Update tag
export const updateTag = async (tagId: string, updates: Partial<{ name: string; icon: string }>) => {
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

// Enhanced search functionality using the inverted index
export const searchBookmarks = async (userId: string, searchTokens: string[]): Promise<BookmarkWithScore[]> => {
  if (!searchTokens.length) return [];

  // Separate exact phrase tokens from regular tokens
  const exactPhraseTokens = searchTokens
    .filter((token) => token.startsWith("__exact__:"))
    .map((token) => token.substring(9)); // Remove '__exact__:' prefix

  // Regular search tokens (excluding special exact phrase tokens)
  const regularTokens = searchTokens.filter((token) => !token.startsWith("__exact__:"));

  // Include exact phrase without the prefix in the tokens
  const allSearchTokens = [...regularTokens, ...exactPhraseTokens];

  // Limit to first 6 tokens for better performance
  // But make sure we keep at least one exact phrase token if present
  const queryTokens = allSearchTokens.slice(0, 6);

  // For each search token, query the inverted index to find matching bookmarks
  const bookmarkIdSets: Set<string>[] = [];

  // We'll collect all matching bookmark IDs from the inverted index
  for (const token of queryTokens) {
    // Query the inverted index for this token
    const params: DynamoDBParams = {
      TableName: TABLE_NAME,
      IndexName: "InvertedIndex",
      KeyConditionExpression: "userId = :userId AND begins_with(#token, :token)",
      ExpressionAttributeValues: {
        ":userId": userId,
        ":token": token.toLowerCase(),
      },
      ExpressionAttributeNames: {
        "#token": "token", // Escape reserved keyword
      },
      ProjectionExpression: "bookmarkId", // Only return bookmark IDs
    };

    try {
      const result = await dynamodb.send(new QueryCommand(params));

      // Extract unique bookmark IDs for this token
      const bookmarkIds = new Set<string>(
        (result.Items || []).map((item) => item.bookmarkId as string).filter(Boolean),
      );

      if (bookmarkIds.size > 0) {
        bookmarkIdSets.push(bookmarkIds);
      }
    } catch (error) {
      console.error(`Error searching for token ${token}:`, error);
    }
  }

  // No matches found in the inverted index
  if (bookmarkIdSets.length === 0) return [];

  // Find intersection of bookmark IDs (bookmarks that match multiple tokens)
  // We prioritize bookmarks that match more tokens
  const scoredIds: Map<string, number> = new Map();

  // Score each bookmark based on how many tokens it matches
  bookmarkIdSets.forEach((idSet) => {
    idSet.forEach((id) => {
      scoredIds.set(id, (scoredIds.get(id) || 0) + 1);
    });
  });

  // Convert to array and sort by score (number of matching tokens)
  const sortedIds = [...scoredIds.entries()]
    .sort((a, b) => b[1] - a[1]) // Sort by score (descending)
    .slice(0, SEARCH_RESULTS_LIMIT) // Limit the number of results
    .map((entry) => entry[0]); // Get just the bookmark IDs

  // Early return if no matches
  if (sortedIds.length === 0) return [];

  // Fetch full bookmark details for the matching IDs
  const bookmarks: unknown[] = [];

  // Fetch bookmarks in batches (to avoid DynamoDB limits)
  const BATCH_SIZE = 25;
  for (let i = 0; i < sortedIds.length; i += BATCH_SIZE) {
    const batch = sortedIds.slice(i, i + BATCH_SIZE);

    // Fetch each bookmark in parallel
    const batchResults = await Promise.all(batch.map((id) => getBookmarkById(id)));

    // Add to results, filtering out null values
    bookmarks.push(...batchResults.filter(Boolean));
  }

  // Import here to avoid circular dependencies
  const { applySearchScoring, sortBySearchScore } = await import("./search-utils");

  // Apply detailed scoring algorithm and sort by relevance
  const scoredResults = sortBySearchScore(applySearchScoring(bookmarks, searchTokens));

  return scoredResults;
};

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

import type { UpdateUserSettingsInput } from "@/schemas/user-settings.schema";
import type { UserSettings } from "@/schemas/user.schema";

// Get user settings
export const getUserSettings = async (userId: string): Promise<UserSettings | null> => {
  const result = await dynamodb.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: createPK(ENTITY_TYPES.USER, userId),
        SK: "SETTINGS",
      },
    }),
  );

  return result.Item as UserSettings | null;
};

// Update user settings
export const updateUserSettings = async (userId: string, data: UpdateUserSettingsInput): Promise<UserSettings> => {
  const now = new Date().toISOString();

  const updateExpression: string[] = [];
  const expressionAttributeNames: Record<string, string> = {};
  const expressionAttributeValues: Record<string, unknown> = {};

  // Add each field to the update expression
  Object.entries(data).forEach(([key, value]) => {
    updateExpression.push(`#${key} = :${key}`);
    expressionAttributeNames[`#${key}`] = key;
    expressionAttributeValues[`:${key}`] = value;
  });

  // Add updated timestamp
  updateExpression.push("#updatedAt = :updatedAt");
  expressionAttributeNames["#updatedAt"] = "updatedAt";
  expressionAttributeValues[":updatedAt"] = now;

  const params = {
    TableName: TABLE_NAME,
    Key: {
      PK: createPK(ENTITY_TYPES.USER, userId),
      SK: "SETTINGS",
    },
    UpdateExpression: `SET ${updateExpression.join(", ")}`,
    ExpressionAttributeNames: expressionAttributeNames,
    ExpressionAttributeValues: expressionAttributeValues,
    ReturnValues: "ALL_NEW" as const,
  };

  const result = await dynamodb.send(new UpdateCommand(params));

  return result.Attributes as UserSettings;
};

// Utility to rebuild the search index for a user's bookmarks
export const rebuildSearchIndex = async (userId: string): Promise<{ success: boolean; count: number }> => {
  try {
    // Get all user's bookmarks
    const result = await getUserBookmarks(userId, { limit: 500 });
    const bookmarks = result.items as BookmarkData[];

    if (!bookmarks || bookmarks.length === 0) {
      return { success: true, count: 0 };
    }

    // Process bookmarks in batches
    const BATCH_SIZE = 25;
    let processedCount = 0;

    // For each bookmark, regenerate its search tokens and rebuild index entries
    for (let i = 0; i < bookmarks.length; i += BATCH_SIZE) {
      const batch = bookmarks.slice(i, i + BATCH_SIZE);

      // Process each bookmark in parallel
      await Promise.all(
        batch.map(async (bookmark) => {
          try {
            // First delete existing search entries
            await deleteSearchIndexEntries(userId, bookmark.id);

            // Generate search tokens from bookmark content
            const { title, description, domain, url } = bookmark;
            const searchText = [title, description, domain, url].filter(Boolean).join(" ");

            // Generate tokens using the metadata utility
            const { generateSearchTokens } = await import("./metadata");
            const searchTokens = generateSearchTokens(searchText);

            // Create new index entries
            await createSearchIndexEntries(userId, bookmark.id, searchTokens);

            processedCount++;
          } catch (error) {
            console.error(`Error rebuilding search index for bookmark ${bookmark.id}:`, error);
          }
        }),
      );
    }

    return { success: true, count: processedCount };
  } catch (error) {
    console.error("Error rebuilding search index:", error);
    return { success: false, count: 0 };
  }
};

/**
 * Count bookmarks by category for a user
 */
export const countBookmarksByCategory = async (userId: string): Promise<Record<string, number>> => {
  const result = await dynamodb.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: "GSI1",
      KeyConditionExpression: "GSI1PK = :gsi1pk AND begins_with(GSI1SK, :gsi1sk)",
      ExpressionAttributeValues: {
        ":gsi1pk": createGSI1PK(userId),
        ":gsi1sk": createGSI1SK(ENTITY_TYPES.BOOKMARK),
      },
      ProjectionExpression: "categoryId",
    }),
  );

  const bookmarks = result.Items || [];
  const categoryCounts: Record<string, number> = {};

  // Count bookmarks by category
  for (const bookmark of bookmarks) {
    const categoryId = bookmark.categoryId as string;
    if (categoryId) {
      categoryCounts[categoryId] = (categoryCounts[categoryId] || 0) + 1;
    } else {
      // Count uncategorized bookmarks
      categoryCounts["uncategorized"] = (categoryCounts["uncategorized"] || 0) + 1;
    }
  }

  return categoryCounts;
};

/**
 * Count bookmarks by tag for a user
 */
export const countBookmarksByTag = async (userId: string): Promise<Record<string, number>> => {
  const result = await dynamodb.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: "GSI1",
      KeyConditionExpression: "GSI1PK = :gsi1pk AND begins_with(GSI1SK, :gsi1sk)",
      ExpressionAttributeValues: {
        ":gsi1pk": createGSI1PK(userId),
        ":gsi1sk": createGSI1SK(ENTITY_TYPES.BOOKMARK),
      },
      ProjectionExpression: "tagIds",
    }),
  );

  const bookmarks = result.Items || [];
  const tagCounts: Record<string, number> = {};

  // Count bookmarks by tag
  for (const bookmark of bookmarks) {
    const tagIds = (bookmark.tagIds as string[]) || [];
    for (const tagId of tagIds) {
      tagCounts[tagId] = (tagCounts[tagId] || 0) + 1;
    }
  }

  return tagCounts;
};

/**
 * Get categories with bookmark counts for a user
 */
export const getCategoriesWithCounts = async (userId: string) => {
  const [categories, categoryCounts] = await Promise.all([getUserCategories(userId), countBookmarksByCategory(userId)]);

  return categories.map((category) => ({
    ...category,
    _count: {
      bookmarks: categoryCounts[category.id] || 0,
    },
  }));
};

/**
 * Get tags with bookmark counts for a user
 */
export const getTagsWithCounts = async (userId: string) => {
  const [tags, tagCounts] = await Promise.all([getUserTags(userId), countBookmarksByTag(userId)]);

  return tags.map((tag) => ({
    ...tag,
    _count: {
      bookmarks: tagCounts[tag.id] || 0,
    },
  }));
};
