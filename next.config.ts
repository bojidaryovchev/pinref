import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
        port: "",
        pathname: "**",
      },
    ],
    domains: [
      // Common favicon domains
      "www.google.com",
      "www.youtube.com",
      "github.com",
      "twitter.com",
      "facebook.com",
      "linkedin.com",
      "amazon.com",
      "wikipedia.org",
      "medium.com",
      "dev.to",
      "cdn.jsdelivr.net",
      "unpkg.com",
    ],
  },
};

export default nextConfig;
