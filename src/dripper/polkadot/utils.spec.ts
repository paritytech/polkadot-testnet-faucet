import { convertAmountToBn } from "./utils";

describe("utils", () => {
  [
    { amount: "0", expected: "0" },
    { amount: "1", expected: "10000000000" },
    { amount: "100", expected: "1000000000000" },
    { amount: "1.45", expected: "14500000000" },
    { amount: "145.454141111", expected: "1454541411110" },
    { amount: "99999999.9", expected: "999999999000000000" },
    { amount: "999999999", expected: "9999999990000000000" },
    { amount: "999999999.9", expected: "9999999999000000000" },
    { amount: "999999999999999.9", expected: "9999999999999999000000000" },
    {
      amount: "999999999999999999999999999999999999999999999999999999",
      expected: "9999999999999999999999999999999999999999999999999999990000000000",
    },
    {
      amount: "999999999999999999999999999999999999999999999999999999.7",
      expected: "9999999999999999999999999999999999999999999999999999997000000000",
    },
  ].forEach((t) =>
    test(`convertAmountToBn ${t.amount} => ${t.expected}`, () => {
      expect(convertAmountToBn(t.amount).toString()).toEqual(t.expected);
    }),
  );
});
