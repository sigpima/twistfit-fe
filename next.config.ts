import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  /* config options here */
  allowedDevOrigins: ["172.16.1.43"],
  output: "standalone",
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
