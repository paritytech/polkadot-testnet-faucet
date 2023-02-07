import { isGoogleAccountPrivileged, isMatrixAccountPrivileged } from "./utils";

describe("isMatrixAccountPrivileged", () => {
  type DataProvider = {
    username: string;
    expected: boolean;
  };

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
    expect(isMatrixAccountPrivileged(username)).toBe(expected);
  });
});

describe("isGoogleAccountPrivileged", () => {
  type DataProvider = {
    username: string;
    expected: boolean;
  };

  const dataProvider: DataProvider[] = [
    { username: "1", expected: false },
    { username: "", expected: false },
    { username: "username@google.com", expected: false },
    { username: "username@gmail.com", expected: false },
    { username: "username@parity.io", expected: true },
    { username: "username@parity.something.io", expected: false },
  ];

  test.each(dataProvider)("$username, $expect", ({ username, expected }) => {
    expect(isGoogleAccountPrivileged(username)).toBe(expected);
  });
});
