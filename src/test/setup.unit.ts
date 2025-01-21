import { before, after, mock } from "node:test";
import * as mockedConfig from "#src/__mocks__/config";

mock.module("#src/config", { namedExports: mockedConfig });

before(() => {
  process.env.SMF_CONFIG_NETWORK = "westend";
});

after(async () => {
  const { client } = await import("../papi/index.js");
  client.destroy();
});

export default function() {
  process.env.SMF_CONFIG_NETWORK = "westend";
}
