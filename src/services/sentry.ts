// Sentry Uptime & Crash Reporting Service Stub for AZ OVERVERSE
export const initSentry = () => {
  console.log("Sentry Crash & Uptime Monitoring initialized for AZ OVERVERSE.");
};

export const captureException = (error: Error, context?: Record<string, any>) => {
  console.error("[Sentry Error Captured]:", error, context);
};
