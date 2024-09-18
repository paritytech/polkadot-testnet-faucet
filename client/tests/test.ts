import {
	type Frame,
	type FullConfig,
	type Locator,
	type Page,
	expect,
	test
} from "@playwright/test";

const chains = [{ name: "Frequency Rococo Testnet Chain", id: -1 }];

type FormSubmit = {
	address: string;
	recaptcha: string;
	parachain_id?: string;
};

const testAddress = '5G3r2K1cEi4vtdBjMNHpjWCofRdyg2AFSdVVxMGkDGvuJgaG';

const getFormElements = async (page: Page, getCaptcha = false) => {
	let captcha: Locator = {} as Locator;
	if (getCaptcha) {
		// ?: Hack. We need to wait for the frame to load and then invade it.
		await page.reload();
		const captchaFrame = await new Promise<Frame>((resolve, reject) => {
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

const dropdownId = "dropdown";

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
		const { address, network, captcha } = await getFormElements(page, true);
		await expect(address).toBeVisible();
		await expect(network).toBeHidden();
		await expect(captcha).toBeVisible();
	});

	test("page loads with default value in parachain field", async ({ page }) => {
		await page.goto(`/`);
		const { network } = await getFormElements(page);
		await expect(network).toHaveValue("-1");
	});

	test("page with get parameter loads with value in parachain field", async ({ page }) => {
		const parachainId = "1234";
		await page.goto(`/?parachain=${parachainId}`);
		const { network } = await getFormElements(page);
		await expect(network).toHaveValue(parachainId);
	});

	test("page has captcha", async ({ page }) => {
		await page.goto("/");
		const { captcha } = await getFormElements(page, true);
		await expect(captcha).toBeVisible();
	});
});

test.describe("form interaction", () => {
	test("submit form becomes valid on data entry", async ({ page }) => {
		await page.goto("/");
		const { address, captcha, submit } = await getFormElements(page, true);
		await expect(submit).toBeDisabled();
		await address.fill(testAddress);
		await captcha.click();
		await expect(submit).toBeEnabled();
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

	for (let i = 1; i < chains.length; i++) {
		const chain = chains[i];
		test(`sends data with ${chain.name} chain on submit`, async ({ page }, { config }) => {
			await page.goto("/");
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

	// test("display link to transaction", async ({ page }, { config }) => {
	// 	await page.goto("/");
	// 	const operationHash = "0x0123435423412343214";
	// 	const { address, captcha, submit } = await getFormElements(page, true);
	// 	await expect(submit).toBeDisabled();
	// 	const myAddress = "0x000000001";
	// 	await address.fill(myAddress);
	// 	await captcha.click();
	// 	await page.route(getFaucetUrl(config), (route) =>
	// 		route.fulfill({
	// 			body: JSON.stringify({ hash: operationHash })
	// 		})
	// 	);
	// 	await submit.click();
	// 	const transactionLink = page.getByTestId("success-button");
	// 	await expect(transactionLink).toBeVisible();
	// 	expect(await transactionLink.getAttribute("href")).toContain(operationHash);
	// });

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
