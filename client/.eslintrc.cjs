const { getConfiguration, getTypescriptOverride } = require("@eng-automation/js-style/src/eslint/configuration");

const tsConfParams = { rootDir: __dirname };
const conf = getConfiguration({ typescript: tsConfParams, browser: true });

const tsConfOverride = getTypescriptOverride(tsConfParams);
conf.overrides.push(tsConfOverride);

// Unfortunately, this rule has no fine-tuning,
// and it doesn't live well with Tailwind CSSª
conf.rules["svelte/valid-compile"] = ["error", { ignoreWarnings: true }];

module.exports = conf;
