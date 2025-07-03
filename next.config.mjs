import CompressionPlugin from 'compression-webpack-plugin'

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // Enable basic compression (safe change)
  compress: true,
  
  images: {
    unoptimized: true,
    domains: [
      process.env.NEXT_PUBLIC_SUPABASE_URL?.replace('https://', '') || '',
      'api.heygen.com',
      'storage.googleapis.com',
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'api.heygen.com',
      },
    ],
  },
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_N8N_URL: process.env.NEXT_PUBLIC_N8N_URL,
    N8N_API_KEY: process.env.N8N_API_KEY,
    HEYGEN_API_KEY: process.env.HEYGEN_API_KEY,
    HEYGEN_API_URL: process.env.HEYGEN_API_URL,
  },
  async headers() {
    return [
      {
        // Apply to all API routes
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, POST, PUT, DELETE, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
        ],
      },
    ];
  },
  
  // Webpack configuration for compression (ES module)
  webpack: (config, { isServer, dev }) => {
    // Only enable compression in production builds for client-side bundles
    if (!dev && !isServer) {
      try {
        // Add Brotli compression
        config.plugins.push(
          new CompressionPlugin({
            filename: '[path][base].br',
            algorithm: 'brotliCompress',
            test: /\.(js|css|html|svg|json)$/,
            compressionOptions: {
              level: 11,
            },
            threshold: 8192, // Only compress files larger than 8KB
            minRatio: 0.8, // Only compress if we get at least 20% reduction
          })
        );
        
        // Add Gzip compression as fallback
        config.plugins.push(
          new CompressionPlugin({
            filename: '[path][base].gz',
            algorithm: 'gzip',
            test: /\.(js|css|html|svg|json)$/,
            threshold: 8192,
            minRatio: 0.8,
          })
        );
      } catch (error) {
        // If compression fails, don't break the build
        console.warn('Compression plugin failed to load:', error.message);
      }
    }
    
    return config;
  },
}

export default nextConfig
