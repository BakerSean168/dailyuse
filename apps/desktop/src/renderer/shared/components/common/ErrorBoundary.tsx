/**
 * ErrorBoundary Component
 * 错误边界组件，捕获子组件�?JS 错误
 */

import * as React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button, Card, CardContent, CardFooter, CardHeader, CardTitle } from '@dailyuse/ui-react-shadcn';

export interface ErrorBoundaryProps {
  children: React.ReactNode;
  /** 自定义错�?UI */
  fallback?: React.ReactNode;
  /** 错误回调 */
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  /** 是否显示错误详情 */
  showDetails?: boolean;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ errorInfo });
    this.props.onError?.(error, errorInfo);
    
    // 在开发模式下打印详细错误
    if (import.meta.env.DEV) {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  override render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex items-center justify-center min-h-[200px] p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                出错�?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                抱歉，页面发生了一些错误�?
              </p>
              
              {this.props.showDetails && this.state.error && (
                <details className="text-sm">
                  <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                    查看错误详情
                  </summary>
                  <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto max-h-32">
                    {this.state.error.toString()}
                    {this.state.errorInfo?.componentStack}
                  </pre>
                </details>
              )}
            </CardContent>
            <CardFooter>
              <Button onClick={this.handleReset} variant="outline" className="w-full">
                <RefreshCw className="mr-2 h-4 w-4" />
                重试
              </Button>
            </CardFooter>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * useErrorBoundary Hook
 * 用于在函数组件中手动触发错误边界
 */
export function useErrorBoundary() {
  const [error, setError] = React.useState<Error | null>(null);

  if (error) {
    throw error;
  }

  return {
    showBoundary: setError,
    resetBoundary: () => setError(null),
  };
}
