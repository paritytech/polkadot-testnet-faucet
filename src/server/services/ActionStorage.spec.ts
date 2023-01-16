import fs from "fs";

import ActionStorage from "./ActionStorage";

const STUB_TO_NOTHING = "-----";

type DataProvider = {
  testName: string;
  save?: {
    username: string;
    addr: string;
    fakeDate?: Date;
  };
  expect: {
    username: string;
    addr: string;
    isValid: boolean;
  };
};

/**
 * @param hoursSpan could be positive & negative
 */
function getDate(hoursSpan: number) {
  const date = new Date();
  date.setHours(date.getHours() + hoursSpan);
  return date;
}

const dataProvider: DataProvider[] = [
  { testName: "fresh user", expect: { username: "user1", addr: "addr1", isValid: true } },
  {
    testName: "add one user, but check another, should be valid",
    save: { username: "user1", addr: "addr1" },
    expect: { username: "user2", addr: "addr2", isValid: true },
  },
  {
    testName: "add user, expect non-valid",
    save: { username: "user1", addr: STUB_TO_NOTHING },
    expect: { username: "user1", addr: "addr1", isValid: false },
  },
  {
    testName: "add address, expect non-valid",
    save: { username: STUB_TO_NOTHING, addr: "addr1" },
    expect: { username: "user1", addr: "addr1", isValid: false },
  },
  {
    testName: "add address, 21 hours ago, expect valid",
    save: { username: "user1", addr: "addr1", fakeDate: getDate(-21) },
    expect: { username: "user1", addr: "addr1", isValid: true },
  },
  {
    testName: "add address, 19 hours ago, expect invalid",
    save: { username: "user1", addr: "addr1", fakeDate: getDate(-19) },
    expect: { username: "user1", addr: "addr1", isValid: false },
  },
];

for (const dp of dataProvider) {
  describe("ActionStorage", () => {
    let storage: ActionStorage;
    let storageFileName: string;

    beforeEach(() => {
      storageFileName = `./test-storage-${dataProvider.indexOf(dp)}.db`;
      storage = new ActionStorage(storageFileName);
    });

    afterEach(async () => {
      await fs.rmSync(storageFileName);
    });

    test(dp.testName, async () => {
      // fake system date to emulate saving data 24 hours before
      if (dp.save?.fakeDate) {
        jest.useFakeTimers().setSystemTime(dp.save.fakeDate);
      }

      if (dp.save) {
        await storage.saveData(dp.save.username, dp.save.addr);
      }

      // un-fake system date to real time
      if (dp.save?.fakeDate) {
        jest.useRealTimers();
      }

      expect(await storage.isValid(dp.expect.username, dp.expect.addr)).toBe(dp.expect.isValid);
    });
  });
}
