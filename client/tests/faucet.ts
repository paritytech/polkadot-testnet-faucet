import { expect, type Frame, type FullConfig, type Locator, type Page, test } from "@playwright/test";

type FormSubmit = {
  address: string;
  recaptcha: string;
  parachain_id?: string;
};

const getFormElements = async (page: Page, getCaptcha = false) => {
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  let captcha: Locator = {} as Locator;
  if (getCaptcha) {
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
  readonly teleportEnabled: boolean;

  constructor(params: {
    url: string;
    faucetName: string;
    chains: { name: string; id: number }[];
    expectTransactionLink: boolean;
    teleportEnabled: boolean;
  }) {
    this.chains = params.chains;
    this.faucetName = params.faucetName;
    this.url = params.url;
    this.expectTransactionLink = params.expectTransactionLink;
    this.teleportEnabled = params.teleportEnabled;
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

  runTests(): void {
    test.describe(`${this.faucetName} tests`, () => {
      test.describe("on page load", () => {
        test("page has expected header", async ({ page }) => {
          await page.goto(this.url);
          await expect(page.getByRole("heading", { name: this.faucetName })).toBeVisible();
        });

        test("page has disabled submit button", async ({ page }) => {
          await page.goto(this.url);
          const { submit } = await getFormElements(page);
          await expect(submit).toBeVisible();
          await expect(submit).toBeDisabled();
        });

        test("page has form elements", async ({ page }) => {
          await page.goto(this.url);
          const { address, network, captcha } = await getFormElements(page, true);
          await expect(address).toBeVisible();
          await expect(network).toBeHidden();
          await expect(captcha).toBeVisible();
        });

        if (this.teleportEnabled) {
          test("page loads with default value in parachain field", async ({ page }) => {
            await page.goto(this.url);
            const { network } = await getFormElements(page);
            await expect(network).toHaveValue("-1");
          });

          test("page with get parameter loads with value in parachain field", async ({ page }) => {
            const parachainId = "1234";
            await page.goto(`${this.url}?parachain=${parachainId}`);
            const { network } = await getFormElements(page);
            await expect(network).toHaveValue(parachainId);
          });
        }

        test("page has captcha", async ({ page }) => {
          await page.goto(this.url);
          const { captcha } = await getFormElements(page, true);
          await expect(captcha).toBeVisible();
        });
      });

      test.describe("dropdown interaction", () => {
        if (!this.teleportEnabled) {
          test("dropdown should be hidden", async ({ page }) => {
            await page.goto(this.url);

            const count = await page.getByTestId(this.dropdownId).count();
            expect(count).toEqual(0);
          });
        }

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

        test("network changes on modal selection", async ({ page }) => {
          await page.goto(this.url);
          const dropdown = page.getByTestId(this.dropdownId);
          const { network } = await getFormElements(page);
          await expect(dropdown).toBeVisible();
          const networkBtn = page.getByTestId("network-1");
          await dropdown.click();
          await expect(networkBtn).toBeVisible();
          await networkBtn.click();
          await expect(networkBtn).not.toBeVisible();
          await expect(network).toHaveValue(String(this.chains[1].id));
        });
      });

      if (this.teleportEnabled) {
        test.describe("Custom networks", () => {
          let network: Locator;
          let customChainDiv: Locator;

          test.beforeEach(async ({ page }) => {
            await page.goto(this.url);
            network = (await getFormElements(page)).network;
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
      }

      test.describe("form interaction", () => {
        test("submit form becomes valid on data entry", async ({ page }) => {
          await page.goto(this.url);
          const { address, captcha, submit } = await getFormElements(page, true);
          await expect(submit).toBeDisabled();
          await address.fill("address");
          await captcha.click();
          await expect(submit).toBeEnabled();
        });

        test("sends data on submit", async ({ page }, { config }) => {
          await page.goto(this.url);
          const { address, captcha, submit } = await getFormElements(page, true);
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
              return !!data.recaptcha;
            }
            return false;
          });
          await submit.click();
          // verify that the post request is correct
          await request;
        });

        if (this.teleportEnabled) {
          for (let i = 1; i < this.chains.length; i++) {
            const chain = this.chains[i];
            test(`sends data with ${chain.name} chain on submit`, async ({ page }, { config }) => {
              await page.goto(this.url);
              const { address, captcha, submit } = await getFormElements(page, true);
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
                  return !!data.recaptcha;
                }
                return false;
              });

              await submit.click();
              await request;
            });
          }

          test("sends data with custom chain on submit", async ({ page }, { config }) => {
            await page.goto(this.url);
            const { address, network, captcha, submit } = await getFormElements(page, true);
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
                return !!data.recaptcha;
              }
              return false;
            });

            await submit.click();
            await request;
          });
        }

        test("display link to transaction", async ({ page }, { config }) => {
          await page.goto(this.url);
          const operationHash = "0x0123435423412343214";
          const { address, captcha, submit } = await getFormElements(page, true);
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
          const { address, captcha, submit } = await getFormElements(page, true);
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
