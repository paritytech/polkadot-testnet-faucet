// @ts-check

import eslint from "@eslint/js";
import tsParser from "@typescript-eslint/parser";
import eslintPluginSvelte from "eslint-plugin-svelte";
import globals from "globals";
import svelteParser from "svelte-eslint-parser";
import tseslint from "typescript-eslint";
import svelteConfig from "./svelte.config.js";

export default tseslint.config(
	eslint.configs.recommended,
	...tseslint.configs.strict,
	...tseslint.configs.stylistic,
	...eslintPluginSvelte.configs["flat/recommended"],
	...eslintPluginSvelte.configs["flat/prettier"],
	{
		ignores: [
			"_site/*",
			"build/*",
			".svelte-kit/*",
			".env*",
			"*.js",
			"static/*.js",
			"pnpm-lock.yaml",
			"package-lock.json",
			"yarn.lock"
		]
	},
	{
		rules: {
			"@typescript-eslint/no-empty-function": "off",
			"@typescript-eslint/no-inferrable-types": "off",
			"@typescript-eslint/consistent-type-assertions": "off",
			"@typescript-eslint/no-explicit-any": "warn",
			"@typescript-eslint/no-unused-vars": [
				"error",
				{
					argsIgnorePattern: "^_",
					varsIgnorePattern: "^_",
					caughtErrorsIgnorePattern: "^_"
				}
			],
			"no-unused-vars": "off",
			indent: ["warn", 2],
			"linebreak-style": ["error", "unix"],
			semi: "warn",
			"@typescript-eslint/ban-ts-comment": "off",
			"svelte/no-at-html-tags": "off"
		}
	},
	{
		languageOptions: {
			globals: {
				...globals.browser
			}
		}
	},
	{
		languageOptions: {
			parser: tsParser,
			parserOptions: {
				extraFileExtensions: [".svelte"]
			}
		}
	},
	{
		files: ["**/*.svelte", "*.svelte"],
		languageOptions: {
			parser: svelteParser,
			parserOptions: {
				parser: tsParser,
				svelteConfig
			}
		}
	},
	{
		files: ["**/*.test.ts"],
		rules: {
			"@typescript-eslint/no-non-null-assertion": "off",
			"@typescript-eslint/no-explicit-any": "off",
			"@typescript-eslint/no-unused-vars": "off"
		}
	}
);
