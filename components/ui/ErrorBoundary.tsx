'use client';
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, Bug, Clock } from 'lucide-react';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string;
  retryCount: number;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  enableRetry?: boolean;
  maxRetries?: number;
  resetOnPropsChange?: boolean;
  resetKeys?: Array<string | number>;
  level?: 'page' | 'component' | 'critical';
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private resetTimeoutId: number | null = null;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    const errorId = `ERR_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    return {
      hasError: true,
      error,
      errorId
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo
    });

    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('🚨 Error Boundary caught an error:', {
        error,
        errorInfo,
        errorId: this.state.errorId,
        level: this.props.level || 'component'
      });
    }

    // Call custom error handler
    this.props.onError?.(error, errorInfo);

    // Log error to analytics/monitoring service in production
    this.logErrorToService(error, errorInfo);
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    const { resetOnPropsChange, resetKeys } = this.props;
    const { hasError } = this.state;

    if (hasError && resetOnPropsChange && resetKeys) {
      const hasResetKeyChanged = resetKeys.some(
        (key, index) => key !== (prevProps.resetKeys?.[index])
      );

      if (hasResetKeyChanged) {
        this.resetErrorBoundary();
      }
    }
  }

  private logErrorToService = async (error: Error, errorInfo: ErrorInfo) => {
    try {
      // In production, you would send this to your error tracking service
      // (Sentry, LogRocket, Bugsnag, etc.)
      const errorData = {
        errorId: this.state.errorId,
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        level: this.props.level || 'component',
        timestamp: new Date().toISOString(),
        userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'unknown',
        url: typeof window !== 'undefined' ? window.location.href : 'unknown'
      };

      // Store in session storage for admin review
      if (typeof window !== 'undefined') {
        const existingErrors = JSON.parse(
          sessionStorage.getItem('error_logs') || '[]'
        );
        existingErrors.push(errorData);
        
        // Keep only last 50 errors
        if (existingErrors.length > 50) {
          existingErrors.splice(0, existingErrors.length - 50);
        }
        
        sessionStorage.setItem('error_logs', JSON.stringify(existingErrors));
      }

      // Log to admin API in production
      if (process.env.NODE_ENV === 'production') {
        fetch('/api/admin/error-logs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(errorData)
        }).catch(err => {
          console.warn('Failed to log error to service:', err);
        });
      }
    } catch (loggingError) {
      console.warn('Failed to log error:', loggingError);
    }
  };

  private resetErrorBoundary = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
      retryCount: 0
    });
  };

  private handleRetry = () => {
    const { maxRetries = 3 } = this.props;
    const { retryCount } = this.state;

    if (retryCount < maxRetries) {
      this.setState(prevState => ({
        hasError: false,
        error: null,
        errorInfo: null,
        retryCount: prevState.retryCount + 1
      }));

      // Auto-reset after 5 seconds if error persists
      this.resetTimeoutId = window.setTimeout(() => {
        if (this.state.hasError) {
          this.resetErrorBoundary();
        }
      }, 5000);
    }
  };

  private getErrorSeverity = (error: Error): 'low' | 'medium' | 'high' | 'critical' => {
    const message = error.message.toLowerCase();
    const stack = error.stack?.toLowerCase() || '';

    if (message.includes('network') || message.includes('fetch')) return 'medium';
    if (message.includes('chunk') || message.includes('loading')) return 'low';
    if (message.includes('permission') || message.includes('auth')) return 'high';
    if (stack.includes('supabase') || stack.includes('database')) return 'critical';
    if (this.props.level === 'critical') return 'critical';
    if (this.props.level === 'page') return 'high';
    
    return 'medium';
  };

  private renderErrorUI = () => {
    const { error, errorId, retryCount } = this.state;
    const { enableRetry = true, maxRetries = 3, level = 'component' } = this.props;
    
    if (!error) return null;

    const severity = this.getErrorSeverity(error);
    const canRetry = enableRetry && retryCount < maxRetries;

    // Different UIs based on error level
    if (level === 'page') {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <div className="max-w-md w-full text-center">
            <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-6 ${
              severity === 'critical' ? 'bg-red-100' : 'bg-yellow-100'
            }`}>
              <AlertTriangle className={`w-8 h-8 ${
                severity === 'critical' ? 'text-red-600' : 'text-yellow-600'
              }`} />
            </div>
            
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              {severity === 'critical' ? 'Critical Error' : 'Something went wrong'}
            </h1>
            
            <p className="text-gray-600 mb-6">
              {severity === 'critical' 
                ? 'A critical error occurred. Please contact support.'
                : 'We encountered an unexpected error. Please try refreshing the page.'
              }
            </p>

            {process.env.NODE_ENV === 'development' && (
              <div className="bg-gray-100 p-4 rounded-lg mb-6 text-left">
                <p className="text-sm font-mono text-gray-800 break-all">
                  {error.message}
                </p>
                <p className="text-xs text-gray-500 mt-2">Error ID: {errorId}</p>
              </div>
            )}

            <div className="space-y-3">
              {canRetry && (
                <button
                  onClick={this.handleRetry}
                  className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Try again ({maxRetries - retryCount} attempts left)
                </button>
              )}
              
              <button
                onClick={() => window.location.href = '/'}
                className="w-full bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
              >
                <Home className="w-4 h-4" />
                Go to homepage
              </button>
            </div>
          </div>
        </div>
      );
    }

    // Component-level error UI
    return (
      <div className="border border-red-200 bg-red-50 rounded-lg p-4 m-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <h3 className="text-sm font-medium text-red-800 mb-1">
              Component Error
            </h3>
            <p className="text-sm text-red-700 mb-3">
              This section couldn't load properly.
            </p>
            
            {process.env.NODE_ENV === 'development' && (
              <details className="mb-3">
                <summary className="text-xs text-red-600 cursor-pointer">
                  Error details
                </summary>
                <div className="mt-2 p-2 bg-red-100 rounded text-xs font-mono text-red-800 break-all">
                  {error.message}
                </div>
              </details>
            )}

            {canRetry && (
              <button
                onClick={this.handleRetry}
                className="inline-flex items-center gap-1 text-sm text-red-700 hover:text-red-800"
              >
                <RefreshCw className="w-3 h-3" />
                Retry ({maxRetries - retryCount} left)
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  render() {
    if (this.state.hasError) {
      return this.props.fallback || this.renderErrorUI();
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

// Hook to access error logs for admin dashboard
export const useErrorLogs = () => {
  const [errorLogs, setErrorLogs] = React.useState<any[]>([]);

  React.useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const logs = JSON.parse(sessionStorage.getItem('error_logs') || '[]');
      setErrorLogs(logs);
    } catch (error) {
      console.warn('Failed to load error logs:', error);
    }
  }, []);

  const clearErrorLogs = () => {
    sessionStorage.removeItem('error_logs');
    setErrorLogs([]);
  };

  const getErrorStats = () => {
    const now = Date.now();
    const last24Hours = errorLogs.filter(log => 
      now - new Date(log.timestamp).getTime() < 24 * 60 * 60 * 1000
    );

    return {
      total: errorLogs.length,
      last24Hours: last24Hours.length,
      byLevel: errorLogs.reduce((acc, log) => {
        acc[log.level] = (acc[log.level] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    };
  };

  return {
    errorLogs,
    clearErrorLogs,
    getErrorStats
  };
};