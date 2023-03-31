import {
	expect,
	test,
	type Frame,
	type FullConfig,
	type Locator,
	type Page
} from "@playwright/test";

type FormSubmit = {
	address: string;
	recaptcha: string;
	parachain_id?: string;
};

const getFormElements = async (page: Page, getCaptcha = false) => {
	let captcha: Locator = {} as Locator;
	if (getCaptcha) {
		// ?: Hack. We need to wait for the frame to load and then invade it.
		await page.reload();
		const captchaFrame = await new Promise<Frame>(function (resolve, reject) {
			let i = 0;
			// function that waits for the frame and timeouts after 3 seconds
			(function waitForFrame() {
				const captchaFrame = page
					.frames()
					.filter((f) => f.url().includes("https://www.google.com/recaptcha/api2/"));
				if (captchaFrame.length > 0) {
					return resolve(captchaFrame[0]);
				} else {
					i++;
					if (i > 10) {
						reject(new Error("Timout"));
					}
				}
				setTimeout(waitForFrame, 300);
			})();
		});
		captcha = captchaFrame?.locator("#recaptcha-anchor") as Locator;
	}
	return {
		address: page.getByTestId("address"),
		parachain: page.getByTestId("chain-selection"),
		captcha,
		submit: page.getByTestId("submit-button")
	};
};

/**
 * Gets the faucet url from the config file
 * @param config The second value that is given on the tests arrow function
 */
const getFaucetUrl = (config: FullConfig): string => {
	const URL_VAR = "PUBLIC_FAUCET_URL";
	const env = config.webServer?.env;
	if (!env) {
		throw new Error("No env vars in project");
	}
	const faucetUrl = env[URL_VAR];
	if (!faucetUrl) {
		throw new Error(`No env var value found for ${URL_VAR}`);
	}

	return faucetUrl;
};

const modalId = "parachain-modal";

test.describe("on page load", () => {
	test("page has expected header", async ({ page }) => {
		await page.goto("/");
		await expect(page.getByRole("heading", { name: "Rococo Faucet" })).toBeVisible();
	});

	test("page has disabled submit button", async ({ page }) => {
		await page.goto("/");
		const { submit } = await getFormElements(page);
		await expect(submit).toBeVisible();
		await expect(submit).toBeDisabled();
	});

	test("page has form elements", async ({ page }) => {
		await page.goto("/");
		const { address, parachain, captcha } = await getFormElements(page, true);
		await expect(address).toBeVisible();
		await expect(parachain).toBeVisible();
		await expect(captcha).toBeVisible();
	});

	test("page loads with default value in parachain field", async ({ page }) => {
		await page.goto(`/`);
		const { parachain } = await getFormElements(page);
		await expect(parachain).toContainText("Relay Chain");
	});

	test("page with get parameter loads with value in parachain field", async ({ page }) => {
		const parachainId = "1234";
		await page.goto(`/?parachain=${parachainId}`);
		const { parachain } = await getFormElements(page);
		await expect(parachain).toContainText(parachainId);
	});

	test("page has captcha", async ({ page }) => {
		await page.goto("/");
		const { captcha } = await getFormElements(page, true);
		await expect(captcha).toBeVisible();
	});
});

test.describe("modal interaction", () => {
	test("modal appears on click", async ({ page }) => {
		await page.goto("/");
		const { parachain } = await getFormElements(page);
		const modal = page.getByTestId(modalId);
		await expect(modal).not.toBeVisible();
		await parachain.click();
		await expect(modal).toBeVisible();
	});

	test("modal closes on network click", async ({ page }) => {
		await page.goto("/");
		const { parachain } = await getFormElements(page);
		const modal = page.getByTestId(modalId);
		await parachain.click();
		await expect(modal).toBeVisible();
		const contractsNetwork = page.getByRole("button", { name: "Contracts" });
		await expect(contractsNetwork).toBeVisible();
		await contractsNetwork.click();
		await expect(modal).not.toBeVisible();
	});

	test("network changes on modal selection", async ({ page }) => {
		await page.goto("/");
		const { parachain } = await getFormElements(page);
		const modal = page.getByTestId(modalId);
		await parachain.click();
		await expect(modal).toBeVisible();
		const contractsNetwork = page.getByRole("button", { name: "Contracts" });
		await contractsNetwork.click();
		await expect(parachain).toContainText("Contracts");
	});

	test.describe("Custom networks", () => {
		let parachain: Locator;
		let modal: Locator;
		let customField: Locator;
		let customChainBtn: Locator;

		// does everything until opening the modal
		test.beforeEach(async ({ page }) => {
			await page.goto("/");
			parachain = (await getFormElements(page)).parachain;
			modal = page.getByTestId(modalId);
			await parachain.click();
			await expect(modal).toBeVisible();
			customField = page.getByPlaceholder("Parachain id");
			customChainBtn = page.getByRole("button", { name: "Custom chain" });
			await expect(customField).toHaveValue("");
			await expect(customChainBtn).toBeDisabled();
		});

		for (const value of ["12", "234", "211"]) {
			test(`btn is disabled with value '${value}' that is lower than 1000`, async () => {
				await customField.fill(value);
				await expect(customChainBtn).toBeDisabled();
			});
		}

		for (const value of ["1432", "2411", "99999"]) {
			test(`btn is enabled with value '${value}' that is higher than 1000`, async () => {
				await customField.fill(value);
				await expect(customChainBtn).not.toBeDisabled();
			});
		}

		for (const value of ["asd", "123d", "23f5", "po312"]) {
			test(`btn is disabled with value '${value}' which contains letters`, async () => {
				await customField.type(value);
				await expect(customChainBtn).toBeDisabled();
			});
		}

		test("network changes on custom network selection", async ({ page }) => {
			await customField.fill("9990");
			const customChainBtn = page.getByRole("button", { name: "Custom chain" });
			await customChainBtn.click();
			await expect(parachain).toContainText("9990");
		});
	});
});

