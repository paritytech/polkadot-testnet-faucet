import { type Frame, type FullConfig, type Locator, type Page, expect, test } from "@playwright/test";
import {stringToHex} from "@polkadot/util";

type FormSubmit = {
  address: string;
  captchaResponse: string;
  parachain_id?: string;
};

type CaptchaProvider = "recaptcha" | "procaptcha";

const getFormElements = async (page: Page, captchaProvider: "recaptcha" | "procaptcha", getCaptcha = false) => {
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  let captcha: Locator = {} as Locator;
  if (getCaptcha) {
    if (captchaProvider === "recaptcha") {
      // ?: Hack. We need to wait for the frame to load and then invade it.
      await page.reload();
      const captchaFrame = await new Promise<Frame>((resolve, reject) => {
        let i = 0;
        // function that waits for the frame and timeouts after 3 seconds
        // FIXME consider "until" from "@eng-automation/js"?
        // eslint-disable-next-line no-restricted-syntax
        (function waitForFrame() {
          const captchaFrames = page.frames().filter((f) => f.url().includes("https://www.google.com/recaptcha/api2/"));
          if (captchaFrames.length > 0) {
            return resolve(captchaFrames[0]);
          } else {
            i++;
            if (i > 10) {
              reject(new Error("Timeout"));
            }
          }
          setTimeout(waitForFrame, 300);
        })();
      });
      captcha = captchaFrame?.locator("#recaptcha-anchor") as Locator;
    } else if (captchaProvider === "procaptcha") {
      const testAccount = "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY"; // Alice's address
      const testSiteKey = "5C4hrfjw9DjXZTzV3MwzrrAr9P1MJhSrvWGWqi1eSuyUpnhM"; // Mock site key
      const testProvider = "https://mockprovider.prosopo.io"; // Mock provider

      // Tell the page that a captcha provider has previously been used and inject the mock provider
      const testStorage = stringToHex(JSON.stringify({account: testAccount, providerUrl: testProvider, blockNumber: 1}));
      await page.evaluate((storage) => {
        localStorage.setItem("@prosopo/procaptcha", storage)
      }, testStorage);

      // Mock the verify api call and inject Alice's address before clicking the captcha
      await page.route("*/**/v1/prosopo/provider/verify", async (route) => {
        const json = { user: testAccount, dapp: testSiteKey, blockNumber: 1 };
        await route.continue({ postData: json });
      });
      captcha = page.locator("#captcha_element input[type='checkbox']");
    } else {
      throw new Error("Unknown captcha provider");
    }
  }
  return {
    address: page.getByTestId("address"),
    network: page.getByTestId("network"),
    captcha,
    submit: page.getByTestId("submit-button"),
    dropdown: page.getByTestId("dropdown"),
  };
};

export class FaucetTests {
  private readonly dropdownId = "dropdown";

  readonly url: string;
  readonly faucetName: string;
  readonly chains: { name: string; id: number }[];
  readonly expectTransactionLink: boolean;

  constructor(params: {
    url: string;
    faucetName: string;
    chains: { name: string; id: number }[];
    expectTransactionLink: boolean;
  }) {
    this.chains = params.chains;
    this.faucetName = params.faucetName;
    this.url = params.url;
    this.expectTransactionLink = params.expectTransactionLink;
  }

  /**
   * Gets the faucet url from the config file
   * @param config The second value that is given on the tests arrow function
   */
  getFaucetUrl = (config: FullConfig): string => {
    const env = config.webServer?.env;
    if (!env) {
      throw new Error("No env vars in project");
    }
    const faucetUrl = env.PUBLIC_FAUCET_URL;
    if (!faucetUrl) {
      throw new Error(`No env var value found for PUBLIC_FAUCET_URL`);
    }

    return faucetUrl;
  };

  /**
   * Get the captcha provider from the config file
   * @param config The second value that is given on the tests arrow function
   */
  getCaptchaProvider = (config: FullConfig): CaptchaProvider => {
    const env = config.webServer?.env;
    if (!env) {
      throw new Error("No env vars in project");
    }
    const captchaProvider = env.PUBLIC_CAPTCHA_PROVIDER;
    if (!captchaProvider) {
      throw new Error(`No env var value found for PUBLIC_CAPTCHA_PROVIDER`);
    }
    if (!["recaptcha", "procaptcha"].includes(captchaProvider)) {
      throw new Error(`Invalid captcha provider: ${captchaProvider}`);
    }

    return captchaProvider as CaptchaProvider;
  };

