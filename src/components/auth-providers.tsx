import { auth } from "@/auth";
import { SessionProvider } from "next-auth/react";
import React, { PropsWithChildren } from "react";

const AuthProviders: React.FC<PropsWithChildren> = async ({ children }) => {
  const session = await auth();

  return <SessionProvider session={session}>{children}</SessionProvider>;
};

export default AuthProviders;
