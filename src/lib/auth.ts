import { TABLE_NAME } from "@/constants";
import { DynamoDBAdapter } from "@next-auth/dynamodb-adapter";
import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { dynamoAuthDocClient } from "./db-client";

export const authOptions: NextAuthOptions = {
  adapter: DynamoDBAdapter(dynamoAuthDocClient, {
    tableName: TABLE_NAME,
  }),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    jwt: async ({ token, user, account }) => {
      // Initial sign in
      if (account && user) {
        return {
          ...token,
          id: user.id,
          accessToken: account.access_token,
        };
      }
      // Return previous token if the access token has not expired yet
      return token;
    },
    session: ({ session, token }) => ({
      ...session,
      user: {
        ...session.user,
        id: token.sub || token.id,
      },
    }),
  },
};
