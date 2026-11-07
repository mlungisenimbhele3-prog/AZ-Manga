// Push Notifications Service Stub (OneSignal) for AZ OVERVERSE
export const initOneSignalPush = () => {
  console.log("OneSignal Push Notifications initialized for AZ OVERVERSE.");
};

export const sendPushNotification = (title: string, message: string) => {
  console.log(`[OneSignal Push Sent] Title: "${title}" - Message: "${message}"`);
};
