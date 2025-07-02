// DynamoDB Table Schema Definition
// This would be used with AWS CDK, CloudFormation, or Terraform

export const TABLE_SCHEMA = {
  TableName: "bookmark-manager",
  BillingMode: "PAY_PER_REQUEST", // or PROVISIONED with ReadCapacityUnits/WriteCapacityUnits

  AttributeDefinitions: [
    {
      AttributeName: "PK",
      AttributeType: "S",
    },
    {
      AttributeName: "SK",
      AttributeType: "S",
    },
    {
      AttributeName: "GSI1PK",
      AttributeType: "S",
    },
    {
      AttributeName: "GSI1SK",
      AttributeType: "S",
    },
  ],

  KeySchema: [
    {
      AttributeName: "PK",
      KeyType: "HASH",
    },
    {
      AttributeName: "SK",
      KeyType: "RANGE",
    },
  ],

  GlobalSecondaryIndexes: [
    {
      IndexName: "GSI1",
      KeySchema: [
        {
          AttributeName: "GSI1PK",
          KeyType: "HASH",
        },
        {
          AttributeName: "GSI1SK",
          KeyType: "RANGE",
        },
      ],
      Projection: {
        ProjectionType: "ALL",
      },
    },
  ],

  StreamSpecification: {
    StreamEnabled: true,
    StreamViewType: "NEW_AND_OLD_IMAGES",
  },

  PointInTimeRecoverySpecification: {
    PointInTimeRecoveryEnabled: true,
  },

  SSESpecification: {
    SSEEnabled: true,
  },
};

// CloudFormation template example
export const CLOUDFORMATION_TEMPLATE = `
AWSTemplateFormatVersion: '2010-09-09'
Description: 'DynamoDB table for bookmark manager'

Resources:
  BookmarkManagerTable:
    Type: AWS::DynamoDB::Table
    Properties:
      TableName: bookmark-manager
      BillingMode: PAY_PER_REQUEST
      AttributeDefinitions:
        - AttributeName: PK
          AttributeType: S
        - AttributeName: SK
          AttributeType: S
        - AttributeName: GSI1PK
          AttributeType: S
        - AttributeName: GSI1SK
          AttributeType: S
      KeySchema:
        - AttributeName: PK
          KeyType: HASH
        - AttributeName: SK
          KeyType: RANGE
      GlobalSecondaryIndexes:
        - IndexName: GSI1
          KeySchema:
            - AttributeName: GSI1PK
              KeyType: HASH
            - AttributeName: GSI1SK
              KeyType: RANGE
          Projection:
            ProjectionType: ALL
      StreamSpecification:
        StreamEnabled: true
        StreamViewType: NEW_AND_OLD_IMAGES
      PointInTimeRecoverySpecification:
        PointInTimeRecoveryEnabled: true
      SSESpecification:
        SSEEnabled: true

Outputs:
  TableName:
    Description: 'DynamoDB table name'
    Value: !Ref BookmarkManagerTable
    Export:
      Name: !Sub '\${AWS::StackName}-TableName'
  
  TableArn:
    Description: 'DynamoDB table ARN'
    Value: !GetAtt BookmarkManagerTable.Arn
    Export:
      Name: !Sub '\${AWS::StackName}-TableArn'
`;
