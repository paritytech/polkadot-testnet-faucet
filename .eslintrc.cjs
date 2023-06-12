const { getConfiguration, getTypescriptOverride } = require("@eng-automation/js-style/src/eslint/configuration");

const tsConfParams = { rootDir: __dirname };

const conf = getConfiguration({ typescript: tsConfParams });

const tsConfOverride = getTypescriptOverride(tsConfParams);

module.exports = {
  ...conf,
  plugins: [
    ...conf.plugins,
    "security"
  ],
  extends: [
    ...conf.extends,
    "plugin:security/recommended"
  ],
  overrides: [
    ...conf.overrides,
    {
      ...tsConfOverride,
      files: "{*,**,**/*}.{ts,tsx}",
      rules: {
        ...tsConfOverride.rules,
        "@typescript-eslint/no-floating-promises": "off",
        "@typescript-eslint/strict-boolean-expressions": "off",
        "no-restricted-imports": "off",
        "@typescript-eslint/no-misused-promises": "off",
        "@typescript-eslint/require-await": "off",
        "@typescript-eslint/await-thenable": "off",
        "@typescript-eslint/no-unsafe-assignment": "off",
        "pescript-eslint/restrict-template-expressions": "off",
        "@typescript-eslint/explicit-module-boundary-types": "off",
        "@typescript-eslint/no-unsafe-argument": "off"
      },
    },
  ],
};
