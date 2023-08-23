export const saveDrip = jest.fn<Promise<void>, [{ username?: string; addr: string }]>(async () => {});
export const hasDrippedToday = jest.fn<Promise<boolean>, [{ username?: string; addr: string }]>(async () => false);
