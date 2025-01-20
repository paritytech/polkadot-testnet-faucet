import { Mock, mock } from "node:test";

export const saveDrip: Mock<(opts: { username?: string; addr: string }) => Promise<void>> = mock.fn(async () => {});
export const hasDrippedToday: Mock<(opts: { username?: string; addr: string }) => Promise<boolean>> = mock.fn(
  async () => false,
);
