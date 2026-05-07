import baseConfig from "./base.js";
import reactPlugin from "eslint-plugin-react";
import reactHooksPlugin from "eslint-plugin-react-hooks";

/** @type {import("eslint").Linter.Config[]} */
export default [
  ...baseConfig,
  {
    files: ["**/*.tsx", "**/*.jsx"],
    plugins: {
      react: reactPlugin,
    },
    settings: {
      react: {
        version: "detect",
      },
    },
    rules: {
      "react/react-in-jsx-scope": "off",
      "react/prop-types": "off",
    },
  },
  // react-hooks rules apply to .ts files too (custom hooks live there).
  {
    files: ["**/*.ts", "**/*.tsx", "**/*.js", "**/*.jsx"],
    plugins: {
      "react-hooks": reactHooksPlugin,
    },
    rules: {
      "react-hooks/rules-of-hooks": "warn",
      "react-hooks/exhaustive-deps": "warn",
    },
  },
  // Bug prevention: inline cache keys → must use QUERY_KEYS
  {
    files: ["**/*.ts", "**/*.tsx"],
    rules: {
      "no-restricted-syntax": [
        "warn",
        {
          selector: "CallExpression[callee.property.name='getQueryData'] > ArrayExpression",
          message: "Use QUERY_KEYS constants instead of inline cache key arrays.",
        },
        {
          selector: "CallExpression[callee.property.name='setQueryData'] > ArrayExpression",
          message: "Use QUERY_KEYS constants instead of inline cache key arrays.",
        },
      ],
    },
  },
];
