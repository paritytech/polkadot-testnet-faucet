import { convertAmountToBn } from "./utils";

jest.mock("../../config");

describe("utils", () => {
  [
    { amount: "0", expected: "0" },
    { amount: "1", expected: "1000000000000" },
    { amount: "100", expected: "100000000000000" },
    { amount: "1.45", expected: "1450000000000" },
    { amount: "145.454141111", expected: "145454141111000" },
    { amount: "99999999.9", expected: "99999999900000000000" },
    { amount: "999999999", expected: "999999999000000000000" },
    { amount: "999999999.9", expected: "999999999900000000000" },
    { amount: "999999999999999.9", expected: "999999999999999900000000000" },
    {
      amount: "999999999999999999999999999999999999999999999999999999",
      expected: "999999999999999999999999999999999999999999999999999999000000000000",
    },
    {
      amount: "999999999999999999999999999999999999999999999999999999.7",
      expected: "999999999999999999999999999999999999999999999999999999700000000000",
    },
  ].forEach((t) =>
    test(`convertAmountToBn ${t.amount} => ${t.expected}`, () => {
      expect(convertAmountToBn(t.amount).toString()).toEqual(t.expected);
    }),
  );
});
