/**
 * PDF.js Configuration for Next.js 14+ Browser Environment
 * Uses webpack.mjs approach to avoid CORS issues
 */

// Use the Next.js 14 compatible import
export async function loadPDFJS() {
  if (typeof window === 'undefined') {
    // Server-side environment - use legacy build
    const pdfjsLib = await import('pdfjs-dist');
    return pdfjsLib;
  } else {
    // Client-side environment - use webpack.mjs build for Next.js 14
    const pdfjsLib = await import('pdfjs-dist/webpack.mjs');
    
    // Configure worker using import.meta.url approach (no CORS issues)
    if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
      // Use the webpack approach that bundles the worker
      pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
        'pdfjs-dist/build/pdf.worker.min.mjs',
        import.meta.url
      ).toString();
      
      console.log('📄 PDF.js configured for Next.js 14 browser environment');
      console.log(`   Worker configured via import.meta.url`);
      console.log(`   PDF.js version: ${pdfjsLib.version || 'webpack-bundled'}`);
    }
    
    return pdfjsLib;
  }
}

// Legacy export for compatibility
export const pdfjsLib = {
  getDocument: async (...args: any[]) => {
    const pdfjs = await loadPDFJS();
    return pdfjs.getDocument(...args);
  },
  GlobalWorkerOptions: {} as any,
  version: '5.4.149'
};