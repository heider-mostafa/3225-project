'use client'

import { useEffect } from 'react'

export function MobileDebug() {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Create error display div
      const errorDiv = document.createElement('div');
      errorDiv.id = 'mobile-debug';
      errorDiv.style.cssText = `
        position: fixed; 
        top: 0; 
        left: 0; 
        right: 0; 
        background: red; 
        color: white; 
        padding: 10px; 
        z-index: 9999; 
        font-size: 12px;
        max-height: 200px;
        overflow-y: auto;
        display: none;
      `;
      document.body.appendChild(errorDiv);
      
      const showError = (message: string) => {
        errorDiv.style.display = 'block';
        errorDiv.innerHTML += '<div>' + new Date().toLocaleTimeString() + ': ' + message + '</div>';
      };
      
      // Catch unhandled promise rejections
      window.addEventListener('unhandledrejection', function(event) {
        showError('Promise Error: ' + (event.reason?.message || event.reason));
        event.preventDefault();
      });
      
      // Catch JavaScript errors  
      window.addEventListener('error', function(event) {
        showError('JS Error: ' + (event.error?.message || event.message));
      });
      
      // Initial status
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      if (isMobile) {
        showError('Mobile detected. Watching for errors...');
        
        // Show environment status
        showError('Env check: Supabase URL = ' + (process.env.NEXT_PUBLIC_SUPABASE_URL ? 'OK' : 'MISSING'));
      }
    }
  }, []);
  
  return null; // This component doesn't render anything
}