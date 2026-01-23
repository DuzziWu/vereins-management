import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY', // Verhindert Clickjacking
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff', // Verhindert MIME-Type Sniffing
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains', // HSTS
          },
        ],
      },
    ]
  },
};

export default nextConfig;
