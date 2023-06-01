import {
	expect,
	test,
	type Frame,
	type FullConfig,
	type Locator,
	type Page
} from "@playwright/test";

const chains = [
	{ name: "Westend Relay Chain", id: -1 },
	{ name: "Westmint", id: 1000 },
	{ name: "Collectives", id: 1001 }
];

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
		network: page.getByTestId("network"),
		captcha,
		submit: page.getByTestId("submit-button"),
		dropdown: page.getByTestId("dropdown")
	};
};

/**
 * Gets the faucet url from the config file
 * @param config The second value that is given on the tests arrow function
 */
const getFaucetUrl = (config: FullConfig): string => {
	const URL_VAR = "PUBLIC_FAUCET_WESTEND_URL";
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

const dropdownId = "dropdown";

test.describe("on page load", () => {
	test("page has expected header", async ({ page }) => {
		await page.goto("/westend");
		await expect(page.getByRole("heading", { name: "Westend Faucet" })).toBeVisible();
	});

	test("page has disabled submit button", async ({ page }) => {
		await page.goto("/westend");
		const { submit } = await getFormElements(page);
		await expect(submit).toBeVisible();
		await expect(submit).toBeDisabled();
	});

	test("page has form elements", async ({ page }) => {
		await page.goto("/westend");
		const { address, network, captcha } = await getFormElements(page, true);
		await expect(address).toBeVisible();
		await expect(network).toBeHidden();
		await expect(captcha).toBeVisible();
	});

	test("page loads with default value in parachain field", async ({ page }) => {
		await page.goto("/westend");
		const { network } = await getFormElements(page);
		await expect(network).toHaveValue("-1");
	});

	test("page with get parameter loads with value in parachain field", async ({ page }) => {
		const parachainId = "1234";
		await page.goto(`/westend?parachain=${parachainId}`);
		const { network } = await getFormElements(page);
		await expect(network).toHaveValue(parachainId);
	});

	test("page has captcha", async ({ page }) => {
		await page.goto("/westend");
		const { captcha } = await getFormElements(page, true);
		await expect(captcha).toBeVisible();
	});
});

test.describe("dropdown interaction", () => {
	const networkName = "Westmint";
	test("dropdown appears on click", async ({ page }) => {
		await page.goto("/westend");
		const dropdown = page.getByTestId(dropdownId);
		await expect(dropdown).toBeVisible();
		await expect(page.getByText(networkName)).toBeHidden();
		await dropdown.click();
		await expect(page.getByText(networkName)).toBeVisible();
	});

	test("dropdown closes on network selection", async ({ page }) => {
		await page.goto("/westend");
		const dropdown = page.getByTestId(dropdownId);
		await expect(dropdown).toBeVisible();
		const networkBtn = page.getByTestId("network-1");
		await dropdown.click();
		await expect(networkBtn).toBeVisible();
		await networkBtn.click();
		await expect(networkBtn).not.toBeVisible();
	});

	test("network changes on modal selection", async ({ page }) => {
		await page.goto("/westend");
		const dropdown = page.getByTestId(dropdownId);
		const { network } = await getFormElements(page);
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

	test.beforeEach(async ({ page }) => {
		await page.goto("/westend");
		network = (await getFormElements(page)).network;
		customChainDiv = page.getByTestId("custom-network-button");
		await expect(customChainDiv).toBeEnabled();
		await expect(customChainDiv).toContainText("Use custom chain id");
		await customChainDiv.click();
		expect(network).toBeVisible();
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
	test("submit form becomes valid on data entry", async ({ page }) => {
		await page.goto("/westend");
		const { address, captcha, submit } = await getFormElements(page, true);
		await expect(submit).toBeDisabled();
		await address.fill("address");
		await captcha.click();
		await expect(submit).toBeEnabled();
	});

	test("sends data on submit", async ({ page }, { config }) => {
		await page.goto("/westend");
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

	for (let i = 1; i < chains.length; i++) {
		const chain = chains[i];
		test(`sends data with ${chain.name} chain on submit`, async ({ page }, { config }) => {
			await page.goto("/westend");
			const { address, captcha, submit } = await getFormElements(page, true);
			const dropdown = page.getByTestId(dropdownId);
			await expect(submit).toBeDisabled();
			const myAddress = "0x000000002";
			await address.fill(myAddress);
			await dropdown.click();
			const networkBtn = page.getByTestId(`network-${i}`);
			await expect(networkBtn).toBeVisible();
			await networkBtn.click();
			await captcha.click();
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
		await page.goto("/westend");
		const { address, network, captcha, submit } = await getFormElements(page, true);
		await expect(submit).toBeDisabled();
		const myAddress = "0x000000002";
		await address.fill(myAddress);
		const customChainDiv = page.getByTestId("custom-network-button");
		await customChainDiv.click();
		await network.fill("9999");
		await captcha.click();
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
				expect(data).toMatchObject({ address: myAddress, parachain_id: "9999" });
				return !!data.recaptcha;
			}
			return false;
		});

		await submit.click();
		await request;
	});

	test("display link to transaction", async ({ page }, { config }) => {
		await page.goto("/westend");
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
		const transactionLink = page.getByTestId("success-button");
		await expect(transactionLink).toBeVisible();
		expect(await transactionLink.getAttribute("href")).toContain(operationHash);
	});

	test("throw error", async ({ page }, { config }) => {
		await page.goto("/westend");
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
