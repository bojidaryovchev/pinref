import authConfig from "@/auth.config";
import { TABLE_NAME } from "@/constants";
import { DynamoDBAdapter } from "@next-auth/dynamodb-adapter";
import NextAuth, { NextAuthOptions } from "next-auth";
import { dynamoAuthDocClient } from "./db-client";

export const authOptions: NextAuthOptions = {
  adapter: DynamoDBAdapter(dynamoAuthDocClient, {
    tableName: TABLE_NAME,
    partitionKey: "PK",
    sortKey: "SK",
  }),
  providers: authConfig.providers,
  pages: authConfig.pages,
  callbacks: authConfig.callbacks,
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  debug: process.env.NODE_ENV !== "production",
  events: {
    signIn: ({ user }) => {
      console.log("User signed in:", user?.email);
    },
  },
};

// Export NextAuth v4 handler
const auth = NextAuth(authOptions);
export default auth;
