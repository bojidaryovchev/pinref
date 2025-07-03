declare namespace NodeJS {
  interface ProcessEnv {
    // Environment & Deployment
    NODE_ENV: "development" | "production" | "test";
    PORT: string;
    DEPLOYMENT_ENV: "dev" | "prod";
    DYNAMODB_TABLE_NAME: string;
    ENCRYPTION_KEY: string;
    GOOGLE_CLIENT_ID: string;
    GOOGLE_CLIENT_SECRET: string;
    AUTH_SECRET: string;
    AUTH_TRUST_HOST: string;
    NEXT_PUBLIC_APP_URL: string;
  }
}
