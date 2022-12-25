module.exports = {
  parser: "@typescript-eslint/parser",
  extends: ["turbo", "prettier", "plugin:import/recommended", "plugin:import/typescript"],
  plugins: ["simple-import-sort"],
  rules: {
    "camelcase": "error",
    "yoda": "error",
    "eqeqeq": "error",
    "prefer-const": "error",

    "simple-import-sort/imports": "error",
    "simple-import-sort/exports": "error",
    "import/newline-after-import": "error",

    "import/no-unresolved": "off"
  },
};
