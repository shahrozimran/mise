import { expect, test } from "@playwright/test";

async function settleAnimations(page: import("@playwright/test").Page) {
  for (const view of await page.getByTestId("entrance-animation").all())
    await expect(view).toHaveCSS("opacity", "1");
}

test("first-run preferences personalize meals, persist, and open a usable portioned recipe", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "What brings you here?" }),
  ).toBeVisible();
  await settleAnimations(page);
  await page.screenshot({ path: "artifacts/mise-onboarding-mobile.png" });
  await page.getByRole("radio", { name: "Lose weight", exact: true }).click();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page
    .getByRole("radio", { name: "Plant-based / vegan", exact: true })
    .click();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("checkbox", { name: "Peanuts", exact: true }).click();
  await page.getByRole("checkbox", { name: "Soy", exact: true }).click();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("radio", { name: "15 minutes", exact: true }).click();
  await page
    .getByRole("button", { name: "More portions", exact: true })
    .click();
  await settleAnimations(page);
  await page.screenshot({ path: "artifacts/mise-routine-mobile.png" });
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page
    .getByRole("textbox", { name: "What should we call you? (optional)" })
    .fill("Amina");
  await page
    .getByRole("button", { name: "Show my meal ideas", exact: true })
    .click();
  await expect(
    page.getByText("Hello, Amina."),
  ).toBeVisible();
  await expect(
    page.getByRole("button", {
      name: "View 15-minute chickpea bowl",
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", {
      name: "View Peanut & banana oats",
      exact: true,
    }),
  ).toHaveCount(0);
  await settleAnimations(page);
  await page.screenshot({
    path: "artifacts/mise-personalized-home-mobile.png",
    fullPage: true,
  });
  await page.reload();
  await expect(
    page.getByText("Hello, Amina."),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "View 15-minute chickpea bowl", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Use this recipe", exact: true })
    .click();
  await expect(
    page.getByRole("textbox", { name: "Number of portions" }),
  ).toHaveValue("5");
  await expect(page.getByRole("textbox", { name: "Dish name" })).toHaveValue(
    "15-minute chickpea bowl",
  );
  await page.getByRole("tab", { name: /Home/ }).click();
  await page.getByRole("button", { name: "Paste a recipe", exact: true }).click();
  await page.getByRole("button", { name: "Keep working on my meal" }).click();
  await expect(page.getByRole("textbox", { name: "Dish name" })).toHaveValue(
    "15-minute chickpea bowl",
  );
  await page.getByRole("tab", { name: /Home/ }).click();
  await page.getByRole("button", { name: "Paste a recipe", exact: true }).click();
  await page.getByRole("button", { name: "Replace my current meal" }).click();
  await expect(page.getByRole("textbox", { name: "Recipe ingredients" })).toBeVisible();
});

test("setup resumes at the saved step and editing can be canceled", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("radio", { name: "Build muscle", exact: true }).click();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "What feels like you?" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Skip setup for now", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Edit preferences", exact: true })
    .click();
  await page.getByRole("radio", { name: "Gain weight", exact: true }).click();
  await page
    .getByRole("button", { name: "Cancel preferences", exact: true })
    .click();
  await expect(page.getByText("BUILD MUSCLE", { exact: false })).toBeVisible();
  await page.getByRole("button", { name: "Edit preferences", exact: true }).click();
  await page.getByRole("radio", { name: "Gain weight", exact: true }).click();
  for (let step = 0; step < 4; step++)
    await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("button", { name: "Save my preferences", exact: true }).click();
  await expect(page.getByText("GAIN WEIGHT", { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByText("GAIN WEIGHT", { exact: true })).toBeVisible();
});

test("desktop onboarding and reduced-motion layout have no runtime errors", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(
    page.getByRole("radio", { name: "Eat more balanced", exact: true }),
  ).toBeChecked();
  await settleAnimations(page);
  await page.screenshot({
    path: "artifacts/mise-onboarding-desktop.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Skip setup for now" }).click();
  await expect(
    page.getByText("Suggested recipes", { exact: true }),
  ).toBeVisible();
  await settleAnimations(page);
  await page.screenshot({
    path: "artifacts/mise-home-desktop.png",
    fullPage: true,
  });
  expect(errors).toEqual([]);
});
