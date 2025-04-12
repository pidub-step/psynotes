import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep reactStrictMode false as per your current setting to prevent double-rendering
  reactStrictMode: false,
  
  // Add Supabase domain to allowed image domains for Next.js Image component
  images: {
    domains: [
      process.env.NEXT_PUBLIC_SUPABASE_URL?.replace('https://', '').split('/')[0] || '',
    ],
  },

  // Enable standalone output for better Vercel deployment
  output: 'standalone',

  // Add security headers for production
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ];
  },

  // Remove console logs in production for better performance
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  }
};

export default nextConfig;
