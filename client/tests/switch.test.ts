import {
	expect,
	test,
	type Frame,
	type FullConfig,
	type Locator,
	type Page
} from "@playwright/test";

export const Networks = [
	{ name: "Rococo", url: "/" },
	{ name: "Westend", url: "/westend" }
];

const networkSelectId = "network-select";

const networkTestId = Networks.map(({ name }) => `network-${name}`);

test.describe("Test network switch component", () => {
	for (let i = 0; i < Networks.length; i++) {
		const network = Networks[i];
		test(`page for ${network.name} loads`, async ({ page }) => {
			await page.goto(network.url);
			await expect(page.getByRole("heading", { name: `${network.name} Faucet` })).toBeVisible();
		});

		test(`network switch has correct name for ${network.url}`, async ({ page }) => {
			await page.goto(network.url);
			const selector = page.getByTestId(networkSelectId);
			await expect(selector).toContainText(network.name);
		});
	}

	test("network switch shows all available networks", async ({ page }) => {
		await page.goto("/");
		const selector = page.getByTestId(networkSelectId);
		await selector.click();
		for (let i = 0; i < networkTestId.length; i++) {
			const link = page.getByTestId(networkTestId[i]);
			await expect(link).toBeVisible();
			await expect(link).toContainText(Networks[i].name);
		}
	});

	test("network switch are not visible by default", async ({ page }) => {
		await page.goto("/");
		for (let i = 0; i < networkTestId.length; i++) {
			const link = page.getByTestId(networkTestId[i]);
			await expect(link).toBeHidden();
		}
	});

	test("network switch contains links", async ({ page }) => {
		await page.goto("/");
		const selector = page.getByTestId(networkSelectId);
		await selector.click();
		for (let i = 0; i < networkTestId.length; i++) {
			const link = page.getByTestId(networkTestId[i]);
			expect(await link.getAttribute("href")).toContain(Networks[i].url);
		}
	});
});
