const commonConfig = require("./jest.config");

/** @type {import("ts-jest/dist/types").InitialOptionsTsJest} */
module.exports = {
  ...commonConfig,
  moduleNameMapper: { "^#src/(.*)": `${__dirname}/src/$1` },
  testRegex: ["\\w+\\.(e2e).ts"],
  testTimeout: 60_000,
};
