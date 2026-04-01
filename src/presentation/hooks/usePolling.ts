/**
 * Custom hook for polling operations
 * Reusable for payment verification, subscription activation, etc.
 */
import { useRef, useEffect } from 'react';

interface UsePollingOptions<T> {
  pollFn: () => Promise<T>;
  checkSuccess: (data: T) => boolean;
  onSuccess: (data: T) => void;
  onTimeout?: () => void;
  onError?: (error: Error) => void;
  interval?: number; // in milliseconds
  maxPolls?: number;
  enabled?: boolean;
}

export function usePolling<T>({
  pollFn,
  checkSuccess,
  onSuccess,
  onTimeout,
  onError,
  interval = 2000,
  maxPolls = 20,
  enabled = true,
}: UsePollingOptions<T>) {
  const pollCount = useRef(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isPolling = useRef(enabled);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const poll = async () => {
      try {
        if (!isPolling.current || pollCount.current >= maxPolls) {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
          }

          if (pollCount.current >= maxPolls && onTimeout) {
            onTimeout();
          }
          return;
        }

        const result = await pollFn();

        if (checkSuccess(result)) {
          isPolling.current = false;
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
          }
          onSuccess(result);
          return;
        }

        pollCount.current++;
      } catch (error) {
        console.error('Polling error:', error);
        if (onError) {
          onError(error instanceof Error ? error : new Error('Polling failed'));
        }
      }
    };

    // Initial poll
    poll();

    // Start interval
    intervalRef.current = setInterval(poll, interval);

    // Cleanup
    return () => {
      isPolling.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [enabled]);

  const stop = () => {
    isPolling.current = false;
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  };

  const reset = () => {
    pollCount.current = 0;
    isPolling.current = true;
  };

  return {
    stop,
    reset,
    pollCount: pollCount.current,
  };
}

/**
 * Example usage:
 * 
 * const { stop, reset, pollCount } = usePolling({
 *   pollFn: async () => {
 *     const response = await fetch('/api/orders/123');
 *     return response.json();
 *   },
 *   checkSuccess: (data) => data.status === 'PAID',
 *   onSuccess: (data) => {
 *     Toast.show({ type: 'success', text1: 'Payment verified!' });
 *   },
 *   onTimeout: () => {
 *     Toast.show({ type: 'warning', text1: 'Verification timeout' });
 *   },
 *   interval: 2000,
 *   maxPolls: 20,
 * });
 */
