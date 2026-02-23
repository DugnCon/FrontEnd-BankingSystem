// next.config.js  (giữ tên .js, nhưng dùng ES module syntax)

import withSerwistInit from '@serwist/next';

// Config Next.js gốc của bạn
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Giả lập module Node.js cho browser
      config.resolve.fallback = {
        fs: false,
        encoding: false,
        path: false,
        crypto: false,
        util: false,
        stream: false,
        http: false,
        https: false,
        zlib: false,
        net: false,
        tls: false,
        child_process: false,
        os: false,
        'node-fetch': false,
      };
    }

    // Xử lý ESM alias
    config.resolve.alias = {
      ...config.resolve.alias,
      'encoding': false,
    };

    return config;
  },
};

// Wrap với Serwist (PWA support)
const withSerwist = withSerwistInit({
  swSrc: 'app/sw.ts',
  swDest: 'public/sw.js',
  disable: process.env.NODE_ENV === 'development',
  cacheOnNavigation: true,  // Optional: cache navigation tốt hơn cho banking app
  // Nếu cần fallback page offline, thêm sau:
  // additionalPrecacheEntries: [{ url: '/offline', revision: null }],
});

export default withSerwist(nextConfig);