import authConfig from "@/auth.config";
import { TABLE_NAME } from "@/constants";
import { DynamoDBAdapter } from "@auth/dynamodb-adapter";
import NextAuth from "next-auth";
import { dynamoAuthDocClient } from "./lib/db-client";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DynamoDBAdapter(dynamoAuthDocClient, {
    tableName: TABLE_NAME,
    partitionKey: "PK",
    sortKey: "SK",
  }),
  session: { strategy: "jwt" },
  ...authConfig,
});
