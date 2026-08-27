import { test, expect } from "@playwright/test";

test.describe("Public pages (English)", () => {
  test("landing page loads", async ({ page }) => {
    await page.goto("/en");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("login page loads", async ({ page }) => {
    await page.goto("/en/login");
    await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible();
  });

  test("register page loads", async ({ page }) => {
    await page.goto("/en/register");
    await expect(page.getByText(/customer/i)).toBeVisible();
  });
});

test.describe("Public pages (Hindi)", () => {
  test.use({ locale: "hi-IN" });

  test("Hindi login page loads", async ({ page }) => {
    await page.goto("/hi/login");
    await expect(page.getByRole("button")).toBeVisible();
  });

  test("Hindi landing page loads", async ({ page }) => {
    await page.goto("/hi");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });
});
