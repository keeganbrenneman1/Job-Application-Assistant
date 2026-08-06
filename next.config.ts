import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // mammoth does Node-native file/module resolution that the default
  // server bundler trips on — keep it as a real dependency instead of
  // being bundled.
  serverExternalPackages: ["mammoth"],
};

export default nextConfig;
