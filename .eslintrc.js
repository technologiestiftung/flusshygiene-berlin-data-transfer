module.exports = {
  env: {
    browser: true,
    commonjs: true,
    es2020: true,
    jest: true,
  },
  globals: {
    "jest/globals": true,
  },
  extends: ["standard", "prettier"],
  plugins: ["prettier", "jest"],
  parserOptions: {
    ecmaVersion: 11,
  },
  rules: {},
};
