import { expect, test } from "@playwright/test";

import { readFileSync } from "node:fs";
import {
  appDataSchema,
  defaultPreferences,
  Food,
  makeIngredient,
} from "@mise/domain";
const catalog: Food[] = JSON.parse(
  readFileSync("apps/mobile/src/data/catalog.json", "utf8"),
);
test.beforeEach(async ({ page }) => {
  const draft = {
    id: "fixture-draft",
    title: "Chicken & rice bowls",
    servings: 5,
    yieldGrams: 2000,
    notes: "A sample batch.",
    updatedAt: new Date().toISOString(),
    ingredients: [
      ["171077", 500],
      ["168877", 200],
      ["170000", 150],
      ["170457", 200],
      ["171413", 15],
      ["168462", 100],
    ].map(([source, grams], index) =>
      makeIngredient(
        catalog.find((f) => f.sourceId === source)!,
        Number(grams),
        "g",
        "fixture-" + index,
      ),
    ),
  };
  const data = appDataSchema.parse({
    schemaVersion: 1,
    draft,
    recipes: [],
    batches: [],
    customFoods: [],
    grocerySelection: {},
    groceryChecked: [],
    settings: { convention: "us" },
    preferences: {
      ...defaultPreferences(),
      completedAt: new Date().toISOString(),
    },
  });
  await page.addInitScript((state) => {
    if (window.top !== window) return;
    if (!localStorage.getItem("mise-state-v1"))
      localStorage.setItem("mise-state-v1", JSON.stringify(state));
  }, data);
});
async function backToMeal(page: import("@playwright/test").Page) {
  await page.getByRole("tab", { name: /Home/ }).click();
  await page
    .getByRole("button", { name: "Continue my meal", exact: true })
    .click();
}

async function setProPreview(
  page: import("@playwright/test").Page,
  enabled: boolean,
) {
  const toggle = page.getByRole("button", {
    name: /^(Preview Pro tools in this development build|Turn off development Pro preview)$/,
  });
  await expect(toggle).toBeVisible();
  const active = (await toggle.getAttribute("aria-label")) === "Turn off development Pro preview";
  if (active !== enabled) await toggle.click();
  await expect(toggle).toHaveAccessibleName(
    enabled
      ? "Turn off development Pro preview"
      : "Preview Pro tools in this development build",
  );
}

test("complete offline dish, persistent library, portions, and immutable batch history", async ({
  page,
}) => {
  await page.goto("/cook");
  await expect(page.getByText("Meal builder")).toBeVisible();
  await page.context().setOffline(true);
  await page
    .getByLabel("Dish name", { exact: true })
    .fill("My test chicken bowls");
  await page
    .getByRole("button", { name: "Add ingredient", exact: true })
    .click();
  await page.getByRole("textbox", { name: "Search foods" }).fill("broccoli");
  await page
    .getByRole("button", { name: "Select Broccoli, raw", exact: true })
    .click();
  await page
    .getByRole("textbox", { name: "Quantity", exact: true })
    .fill("200");
  await page.getByRole("button", { name: "Add to dish" }).click();
  await expect(
    page.getByRole("button", { name: "Edit Broccoli, raw" }),
  ).toBeVisible();
  await page.getByRole("textbox", { name: "Number of portions" }).fill("5");
  await page
    .getByRole("textbox", { name: "Finished food weight (g) · optional" })
    .fill("2000");
  await page
    .getByRole("textbox", { name: "Finished food weight (g) · optional" })
    .blur();
  await page.getByRole("button", { name: "Save recipe", exact: true }).click();
  await expect(page.getByText("Recipe saved to your library.")).toBeVisible();
  await page.getByRole("button", { name: "Record this batch" }).click();
  await page
    .getByRole("textbox", { name: "Finished food weight (g) · optional" })
    .fill("1600");
  await page
    .getByRole("textbox", { name: "Finished food weight (g) · optional" })
    .blur();
  await page.getByRole("tab", { name: "Recipes" }).click();
  await expect(
    page.getByText("My test chicken bowls", { exact: true }),
  ).toBeVisible();
  await page.context().setOffline(false);
  await page.reload();
  await expect(
    page.getByText("My test chicken bowls", { exact: true }),
  ).toBeVisible();
  await page.getByText("Cooked batches (1)", { exact: true }).click();
  await expect(
    page.getByText("My test chicken bowls", { exact: true }),
  ).toBeVisible();
  await page.getByText("My test chicken bowls", { exact: true }).click();
  await expect(
    page.getByText("5 containers · 2,000 g cooked yield", { exact: true }),
  ).toBeVisible();
});

