import { expect, test } from "@playwright/test";

test.describe("Embed mode", () => {
  for (const param of ["true", "1"]) {
    test(`?embed=${param} hides chrome`, async ({ page }) => {
      await page.goto(`/?embed=${param}`);

      // Card and submit button should still be visible
      await expect(page.getByTestId("submit-button")).toBeVisible();

      // NavBar, Footer, FAQ should be hidden
      await expect(page.getByTestId("navbar")).toHaveCount(0);
      await expect(page.getByTestId("footer")).toHaveCount(0);
      await expect(page.locator("text=Frequently Asked Questions")).toHaveCount(0);

      // Network dropdowns hidden in embed
      await expect(page.getByTestId("dropdown")).toHaveCount(0);

      // Body should have embed-mode class
      const hasClass = await page.evaluate(() => document.body.classList.contains("embed-mode"));
      expect(hasClass).toBe(true);
    });
  }

  test("without embed param shows full chrome", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByTestId("submit-button")).toBeVisible();
    await expect(page.getByTestId("dropdown")).toBeVisible();

    const hasClass = await page.evaluate(() => document.body.classList.contains("embed-mode"));
    expect(hasClass).toBe(false);
  });
});

test.describe("URL parameters", () => {
  test("?address= prefills the address input", async ({ page }) => {
    const addr = "5E4QQAVoYgmqkLZN5S3JvSqU4HSqEHLCPSPtZNM8PT3na1Tc";
    await page.goto(`/?address=${addr}`);

    const input = page.getByTestId("address");
    await expect(input).toHaveValue(addr);
  });

  test("?network=westend switches to Westend", async ({ page }) => {
    await page.goto("/?network=westend");

    await expect(page.getByRole("heading", { name: "Westend Faucet" })).toBeVisible();
  });

  test("?parachain= sets parachain value", async ({ page }) => {
    await page.goto("/?parachain=1002");
    const network = page.getByTestId("network");
    await expect(network).toHaveValue("1002");
  });

  test("?embed=true&address= works together", async ({ page }) => {
    const addr = "5E4QQAVoYgmqkLZN5S3JvSqU4HSqEHLCPSPtZNM8PT3na1Tc";
    await page.goto(`/?embed=true&address=${addr}`);

    // Embed mode active
    const hasClass = await page.evaluate(() => document.body.classList.contains("embed-mode"));
    expect(hasClass).toBe(true);

    // Address prefilled
    const input = page.getByTestId("address");
    await expect(input).toHaveValue(addr);

    // Dropdowns hidden
    await expect(page.getByTestId("dropdown")).toHaveCount(0);
  });
});

test.describe("networks.json", () => {
  test("returns valid network data", async ({ request }) => {
    const response = await request.get("/networks.json");
    expect(response.ok()).toBe(true);

    const data = await response.json();
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);

    for (const network of data) {
      expect(network).toHaveProperty("network");
      expect(network).toHaveProperty("currency");
      expect(network).toHaveProperty("dripAmount");
      expect(network).toHaveProperty("parachains");
      expect(Array.isArray(network.parachains)).toBe(true);

      for (const chain of network.parachains) {
        expect(chain).toHaveProperty("name");
        expect(chain).toHaveProperty("id");
      }
    }
  });

  test("contains paseo and westend", async ({ request }) => {
    const response = await request.get("/networks.json");
    const data = await response.json();
    const names = data.map((n: { network: string }) => n.network);

    expect(names).toContain("paseo");
    expect(names).toContain("westend");
  });
});
