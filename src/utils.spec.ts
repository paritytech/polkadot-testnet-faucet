import * as process from "process";

import { isAccountPrivileged } from "./utils";

type DataProvider = {
  username: string;
  expected: boolean;
};

jest.mock("./networkData");

describe("test rococo", () => {
  const dataProvider: DataProvider[] = [
    { username: "1", expected: false },
    { username: "", expected: false },
    { username: "@username:matrix.org", expected: false },
    { username: "@1:parity.io", expected: true },
    { username: "@1:matrix.parity.io", expected: false },
    { username: "@1:web3.foundation", expected: true },
    { username: "@1:web3.foundati", expected: false },
  ];

  test.each(dataProvider)("$username, $expect", ({ username, expected }) => {
    expect(isAccountPrivileged(username)).toBe(expected);
  });
});

describe("test paseo", () => {
  beforeAll(() => {
    process.env.SMF_CONFIG_NETWORK = "paseo";
    jest.resetModules();
  });

  const dataProvider: DataProvider[] = [
    { username: "1", expected: false },
    { username: "", expected: false },
    { username: "@username:matrix.org", expected: false },
    { username: "@1:parity.io", expected: false },
    { username: "@1:matrix.parity.io", expected: false },
    { username: "@1:web3.foundation", expected: false },
    { username: "@1:web3.foundati", expected: false },
    { username: "@erin:web3.foundation", expected: false },
    { username: "@erin:parity.io", expected: true },
  ];

  test.each(dataProvider)("$username, $expect", ({ username, expected }) => {
    expect(isAccountPrivileged(username)).toBe(expected);
  });
});