test("paste parser requires explicit review and supports ingredient confirmation", async ({
  page,
}) => {
  await page.goto("/cook");
  await page.getByRole("button", { name: "Paste recipe", exact: true }).click();
  await page
    .getByRole("textbox", { name: "Recipe ingredients" })
    .fill("100 g chicken breast\nsalt to taste");
  await page.getByRole("button", { name: "Find ingredients" }).click();
  await expect(
    page.getByRole("button", { name: "Add 0 reviewed ingredients" }),
  ).toBeDisabled();
  await page
    .getByRole("checkbox", { name: "Review 100 g chicken breast", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Add 1 reviewed ingredients" })
    .click();
  await expect(
    page.getByText("1 ingredients added. 1 lines left out."),
  ).toBeVisible();
});

test("mobile layout and calorie scaling preview", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/cook");
  await expect(page.getByText("Meal builder")).toBeVisible();
  await page.screenshot({ path: "artifacts/mise-mobile.png", fullPage: true });
  await page.getByRole("tab", { name: "Settings" }).click();
  await setProPreview(page, true);
  await expect(
    page.getByText(
      "Development Pro preview is active. No purchase has been made.",
    ),
  ).toBeVisible();
  await backToMeal(page);
  await page
    .getByRole("button", { name: "More tools: scaling & PDF", exact: true })
    .click();
  await page.getByRole("button", { name: "Scale recipe", exact: true }).click();
  await page
    .getByRole("textbox", { name: "Calorie target (kcal)" })
    .fill("500");
  await page.getByRole("button", { name: "Create scaled draft" }).click();
  await expect(page.getByLabel("Dish name", { exact: true })).toHaveValue(
    /scaled/,
  );
  await expect(
    page.getByText(
      "No kitchen scale? You can still see the nutrition in each equal portion.",
    ),
  ).toBeVisible();
});

test("grocery generation aggregates weights, subtracts pantry, and persists checks", async ({
  page,
}) => {
  await page.goto("/cook");
  await page.getByRole("button", { name: "Save recipe", exact: true }).click();
  await page.getByRole("tab", { name: "Settings" }).click();
  await setProPreview(page, true);
  await page.getByRole("tab", { name: "Shopping" }).click();
  await page
    .getByRole("checkbox", {
      name: "Include Chicken & rice bowls",
      exact: true,
    })
    .click();
  await page.getByRole("button", { name: "More batches of Chicken & rice bowls", exact: true }).click();
  await expect(page.getByText("2×", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Fewer batches of Chicken & rice bowls", exact: true }).click();
  await page.getByRole("button", { name: /Build grocery list/ }).click();
  await expect(page.getByRole("progressbar", { name: "Shopping progress" })).toHaveAttribute("aria-valuenow", "0");
  await expect(
    page.getByText("500 g required · Poultry Products", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("textbox", { name: "Already in pantry (g)" })
    .filter({ visible: true })
    .first()
    .fill("50");
  await page
    .getByRole("textbox", { name: "Already in pantry (g)" })
    .filter({ visible: true })
    .first()
    .blur();
  await page
    .getByRole("checkbox", {
      name: "Purchased Chicken breast, raw",
      exact: true,
    })
    .click();
  await expect(
    page.getByRole("checkbox", {
      name: "Purchased Chicken breast, raw",
      exact: true,
    }),
  ).toBeChecked();
  await expect(page.getByRole("progressbar", { name: "Shopping progress" })).toHaveAttribute("aria-valuenow", "1");
  await page.reload();
  await expect(
    page.getByRole("checkbox", {
      name: "Purchased Chicken breast, raw",
      exact: true,
    }),
  ).toBeChecked();
});

test("shopping starts with a recipe and preserves Pro access requirements", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await page.goto("/grocery");
  await expect(page.getByTestId("shopping-empty-state")).toBeVisible();
  await expect(page.getByRole("button", { name: /Build grocery list/ })).toHaveCount(0);
  await page.getByRole("button", { name: "Create your first recipe", exact: true }).click();
  await expect(page.getByRole("textbox", { name: "Dish name", exact: true })).toHaveValue("Chicken & rice bowls");
  await page.getByRole("button", { name: "Save recipe", exact: true }).click();
  await page.getByRole("tab", { name: "Shopping" }).click();
  await page.getByRole("checkbox", { name: "Include Chicken & rice bowls", exact: true }).click();
  await expect(page.getByText("Subscriptions are not available in this build yet.", { exact: false })).toBeVisible();
  await page.getByRole("button", { name: "Close dialog", exact: true }).click();
  await expect(page.getByRole("checkbox", { name: "Include Chicken & rice bowls", exact: true })).not.toBeChecked();
  await page.getByRole("tab", { name: "Settings" }).click();
  await setProPreview(page, true);
  await page.getByRole("tab", { name: "Shopping" }).click();
  await expect(page.getByRole("button", { name: /Build grocery list/ })).toBeDisabled();
  await page.getByRole("checkbox", { name: "Include Chicken & rice bowls", exact: true }).click();
  await expect(page.getByRole("button", { name: /Build grocery list/ })).toBeEnabled();
  await page.getByRole("button", { name: "Fewer batches of Chicken & rice bowls", exact: true }).click();
  await expect(page.getByRole("checkbox", { name: "Include Chicken & rice bowls", exact: true })).not.toBeChecked();
  await expect(page.getByRole("button", { name: /Build grocery list/ })).toBeDisabled();
});

test("portable backup exports and imports actual local data", async ({
  page,
}) => {
  await page.goto("/cook");
  await page
    .getByRole("textbox", { name: "Dish name", exact: true })
    .fill("Backup proof");
  await page.getByRole("tab", { name: "Settings" }).click();
  const downloadEvent = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Export backup", exact: true })
    .click();
  const download = await downloadEvent;
  const backupPath = await download.path();
  await backToMeal(page);
  await page
    .getByRole("textbox", { name: "Dish name", exact: true })
    .fill("Changed after backup");
  await page.getByRole("tab", { name: "Settings" }).click();
  const chooserEvent = page.waitForEvent("filechooser");
  await page
    .getByRole("button", { name: "Import backup", exact: true })
    .click();
  const chooser = await chooserEvent;
  await chooser.setFiles(backupPath!);
  await page
    .getByRole("button", { name: "Replace with this backup", exact: true })
    .click();
  await expect(
    page.getByText("Your kitchen has been restored.", { exact: true }),
  ).toBeVisible();
  await backToMeal(page);
  await expect(
    page.getByRole("textbox", { name: "Dish name", exact: true }),
  ).toHaveValue("Backup proof");
});

test("macro card opens a printable document with recipe nutrition", async ({
  page,
}) => {
  await page.context().addInitScript(() => {
    window.print = () => {};
  });
  await page.goto("/cook");
  await page.getByRole("tab", { name: "Settings" }).click();
  await setProPreview(page, true);
  await backToMeal(page);
  const popupEvent = page.waitForEvent("popup");
  await page
    .getByRole("button", { name: "More tools: scaling & PDF", exact: true })
    .click();
  await page.getByRole("button", { name: "Macro PDF", exact: true }).click();
  const popup = await popupEvent;
  await expect(
    popup.getByRole("heading", { name: "Chicken & rice bowls", exact: true }),
  ).toBeVisible();
  await expect(popup.getByText("PER CONTAINER", { exact: true })).toBeVisible();
  await popup.pdf({
    path: "artifacts/mise-macro-card.pdf",
    format: "A4",
    printBackground: true,
  });
  await popup.screenshot({
    path: "artifacts/mise-macro-card.png",
    fullPage: true,
  });
});

test("desktop layout renders without runtime errors", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await page.goto("/cook");
  await expect(page.getByText("Meal builder")).toBeVisible();
  await page.screenshot({ path: "artifacts/mise-desktop.png", fullPage: true });
  expect(errors).toEqual([]);
});

test("free recipe slots block only the fourth new master save", async ({
  page,
}) => {
  await page.goto("/cook");
  await page.getByRole("tab", { name: "Settings" }).click();
  await setProPreview(page, false);
  await backToMeal(page);
  for (let index = 0; index < 3; index++) {
    await page
      .getByRole("textbox", { name: "Dish name", exact: true })
      .fill(`Saved dish ${index + 1}`);
    await page
      .getByRole("button", { name: "Save recipe", exact: true })
      .click();
    await expect(
      page.getByText("Recipe saved to your library.", { exact: true }),
    ).toBeVisible();
    await page.getByRole("tab", { name: "Recipes" }).click();
    await page
      .getByRole("button", { name: "Make a copy", exact: true })
      .first()
      .click();
  }
  await page
    .getByRole("textbox", { name: "Dish name", exact: true })
    .fill("Fourth dish");
  await page.getByRole("button", { name: "Save recipe", exact: true }).click();
  await expect(
    page.getByText("Mise Pro", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Close dialog", exact: true }).click();
  await page.getByRole("tab", { name: "Recipes" }).click();
  await expect(
    page.getByText("3 of 3 free slots used", { exact: true }),
  ).toBeVisible();
});
