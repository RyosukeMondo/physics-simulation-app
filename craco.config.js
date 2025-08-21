module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      // Ignore source map warnings for specific packages
      webpackConfig.ignoreWarnings = [
        {
          module: /node_modules\/@mediapipe\/tasks-vision/,
          message: /Failed to parse source map/,
        },
        // You can add more patterns here if needed
        /Failed to parse source map.*@mediapipe/,
      ];

      // Alternative: Disable source map loader for problematic packages
      webpackConfig.module.rules.forEach((rule) => {
        if (rule.enforce === 'pre' && rule.use) {
          rule.use.forEach((loader) => {
            if (loader.loader && loader.loader.includes('source-map-loader')) {
              loader.exclude = [
                /node_modules\/@mediapipe/,
                ...(loader.exclude || [])
              ];
            }
          });
        }
      });

      return webpackConfig;
    },
  },
};