"use client";

import { TOASTER_DURATION_MS } from "@/constants";
import { ThemeProvider } from "next-themes";
import type React from "react";
import { PropsWithChildren } from "react";
import { Toaster } from "react-hot-toast";

const Providers: React.FC<PropsWithChildren> = ({ children }) => {
  return (
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
  );
};

export default Providers;
