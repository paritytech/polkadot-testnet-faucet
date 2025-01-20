import { expect } from "earl";
import { before, describe, test } from "node:test";

import { isAccountPrivileged } from "./utils.js";

type DataProvider = {
  username: string;
  expected: boolean;
};

describe("test westend", () => {
  before(() => {
    process.env.SMF_CONFIG_NETWORK = "westend";
  });
  const dataProvider: DataProvider[] = [
    { username: "1", expected: false },
    { username: "", expected: false },
    { username: "@username:matrix.org", expected: false },
    { username: "@1:parity.io", expected: true },
    { username: "@1:matrix.parity.io", expected: false },
    { username: "@1:web3.foundation", expected: true },
    { username: "@1:web3.foundati", expected: false },
  ];

  for (const item of dataProvider) {
    test(`Username "${item.username}" should${item.expected ? "" : " NOT"} be privileged`, async () => {
      expect(isAccountPrivileged(item.username)).toEqual(item.expected);
    });
  }
});

describe("test paseo", () => {
  before(() => {
    process.env.SMF_CONFIG_NETWORK = "paseo";
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

  for (const item of dataProvider) {
    test(`Username "${item.username}" should${item.expected ? "" : " NOT"} be privileged`, async () => {
      expect(isAccountPrivileged(item.username)).toEqual(item.expected);
    });
  }
});
