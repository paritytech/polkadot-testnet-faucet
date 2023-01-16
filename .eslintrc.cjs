const { getConfiguration, getTypescriptOverride } = require("opstooling-js-style/src/eslint/configuration");

const tsConfParams = { rootDir: __dirname };

const conf = getConfiguration({ typescript: tsConfParams });

const tsConfOverride = getTypescriptOverride(tsConfParams);

module.exports = {
  ...conf,
  overrides: [
    ...conf.overrides,
    {
      ...tsConfOverride,
      files: "{*,**,**/*}.{ts,tsx}",
      rules: {
        ...tsConfOverride.rules,
        "@typescript-eslint/no-floating-promises": "off",
        "@typescript-eslint/no-unsafe-assignment": "off",
        "@typescript-eslint/explicit-module-boundary-types": "off",
        "@typescript-eslint/no-unsafe-call": "off",
        "@typescript-eslint/no-unsafe-argument": "off",
        "@typescript-eslint/restrict-template-expressions": "off",
        "@typescript-eslint/no-explicit-any": "off",
        "pescript-eslint/explicit-module-boundary-types": "off",
        "pescript-eslint/restrict-template-expressions": "off",
        "no-restricted-syntax": "off",
        "pescript-eslint/no-unsafe-call": "off"
      },
    },
  ],
};