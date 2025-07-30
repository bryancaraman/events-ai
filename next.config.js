/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  webpack: (config, { isServer }) => {
    // Handle undici module parsing issues
    config.externals = config.externals || [];
    
    if (isServer) {
      config.externals.push({
        'undici': 'commonjs undici',
      });
    }

    // Add fallbacks for node modules
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      crypto: false,
    };

    return config;
  },
}

module.exports = nextConfig 