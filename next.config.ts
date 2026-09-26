import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  /* config options here */
  allowedDevOrigins: ["172.16.1.43"],
  output: "standalone",
  async rewrites() {
    // The only way the browser reaches the backend: it stays private
    // (BACKEND_INTERNAL_URL, e.g. http://backend:8000 in docker), never
    // exposed on its own port/domain. See frontend/lib/apiClient.ts.
    const backendInternalUrl = process.env.BACKEND_INTERNAL_URL ?? "http://localhost:8000";
    return [
      {
        source: "/api/:path*",
        destination: `${backendInternalUrl}/:path*`,
      },
    ];
  },
  images: {
    // Static images under public/ are treated as immutable (see headers()
    // below), so the optimizer's cached variants can live just as long.
    minimumCacheTTL: 31536000,
  },
  async headers() {
    return [
      {
        // Static assets in public/ have no cache-busting filename, so only
        // add new files under a new name rather than overwriting one in place.
        source: "/:path*.:ext(jpg|jpeg|png|webp|avif|gif|svg|ico|woff|woff2)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
};

export default withNextIntl(nextConfig);
