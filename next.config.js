/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true
  },
  eslint: {
    ignoreDuringBuilds: true
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Giả lập các module Node.js cho browser
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
    
    // Xử lý cho các module ESM
    config.resolve.alias = {
      ...config.resolve.alias,
      'encoding': false,
    };
    
    return config;
  },
};
export default nextConfig;