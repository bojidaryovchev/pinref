"use client";

import { TOASTER_DURATION_MS } from "@/constants";
import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";
import { Toaster } from "react-hot-toast";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
        {children}
        <Toaster
          toastOptions={{
            style: {
              fontSize: "0.875rem",
            },
            duration: TOASTER_DURATION_MS,
          }}
        />
      </ThemeProvider>
    </SessionProvider>
  );
}
