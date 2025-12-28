// eslint.config.js
const globals = require("globals");
const prettier = require("eslint-config-prettier");

module.exports = [
    {
        files: ["**/*.js"],
        languageOptions: {
            ecmaVersion: 2023,
            sourceType: "commonjs",
            globals: {
                ...globals.node,
            },
        },
        rules: {
            "no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
            "no-console": "off",
        },
    },
    prettier, // <= IMPORTANT : doit être à la fin
];
