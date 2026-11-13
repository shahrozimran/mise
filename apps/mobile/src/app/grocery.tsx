import { useState } from "react";
import { Pressable, useWindowDimensions, View } from "react-native";
import { aggregateGroceries, formatNumber, purchaseNeeded } from "@mise/domain";
import { router } from "expo-router";
import { useKitchen } from "../data/store";
import { useBilling } from "../services/billing";
import {
  Button,
  Card,
  useTheme,
  Eyebrow,
  Field,
  Icon,
  Muted,
  Notice,
  Page,
  Row,
  Txt,
} from "../components/ui";
import { ProSheet } from "../components/ProSheet";

function Pantry({ foodId, grams }: { foodId: string; grams: number }) {
  const initial = useKitchen((s) => s.data!.pantryGrams[foodId] ?? 0);
  const [text, setText] = useState(initial ? String(initial) : "");
  return (
    <View style={{ maxWidth: 180 }}>
      <Field
        label="Already in pantry (g)"
        value={text}
        keyboardType="decimal-pad"
        placeholder="0"
        onChangeText={setText}
        onBlur={() => {
          const value = text.trim() ? Number(text) : 0;
          if (Number.isFinite(value) && value >= 0)
            useKitchen.getState().commit((d) => ({
              ...d,
              pantryGrams: { ...d.pantryGrams, [foodId]: value },
            }));
          else setText(initial ? String(initial) : "");
        }}
      />
      <Muted>{formatNumber(purchaseNeeded(grams, initial))} g to buy</Muted>
    </View>
  );
}
export default function Grocery() {
  const { colors } = useTheme();
  const wide = useWindowDimensions().width >= 900;
  const data = useKitchen((s) => s.data)!;
  const pro = useBilling((s) => s.pro || s.preview);
  const [paywall, setPaywall] = useState(false);
  const [message, setMessage] = useState("");
  const selected = data.recipes.filter(
    (r) => (data.grocerySelection[r.id] ?? 0) > 0,
  );
  const items = data.groceryList?.items ?? [];
  const completed = items.filter((item) =>
    data.groceryChecked.includes(item.foodId),
  ).length;
  function select(recipeId: string, batches: number) {
    useKitchen.getState().commit((d) => {
      const selection = { ...d.grocerySelection };
      if (batches <= 0) delete selection[recipeId];
      else selection[recipeId] = Math.min(100, batches);
      return { ...d, grocerySelection: selection };
    });
  }
  function buildList() {
    if (!pro) {
      setPaywall(true);
      return;
    }
    if (!selected.length) return;
    const aggregated = aggregateGroceries(
      selected.map((recipe) => ({
        recipe,
        batches: data.grocerySelection[recipe.id],
      })),
    );
    useKitchen.getState().commit((d) => ({
      ...d,
      groceryList: {
        items: aggregated,
        createdAt: new Date().toISOString(),
      },
      groceryChecked: [],
    }));
    setMessage("List built. Recipe changes won’t alter it until you rebuild.");
  }
  return (
    <Page
      title="Shopping list"
      subtitle="Combine your recipes, check your pantry, and buy what you need."
    >
      {!!message && (
        <View style={{ marginBottom: 17 }}>
          <Notice>{message}</Notice>
        </View>
      )}
      <View style={{ gap: 20 }}>
        <Card>
          {!data.recipes.length ? (
            <View testID="shopping-empty-state" style={{ gap: 16, paddingVertical: wide ? 24 : 8, maxWidth: 520 }}>
              <Eyebrow>GETTING STARTED</Eyebrow>
              <Txt accessibilityRole="header" style={{ fontWeight: "600", fontSize: 24, lineHeight: 31, letterSpacing: -0.5 }}>
                Save a recipe to start your list
              </Txt>
              <Muted>Add ingredients to a meal and save it. Your recipes will appear here, ready to combine into one shopping list.</Muted>
              <Button
                label="Create your first recipe"
                style={{ alignSelf: "flex-start" }}
                onPress={() => router.navigate("/cook")}
              />
            </View>
          ) : (
            <>
              <Row style={{ justifyContent: "space-between", flexWrap: "wrap" }}>
                <Txt accessibilityRole="header" style={{ fontSize: 19, fontWeight: "600" }}>Choose recipes</Txt>
                <Muted>{selected.length} of {data.recipes.length} selected</Muted>
              </Row>
              <Muted>Select recipes and adjust how many batches you plan to cook.</Muted>
              {data.recipes.map((recipe) => (
                <Row
                  key={recipe.id}
                  style={{ justifyContent: "space-between", flexWrap: "wrap", paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.line }}
                >
                  <Pressable
                    accessibilityRole="checkbox"
                    accessibilityState={{
                      checked: !!data.grocerySelection[recipe.id],
                    }}
                    aria-checked={!!data.grocerySelection[recipe.id]}
                    accessibilityLabel={`Include ${recipe.title}`}
                    onPress={() =>
                      pro
                        ? select(
                            recipe.id,
                            data.grocerySelection[recipe.id] ? 0 : 1,
                          )
                        : setPaywall(true)
                    }
                    style={{ flex: 1, minWidth: 170, minHeight: 48, justifyContent: "center" }}
                  >
                    <Row>
                      <Icon
                        name={
                          data.grocerySelection[recipe.id]
                            ? "checkbox"
                            : "square-outline"
                        }
                        color={colors.accent}
                      />
                      <View style={{ flex: 1, gap: 4 }}>
                        <Txt style={{ fontWeight: "500" }}>{recipe.title}</Txt>
                        <Muted>{recipe.servings} containers per batch</Muted>
                      </View>
                    </Row>
                  </Pressable>
                  {!!data.grocerySelection[recipe.id] && (
                    <Row style={{ gap: 0 }}>
                      <Button
                        small
                        label="−"
                        accessibilityLabel={`Fewer batches of ${recipe.title}`}
                        variant="secondary"
                        onPress={() => {
                          if (pro)
                            select(
                              recipe.id,
                              data.grocerySelection[recipe.id] - 1,
                            );
                          else setPaywall(true);
                        }}
                      />
                      <Txt style={{ paddingHorizontal: 12 }}>
                        {data.grocerySelection[recipe.id]}×
                      </Txt>
                      <Button
                        small
                        label="+"
                        accessibilityLabel={`More batches of ${recipe.title}`}
                        variant="secondary"
                        onPress={() => {
                          if (pro)
                            select(
                              recipe.id,
                              data.grocerySelection[recipe.id] + 1,
                            );
                          else setPaywall(true);
                        }}
                      />
                    </Row>
                  )}
                </Row>
              ))}
              <View style={{ gap: 10, alignItems: "flex-start", marginTop: 4 }}>
                <Button
                  label={`Build grocery list${selected.length ? ` · ${selected.length} recipes` : ""}`}
                  disabled={pro && !selected.length}
                  onPress={buildList}
                />
                {pro && !selected.length && <Muted>Select at least one recipe to continue.</Muted>}
              </View>
            </>
          )}
        </Card>
        {!pro && (
          <Card style={{ backgroundColor: colors.bg }}>
            <Row style={{ justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
              <View style={{ flex: 1, minWidth: 200, gap: 8 }}>
                <Row style={{ gap: 10 }}>
                  <Txt style={{ fontSize: 16, fontWeight: "600" }}>Recipe-based shopping</Txt>
                  <Txt style={{ fontSize: 11, fontWeight: "600", color: colors.muted, borderWidth: 1, borderColor: colors.line, borderRadius: 5, paddingHorizontal: 7, paddingVertical: 3 }}>PRO</Txt>
                </Row>
                <Muted>Combine ingredient weights across recipes and subtract what’s already in your pantry with Mise Pro.</Muted>
              </View>
              <Button label="View Pro options" variant="secondary" onPress={() => setPaywall(true)} />
            </Row>
          </Card>
        )}
        {!!items.length && (
          <Card>
            <Row style={{ justifyContent: "space-between" }}>
              <Txt accessibilityRole="header" style={{ fontSize: 19, fontWeight: "600" }}>Items to buy</Txt>
              <Muted>
                {completed} / {items.length} checked
              </Muted>
            </Row>
            <View
              accessible
              accessibilityRole="progressbar"
              accessibilityLabel="Shopping progress"
              accessibilityValue={{ min: 0, max: items.length, now: completed }}
              aria-valuemin={0}
              aria-valuemax={items.length}
              aria-valuenow={completed}
              aria-valuetext={`${completed} of ${items.length} items checked`}
              style={{ height: 4, borderRadius: 2, backgroundColor: colors.pale, overflow: "hidden" }}
            >
              <View style={{ height: 4, width: `${completed / items.length * 100}%`, backgroundColor: colors.accent }} />
            </View>
            <Notice>
              Weights match the ingredient forms in your recipes. For cooked or
              drained foods, confirm the purchase amount; raw and cooked foods
              are kept separate.
            </Notice>
            {items.map((item) => {
              const checked = data.groceryChecked.includes(item.foodId);
              return (
                <View
                  key={item.foodId}
                  style={{
                    paddingVertical: 15,
                    borderBottomWidth: 1,
                    borderBottomColor: colors.line,
                    gap: 12,
                  }}
                >
                  <Pressable
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked }}
                    aria-checked={checked}
                    accessibilityLabel={`Purchased ${item.name}`}
                    onPress={() =>
                      useKitchen.getState().commit((d) => ({
                        ...d,
                        groceryChecked: checked
                          ? d.groceryChecked.filter((f) => f !== item.foodId)
                          : [...d.groceryChecked, item.foodId],
                      }))
                    }
                  >
                    <Row>
                      <Icon
                        name={checked ? "checkbox" : "square-outline"}
                        color={colors.accent}
                      />
                      <View style={{ flex: 1, gap: 5 }}>
                        <Txt
                          style={{
                            textDecorationLine: checked
                              ? "line-through"
                              : "none",
                            color: checked ? colors.muted : colors.ink,
                            fontWeight: "500",
                          }}
                        >
                          {item.name}
                        </Txt>
                        <Muted>
                          {formatNumber(item.grams)} g required ·{" "}
                          {item.category}
                        </Muted>
                      </View>
                    </Row>
                  </Pressable>
                  {pro && <Pantry foodId={item.foodId} grams={item.grams} />}
                </View>
              );
            })}
          </Card>
        )}
      </View>
      {paywall && <ProSheet visible onClose={() => setPaywall(false)} />}
    </Page>
  );
}
