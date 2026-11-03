const appConfig = {
  name: 'AZ OVERVERSE',
  slug: 'az-oververse',
  version: '1.0.2',
  android: {
    package: 'com.azoververse.oververse',
    versionCode: 102,
    config: {
      googleMobileAdsAppId: 'ca-app-pub-7570164094154420~3142297870',
    },
  },
  ios: {
    bundleIdentifier: 'com.azoververse.oververse',
  },
};

export default ({ config = {} } = {}) => ({
  ...config,
  ...appConfig,
  android: {
    ...(config.android || {}),
    ...appConfig.android,
    package: 'com.azoververse.oververse',
  },
  ios: {
    ...(config.ios || {}),
    ...appConfig.ios,
    bundleIdentifier: 'com.azoververse.oververse',
  },
});
