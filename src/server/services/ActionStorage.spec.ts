import fs from 'fs';

import ActionStorage from './ActionStorage';

const STUB_TO_NOTHING = '-----';

describe('ActionStorage', () => {
  let storage: ActionStorage;
  let storageFileName: string;

  beforeEach(() => {
    storageFileName = `./test-storage-${new Date().getTime()}.db`;
    storage = new ActionStorage(storageFileName);
  });

  afterEach(async () => {
    await fs.rmSync(storageFileName);
  });

  type DataProvider = {
    testName: string;
    save?: {
      username: string;
      addr: string;
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
  ];

  for (const dp of dataProvider) {
    test(dp.testName, async () => {
      if (dp.save) await storage.saveData(dp.save.username, dp.save.addr);
      expect(await storage.isValid(dp.expect.username, dp.expect.addr)).toBe(
        dp.expect.isValid
      );
    });
  }
});
