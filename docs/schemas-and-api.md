# Schema and API Documentation

This document describes all schemas and API endpoints used in the Pinref application.

## Schemas

### Bookmark Schema

- `createBookmarkSchema`: Used when creating a new bookmark

  - `url`: String (required, URL format)
  - `categoryId`: String (optional)
  - `tagIds`: Array of Strings (optional)

- `updateBookmarkSchema`: Used when updating an existing bookmark

  - `title`: String (optional)
  - `description`: String (optional)
  - `categoryId`: String (optional)
  - `tagIds`: Array of Strings (optional)
  - `isFavorite`: Boolean (optional)

- `bookmarkSchema`: Represents a complete bookmark entity

  - `id`: String
  - `userId`: String
  - `url`: String
  - `title`: String (optional)
  - `description`: String (optional)
  - `image`: String (optional)
  - `favicon`: String (optional)
  - `domain`: String (optional)
  - `categoryId`: String (optional)
  - `tagIds`: Array of Strings (optional)
  - `isFavorite`: Boolean (optional)
  - `createdAt`: String (ISO date)
  - `updatedAt`: String (optional, ISO date)

- `bookmarkQuerySchema`: Used for filtering bookmarks
  - `limit`: Number (default: 20)
  - `categoryId`: String (optional)
  - `tagId`: String (optional)
  - `isFavorite`: Boolean (optional)
  - `query`: String (optional)

### Category Schema

- `createCategorySchema`: Used when creating a new category

  - `name`: String (required, max 50 chars)
  - `icon`: String (required)
  - `color`: String (required)

- `updateCategorySchema`: Used when updating an existing category

  - `name`: String (optional, max 50 chars)
  - `icon`: String (optional)
  - `color`: String (optional)

- `categorySchema`: Represents a complete category entity
  - `id`: String
  - `userId`: String
  - `name`: String
  - `icon`: String
  - `color`: String
  - `createdAt`: String (ISO date)
  - `updatedAt`: String (optional, ISO date)
  - `_count`: Object (optional)
    - `bookmarks`: Number

### Tag Schema

- `createTagSchema`: Used when creating a new tag

  - `name`: String (required, max 30 chars)
  - `icon`: String (optional)

- `updateTagSchema`: Used when updating an existing tag

  - `name`: String (optional, max 30 chars)
  - `icon`: String (optional)

- `tagSchema`: Represents a complete tag entity
  - `id`: String
  - `userId`: String
  - `name`: String
  - `icon`: String (optional)
  - `createdAt`: String (ISO date)
  - `updatedAt`: String (optional, ISO date)
  - `_count`: Object (optional)
    - `bookmarks`: Number

### User Schema

- `userSchema`: Represents a user entity

  - `id`: String
  - `email`: String (email format)
  - `name`: String
  - `image`: String (optional)
  - `createdAt`: String (ISO date)
  - `updatedAt`: String (ISO date)

- `userSettingsSchema`: Represents user settings

  - `userId`: String
  - `theme`: Enum ("light", "dark", "system"), default "system"
  - `defaultView`: Enum ("grid", "list"), default "grid"
  - `bookmarksPerPage`: Number (positive integer), default 20

- `updateUserSettingsSchema`: Used when updating user settings
  - `theme`: Enum ("light", "dark", "system") (optional)
  - `defaultView`: Enum ("grid", "list") (optional)
  - `bookmarksPerPage`: Number (optional)

### Contact Form Schema

- `contactFormSchema`: Used for contact form submissions
  - `name`: String (required, max 100 chars)
  - `email`: String (required, email format)
  - `message`: String (required, min 10 chars, max 1000 chars)

## API Endpoints

### Bookmarks

- `GET /api/bookmarks`: Get all bookmarks (with optional filtering)

  - Query parameters: `limit`, `category`, `tag`, `favorite`, `q`
  - Returns: Array of bookmarks and pagination info

- `POST /api/bookmarks`: Create a new bookmark

  - Body: `createBookmarkSchema`
  - Returns: Created bookmark

- `GET /api/bookmarks/:id`: Get a single bookmark

  - Returns: Bookmark or 404

- `PUT /api/bookmarks/:id`: Update a bookmark

  - Body: `updateBookmarkSchema`
  - Returns: Updated bookmark

- `DELETE /api/bookmarks/:id`: Delete a bookmark
  - Returns: Success message

### Categories

- `GET /api/categories`: Get all categories

  - Returns: Array of categories

- `POST /api/categories`: Create a new category

  - Body: `createCategorySchema`
  - Returns: Created category

- `GET /api/categories/:id`: Get a single category

  - Returns: Category or 404

- `PUT /api/categories/:id`: Update a category

  - Body: `updateCategorySchema`
  - Returns: Updated category

- `DELETE /api/categories/:id`: Delete a category
  - Returns: Success message

### Tags

- `GET /api/tags`: Get all tags

  - Returns: Array of tags

- `POST /api/tags`: Create a new tag

  - Body: `createTagSchema`
  - Returns: Created tag

- `GET /api/tags/:id`: Get a single tag

  - Returns: Tag or 404

- `PUT /api/tags/:id`: Update a tag

  - Body: `updateTagSchema`
  - Returns: Updated tag

- `DELETE /api/tags/:id`: Delete a tag
  - Returns: Success message

### User Settings

- `GET /api/user/settings`: Get user settings

  - Returns: User settings or default settings

- `PUT /api/user/settings`: Update user settings
  - Body: `updateUserSettingsSchema`
  - Returns: Updated user settings

### Contact

- `POST /api/contact`: Submit contact form
  - Body: `contactFormSchema`
  - Returns: Success message

## Data Flow

1. User interacts with UI components
2. Components use SWR hooks from `use-api.ts`
3. Hooks call API functions from `API.ts`
4. API functions call endpoints and return data
5. Data is validated using Zod schemas
6. DynamoDB functions in `dynamodb.ts` handle database operations
7. Encryption/decryption is applied as needed using `encryption.ts`
