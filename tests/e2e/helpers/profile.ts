import { Page } from "@playwright/test";

export async function completePersonalDetails(page: Page, name = "Amina") {
  await page.getByRole("textbox", { name: "Name", exact: true }).fill(name);
  await page.getByRole("textbox", { name: "Age (years)", exact: true }).fill("28");
  await page.getByRole("textbox", { name: "Current weight (kg)", exact: true }).fill("68.5");
  await page.getByRole("textbox", { name: "Height (cm)", exact: true }).fill("170");
  await page.getByRole("button", { name: "Continue to preferences", exact: true }).click();
}
