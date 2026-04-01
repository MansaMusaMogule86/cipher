// Stub analytics module - replace with actual PostHog integration when ready
export function trackVisitor(data: { page: string | null; referrer: string }) {
  // TODO: Implement PostHog tracking
  if (process.env.NODE_ENV === 'development') {
    console.log('[Analytics] Track visitor:', data);
  }
}

export function trackButtonClick(buttonText: string, metadata: { page: string | null }) {
  // TODO: Implement PostHog tracking
  if (process.env.NODE_ENV === 'development') {
    console.log('[Analytics] Button click:', buttonText, metadata);
  }
}

export function trackEvent(eventName: string, properties?: Record<string, unknown>) {
  // TODO: Implement PostHog tracking
  if (process.env.NODE_ENV === 'development') {
    console.log('[Analytics] Event:', eventName, properties);
  }
}
