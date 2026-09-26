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
    //
    // Verified against a real container: with output "standalone", this
    // function only runs once during `next build` — the resolved
    // destination gets baked into the standalone build's routes manifest,
    // and BACKEND_INTERNAL_URL set later at `docker run`/compose time has
    // no effect. The Dockerfile never sets it during build, so the
    // fallback below is what actually ships in the image — keep it equal
    // to the docker-compose service name, not a "generic" default.
    // (`npm run dev` doesn't have this problem — it re-evaluates
    // next.config.ts, and therefore this env var, on every dev server start.)
    const backendInternalUrl = process.env.BACKEND_INTERNAL_URL ?? "http://backend:8000";
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
