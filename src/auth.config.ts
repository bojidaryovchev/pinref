import type { NextAuthConfig } from "next-auth";
import GoogleProvider, { GoogleProfile } from "next-auth/providers/google";

// Extend the session type to include user ID
declare module "next-auth" {
  interface Session {
    user: {
      id?: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}

const providers: NextAuthConfig["providers"] = [
  GoogleProvider({
    clientId: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    // Include profile information needed for our app
    profile(profile: GoogleProfile) {
      return {
        id: profile.sub,
        name: profile.name,
        email: profile.email,
        image: profile.picture,
      };
    },
    authorization: {
      params: {
        prompt: "select_account",
      },
    },
  }),
];

const pages: NextAuthConfig["pages"] = {
  signIn: "/auth",
  error: "/auth?error=true",
};

const callbacks: NextAuthConfig["callbacks"] = {
  async jwt({ token, user }) {
    if (user) {
      token.id = user.id;
    }
    return token;
  },

  async session({ session, token }) {
    if (session.user) {
      session.user.id = token.id as string;
    }
    return session;
  },
};

/**
 * Authentication configuration for NextAuth v5
 */
export default { providers, pages, callbacks } satisfies NextAuthConfig;
