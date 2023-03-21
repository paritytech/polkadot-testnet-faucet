import { expect, test, type Frame, type Locator, type Page } from "@playwright/test";

// test.use({ headless: false });

const TEST_URL = 'https://example.com/test';

type FormSubmit = {
	address: string;
	recaptcha: string;
	parachain_id?: string;
}

const getFormElements = async (page: Page, getCaptcha = false) => {
	let captcha: Locator = {} as Locator;
	if (getCaptcha) {
		await page.reload();

		const captchaFrame = await new Promise<Frame>(function (resolve, reject) {
			let i = 0;
			(function waitForFrame() {
				const captchaFrame = page.frames().filter((f) =>
					f.url().includes("https://www.google.com/recaptcha/api2/")
				);
				if (captchaFrame.length > 0) {
					return resolve(captchaFrame[0]);
				}
				else {
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
		address: page.getByPlaceholder("Enter your address"),
		useParachain: page.getByLabel("Use parachain"),
		parachain: page.getByPlaceholder("Using Relay chain"),
		captcha,
		submit: page.getByRole("button", { name: "Submit" })
	}
}

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
	const { address, useParachain, parachain, captcha } = await getFormElements(page, true);
	await expect(address).toBeVisible();
	await expect(useParachain).toBeVisible();
	await expect(useParachain).not.toBeChecked();
	await expect(parachain).toBeVisible();
	await expect(parachain).toBeDisabled();
	await expect(captcha).toBeVisible();
});

test("page with get parameter loads value in parachain", async ({ page }) => {
	const parachainId = "1234";
	await page.goto(`/?parachain=${parachainId}`);
	const { useParachain } = await getFormElements(page);
	await expect(useParachain).toBeChecked();
	await expect(page.getByPlaceholder("Parachain id")).toHaveValue(parachainId);
});

test("page has captcha", async ({ page }) => {
	await page.goto("/");
	const { captcha } = await getFormElements(page, true);
	await expect(captcha).toBeVisible();
});

test("submit form becomes valid on data entry", async ({ page }) => {
	await page.goto("/");
	const { address, captcha, submit } = await getFormElements(page, true);
	await expect(submit).toBeDisabled();
	await address.fill("address");
	await captcha.click();
	await expect(submit).not.toBeDisabled();
});

test("sends data on submit", async ({ page }) => {
	await page.goto("/");
	const { address, captcha, submit } = await getFormElements(page, true);
	await expect(submit).toBeDisabled();
	const myAddress = "0x000000001"
	await address.fill(myAddress);
	await captcha.click();
	await page.route(TEST_URL, route => route.fulfill({
		status: 201,
		body: JSON.stringify({ hash: "ABCDEF" }),
	}));
	const request = page.waitForRequest(req => {
		if (req.url() === TEST_URL) {
			const data = req.postDataJSON() as FormSubmit;
			return data.address === myAddress && data.recaptcha !== "";
		}
		return false;
	});
	await submit.click();
	await request;
});

test("sends data with chain on submit", async ({ page }) => {
	await page.goto("/");
	const { address, useParachain, captcha, submit } = await getFormElements(page, true);
	await expect(submit).toBeDisabled();
	await captcha.click();
	const myAddress = "0x000000001"
	await address.fill(myAddress);
	await useParachain.click();
	await (page.getByPlaceholder("Parachain id")).fill("1001");
	await expect(submit).toBeEnabled();
	await page.route(TEST_URL, route => route.fulfill({
		status: 201,
		body: JSON.stringify({ hash: "ABCDEF" }),
	}));

	const request = page.waitForRequest(req => {
		if (req.url() === TEST_URL) {
			const data = req.postDataJSON() as FormSubmit;
			expect(data).toMatchObject({address:myAddress, parachain_id: "1001"});
			return !!data.recaptcha;
		}
		return false;
	});
	await submit.click();
	await request;
});
