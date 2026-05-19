import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  // Conservative settings for a finance app — no caching of nav/HTML.
  // The hand-rolled public/sw.js handles all caching strategy.
  cacheOnFrontEndNav: false,
  aggressiveFrontEndNavCaching: false,
  reloadOnOnline: false,
  workboxOptions: {
    disableDevLogs: true,
    runtimeCaching: [],
  },
});

/** @type {import('next').NextConfig} */

const isProd = process.env.NODE_ENV === "production";

// Non-CSP security headers. CSP is generated per-request in middleware.ts
// (nonce-based, with x-nonce forwarded to Server Components).
//
// HSTS and `upgrade-insecure-requests` are PRODUCTION-ONLY: in local dev
// they would force HTTP requests to HTTPS, breaking access from another
// device over the LAN (e.g. testing on a phone at http://<lan-ip>:3000).
const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-DNS-Prefetch-Control", value: "off" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
  ...(isProd
    ? [
        {
          key: "Strict-Transport-Security",
          value: "max-age=63072000; includeSubDomains; preload",
        },
      ]
    : []),
];

const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
    ],
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default withPWA(nextConfig);
