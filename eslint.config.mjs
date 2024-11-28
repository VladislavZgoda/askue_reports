import js from "@eslint/js";
import typescriptEslint from "@typescript-eslint/eslint-plugin";
import typescriptParser from "@typescript-eslint/parser";
import globals from "globals";
import importPlugin from "eslint-plugin-import";

import reactPlugin from "eslint-plugin-react";
import jsxA11yPlugin from "eslint-plugin-jsx-a11y";
import reactHooksPlugin from "eslint-plugin-react-hooks";

const __dirname = new URL(".", import.meta.url).pathname;

export default [
    js.configs.recommended,
    importPlugin.flatConfigs.recommended,
    {
        ignores: [
            "build/*",
            "build/**/*",
            "eslint.config.mjs",
            "node_modules/*",
            "node_modules/**/*",
            ".react-router"
        ],
    },
    {
        files: ["**/*.{ts,tsx}"],
        languageOptions: {
            ecmaVersion: "latest",
            sourceType: "module",
            globals: {
                ...globals.browser,
                ...globals.commonjs,
                ...globals.es6,
                process: "readonly",
            },
        },
        plugins: {
            react: reactPlugin,
            "jsx-a11y": jsxA11yPlugin,
            "react-hooks": reactHooksPlugin,
        },
        rules: {
            ...reactHooksPlugin.configs.recommended.rules,
            ...reactPlugin.configs.recommended.rules,
            ...jsxA11yPlugin.configs.recommended.rules,
        },
        settings: {
            react: {
                version: "detect",
            },
            formComponents: ["Form"],
            linkComponents: [
                { name: "Link", linkAttribute: "to" },
                { name: "NavLink", linkAttribute: "to" },
            ],
            "import/resolver": {
                typescript: {
                    alwaysTryTypes: true,
                    project: "./tsconfig.json",
                },
            },
            "import/ignore": [".(css)$"],
        },
    },
    // TypeScript configuration
    {
        files: ["**/*.{ts,tsx}"],
        languageOptions: {
            parser: typescriptParser,
            parserOptions: {
                tsconfigRootDir: __dirname,
                project: ["./tsconfig.json"],
            },
            globals: {
                ...globals.node,
                React: "readonly",
                NodeJS: "readonly",
            },
        },
        plugins: {
            "@typescript-eslint": typescriptEslint,
        },
        rules: {
            ...typescriptEslint.configs.recommended.rules,
            "@typescript-eslint/no-require-imports": "off",
        },
    },
    // Node environment for eslint.config.mjs
    {
        files: ["eslint.config.mjs"],
        env: {
            node: true,
        },
    },
];
