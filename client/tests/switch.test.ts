import { expect, test } from "@playwright/test";

type Network = { name: string; url: string };

export const networks: Network[] = [
  { name: "Rococo", url: "/" },
  { name: "Westend", url: "/westend" },
];

const networkSelectId = "network-select";

function getTestId(network: Network): string {
  return `network-${network.name}`;
}

test.describe("Test network switch component", () => {
  for (const currentNetwork of networks) {
    test(`page for ${currentNetwork.name} loads`, async ({ page }) => {
      await page.goto(currentNetwork.url);
      await expect(page.getByRole("heading", { name: `${currentNetwork.name} Faucet` })).toBeVisible();
    });

    test(`network switch has correct name for ${currentNetwork.url}`, async ({ page }) => {
      await page.goto(currentNetwork.url);
      const selector = page.getByTestId(networkSelectId);
      await expect(selector).toContainText(currentNetwork.name);
    });
  }

  test("network switch shows all available networks", async ({ page }) => {
    await page.goto("/");
    const selector = page.getByTestId(networkSelectId);
    await selector.click();
    for (const network of networks) {
      const link = page.getByTestId(getTestId(network));
      await expect(link).toBeVisible();
      await expect(link).toContainText(network.name);
    }
  });

  test("network switch are not visible by default", async ({ page }) => {
    await page.goto("/");
    for (const network of networks) {
      const link = page.getByTestId(getTestId(network));
      await expect(link).toBeHidden();
    }
  });

  test("network switch contains links", async ({ page }) => {
    await page.goto("/");
    const selector = page.getByTestId(networkSelectId);
    await selector.click();
    for (const network of networks) {
      const link = page.getByTestId(getTestId(network));
      expect(await link.getAttribute("href")).toContain(network.url);
    }
  });
});
