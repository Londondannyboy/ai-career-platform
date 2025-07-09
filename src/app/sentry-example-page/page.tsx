'use client';

import { useState } from 'react';
import { InstantError } from './instant-error';

export default function SentryExamplePage() {
  const [isLoading, setIsLoading] = useState(false);
  const [triggerInstant, setTriggerInstant] = useState(false);
  
  // If instant error is triggered, render the error component
  if (triggerInstant) {
    return <InstantError />;
  }

  const triggerError = async () => {
    setIsLoading(true);
    try {
      // This will throw an error that Sentry will catch
      throw new Error("Sentry Test Error - Button Clicked!");
    } catch (error) {
      // Let the error propagate so Sentry catches it
      throw error;
    }
  };

  const triggerAsyncError = async () => {
    setIsLoading(true);
    // Unhandled promise rejection
    Promise.reject(new Error("Async Sentry Test Error!"));
  };

  const triggerTypeError = () => {
    setIsLoading(true);
    // This will cause a type error
    // @ts-ignore
    const result = window.nonExistentFunction();
    return result;
  };

  const triggerNetworkError = async () => {
    setIsLoading(true);
    // This will cause a network error
    const response = await fetch('/api/non-existent-endpoint');
    if (!response.ok) {
      throw new Error(`Network error: ${response.status}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        <div className="bg-white shadow rounded-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            Sentry Error Test Page
          </h1>
          
          <p className="text-gray-600 mb-6">
            Click any button below to trigger different types of errors that Sentry will capture.
          </p>

          <div className="space-y-4">
            <button
              onClick={() => setTriggerInstant(true)}
              className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors font-bold"
            >
              Trigger myUndefinedFunction() Error (Sentry's Test)
            </button>
            
            <div className="border-t pt-4">
              <p className="text-sm text-gray-500 mb-2">Or try other error types:</p>
            </div>
            
            <button
              onClick={triggerError}
              disabled={isLoading}
              className="w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? 'Triggering...' : 'Trigger Basic Error'}
            </button>

            <button
              onClick={triggerAsyncError}
              disabled={isLoading}
              className="w-full bg-orange-600 text-white py-2 px-4 rounded-md hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? 'Triggering...' : 'Trigger Async Error'}
            </button>

            <button
              onClick={triggerTypeError}
              disabled={isLoading}
              className="w-full bg-yellow-600 text-white py-2 px-4 rounded-md hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? 'Triggering...' : 'Trigger Type Error'}
            </button>

            <button
              onClick={triggerNetworkError}
              disabled={isLoading}
              className="w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? 'Triggering...' : 'Trigger Network Error'}
            </button>
          </div>

          <div className="mt-6 p-4 bg-blue-50 rounded-md">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> After clicking a button, check your Sentry dashboard at{' '}
              <a 
                href="https://sentry.io" 
                target="_blank" 
                rel="noopener noreferrer"
                className="underline"
              >
                sentry.io
              </a>{' '}
              to see the captured error.
            </p>
          </div>

          <div className="mt-4 text-center">
            <a 
              href="/"
              className="text-sm text-gray-500 hover:text-gray-700 underline"
            >
              Back to Home
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}