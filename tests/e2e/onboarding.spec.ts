import { expect, test } from "@playwright/test";
import { completePersonalDetails } from "./helpers/profile";

async function settleAnimations(page: import("@playwright/test").Page) {
  for (const view of await page.getByTestId("entrance-animation").all())
    await expect(view).toHaveCSS("opacity", "1");
}

test("first-run preferences personalize meals, persist, and open a usable portioned recipe", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Tell us about you", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Skip setup for now" })).toHaveCount(0);
  await page.getByRole("button", { name: "Continue to preferences" }).click();
  await expect(page.getByText("Check the highlighted fields to continue.")).toBeVisible();
  await completePersonalDetails(page);
  await page.reload();
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
  await completePersonalDetails(page);
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
    .getByRole("button", { name: "Change my preferences", exact: true })
    .click();
  await page.getByRole("radio", { name: "Gain weight", exact: true }).click();
  await page
    .getByRole("button", { name: "Cancel preferences", exact: true })
    .click();
  await expect(page.getByText("BUILD MUSCLE", { exact: false })).toBeVisible();
  await page.getByRole("button", { name: "Change my preferences", exact: true }).click();
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
  await settleAnimations(page);
  await page.screenshot({ path: "artifacts/mise-profile-intro-desktop.png", fullPage: true });
  await completePersonalDetails(page);
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

test("profile avatar opens Settings and personal edits validate, cancel, and persist offline", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ colorScheme: "dark", reducedMotion: "reduce" });
  await page.goto("/");
  await completePersonalDetails(page, "  Sara  ");
  await page.getByRole("radio", { name: "Gain weight", exact: true }).click();
  await page.getByRole("button", { name: "Skip setup for now", exact: true }).click();
  const avatar = page.getByRole("button", { name: "Open profile settings", exact: true });
  await expect(avatar).toHaveText("S");
  await avatar.click();
  await expect(page.getByRole("heading", { name: "Settings", exact: true })).toBeVisible();
  await expect(page.getByText("GOOD DATA, CLEAR LIMITS", { exact: true })).toHaveCount(0);
  const profile = page.getByTestId("profile-card");
  await expect(profile.getByText("Sara", { exact: true })).toBeVisible();
  await expect(profile.getByText("68.5 kg", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Edit profile", exact: true }).click();
  await page.getByRole("textbox", { name: "Name", exact: true }).fill("Discard me");
  await page.getByRole("button", { name: "Close dialog", exact: true }).click();
  await expect(profile.getByText("Sara", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Edit profile", exact: true }).click();
  await expect(page.getByRole("textbox", { name: "Name", exact: true })).toHaveValue("Sara");
  await page.getByRole("textbox", { name: "Age (years)", exact: true }).fill("0");
  await page.getByRole("button", { name: "Save profile", exact: true }).click();
  await expect(page.getByText("Enter a whole age between 1 and 120.", { exact: true })).toBeVisible();
  await page.context().setOffline(true);
  await page.getByRole("textbox", { name: "Name", exact: true }).fill("Nadia");
  await page.getByRole("textbox", { name: "Age (years)", exact: true }).fill("29");
  await page.getByRole("textbox", { name: "Current weight (kg)", exact: true }).fill("72,4");
  await page.getByRole("textbox", { name: "Height (cm)", exact: true }).fill("172");
  await page.getByRole("button", { name: "Save profile", exact: true }).click();
  await expect(profile.getByText("Nadia", { exact: true })).toBeVisible();
  await expect(profile.getByText("72.4 kg", { exact: true })).toBeVisible();
  await expect(profile.getByText("29 years", { exact: true })).toBeVisible();
  await expect(profile.getByText("172 cm", { exact: true })).toBeVisible();
  await page.screenshot({ path: "artifacts/mise-profile-settings-dark.png" });
  await page.getByRole("tab", { name: /Home/ }).click();
  await expect(avatar).toHaveText("N");
  await expect(page.getByText("GAIN WEIGHT", { exact: true })).toBeVisible();
  await page.context().setOffline(false);
  await page.reload();
  await expect(avatar).toHaveText("N");
  await avatar.click();
  await page.getByRole("button", { name: "Edit profile", exact: true }).click();
  await expect(page.getByRole("textbox", { name: "Name", exact: true })).toHaveValue("Nadia");
  await expect(page.getByRole("textbox", { name: "Current weight (kg)", exact: true })).toHaveValue("72.4");
  await page.getByRole("button", { name: "Close dialog", exact: true }).click();
});
