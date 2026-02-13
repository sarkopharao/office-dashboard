import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  sassOptions: {
    compiler: "modern",
    silenceDeprecations: ["legacy-js-api"],
  },
};

export default nextConfig;
