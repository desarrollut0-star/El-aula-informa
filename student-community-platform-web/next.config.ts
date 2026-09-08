import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // La API vive aparte (Cloudflare Workers). En Vercel no se usan API routes
  // propias salvo alguna excepción puntual documentada en app/api/.
};

export default nextConfig;
