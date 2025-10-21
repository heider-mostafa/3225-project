import CompressionPlugin from 'compression-webpack-plugin'
import bundleAnalyzer from '@next/bundle-analyzer'

// Bundle Analyzer
const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
})

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
  
  // SWC minification is now enabled by default in Next.js 15
  
  // Experimental features temporarily disabled for stable deployment
  // experimental: {
  //   optimizeCss: true, // Can cause build issues in some environments
  // },
  
  images: {
    // 🚀 ENABLE IMAGE OPTIMIZATION for 30-50% faster loading
    // unoptimized: true, // REMOVED - this was preventing optimization
    formats: ['image/webp', 'image/avif'], // Modern formats
    deviceSizes: [640, 750, 828, 1080, 1200, 1920], // Responsive breakpoints
    minimumCacheTTL: 31536000, // Cache for 1 year
    domains: [
      process.env.NEXT_PUBLIC_SUPABASE_URL?.replace('https://', '') || '',
      'api.heygen.com',
      'storage.googleapis.com',
      'images.unsplash.com',
      'example.com',
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'api.heygen.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'example.com',
        pathname: '/**',
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
        // 🚀 PERFORMANCE: Cache static assets aggressively
        source: '/_next/static/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        // 🚀 PERFORMANCE: Cache optimized images
        source: '/_next/image/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        // Apply to all API routes with caching
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, POST, PUT, DELETE, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
          { key: 'Cache-Control', value: 'public, s-maxage=60, stale-while-revalidate=300' },
        ],
      },
    ];
  },
  
  // 🚀 ENHANCED Webpack configuration for maximum performance
  webpack: (config, { isServer, dev }) => {
    // Production optimizations
    if (!dev && !isServer) {
      // Simplified chunk splitting - fewer chunks for mobile compatibility
      config.optimization.splitChunks = {
        chunks: 'all',
        maxAsyncRequests: 5,
        maxInitialRequests: 3,
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
            priority: 10,
          },
          common: {
            minChunks: 2,
            priority: 5,
            reuseExistingChunk: true,
          },
        },
      };
      
      // 🚀 PERFORMANCE: Tree shaking
      config.optimization.usedExports = true;
      config.optimization.sideEffects = false;
      
      try {
        // Enhanced Brotli compression (include fonts)
        config.plugins.push(
          new CompressionPlugin({
            filename: '[path][base].br',
            algorithm: 'brotliCompress',
            test: /\.(js|css|html|svg|json|woff|woff2)$/,
            compressionOptions: { level: 11 },
            threshold: 8192,
            minRatio: 0.8,
          })
        );
        
        // Enhanced Gzip compression
        config.plugins.push(
          new CompressionPlugin({
            filename: '[path][base].gz',
            algorithm: 'gzip',
            test: /\.(js|css|html|svg|json|woff|woff2)$/,
            threshold: 8192,
            minRatio: 0.8,
          })
        );
      } catch (error) {
        console.warn('Compression plugin failed to load:', error.message);
      }
    }
    
    // 🚀 PERFORMANCE: Faster resolving
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': '.',
    };
    
    return config;
  },
}

export default withBundleAnalyzer(nextConfig)
