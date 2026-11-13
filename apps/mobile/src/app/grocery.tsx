import { useState } from "react";
import { Pressable, View } from "react-native";
import { aggregateGroceries, formatNumber, purchaseNeeded } from "@mise/domain";
import { router } from "expo-router";
import { useKitchen } from "../data/store";
import { useBilling } from "../services/billing";
import {
  Button,
  Card,
  colors,
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
  const data = useKitchen((s) => s.data)!;
  const pro = useBilling((s) => s.pro || s.preview);
  const [paywall, setPaywall] = useState(false);
  const [message, setMessage] = useState("");
  const selected = data.recipes.filter(
    (r) => (data.grocerySelection[r.id] ?? 0) > 0,
  );
  const items = data.groceryList?.items ?? [];
  function select(recipeId: string, batches: number) {
    useKitchen.getState().commit((d) => {
      const selection = { ...d.grocerySelection };
      if (batches <= 0) delete selection[recipeId];
      else selection[recipeId] = Math.min(100, batches);
      return { ...d, grocerySelection: selection };
    });
  }
  return (
    <Page
      title="One trip. All your prep."
      subtitle="Bring your batches together into a practical shopping list."
    >
      {!pro && (
        <View style={{ marginBottom: 20 }}>
          <Card style={{ backgroundColor: colors.pale }}>
            <Row>
              <Icon name="sparkles-outline" />
              <Txt style={{ fontWeight: "600", fontSize: 18 }}>
                A smarter list is a Pro perk.
              </Txt>
            </Row>
            <Muted>
              Select your saved recipes, combine ingredient weights, and check
              off what you already have.
            </Muted>
            <Button label="Explore Mise Pro" onPress={() => setPaywall(true)} />
          </Card>
        </View>
      )}
      {!!message && (
        <View style={{ marginBottom: 17 }}>
          <Notice>{message}</Notice>
        </View>
      )}
      <View style={{ gap: 20 }}>
        <Card>
          <Eyebrow>WHAT ARE WE MAKING?</Eyebrow>
          {!data.recipes.length ? (
            <>
              <Muted>
                Save your first master recipe to build a shopping list.
              </Muted>
              <Button
                variant="secondary"
                label="Open kitchen"
                onPress={() => router.navigate("/")}
              />
            </>
          ) : (
            data.recipes.map((recipe) => (
              <Row
                key={recipe.id}
                style={{ justifyContent: "space-between", paddingVertical: 9 }}
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
                  style={{ flex: 1 }}
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
            ))
          )}
          <Button
            label={`Build grocery list${selected.length ? ` · ${selected.length} recipes` : ""}`}
            icon="basket-outline"
            disabled={!data.recipes.length}
            onPress={() => {
              if (!pro) {
                setPaywall(true);
                return;
              }
              if (!selected.length) {
                setMessage("Choose at least one recipe.");
                return;
              }
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
              setMessage(
                "List built. Recipe changes won’t alter it until you rebuild.",
              );
            }}
          />
        </Card>
        {!!items.length && (
          <Card>
            <Row style={{ justifyContent: "space-between" }}>
              <Eyebrow>ON YOUR LIST</Eyebrow>
              <Muted>
                {data.groceryChecked.length} / {items.length} checked
              </Muted>
            </Row>
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
