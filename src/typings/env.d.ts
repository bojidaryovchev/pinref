declare namespace NodeJS {
  interface ProcessEnv {
    // Environment & Deployment
    NODE_ENV: "development" | "production" | "test";
    PORT: string;
    DEPLOYMENT_ENV: "dev" | "prod";
    AWS_REGION: string;
    AWS_ACCESS_KEY_ID: string;
    AWS_SECRET_ACCESS_KEY: string;
    DYNAMODB_TABLE_NAME: string;
    ENCRYPTION_KEY: string;
    GOOGLE_CLIENT_ID: string;
    GOOGLE_CLIENT_SECRET: string;
    NEXTAUTH_URL: string;
    NEXTAUTH_SECRET: string;
  }
}
