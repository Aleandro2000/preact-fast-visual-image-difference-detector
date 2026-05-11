import { test, expect } from "@playwright/test";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const fixture = (name: string) => resolve(__dirname, "fixtures", name);

test.describe("Home Page", () => {
  test("renders heading and get started link", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: /fast visual diff detector/i })).toBeVisible();
    const link = page.getByRole("link", { name: /get started/i });
    await expect(link).toBeVisible();
    await link.click();
    await expect(page).toHaveURL("/diff");
  });
});

test.describe("Differentiator Page", () => {
  test("renders upload areas and controls", async ({ page }) => {
    await page.goto("/diff");
    await expect(page.getByRole("heading", { name: /visual diff detector/i })).toBeVisible();
    await expect(page.getByText(/before image/i)).toBeVisible();
    await expect(page.getByText(/after image/i)).toBeVisible();
    await expect(page.getByText(/sensitivity/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /compare images/i })).toBeDisabled();
  });

  test("uploads two images and runs comparison", async ({ page }) => {
    await page.goto("/diff");

    const beforePath = fixture("before.png");
    const afterPath = fixture("after.png");

    const fileInputs = page.locator('input[type="file"]');
    await fileInputs.nth(0).setInputFiles(beforePath);
    await fileInputs.nth(1).setInputFiles(afterPath);

    await expect(page.getByRole("img", { name: /before/i })).toBeVisible();
    await expect(page.getByRole("img", { name: /after/i })).toBeVisible();

    const compareBtn = page.getByRole("button", { name: /compare images/i });
    await expect(compareBtn).toBeEnabled();
    await compareBtn.click();

    await expect(page.getByText(/ms/)).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(/region/i)).toBeVisible();
    await expect(page.getByText(/changed/i)).toBeVisible();
    await expect(page.getByRole("img", { name: /diff result/i })).toBeVisible();
  });

  test("sensitivity slider changes value", async ({ page }) => {
    await page.goto("/diff");
    const slider = page.locator('input[type="range"]');
    await expect(slider).toBeVisible();
    await slider.fill("80");
    await expect(page.getByText(/sensitivity: 80/i)).toBeVisible();
  });

  test("reset clears everything", async ({ page }) => {
    await page.goto("/diff");

    const fileInputs = page.locator('input[type="file"]');
    const beforePath = fixture("before.png");
    await fileInputs.nth(0).setInputFiles(beforePath);
    await expect(page.getByRole("img", { name: /before/i })).toBeVisible();

    await page.getByRole("button", { name: /reset/i }).click();
    await expect(page.getByRole("img", { name: /before/i })).not.toBeVisible();
  });

  test("zoom controls work after comparison", async ({ page }) => {
    await page.goto("/diff");

    const beforePath = fixture("before.png");
    const afterPath = fixture("after.png");
    const fileInputs = page.locator('input[type="file"]');
    await fileInputs.nth(0).setInputFiles(beforePath);
    await fileInputs.nth(1).setInputFiles(afterPath);

    await page.getByRole("button", { name: /compare images/i }).click();
    await expect(page.getByText(/ms/)).toBeVisible({ timeout: 15_000 });

    await expect(page.getByText("100%")).toBeVisible();
    await page.getByRole("button", { name: /zoom in/i }).click();
    await expect(page.getByText("125%")).toBeVisible();
    await page.getByRole("button", { name: /zoom out/i }).click();
    await expect(page.getByText("100%")).toBeVisible();
  });
});
