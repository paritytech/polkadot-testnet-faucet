const commonConfig = require("./jest.config");

/** @type {import("ts-jest/dist/types").InitialOptionsTsJest} */
module.exports = { ...commonConfig, testMatch: ["**/?(*.)+(e2e).[jt]s?(x)"], testTimeout: 60_000 };
