"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { SITE_DESCRIPTION, SITE_TITLE } from "@/constants";
import { Loader2 } from "lucide-react";
import { signIn, useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import React, { Suspense, useState } from "react";

/**
 * Auth page content component that uses search params
 */
const AuthContent: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  /**
   * Handle Google sign in
   */
  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      // Use returnUrl parameter if available, otherwise redirect to home
      const returnUrl = searchParams.get("returnUrl") || "/";
      await signIn("google", { callbackUrl: returnUrl });
    } catch (error) {
      console.error("Sign in error:", error);
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md px-8">
      <Card className="w-full">
        <CardHeader className="text-center">
          <div className="mb-4 flex justify-center">
            {/* Logo placeholder */}
            <div className="bg-primary text-primary-foreground flex h-12 w-12 items-center justify-center rounded-full font-bold">
              Pin
            </div>
          </div>
          <CardTitle className="text-2xl">{SITE_TITLE}</CardTitle>
          <CardDescription>{SITE_DESCRIPTION}</CardDescription>

          {error && (
            <div className="bg-destructive/10 text-destructive mt-4 rounded p-2 text-sm">
              Authentication error. Please try again.
            </div>
          )}
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Button
              className="flex w-full items-center justify-center space-x-2"
              onClick={handleGoogleSignIn}
              size="lg"
              variant="outline"
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  height="24"
                  viewBox="0 0 24 24"
                  width="24"
                  className="mr-2 h-5 w-5"
                >
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                  <path d="M1 1h22v22H1z" fill="none" />
                </svg>
              )}
              <span>{isLoading ? "Signing in..." : "Sign in with Google"}</span>
            </Button>
          </div>
        </CardContent>
        <CardFooter className="text-muted-foreground text-center text-sm">
          <p className="w-full">By signing in, you agree to our terms and privacy policy.</p>
        </CardFooter>
      </Card>
    </div>
  );
};

/**
 * Authentication page for Pinref
 */
export default function AuthPage() {
  const { status } = useSession();

  // If already authenticated, show loading spinner
  if (status === "authenticated") {
    return (
      <div className="bg-background flex h-screen flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="text-muted-foreground mt-4">Redirecting to dashboard...</p>
      </div>
    );
  }

  return (
    <div className="bg-background flex h-screen flex-col items-center justify-center">
      <Suspense
        fallback={
          <div className="w-full max-w-md px-8">
            <Card className="w-full">
              <CardHeader className="text-center">
                <div className="mb-4 flex justify-center">
                  <div className="bg-primary text-primary-foreground flex h-12 w-12 items-center justify-center rounded-full font-bold">
                    Pin
                  </div>
                </div>
                <CardTitle className="text-2xl">{SITE_TITLE}</CardTitle>
                <CardDescription>{SITE_DESCRIPTION}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center p-4">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              </CardContent>
            </Card>
          </div>
        }
      >
        <AuthContent />
      </Suspense>
    </div>
  );
}
