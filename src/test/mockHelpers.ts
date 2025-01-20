import { Mock } from "node:test";
import { expect } from "earl";

export function expectHaveBeenCalledWith<F extends (...args: any) => any>(mock: Mock<F>, args: Parameters<F>): void {
  expect(mock.mock.calls.length).toBeGreaterThan(0);
  expect(mock.mock.calls.map(call => call.arguments)).toInclude(args);
}

export function mockResolvedValueOnce<V>(mock: Mock<(...args: any[]) => Promise<V>>, value: V): void {
  mock.mock.mockImplementationOnce(() => Promise.resolve(value));
}

export function mockRejectedValueOnce<V>(mock: Mock<(...args: any[]) => Promise<V>>, value: any): void {
  mock.mock.mockImplementationOnce(() => Promise.reject(value));
}
