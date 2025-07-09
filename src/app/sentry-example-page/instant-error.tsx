'use client';

// This component will throw an error immediately when rendered
export function InstantError() {
  // Trigger the error that Sentry expects
  // @ts-ignore
  myUndefinedFunction();
  
  return null;
}