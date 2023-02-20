import { convertAmountToBn, isExternalIP } from "./utils";

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

  [
    { ip: "127.0.0.1", expected: false },
    { ip: "::ffff:127.0.0.1", expected: false },
    { ip: "192.168.0.150", expected: false },
    { ip: "::ffff:192.168.112.4", expected: false },
    { ip: "8.8.8.8", expected: true },
    { ip: "2001:4860:4860::8888", expected: true },
    { ip: "172.31.0.3", expected: false }, // Docker uses 172.x.
    { ip: "::ffff:172.31.0.3", expected: false }, // Docker uses 172.x.
  ].forEach((t) =>
    test(`isExternalIP ${String(t.ip)} => ${String(t.expected)}`, () => {
      expect(isExternalIP(t.ip)).toEqual(t.expected);
    }),
  );

  [
    { ip: "", expected: true },
    { ip: "1", expected: true },
    { ip: "xxx", expected: true },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    { ip: undefined as any, expected: true },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    { ip: null as any, expected: true },
  ].forEach((t) =>
    test(`isExternalIP '${String(t.ip)}' => throws`, () => {
      expect(() => isExternalIP(t.ip)).toThrow("Unrecognized format of IP");
    }),
  );
});