test.describe("form interaction", () => {
	test("submit form becomes valid on data entry", async ({ page }) => {
		await page.goto("/");
		const { address, captcha, submit } = await getFormElements(page, true);
		await expect(submit).toBeDisabled();
		await address.fill("address");
		await captcha.click();
		await expect(submit).not.toBeDisabled();
	});

	test("sends data on submit", async ({ page }, { config }) => {
		await page.goto("/");
		const { address, captcha, submit } = await getFormElements(page, true);
		await expect(submit).toBeDisabled();
		const myAddress = "0x000000001";
		await address.fill(myAddress);
		await captcha.click();
		const url = getFaucetUrl(config);
		await page.route(url, (route) =>
			route.fulfill({
				body: JSON.stringify({ hash: "hash" })
			})
		);

		const request = page.waitForRequest((req) => {
			if (req.url() === url) {
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

	test("sends data with default custom chain on submit", async ({ page }, { config }) => {
		await page.goto("/");
		const { address, parachain, captcha, submit } = await getFormElements(page, true);
		await expect(submit).toBeDisabled();
		await captcha.click();
		const myAddress = "0x000000002";
		await address.fill(myAddress);
		await parachain.click();
		const contractsNetwork = page.getByRole("button", { name: "Contracts" });
		await contractsNetwork.click();
		await expect(submit).toBeEnabled();
		const url = getFaucetUrl(config);
		await page.route(url, (route) =>
			route.fulfill({
				body: JSON.stringify({ hash: "hash" })
			})
		);

		const request = page.waitForRequest((req) => {
			if (req.url() === url) {
				const data = req.postDataJSON() as FormSubmit;
				expect(data).toMatchObject({ address: myAddress, parachain_id: "1002" });
				return !!data.recaptcha;
			}
			return false;
		});

		await submit.click();
		await request;
	});

	test("sends data with custom chain on submit", async ({ page }, { config }) => {
		await page.goto("/");
		const { address, parachain, captcha, submit } = await getFormElements(page, true);
		await expect(submit).toBeDisabled();
		await captcha.click();
		const myAddress = "0x000000002";
		await address.fill(myAddress);
		await parachain.click();
		const customField = page.getByPlaceholder("Parachain id");
		const customChainBtn = page.getByRole("button", { name: "Custom chain" });
		await customField.fill("9343");
		await customChainBtn.click();
		await expect(submit).toBeEnabled();
		const url = getFaucetUrl(config);
		await page.route(url, (route) =>
			route.fulfill({
				body: JSON.stringify({ hash: "hash" })
			})
		);

		const request = page.waitForRequest((req) => {
			if (req.url() === url) {
				const data = req.postDataJSON() as FormSubmit;
				expect(data).toMatchObject({ address: myAddress, parachain_id: "9343" });
				return !!data.recaptcha;
			}
			return false;
		});

		await submit.click();
		await request;
	});

	test("display link to transaction", async ({ page }, { config }) => {
		await page.goto("/");
		const operationHash = "0x0123435423412343214";
		const { address, captcha, submit } = await getFormElements(page, true);
		await expect(submit).toBeDisabled();
		const myAddress = "0x000000001";
		await address.fill(myAddress);
		await captcha.click();
		await page.route(getFaucetUrl(config), (route) =>
			route.fulfill({
				body: JSON.stringify({ hash: operationHash })
			})
		);
		await submit.click();
		const transactionLink = page.getByText("Click here to see the transaction");
		await expect(transactionLink).toBeVisible();
		expect(await transactionLink.getAttribute("href")).toContain(operationHash);
	});

	test("throw error", async ({ page }, { config }) => {
		await page.goto("/");
		const error = "Things failed because you are a naughty boy!";
		const { address, captcha, submit } = await getFormElements(page, true);
		await expect(submit).toBeDisabled();
		await address.fill("0x123");
		await captcha.click();
		await page.route(getFaucetUrl(config), (route) =>
			route.fulfill({
				body: JSON.stringify({ error })
			})
		);
		await submit.click();
		const errorMessage = page.getByTestId("error");
		await expect(errorMessage).toBeVisible();
		await expect((await errorMessage.allInnerTexts())[0]).toContain(error);
	});
});
