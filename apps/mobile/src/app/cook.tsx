import { useState } from "react";
import { Pressable, TextInput, useWindowDimensions, View } from "react-native";
import {
  calculateRecipe,
  clone,
  equalPortion,
  formatNumber,
  Ingredient,
  multiplyNutrients,
  scaleRecipe,
  weighedPortion,
} from "@mise/domain";
import { blankRecipe, id, useKitchen } from "../data/store";
import {
  Button,
  Card,
  Chip,
  useTheme,
  Eyebrow,
  Field,
  Icon,
  Muted,
  Notice,
  Page,
  Row,
  useStyles,
  Sheet,
  Txt,
} from "../components/ui";
import { Macros, MiniMacros } from "../components/Macros";
import { FoodPicker } from "../components/FoodPicker";
import { PasteRecipe } from "../components/PasteRecipe";
import { CustomFood } from "../components/CustomFood";
import { BarcodeScanner } from "../components/BarcodeScanner";
import { ProSheet } from "../components/ProSheet";
import { useBilling } from "../services/billing";
import { exportMacroCard } from "../services/export";
import { router, useLocalSearchParams } from "expo-router";

export default function Kitchen() {
  const draftId = useKitchen((state) => state.data!.draft.id);
  return <KitchenEditor key={draftId} />;
}
function KitchenEditor() {
  const { colors } = useTheme();
  const s = useStyles();
  const {
    data,
    updateDraft,
    saveRecipe,
    addIngredient,
    removeIngredient,
    saving,
    error,
  } = useKitchen();
  const draft = data!.draft;
  const { width } = useWindowDimensions();
  const wide = width > 800;
  const pro = useBilling((state) => state.pro || state.preview);
  const params = useLocalSearchParams<{ action?: string }>();
  const [modal, setModal] = useState<
    "food" | "paste" | "custom" | "scan" | "scale" | "pro" | "new" | null
  >(null);
  const [extraTools, setExtraTools] = useState(false);
  const [barcodeForLabel, setBarcodeForLabel] = useState<string | undefined>();
  const [showNotes, setShowNotes] = useState(false);
  const [edit, setEdit] = useState<Ingredient | undefined>();
  const [message, setMessage] = useState("");
  const [removed, setRemoved] = useState<Ingredient | null>(null);
  const [containers, setContainers] = useState(String(draft.servings));
  const [yieldText, setYield] = useState(
    draft.yieldGrams === null ? "" : String(draft.yieldGrams),
  );
  const [portion, setPortion] = useState("250");
  const [viewMode, setViewMode] = useState<"container" | "100g" | "custom">(
    "container",
  );
  const [target, setTarget] = useState("500");
  const [scaleMode, setScaleMode] = useState<"serving" | "batch">("serving");
  const [batchError, setBatchError] = useState("");
  const result = calculateRecipe(draft);
  let portionError = "";
  let portionValues = equalPortion(draft);
  if (viewMode !== "container") {
    try {
      portionValues =
        viewMode === "100g"
          ? draft.yieldGrams
            ? multiplyNutrients(result.totals, 100 / draft.yieldGrams)
            : (() => {
                throw new Error(
                  "Enter your cooked yield to see nutrition per 100 g.",
                );
              })()
          : weighedPortion(draft, Number(portion));
    } catch (e) {
      portionError = (e as Error).message;
    }
  }
  function applyBatch() {
    const count = Number(containers);
    const grams = yieldText.trim() ? Number(yieldText) : null;
    if (
      !Number.isInteger(count) ||
      count < 1 ||
      count > 10000 ||
      (grams !== null && (!Number.isFinite(grams) || grams <= 0))
    ) {
      setBatchError(
        "Use a whole container count above zero and a positive cooked weight.",
      );
      return false;
    }
    setBatchError("");
    updateDraft({ servings: count, yieldGrams: grams });
    return true;
  }
  function save() {
    if (!applyBatch()) return;
    try {
      saveRecipe(pro);
      setMessage("Recipe saved to your library.");
    } catch (e) {
      setMessage((e as Error).message);
      if (data!.recipes.length >= 3) setModal("pro");
    }
  }
  function guarded(action: () => void) {
    if (!pro) setModal("pro");
    else action();
  }
  let scaledPreview: ReturnType<typeof scaleRecipe> | null = null;
  let scalingError = "";
  if (modal === "scale") {
    try {
      scaledPreview = scaleRecipe(draft, Number(target), scaleMode);
    } catch (failure) {
      scalingError = (failure as Error).message;
    }
  }
  return (
    <Page
      title="Meal builder"
      subtitle="Add your ingredients. Choose your portions. We’ll do the math."
      action={
        <Button
          label="New dish"
          icon="add"
          variant="secondary"
          small
          onPress={() => setModal("new")}
        />
      }
    >
      {message ? (
        <Pressable onPress={() => setMessage("")} style={{ marginBottom: 17 }}>
          <Notice>{message}</Notice>
        </Pressable>
      ) : null}
      {!!error && (
        <View style={{ marginBottom: 17 }}>
          <Notice error>{error}</Notice>
        </View>
      )}
      {!wide && (
        <Card style={{ marginBottom: 20, backgroundColor: colors.pale }}>
          <Row style={{ justifyContent: "space-between" }}>
            <Eyebrow>LIVE BATCH TOTALS</Eyebrow>
            <Txt style={{ color: colors.accent, fontSize: 12 }}>
              {formatNumber(equalPortion(draft).kcal, 0)} kcal / container
            </Txt>
          </Row>
          <MiniMacros nutrients={result.totals} />
        </Card>
      )}
      <View
        style={{
          flexDirection: wide ? "row" : "column",
          gap: 22,
          alignItems: "flex-start",
        }}
      >
        <View
          style={{
            flex: wide ? 1.65 : undefined,
            width: wide ? undefined : "100%",
            gap: 20,
          }}
        >
          <Card>
            <Row style={{ justifyContent: "space-between" }}>
              <Eyebrow>INGREDIENTS</Eyebrow>
              <Row style={{ gap: 5 }}>
                <Icon
                  name={saving ? "sync-outline" : "checkmark-circle-outline"}
                  color={colors.muted}
                  size={14}
                />
                <Txt style={{ color: colors.muted, fontSize: 11 }}>
                  {saving ? "Saving…" : "Saved on this device"}
                </Txt>
              </Row>
            </Row>
            <TextInput
              accessibilityLabel="Dish name"
              value={draft.title}
              maxLength={200}
              onChangeText={(title) => updateDraft({ title: title || " " })}
              onBlur={() => {
                if (!draft.title.trim())
                  updateDraft({ title: "Untitled dish" });
              }}
              style={{
                fontSize: 26,
                fontWeight: "600",
                color: colors.ink,
                padding: 0,
                letterSpacing: -0.7,
              }}
            />
            <Muted>
              {draft.ingredients.length} ingredients ·{" "}
              {formatNumber(result.ingredientGrams)} g before cooking
            </Muted>
            <View style={{ height: 1, backgroundColor: colors.line }} />
            <Row style={{ justifyContent: "space-between" }}>
              <Txt style={{ fontSize: 15, fontWeight: "600" }}>Ingredients</Txt>
              <Row style={{ gap: 4 }}>
                <Button
                  label="Paste recipe"
                  icon="clipboard-outline"
                  small
                  variant="ghost"
                  onPress={() => setModal("paste")}
                />
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Scan a barcode"
                  onPress={() => setModal("scan")}
                  style={s.iconButton}
                >
                  <Icon name="barcode-outline" />
                </Pressable>
              </Row>
            </Row>
            {!draft.ingredients.length && (
              <View style={{ alignItems: "center", padding: 30, gap: 13 }}>
                <Txt>No ingredients added yet</Txt>
                <Muted>Add an ingredient or paste a recipe.</Muted>
              </View>
            )}
            {draft.ingredients.map((item, index) => (
              <Row
                key={item.id}
                style={{
                  paddingBottom: 15,
                  borderBottomWidth:
                    index < draft.ingredients.length - 1 ? 1 : 0,
                  borderBottomColor: colors.line,
                  gap: 10,
                }}
              >
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Edit ${item.food.name}`}
                  onPress={() => {
                    setEdit(item);
                    setModal("food");
                  }}
                  style={{ flex: 1, gap: 5, minHeight: 44, justifyContent: "center" }}
                >
                  <Txt style={{ fontSize: 14, fontWeight: "600" }}>
                    {item.food.name}
                  </Txt>
                  <Txt style={{ fontSize: 11, color: colors.muted }}>
                    {formatNumber(item.grams)} g
                    {!["g", "kg", "oz", "lb"].includes(item.measureId)
                      ? " · household estimate"
                      : ""}
                  </Txt>
                </Pressable>
                <View style={{ alignItems: "flex-end", gap: 4 }}>
                  <Txt style={{ fontWeight: "600", fontSize: 13 }}>
                    {formatNumber(
                      item.food.nutrients.kcal === null
                        ? null
                        : (item.grams * item.food.nutrients.kcal) / 100,
                      0,
                    )}
                  </Txt>
                  <Txt style={{ fontSize: 10, color: colors.muted }}>kcal</Txt>
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Remove ${item.food.name}`}
                  onPress={() => {
                    setRemoved(item);
                    removeIngredient(item.id);
                  }}
                  style={{ minHeight: 44, minWidth: 44, justifyContent: "center", alignItems: "center" }}
                >
                  <Icon name="close" size={15} color={colors.muted} />
                </Pressable>
              </Row>
            ))}
            {removed && (
              <Row style={{ justifyContent: "space-between" }}>
                <Muted>Ingredient removed.</Muted>
                <Button
                  small
                  label="Undo"
                  variant="ghost"
                  onPress={() => {
                    addIngredient(removed);
                    setRemoved(null);
                  }}
                />
              </Row>
            )}
            <Button
              label="Add ingredient"
              icon="add"
              variant="secondary"
              onPress={() => {
                setEdit(undefined);
                setModal("food");
              }}
            />
            <Button
              label="Create a custom food"
              variant="ghost"
              small
              onPress={() => setModal("custom")}
            />
          </Card>
          <Card>
            <Row>
              <View
                style={{
                  backgroundColor: colors.pale,
                  padding: 10,
                  borderRadius: 12,
                }}
              >
                <Icon name="cube-outline" />
              </View>
              <View style={{ gap: 4 }}>
                <Txt style={{ fontWeight: "600", fontSize: 17 }}>
                  How many meals are you making?
                </Txt>
                <Muted>
                  Choose your portions. Weigh the finished food if you like.
                </Muted>
              </View>
            </Row>
            <Row style={{ alignItems: "flex-start" }}>
              <Field
                label="Number of portions"
                value={containers}
                onChangeText={setContainers}
                keyboardType="number-pad"
                onBlur={applyBatch}
              />
              <Field
                label="Finished food weight (g) · optional"
                value={yieldText}
                onChangeText={setYield}
                keyboardType="decimal-pad"
                placeholder="Without the pot"
                onBlur={applyBatch}
              />
            </Row>
            {batchError ? <Notice error>{batchError}</Notice> : null}
            <Notice>
              {draft.yieldGrams
                ? `${formatNumber(draft.yieldGrams / draft.servings)} g per container · ${draft.servings} equal portions`
                : "No kitchen scale? You can still see the nutrition in each equal portion."}
            </Notice>
            <Muted>
              Cooking changes water weight. We assume the edible ingredients you
              entered stay in the dish.
            </Muted>
            <Button
              label={showNotes ? "Hide cooking notes" : "Show cooking notes"}
              variant="ghost"
              icon="reader-outline"
              small
              onPress={() => setShowNotes(!showNotes)}
            />
            {showNotes && (
              <Field
                label="Kitchen notes"
                value={draft.notes}
                onChangeText={(notes) => updateDraft({ notes })}
                multiline
                maxLength={20000}
                placeholder="Your method, swaps, and next-time notes…"
              />
            )}
            <Row style={{ flexWrap: "wrap" }}>
              <Button
                label="Save recipe"
                icon="bookmark-outline"
                disabled={!draft.ingredients.length}
                onPress={save}
              />
              <Button
                label="Record this batch"
                variant="secondary"
                icon="checkmark-circle-outline"
                disabled={!draft.ingredients.length || !!batchError}
                onPress={() => {
                  if (!applyBatch()) return;
                  useKitchen.getState().commit((d) => ({
                    ...d,
                    batches: [
                      {
                        id: id(),
                        recipe: clone(d.draft),
                        createdAt: new Date().toISOString(),
                      },
                      ...d.batches,
                    ],
                  }));
                  setMessage(
                    "Batch recorded. Its ingredient and portion values are now preserved.",
                  );
                }}
              />
            </Row>
          </Card>
        </View>
        <View
          style={{
            flex: wide ? 1 : undefined,
            width: wide ? undefined : "100%",
            gap: 20,
          }}
        >
          <Macros nutrients={result.totals} />
          {Object.values(result.missing).some(Boolean) && (
            <Notice error>
              Some nutrient values are unknown. The known calorie subtotal is{" "}
              {formatNumber(result.known.kcal, 0)} kcal. Open ingredient details
              to review the data.
            </Notice>
          )}
          <Card>
            <Eyebrow>YOUR PORTION, YOUR WAY</Eyebrow>
            <Row style={{ flexWrap: "wrap", gap: 7 }}>
              <Chip
                label="Per container"
                active={viewMode === "container"}
                onPress={() => setViewMode("container")}
              />
              <Chip
                label="Per 100 g"
                active={viewMode === "100g"}
                onPress={() => setViewMode("100g")}
              />
              <Chip
                label="Custom"
                active={viewMode === "custom"}
                onPress={() => setViewMode("custom")}
              />
            </Row>
            {viewMode === "custom" && (
              <Field
                label="Portion weight (g)"
                value={portion}
                onChangeText={setPortion}
                keyboardType="decimal-pad"
              />
            )}
            {portionError ? (
              <Notice>{portionError}</Notice>
            ) : (
              <>
                <Row style={{ alignItems: "baseline", gap: 6 }}>
                  <Txt
                    style={{
                      fontSize: 43,
                      letterSpacing: -1.5,
                      fontWeight: "500",
                    }}
                  >
                    {formatNumber(portionValues.kcal, 0)}
                  </Txt>
                  <Muted>
                    kcal
                    {viewMode === "container"
                      ? " / container"
                      : viewMode === "100g"
                        ? " / 100 g"
                        : " / portion"}
                  </Muted>
                </Row>
                <MiniMacros nutrients={portionValues} />
              </>
            )}
          </Card>
          <Button
            label={
              extraTools ? "Hide extra tools" : "More tools: scaling & PDF"
            }
            variant="secondary"
            icon="options-outline"
            onPress={() => setExtraTools(!extraTools)}
          />
          {extraTools && (
            <Card style={{ backgroundColor: colors.pale }}>
              <Row>
                <Txt style={{ fontWeight: "600", fontSize: 15 }}>
                  Recipe tools
                </Txt>
              </Row>
              <Muted>
                Scale your recipe to a calorie target or make a macro card for
                your next batch.
              </Muted>
              <Row style={{ flexWrap: "wrap", gap: 8 }}>
                <Button
                  small
                  label="Scale recipe"
                  variant="secondary"
                  icon="resize-outline"
                  disabled={!draft.ingredients.length}
                  onPress={() => guarded(() => setModal("scale"))}
                />
                <Button
                  small
                  label="Macro PDF"
                  variant="secondary"
                  icon="document-outline"
                  disabled={!draft.ingredients.length}
                  onPress={() =>
                    guarded(() => {
                      void exportMacroCard(draft)
                        .then(() => setMessage("Macro card is ready."))
                        .catch((e) => setMessage(e.message));
                    })
                  }
                />
              </Row>
            </Card>
          )}
        </View>
      </View>
      {modal === "food" && (
        <FoodPicker
          key={edit?.id ?? "new"}
          visible
          existing={edit}
          onClose={() => setModal(null)}
          onAdd={(ingredient) => {
            if (edit)
              updateDraft({
                ingredients: draft.ingredients.map((i) =>
                  i.id === edit.id ? ingredient : i,
                ),
              });
            else addIngredient(ingredient);
          }}
        />
      )}
      {(modal === "paste" || params.action === "paste") && (
        <PasteRecipe
          visible
          onClose={() => {
            setModal(null);
            if (params.action === "paste") router.setParams({ action: undefined });
          }}
          onDone={setMessage}
        />
      )}
      {modal === "custom" && (
        <CustomFood
          visible
          barcode={barcodeForLabel}
          onClose={() => {
            setModal(null);
            setBarcodeForLabel(undefined);
            setMessage("Custom food saved. Find it in Add ingredient.");
          }}
        />
      )}
      {modal === "scan" && (
        <BarcodeScanner
          visible
          onClose={() => setModal(null)}
          onAdd={addIngredient}
          onManualFood={(code) => {setBarcodeForLabel(code);setModal("custom");}}
        />
      )}
      {modal === "pro" && <ProSheet visible onClose={() => setModal(null)} />}
      {modal === "new" && (
        <Sheet
          visible
          title="A fresh start"
          subtitle="Your working draft will be replaced. Save it to your library first if you want to keep it."
          onClose={() => setModal(null)}
        >
          <Button
            label="Save current recipe"
            variant="secondary"
            onPress={save}
          />
          <Button
            label="Start a new dish"
            icon="add"
            onPress={() => {
              updateDraft(blankRecipe());
              setRemoved(null);
              setModal(null);
            }}
          />
        </Sheet>
      )}
      {modal === "scale" && (
        <Sheet
          visible
          title="Cook to your target"
          subtitle="Scale every ingredient together. A new cooked yield will need to be measured."
          onClose={() => setModal(null)}
        >
          <Row>
            <Chip
              label="Per container"
              active={scaleMode === "serving"}
              onPress={() => setScaleMode("serving")}
            />
            <Chip
              label="Entire batch"
              active={scaleMode === "batch"}
              onPress={() => setScaleMode("batch")}
            />
          </Row>
          <Field
            label="Calorie target (kcal)"
            value={target}
            onChangeText={setTarget}
            keyboardType="decimal-pad"
          />
          <Notice>
            Macro proportions stay the same. Check practical amounts such as
            eggs, spices, and cooking liquid after scaling.
          </Notice>
          {scaledPreview ? (
            <Card>
              <Eyebrow>PREVIEW · PER CONTAINER</Eyebrow>
              <MiniMacros nutrients={equalPortion(scaledPreview)} />
              {scaledPreview.ingredients.map((ingredient) => (
                <Row
                  key={ingredient.id}
                  style={{ justifyContent: "space-between" }}
                >
                  <Txt style={{ flex: 1 }}>{ingredient.food.name}</Txt>
                  <Muted>{formatNumber(ingredient.grams)} g</Muted>
                </Row>
              ))}
            </Card>
          ) : (
            <Notice error>{scalingError}</Notice>
          )}
          <Button
            label="Create scaled draft"
            icon="resize-outline"
            disabled={!scaledPreview}
            onPress={() => {
              try {
                const scaled = scaleRecipe(draft, Number(target), scaleMode);
                updateDraft({ ...scaled, id: id() });
                setModal(null);
                setMessage(
                  "Scaled draft created. Review ingredient amounts and measure the new cooked yield.",
                );
              } catch (e) {
                setMessage((e as Error).message);
              }
            }}
          />
        </Sheet>
      )}
    </Page>
  );
}
