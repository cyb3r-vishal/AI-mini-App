/** @type {import("eslint").Linter.Config} */
module.exports = {
  root: false,
  extends: ['../../.eslintrc.json'],
  parserOptions: {
    tsconfigRootDir: __dirname,
    project: ['./tsconfig.json'],
  },
  env: {
    node: true,
    es2022: true,
  },
};
