/**
 * Centralized DynamoDB client configuration
 * This file creates and exports shared DynamoDB client instances
 * to be used throughout the application
 */

import { DynamoDB, DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocument } from "@aws-sdk/lib-dynamodb";

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

// Create the v3 Document client for the main application
export const dynamoDocClient = DynamoDBDocument.from(dynamoClient);

// Create the DynamoDB client for NextAuth (using v2 compatibility)
export const dynamoAuthClient = new DynamoDB({
  region: process.env.AWS_REGION, // Required
  // In Lambda environment, use the default credentials provider chain
  // which will automatically use the Lambda execution role
  ...(process.env.DYNAMODB_ENDPOINT
    ? {
        endpoint: process.env.DYNAMODB_ENDPOINT,
      }
    : {}),
});

// Create the Document client for NextAuth adapter
export const dynamoAuthDocClient = DynamoDBDocument.from(dynamoAuthClient);
