import fs from 'fs';

import ActionStorage from './ActionStorage';

const STUB_TO_NOTHING = '-----';

type DataProvider = {
  testName: string;
  save?: {
    username: string;
    addr: string;
    fakeYesterday?: boolean;
  };
  expect: {
    username: string;
    addr: string;
    isValid: boolean;
  };
};

const dataProvider: DataProvider[] = [
  {
    testName: 'fresh user',
    expect: { username: 'user1', addr: 'addr1', isValid: true },
  },
  {
    testName: 'add one user, but check another, should be valid',
    save: { username: 'user1', addr: 'addr1' },
    expect: { username: 'user2', addr: 'addr2', isValid: true },
  },
  {
    testName: 'add user, expect non-valid',
    save: { username: 'user1', addr: STUB_TO_NOTHING },
    expect: { username: 'user1', addr: 'addr1', isValid: false },
  },
  {
    testName: 'add address, expect non-valid',
    save: { username: STUB_TO_NOTHING, addr: 'addr1' },
    expect: { username: 'user1', addr: 'addr1', isValid: false },
  },
  {
    testName: 'add address, 20+ hours ago, expect valid',
    save: { username: 'user1', addr: 'addr1', fakeYesterday: true },
    expect: { username: 'user1', addr: 'addr1', isValid: true },
  },
];

for (const dp of dataProvider) {
  describe('ActionStorage', () => {
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
      if (dp.save?.fakeYesterday) {
        const yesterday = new Date(new Date().getTime() - 24 * 60 * 60 * 1000);
        jest.useFakeTimers().setSystemTime(yesterday);
      }

      if (dp.save) {
        await storage.saveData(dp.save.username, dp.save.addr);
      }

      // un-fake system date to real time
      if (dp.save?.fakeYesterday) {
        jest.useRealTimers();
      }

      expect(await storage.isValid(dp.expect.username, dp.expect.addr)).toBe(
        dp.expect.isValid
      );
    });
  });
}
