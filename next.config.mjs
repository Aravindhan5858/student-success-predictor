import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ["sqlite3"],
  webpack: (config) => {
    config.resolve.alias["react-router-dom"] = path.resolve(
      __dirname,
      "lib/react-router-dom-compat.jsx",
    );
    return config;
  },
};

export default nextConfig;
