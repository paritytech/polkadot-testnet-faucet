import { test as base, expect } from "@playwright/test";
import { createTestHostFixture, PASEO_ASSET_HUB } from "@parity/host-api-test-sdk/playwright";

const PRODUCT_BASE = "http://localhost:4173";
// Alice's address re-encoded to Paseo SS58 prefix 0 (default network)
const ALICE_PASEO = "15oF4uVJwmo4TdGW7VfQxNLavjCXviqxT9S1MgbjMNHr6Sp5";
const ALICE_SHORT = `${ALICE_PASEO.slice(0, 8)}...${ALICE_PASEO.slice(-8)}`;

// ── Base fixture: no URL params ──

const { testHost } = createTestHostFixture({
  productUrl: PRODUCT_BASE,
  accounts: ["alice"],
  chain: PASEO_ASSET_HUB,
});

const test = base.extend({ testHost });

test.describe("Host API — account detection", () => {
  test("shows host account name and shortened address", async ({ testHost }) => {
    await testHost.waitForConnection();
    const frame = testHost.productFrame();

    await expect(frame.locator(".host-account-name")).toContainText("Alice");
    await expect(frame.locator(".host-account-addr")).toContainText(ALICE_SHORT);
  });

  test("does not activate embed mode", async ({ testHost }) => {
    await testHost.waitForConnection();
    const frame = testHost.productFrame();

    // Full chrome should be visible
    await expect(frame.getByTestId("submit-button")).toBeVisible();
    const hasClass = await frame.locator("body").evaluate((el: HTMLElement) => el.classList.contains("embed-mode"));
    expect(hasClass).toBe(false);
  });

  test("Other address switches to custom input", async ({ testHost }) => {
    await testHost.waitForConnection();
    const frame = testHost.productFrame();

    await expect(frame.locator(".host-account-name")).toContainText("Alice");
    await frame.locator(".host-account-switch").click();

    // Custom input appears, empty
    const input = frame.getByTestId("address");
    await expect(input).toBeVisible();
    await expect(input).toHaveValue("");
  });

  test("back link returns to host account", async ({ testHost }) => {
    await testHost.waitForConnection();
    const frame = testHost.productFrame();

    // Switch to custom
    await frame.locator(".host-account-switch").click();
    await expect(frame.getByTestId("address")).toBeVisible();

    // Switch back
    await frame.locator(".host-back-link").click();
    await expect(frame.locator(".host-account-name")).toContainText("Alice");
  });
});

// ── ?address= override in host mode ──

const { testHost: testHostWithAddress } = createTestHostFixture({
  productUrl: `${PRODUCT_BASE}/?address=5E4QQAVoYgmqkLZN5S3JvSqU4HSqEHLCPSPtZNM8PT3na1Tc`,
  accounts: ["alice"],
  chain: PASEO_ASSET_HUB,
});

const testAddr = base.extend({ testHost: testHostWithAddress });

test.describe("Host API — ?address= override", () => {
  testAddr("?address= shows custom input with prefilled value", async ({ testHost }) => {
    await testHost.waitForConnection();
    const frame = testHost.productFrame();

    // Should be in "Other address" mode with URL address prefilled
    const input = frame.getByTestId("address");
    await expect(input).toBeVisible();
    await expect(input).toHaveValue("5E4QQAVoYgmqkLZN5S3JvSqU4HSqEHLCPSPtZNM8PT3na1Tc");

    // Back link to host account should still be available
    await expect(frame.locator(".host-back-link")).toBeVisible();
  });
});

// ── ?embed=true in host mode ──

const { testHost: testHostEmbed } = createTestHostFixture({
  productUrl: `${PRODUCT_BASE}/?embed=true`,
  accounts: ["alice"],
  chain: PASEO_ASSET_HUB,
});

const testEmbed = base.extend({ testHost: testHostEmbed });

test.describe("Host API — embed mode in host", () => {
  testEmbed("embed mode hides chrome but shows host account", async ({ testHost }) => {
    await testHost.waitForConnection();
    const frame = testHost.productFrame();

    // Embed mode active
    const hasClass = await frame.locator("body").evaluate((el: HTMLElement) => el.classList.contains("embed-mode"));
    expect(hasClass).toBe(true);

    // Host account still shown
    await expect(frame.locator(".host-account-name")).toContainText("Alice");

    // Network dropdowns hidden
    await expect(frame.getByTestId("dropdown")).toHaveCount(0);
  });
});

// ── ?embed=true&address= combined ──

const { testHost: testHostEmbedAddr } = createTestHostFixture({
  productUrl: `${PRODUCT_BASE}/?embed=true&address=5E4QQAVoYgmqkLZN5S3JvSqU4HSqEHLCPSPtZNM8PT3na1Tc`,
  accounts: ["alice"],
  chain: PASEO_ASSET_HUB,
});

const testEmbedAddr = base.extend({ testHost: testHostEmbedAddr });

test.describe("Host API — embed + address override", () => {
  testEmbedAddr("embed mode with address override shows custom input", async ({ testHost }) => {
    await testHost.waitForConnection();
    const frame = testHost.productFrame();

    // Embed active
    const hasClass = await frame.locator("body").evaluate((el: HTMLElement) => el.classList.contains("embed-mode"));
    expect(hasClass).toBe(true);

    // Custom address mode from URL param
    const input = frame.getByTestId("address");
    await expect(input).toBeVisible();
    await expect(input).toHaveValue("5E4QQAVoYgmqkLZN5S3JvSqU4HSqEHLCPSPtZNM8PT3na1Tc");
  });
});

// ── Account switching ──

const { testHost: testHostMulti } = createTestHostFixture({
  productUrl: PRODUCT_BASE,
  accounts: ["alice", "bob"],
  chain: PASEO_ASSET_HUB,
});

const testMulti = base.extend({ testHost: testHostMulti });

test.describe("Host API — account switching", () => {
  testMulti("switching to bob shows Bob account", async ({ testHost }) => {
    await testHost.waitForConnection();
    const frame = testHost.productFrame();
    await expect(frame.locator(".host-account-name")).toContainText("Alice");

    await testHost.switchAccount("bob");
    await testHost.waitForConnection();
    const frame2 = testHost.productFrame();
    await expect(frame2.locator(".host-account-name")).toContainText("Bob");
  });
});
