# Authentication Debugging Guide

## Problem Encountered

Authentication was failing with the following error:

```
UnrecognizedClientException: The security token included in the request is invalid.
```

This typically indicates an IAM permissions issue or incorrect AWS configuration.

## Solutions Implemented

### 1. Updated DynamoDB Client Configuration

Modified the `db-client.ts` file to use the default AWS credentials provider chain, which will use the Lambda execution role when running in AWS Lambda:

```typescript
// Create the DynamoDB client for the AWS SDK v3
export const dynamoClient = new DynamoDBClient({
  region: process.env.AWS_REGION, // Required
  // In Lambda environment, use the default credentials provider chain
  // which will automatically use the Lambda execution role
  ...(process.env.DYNAMODB_ENDPOINT
    ? {
        endpoint: process.env.DYNAMODB_ENDPOINT,
      }
    : {}),
});
```

### 2. Enhanced NextAuth Configuration

Updated the NextAuth configuration to:

- Add debugging when not in production
- Explicitly specify the partition key and sort key for the DynamoDB adapter
- Add event handlers for better logging

```typescript
export const authOptions: NextAuthOptions = {
  debug: process.env.NODE_ENV !== "production",
  adapter: DynamoDBAdapter(dynamoAuthDocClient, {
    tableName: TABLE_NAME,
    partitionKey: "PK",
    sortKey: "SK",
  }),
  // ... other options
  events: {
    signIn: ({ user }) => {
      console.log("User signed in:", user?.email);
    },
  },
};
```

### 3. Explicit IAM Permissions

Added explicit IAM permissions to the SST configuration to ensure the Lambda functions have the necessary permissions to access DynamoDB:

```typescript
permissions: [
  {
    actions: [
      "dynamodb:GetItem",
      "dynamodb:UpdateItem",
      "dynamodb:DeleteItem",
      "dynamodb:PutItem",
      "dynamodb:Scan",
      "dynamodb:Query",
      "dynamodb:BatchGetItem",
      "dynamodb:BatchWriteItem"
    ],
    resources: [dynamoTable.arn, `${dynamoTable.arn}/*`],
  }
],
```

### 4. Authentication Debugging Endpoint

Created an authentication debugging endpoint at `/api/auth-debug` that provides information about:

- Authentication status
- Session information
- Environment configuration

This endpoint is useful for diagnosing authentication issues in both development and production environments.

## Other Considerations

1. **JWT Strategy**: Using JWT for session management reduces dependency on DynamoDB for session data

2. **Table Structure**: Ensure the DynamoDB table has the correct structure for the NextAuth adapter

3. **Environment Variables**: Ensure all required environment variables are correctly set in the deployment

4. **AWS Credentials**: When using SST and Lambda, rely on IAM roles instead of explicit credentials

5. **Middleware**: Updated to allow access to auth-related paths without authentication

## Next Steps

After deploying these changes:

1. Check the CloudWatch logs for any errors
2. Visit the `/api/auth-debug` endpoint to check authentication status
3. Try the sign-in flow and verify it works correctly
4. If issues persist, enable more verbose logging in NextAuth
