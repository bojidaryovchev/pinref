import AuthProviders from "@/components/auth-providers";
import Providers from "@/components/providers";
import { SITE_DESCRIPTION, SITE_TITLE } from "@/constants";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import type React from "react";
import { PropsWithChildren } from "react";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
};

const RootLayout: React.FC<PropsWithChildren> = ({ children }) => {
  return (
    <>
      <html lang="en">
        <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
          <AuthProviders>
            <Providers>{children}</Providers>
          </AuthProviders>
        </body>
      </html>
    </>
  );
};

export default RootLayout;
