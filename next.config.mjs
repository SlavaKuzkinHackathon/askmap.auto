import withPWA from 'next-pwa';

/** @type {import('next-pwa').PWAConfig} */
const pwaConfig = {
  dest: 'public', 
  register: true, 
  skipWaiting: true, 
  disable: process.env.NODE_ENV === 'development',
};

/** @type {import('next').NextConfig} */
const nextConfig = {
   experimental: {
    serverComponentsExternalPackages: ['undici'],
  },
  transpilePackages: ['cheerio', 'undici'],
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: '89.108.113.41', 
      },
      {
        protocol: 'https',
        hostname: 'askmap.ru',
      },
    ],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
    webpack(config) {
    config.module.rules.push({
      test: /\.svg$/i,
      issuer: /\.[jt]sx?$/,
      use: ['@svgr/webpack'],
    });

    return config;
  },
};

export default withPWA(pwaConfig)(nextConfig);

