import sinon from 'sinon';
import { assert } from 'chai';

import Storage, { DAY, sha256 } from '../storage';

describe('Server', () => {
  describe('Storage', () => {
    const storageInstance = new Storage('./fake-path', false);

    afterEach(() => {
      sinon.restore();
    });

    it('Should pass falsy validation if storage is NOT empty.', async () => {
      const fakeUsername = 'rocky_balboa';
      const fakeAddr = '12bzRJfh7arnnfPPUZHeJUaE62QLEwhK48QnH9LXeK2m1iZU';
      const queryStub = sinon.stub(storageInstance, '_query').resolves(5);

      const result = await storageInstance.isValid(fakeUsername, fakeAddr, 1);

      assert.isFalse(result);
      sinon.assert.calledTwice(queryStub);
      sinon.assert.calledWithExactly(
        queryStub.firstCall,
        sha256(fakeUsername),
        DAY
      );
      sinon.assert.calledWithExactly(
        queryStub.secondCall,
        sha256(fakeAddr),
        DAY
      );
    });

    it('Should pass truthy validation if storage is empty.', async () => {
      const fakeUsername = 'rocky_balboa';
      const fakeAddr = '12bzRJfh7arnnfPPUZHeJUaE62QLEwhK48QnH9LXeK2m1iZU';
      const queryStub = sinon.stub(storageInstance, '_query').resolves(0);

      const result = await storageInstance.isValid(fakeUsername, fakeAddr, 1);

      assert.isTrue(result);
      sinon.assert.calledTwice(queryStub);
      sinon.assert.calledWithExactly(
        queryStub.firstCall,
        sha256(fakeUsername),
        DAY
      );
      sinon.assert.calledWithExactly(
        queryStub.secondCall,
        sha256(fakeAddr),
        DAY
      );
    });

    it('Should insert data into storage and return truthy', async () => {
      const fakeUsername = 'rocky_balboa';
      const fakeAddr = '12bzRJfh7arnnfPPUZHeJUaE62QLEwhK48QnH9LXeK2m1iZU';
      const insertStub = sinon.stub(storageInstance, '_insert');

      const result = await storageInstance.saveData(fakeUsername, fakeAddr);

      assert.isTrue(result);
      sinon.assert.calledTwice(insertStub);
      sinon.assert.calledWithExactly(
        insertStub.firstCall,
        sha256(fakeUsername)
      );
      sinon.assert.calledWithExactly(insertStub.secondCall, sha256(fakeAddr));
    });
  });
});
