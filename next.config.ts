import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // pdf-parse/mammoth do Node-native file/module resolution that the
  // default server bundler trips on — keep them as real dependencies
  // instead of being bundled.
  serverExternalPackages: ["pdf-parse", "mammoth"],
};

export default nextConfig;
