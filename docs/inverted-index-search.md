# Inverted Index Search Implementation

## Overview

This document explains the inverted index search implementation for the bookmark manager. The search system is inspired by Elasticsearch and uses a true inverted index pattern in DynamoDB to enable efficient and scalable search across bookmarks.

## Key Components

### 1. Inverted Index Structure

An inverted index maps search tokens to the bookmarks that contain them, rather than storing all tokens with each bookmark:

```
Token → [Bookmark1, Bookmark2, ...]
```

This allows for efficient retrieval of all bookmarks matching a specific search token.

### 2. Index Entry Schema

Each search index entry uses the following DynamoDB structure:

- **PK**: `SEARCH_INDEX#userId#token`
- **SK**: `SEARCH_INDEX#bookmarkId`
- **userId**: For querying by user
- **token**: The search token
- **bookmarkId**: Reference to the bookmark
- **entityType**: "SEARCH_INDEX"
- **createdAt**: Timestamp

### 3. Index Creation

The `createSearchIndexEntries` function creates search index entries for a bookmark by:
1. De-duplicating search tokens
2. Processing tokens in batches (to avoid DynamoDB limits)
3. Creating one DynamoDB entry per token-bookmark pair

### 4. Search Process

The `searchBookmarks` function:
1. Queries the inverted index for each search token
2. Collects matching bookmark IDs
3. Scores bookmarks based on how many search tokens they match
4. Fetches full bookmark details for the top matches
5. Applies detailed relevance scoring
6. Returns sorted results

### 5. Relevance Scoring

The search system uses a sophisticated scoring algorithm that considers:

- Field-specific boosts (title > domain > description > URL)
- Exact vs. partial matches
- Token position and overlap
- Document freshness (newer bookmarks score slightly higher)

## Implementation Details

### Token Generation

Search tokens are generated from:
- Bookmark title
- Description
- URL
- Domain

The tokenization process creates:
- Full words
- Character n-grams for partial matching
- Word n-grams for phrase matching

### Database Operations

- **Create**: When a bookmark is created, index entries are created for each token
- **Update**: When a bookmark is updated, the old index entries are removed and new ones are created
- **Delete**: When a bookmark is deleted, all associated index entries are removed

### Index Maintenance

The system includes a "Rebuild Search Index" function that:
1. Gets all a user's bookmarks
2. Deletes existing index entries
3. Regenerates search tokens from bookmark content
4. Creates new index entries

## Future Improvements

1. **Token Frequency Analysis**: Weight tokens based on their rarity across the corpus
2. **Typo Tolerance**: Add fuzzy matching for common misspellings
3. **Synonyms**: Expand search tokens with common synonyms
4. **Phrase Boosting**: Give higher scores to bookmarks matching multi-word phrases
5. **User Behavior Learning**: Adjust scoring based on user click patterns

## Advantages Over Previous Approach

1. **Scalability**: No size limit issues since tokens are stored individually
2. **Performance**: Direct token-to-document mapping enables faster searches
3. **Flexibility**: Allows for complex scoring and relevance algorithms
4. **Maintainability**: Clearer separation of concerns between storage and search
