'use client';
import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { Eye, AlertCircle, ImageIcon } from 'lucide-react';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  sizes?: string;
  quality?: number;
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
  onLoad?: () => void;
  onError?: () => void;
  // Lazy loading options
  lazy?: boolean;
  threshold?: number;
  // Performance tracking
  trackPerformance?: boolean;
  category?: string;
  // Mobile optimizations
  mobileOptimized?: boolean;
  webpFallback?: boolean;
  adaptiveQuality?: boolean;
}

interface ImagePerformanceMetrics {
  loadTime: number;
  size: string;
  category: string;
  timestamp: number;
}

const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  width = 800,
  height = 600,
  className = '',
  priority = false,
  sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
  quality = 85,
  mobileOptimized = true,
  webpFallback = true,
  adaptiveQuality = true,
  placeholder = 'blur',
  blurDataURL,
  onLoad,
  onError,
  lazy = true,
  threshold = 0.1,
  trackPerformance = false,
  category = 'property'
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(!lazy || priority);
  const [loadStartTime, setLoadStartTime] = useState<number | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [connectionSpeed, setConnectionSpeed] = useState<string>('4g');
  const imgRef = useRef<HTMLDivElement>(null);

  // Detect mobile device and connection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768 || /Mobi|Android/i.test(navigator.userAgent));
    };
    
    const checkConnection = () => {
      if ('connection' in navigator) {
        const conn = (navigator as any).connection;
        if (conn) {
          setConnectionSpeed(conn.effectiveType || '4g');
        }
      }
    };
    
    checkMobile();
    checkConnection();
    
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Adaptive quality based on device and connection
  const getAdaptiveQuality = () => {
    if (!adaptiveQuality) return quality;
    
    if (connectionSpeed === 'slow-2g' || connectionSpeed === '2g') {
      return Math.min(quality, 60);
    }
    if (connectionSpeed === '3g') {
      return Math.min(quality, 75);
    }
    if (isMobile && connectionSpeed === '4g') {
      return Math.min(quality, 80);
    }
    return quality;
  };

  // Mobile-optimized sizes
  const getMobileSizes = () => {
    if (!mobileOptimized) return sizes;
    
    if (category === 'property-grid') {
      return '(max-width: 480px) 100vw, (max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw';
    }
    if (category === 'property-hero') {
      return '(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 60vw';
    }
    if (category === 'property-thumbnail') {
      return '(max-width: 480px) 150px, (max-width: 768px) 200px, 250px';
    }
    return sizes;
  };

  // Generate optimized blur placeholder
  const generateBlurDataURL = (w: number, h: number) => {
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const gradient = ctx.createLinearGradient(0, 0, w, h);
      gradient.addColorStop(0, '#f3f4f6');
      gradient.addColorStop(1, '#e5e7eb');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, w, h);
    }
    return canvas.toDataURL();
  };

  const defaultBlurDataURL = blurDataURL || generateBlurDataURL(40, 30);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (!lazy || priority || !imgRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          setLoadStartTime(Date.now());
          observer.disconnect();
        }
      },
      { threshold, rootMargin: '50px' }
    );

    observer.observe(imgRef.current);

    return () => observer.disconnect();
  }, [lazy, priority, threshold]);

  // Performance tracking
  const trackImagePerformance = (metrics: Partial<ImagePerformanceMetrics>) => {
    if (!trackPerformance || typeof window === 'undefined') return;

    try {
      const performanceData = {
        ...metrics,
        timestamp: Date.now(),
        category,
        url: src
      };

      // Store in session storage for admin analytics
      const existingData = sessionStorage.getItem('image_performance') || '[]';
      const allData = JSON.parse(existingData);
      allData.push(performanceData);
      
      // Keep only last 100 entries
      if (allData.length > 100) {
        allData.splice(0, allData.length - 100);
      }
      
      sessionStorage.setItem('image_performance', JSON.stringify(allData));
      
      console.log(`📊 Image Performance: ${metrics.loadTime}ms for ${category} image`);
    } catch (error) {
      console.warn('Failed to track image performance:', error);
    }
  };

  const handleLoad = () => {
    setIsLoaded(true);
    
    if (loadStartTime && trackPerformance) {
      const loadTime = Date.now() - loadStartTime;
      trackImagePerformance({
        loadTime,
        size: `${width}x${height}`,
        category
      });
    }
    
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
    console.error(`Failed to load image: ${src}`);
    onError?.();
  };

  // Don't render until in view (for lazy loading)
  if (!isInView) {
    return (
      <div
        ref={imgRef}
        className={`bg-gray-200 animate-pulse flex items-center justify-center ${className}`}
        style={{ width, height }}
      >
        <ImageIcon className="w-8 h-8 text-gray-400" />
      </div>
    );
  }

  // Error state
  if (hasError) {
    return (
      <div
        className={`bg-gray-100 border-2 border-dashed border-gray-300 flex flex-col items-center justify-center ${className}`}
        style={{ width, height }}
      >
        <AlertCircle className="w-8 h-8 text-gray-400 mb-2" />
        <span className="text-sm text-gray-500">Image failed to load</span>
      </div>
    );
  }

  return (
    <div ref={imgRef} className={`relative overflow-hidden ${className}`}>
      {/* Loading skeleton */}
      {!isLoaded && (
        <div
          className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center"
          style={{ width, height }}
        >
          <ImageIcon className="w-8 h-8 text-gray-400" />
        </div>
      )}
      
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        priority={priority}
        quality={getAdaptiveQuality()}
        sizes={getMobileSizes()}
        placeholder={placeholder}
        blurDataURL={defaultBlurDataURL}
        onLoad={handleLoad}
        onError={handleError}
        className={`transition-opacity duration-300 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        style={{
          objectFit: 'cover',
          width: '100%',
          height: '100%',
          // Mobile-specific optimizations
          ...(isMobile && {
            imageRendering: 'optimizeQuality',
            WebkitTransform: 'translateZ(0)', // Force hardware acceleration
          })
        }}
        // Add WebP support with fallback
        {...(webpFallback && {
          loading: lazy && !priority ? 'lazy' : 'eager'
        })}
      />
      
      {/* Loading indicator */}
      {!isLoaded && !hasError && (
        <div className="absolute top-2 right-2">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
        </div>
      )}
      
      {/* Performance indicator (dev mode) */}
      {process.env.NODE_ENV === 'development' && isLoaded && trackPerformance && (
        <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
          <Eye className="w-3 h-3 inline mr-1" />
          {category}
        </div>
      )}
    </div>
  );
};

export default OptimizedImage;

// Hook for accessing image performance data
export const useImagePerformanceData = () => {
  const [performanceData, setPerformanceData] = useState<ImagePerformanceMetrics[]>([]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const data = sessionStorage.getItem('image_performance');
      if (data) {
        setPerformanceData(JSON.parse(data));
      }
    } catch (error) {
      console.warn('Failed to load image performance data:', error);
    }
  }, []);

  const clearPerformanceData = () => {
    sessionStorage.removeItem('image_performance');
    setPerformanceData([]);
  };

  const getAverageLoadTime = (category?: string) => {
    const filteredData = category 
      ? performanceData.filter(d => d.category === category)
      : performanceData;
    
    if (filteredData.length === 0) return 0;
    
    return filteredData.reduce((acc, d) => acc + d.loadTime, 0) / filteredData.length;
  };

  return {
    performanceData,
    clearPerformanceData,
    getAverageLoadTime,
    totalImages: performanceData.length
  };
};