  runTests(): void {
    test.describe(`${this.faucetName} tests`, () => {
      test.describe("on page load", () => {
        test("page has expected header", async ({ page }) => {
          await page.goto(this.url);
          await expect(page.getByRole("heading", { name: this.faucetName })).toBeVisible();
        });

        test("page has disabled submit button", async ({ page }, { config }) => {
          await page.goto(this.url);
          const { submit } = await getFormElements(page, this.getCaptchaProvider(config));
          await expect(submit).toBeVisible();
          await expect(submit).toBeDisabled();
        });

        test("page has form elements", async ({ page }, { config }) => {
          await page.goto(this.url);
          const { address, network, captcha } = await getFormElements(page, this.getCaptchaProvider(config), true);
          await expect(address).toBeVisible();
          await expect(network).toBeHidden();
          await expect(captcha).toBeVisible();
        });

        test("page loads with default value in parachain field", async ({ page }, { config }) => {
          await page.goto(this.url);
          const { network } = await getFormElements(page, this.getCaptchaProvider(config));
          await expect(network).toHaveValue("-1");
        });

        test("page with get parameter loads with value in parachain field", async ({ page }, { config }) => {
          const parachainId = "1234";
          await page.goto(`${this.url}?parachain=${parachainId}`);
          const { network } = await getFormElements(page, this.getCaptchaProvider(config));
          await expect(network).toHaveValue(parachainId);
        });

        test("page has captcha", async ({ page }, { config }) => {
          await page.goto(this.url);
          const { captcha } = await getFormElements(page, this.getCaptchaProvider(config), true);
          await expect(captcha).toBeVisible();
        });
      });

      test.describe("dropdown interaction", () => {
        if (this.chains.length < 2) {
          return;
        }
        const networkName = this.chains[1].name;
        test("dropdown appears on click", async ({ page }) => {
          await page.goto(this.url);
          const dropdown = page.getByTestId(this.dropdownId);
          await expect(dropdown).toBeVisible();
          await expect(page.getByText(networkName)).toBeHidden();
          await dropdown.click();
          await expect(page.getByText(networkName)).toBeVisible();
        });

        test("dropdown closes on network selection", async ({ page }) => {
          await page.goto(this.url);
          const dropdown = page.getByTestId(this.dropdownId);
          await expect(dropdown).toBeVisible();
          const networkBtn = page.getByTestId("network-1");
          await dropdown.click();
          await expect(networkBtn).toBeVisible();
          await networkBtn.click();
          await expect(networkBtn).not.toBeVisible();
        });

        test("network changes on modal selection", async ({ page }, { config }) => {
          await page.goto(this.url);
          const dropdown = page.getByTestId(this.dropdownId);
          const { network } = await getFormElements(page, this.getCaptchaProvider(config));
          await expect(dropdown).toBeVisible();
          const networkBtn = page.getByTestId("network-1");
          await dropdown.click();
          await expect(networkBtn).toBeVisible();
          await networkBtn.click();
          await expect(networkBtn).not.toBeVisible();
          await expect(network).toHaveValue("1000");
        });
      });

      test.describe("Custom networks", () => {
        let network: Locator;
        let customChainDiv: Locator;

        test.beforeEach(async ({ page }, { config }) => {
          await page.goto(this.url);
          network = (await getFormElements(page, this.getCaptchaProvider(config))).network;
          customChainDiv = page.getByTestId("custom-network-button");
          await expect(customChainDiv).toBeEnabled();
          await expect(customChainDiv).toContainText("Use custom chain id");
          await customChainDiv.click();
          await expect(network).toBeVisible();
        });

        test("Value is empty on network pick", async () => {
          await expect(network).toHaveValue("");
        });

        test("Value restores to -1 when picking preselected network", async () => {
          await customChainDiv.click();
          await expect(network).toBeHidden();
          await expect(network).toHaveValue("-1");
        });
      });

      test.describe("form interaction", () => {
        test("submit form becomes valid on data entry", async ({ page }, { config }) => {
          await page.goto(this.url);
          const { address, captcha, submit } = await getFormElements(page, this.getCaptchaProvider(config), true);
          await expect(submit).toBeDisabled();
          await address.fill("address");
          await captcha.click();
          await expect(submit).toBeEnabled();
        });

        test("sends data on submit", async ({ page }, { config }) => {
          await page.goto(this.url);
          const { address, captcha, submit } = await getFormElements(page, this.getCaptchaProvider(config), true);
          await expect(submit).toBeDisabled();
          const myAddress = "0x000000001";
          await address.fill(myAddress);
          await captcha.click();
          const faucetUrl = this.getFaucetUrl(config);

          await page.route(faucetUrl, (route) => route.fulfill({ body: JSON.stringify({ hash: "hash" }) }));

          const request = page.waitForRequest((req) => {
            if (req.url() === faucetUrl) {
              const data = req.postDataJSON() as FormSubmit;
              expect(data.address).toEqual(myAddress);
              return !!data.captchaResponse;
            }
            return false;
          });
          await submit.click();
          // verify that the post request is correct
          await request;
        });

        for (let i = 1; i < this.chains.length; i++) {
          const chain = this.chains[i];
          test(`sends data with ${chain.name} chain on submit`, async ({ page }, { config }) => {
            await page.goto(this.url);
            const { address, captcha, submit } = await getFormElements(page, this.getCaptchaProvider(config), true);
            const dropdown = page.getByTestId(this.dropdownId);
            await expect(submit).toBeDisabled();
            const myAddress = "0x000000002";
            await address.fill(myAddress);
            await dropdown.click();
            const networkBtn = page.getByTestId(`network-${i}`);
            await expect(networkBtn).toBeVisible();
            await networkBtn.click();
            await captcha.click();
            await expect(submit).toBeEnabled();
            const faucetUrl = this.getFaucetUrl(config);
            await page.route(faucetUrl, (route) => route.fulfill({ body: JSON.stringify({ hash: "hash" }) }));

            const request = page.waitForRequest((req) => {
              if (req.url() === faucetUrl) {
                const data = req.postDataJSON() as FormSubmit;
                const parachain_id = chain.id > 0 ? chain.id.toString() : undefined;
                expect(data).toMatchObject({ address: myAddress, parachain_id });
                return !!data.captchaResponse;
              }
              return false;
            });

            await submit.click();
            await request;
          });
        }

        test("sends data with custom chain on submit", async ({ page }, { config }) => {
          await page.goto(this.url);
          const { address, network, captcha, submit } = await getFormElements(
            page,
            this.getCaptchaProvider(config),
            true,
          );
          await expect(submit).toBeDisabled();
          const myAddress = "0x000000002";
          await address.fill(myAddress);
          const customChainDiv = page.getByTestId("custom-network-button");
          await customChainDiv.click();
          await network.fill("9999");
          await captcha.click();
          await expect(submit).toBeEnabled();
          const faucetUrl = this.getFaucetUrl(config);
          await page.route(faucetUrl, (route) => route.fulfill({ body: JSON.stringify({ hash: "hash" }) }));

          const request = page.waitForRequest((req) => {
            if (req.url() === faucetUrl) {
              const data = req.postDataJSON() as FormSubmit;
              expect(data).toMatchObject({ address: myAddress, parachain_id: "9999" });
              return !!data.captchaResponse;
            }
            return false;
          });

          await submit.click();
          await request;
        });

        test("display link to transaction", async ({ page }, { config }) => {
          await page.goto(this.url);
          const operationHash = "0x0123435423412343214";
          const { address, captcha, submit } = await getFormElements(page, this.getCaptchaProvider(config), true);
          await expect(submit).toBeDisabled();
          const myAddress = "0x000000001";
          await address.fill(myAddress);
          await captcha.click();
          await page.route(this.getFaucetUrl(config), (route) =>
            route.fulfill({ body: JSON.stringify({ hash: operationHash }) }),
          );
          await submit.click();
          const transactionLink = page.getByTestId("success-button");
          if (this.expectTransactionLink) {
            await expect(transactionLink).toBeVisible();
            expect(await transactionLink.getAttribute("href")).toContain(operationHash);
          } else {
            await expect(transactionLink).toHaveCount(0);
          }
        });

        test("throw error", async ({ page }, { config }) => {
          await page.goto(this.url);
          const error = "Things failed because you are a naughty boy!";
          const { address, captcha, submit } = await getFormElements(page, this.getCaptchaProvider(config), true);
          await expect(submit).toBeDisabled();
          await address.fill("0x123");
          await captcha.click();
          await page.route(this.getFaucetUrl(config), (route) => route.fulfill({ body: JSON.stringify({ error }) }));
          await submit.click();
          const errorMessage = page.getByTestId("error");
          await expect(errorMessage).toBeVisible();
          expect((await errorMessage.allInnerTexts())[0]).toContain(error);
        });
      });
    });
  }
}
