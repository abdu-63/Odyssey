module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Support des alias de chemin TypeScript (@/* → src/*)
      [
        'module-resolver',
        {
          root: ['./'],
          alias: {
            '@': './src',
          },
        },
      ],
      // react-native-reanimated DOIT toujours être le dernier plugin
      'react-native-reanimated/plugin',
    ],
  };
};
