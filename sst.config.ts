// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="./.sst/platform/config.d.ts" />

// Utility function to determine if the stage is production
const isProd = (stage: string) => stage.startsWith("prod");

// Interface for additional email identities
interface Identity {
  name: string;
  sender: string;
}

export default $config({
  app(input) {
    return {
      name: "pinref-com",
      removal: isProd(input.stage) ? "retain" : "remove",
      home: "aws",
    };
  },

  // The main run function where all Pulumi resources are defined
  async run() {
    // Determine the domain name based on the deployment stage
    const domainName = isProd($app.stage) ? "pinref.com" : `${$app.stage}.pinref.com`;

    // Create DynamoDB table for bookmark management with single-table design
    const dynamoTable = new sst.aws.Dynamo("BookmarkTable", {
      fields: {
        PK: "string", // Partition Key: USER#id, BOOKMARK#id, CATEGORY#id, TAG#id
        SK: "string", // Sort Key: USER, BOOKMARK, CATEGORY, TAG
        GSI1PK: "string", // GSI1 Partition Key: USER#userId
        GSI1SK: "string", // GSI1 Sort Key: ENTITY#timestamp
        entityType: "string", // For filtering: USER, BOOKMARK, CATEGORY, TAG
        userId: "string", // For user data isolation
        searchTokens: "string", // For search functionality (stored as JSON)
      },
      primaryIndex: { hashKey: "PK", rangeKey: "SK" },
      globalIndexes: {
        GSI1: {
          hashKey: "GSI1PK",
          rangeKey: "GSI1SK",
          // This allows querying all entities for a user sorted by creation time
        },
        UserEntitiesIndex: {
          hashKey: "userId",
          rangeKey: "entityType",
          // This allows efficient querying of all entities by user and type
        },
        SearchIndex: {
          hashKey: "userId",
          rangeKey: "searchTokens",
          // This allows efficient searching by tokens for a specific user
        }
      },
      stream: "new-and-old-images" // For real-time updates and triggers
    });

    // Create a SES domain identity with DMARC policy for email sending
    const domainIdentity = new sst.aws.Email("NextEmail", {
      sender: domainName,
      dmarc: "v=DMARC1; p=quarantine; adkim=s; aspf=s;",
    });

    const emailIdentities: Identity[] = [{ name: "SupportEmail", sender: "support@pinref.com" }];

    const identities = [
      domainIdentity,
      ...emailIdentities.map((identity) =>
        isProd($app.stage)
          ? sst.aws.Email.get(identity.name, identity.sender)
          : new sst.aws.Email(identity.name, { sender: identity.sender }),
      ),
    ];

    // Deploy the Next.js application with specified domain
    const nextApp = new sst.aws.Nextjs("NextApp", {
      domain: {
        name: domainName,
        dns: sst.aws.dns({
          zone: "Z00860783LFS4Z4XIHT4N",
        }),
      },
      server: {
        architecture: "arm64",
      },
      environment: {
        DEPLOYMENT_ENV: $app.stage,
        DYNAMODB_TABLE_NAME: dynamoTable.name,
        ENCRYPTION_KEY: process.env.ENCRYPTION_KEY!,
        GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID!,
        GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET!,
        NEXTAUTH_URL: `https://${domainName}`,
        NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET!,
      },
      link: [dynamoTable, ...identities],
    });

    // Output important values
    return {
      dynamoTableName: dynamoTable.name,
      dynamoTableArn: dynamoTable.arn,
      appUrl: nextApp.url,
      domainName,
      stage: $app.stage,
    };
  },
});
