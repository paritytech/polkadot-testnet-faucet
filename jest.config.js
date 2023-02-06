/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  moduleNameMapper: { '^src/(.*)': `${__dirname}/src/$1` },
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ["./src"],
};
