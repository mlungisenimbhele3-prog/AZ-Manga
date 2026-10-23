// Sentry Uptime & Crash Reporting Service Stub for KA Plus: Africa Pulse
export const initSentry = () => {
  console.log("Sentry Crash & Uptime Monitoring initialized for KA Plus: Africa Pulse.");
};

export const captureException = (error: Error, context?: Record<string, any>) => {
  console.error("[Sentry Error Captured]:", error, context);
};
