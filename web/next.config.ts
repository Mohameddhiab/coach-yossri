import type { NextConfig } from "next";

const _isProd = process.env.NODE_ENV === "production";
const serverApiUrl = process.env.SERVER_API_URL || "http://localhost:3001/api";
const backendOrigin = serverApiUrl.replace(/\/api\/?$/, "");

// force rebuild 2026-09-01
const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-XSS-Protection", value: "1; mode=block" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      `img-src 'self' data: blob: https://wger.de http://wger.de https://*.supabase.co https://*.supabase.in https://cdn.jsdelivr.net https://raw.githubusercontent.com http://localhost:* http://127.0.0.1:*`,
      "font-src 'self' data:",
      `connect-src 'self' http://localhost:* http://127.0.0.1:* ws://localhost:* ws://127.0.0.1:* wss://localhost:* wss://127.0.0.1:* https://*.supabase.co https://*.supabase.in http://backend:* http://backend:3001 ${backendOrigin} https://coach-yossri.onrender.com`,
      "frame-ancestors 'none'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  ...(process.env.DOCKER_BUILD ? { output: "standalone" } : {}),
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
