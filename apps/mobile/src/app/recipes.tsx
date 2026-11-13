import { useState } from "react";
import { Pressable, useWindowDimensions, View } from "react-native";
import { router } from "expo-router";
import {
  Batch,
  calculateRecipe,
  equalPortion,
  formatNumber,
  Recipe,
} from "@mise/domain";
import { exampleRecipe, id, useKitchen } from "../data/store";
import {
  Button,
  Card,
  Chip,
  colors,
  Eyebrow,
  Field,
  Icon,
  Muted,
  Notice,
  Page,
  Row,
  Sheet,
  Txt,
} from "../components/ui";
import { Macros, MiniMacros } from "../components/Macros";
import { useBilling } from "../services/billing";

export default function Recipes() {
  const { data, loadRecipe, deleteRecipe } = useKitchen();
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<"recipes" | "batches">("recipes");
  const [deleting, setDeleting] = useState<Recipe | null>(null);
  const [batch, setBatch] = useState<Batch | null>(null);
  const { width } = useWindowDimensions();
  const pro = useBilling((s) => s.pro || s.preview);
  const list = data!.recipes.filter((r) =>
    r.title.toLowerCase().includes(query.toLowerCase()),
  );
  function open(recipe: Recipe) {
    loadRecipe(recipe);
    router.navigate("/cook");
  }
  return (
    <Page
      title="Keep the good ones."
      subtitle="Your favorites, ready for another round."
    >
      <Row
        style={{
          marginBottom: 22,
          justifyContent: "space-between",
          flexWrap: "wrap",
        }}
      >
        <Row>
          <Chip
            label={`Master recipes (${data!.recipes.length})`}
            active={mode === "recipes"}
            onPress={() => setMode("recipes")}
          />
          <Chip
            label={`Cooked batches (${data!.batches.length})`}
            active={mode === "batches"}
            onPress={() => setMode("batches")}
          />
        </Row>
        <Muted>
          {pro
            ? "Unlimited recipe slots"
            : `${data!.recipes.length} of 3 free slots used`}
        </Muted>
      </Row>
      {mode === "recipes" ? (
        <>
          <View style={{ marginBottom: 20 }}>
            <Field
              label="Search your recipes"
              value={query}
              onChangeText={setQuery}
              placeholder="A dish worth making again…"
            />
          </View>
          {!list.length ? (
            <Card style={{ alignItems: "center", paddingVertical: 45 }}>
              <Icon name="book-outline" size={35} color={colors.green} />
              <Txt style={{ fontSize: 23, fontWeight: "500" }}>
                {query
                  ? "No recipe by that name."
                  : "Your recipe shelf starts here."}
              </Txt>
              <Muted>
                Save a dish from the Kitchen and it will be waiting here.
              </Muted>
              <Button
                label="Back to the kitchen"
                icon="arrow-forward"
                onPress={() => router.navigate("/cook")}
              />
            </Card>
          ) : (
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 18 }}>
              {list.map((recipe, index) => (
                <Card
                  key={recipe.id}
                  style={{ width: width > 800 ? "48%" : "100%", gap: 17 }}
                >
                  <Row style={{ justifyContent: "space-between" }}>
                    <View
                      style={{
                        backgroundColor: index % 2 ? "#F2EBDD" : colors.pale,
                        padding: 14,
                        borderRadius: 16,
                      }}
                    >
                      <Icon
                        name={index % 2 ? "restaurant-outline" : "leaf-outline"}
                        size={27}
                        color={colors.green}
                      />
                    </View>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Delete ${recipe.title}`}
                      onPress={() => setDeleting(recipe)}
                      style={{ padding: 9 }}
                    >
                      <Icon
                        name="trash-outline"
                        size={17}
                        color={colors.muted}
                      />
                    </Pressable>
                  </Row>
                  <Txt
                    style={{
                      fontSize: 24,
                      fontWeight: "500",
                      letterSpacing: -0.6,
                    }}
                  >
                    {recipe.title}
                  </Txt>
                  <Muted>
                    {recipe.ingredients.length} ingredients · {recipe.servings}{" "}
                    containers
                    {recipe.yieldGrams
                      ? ` · ${formatNumber(recipe.yieldGrams)} g cooked`
                      : ""}
                  </Muted>
                  <MiniMacros nutrients={equalPortion(recipe)} />
                  <Txt style={{ color: colors.muted, fontSize: 11 }}>
                    Per equal container
                  </Txt>
                  <Row style={{ flexWrap: "wrap" }}>
                    <Button
                      small
                      label="Open recipe"
                      icon="arrow-forward"
                      onPress={() => open(recipe)}
                    />
                    <Button
                      small
                      label="Make a copy"
                      variant="secondary"
                      onPress={() =>
                        open({
                          ...recipe,
                          id: id(),
                          title: `${recipe.title} · copy`.slice(0, 200),
                        })
                      }
                    />
                  </Row>
                </Card>
              ))}
            </View>
          )}
        </>
      ) : (
        <View style={{ gap: 16 }}>
          {!data!.batches.length && (
            <Card>
              <Eyebrow>YOUR COOKING HISTORY</Eyebrow>
              <Txt style={{ fontSize: 23 }}>Every batch tells a story.</Txt>
              <Muted>
                Record a batch in the Kitchen to preserve its ingredients,
                measured yield, and portion values.
              </Muted>
            </Card>
          )}
          {data!.batches.map((item) => (
            <Pressable key={item.id} onPress={() => setBatch(item)}>
              <Card>
                <Row style={{ justifyContent: "space-between" }}>
                  <View style={{ gap: 7, flex: 1 }}>
                    <Txt style={{ fontWeight: "600", fontSize: 19 }}>
                      {item.recipe.title}
                    </Txt>
                    <Muted>
                      {new Date(item.createdAt).toLocaleDateString()} ·{" "}
                      {item.recipe.servings} containers ·{" "}
                      {formatNumber(
                        calculateRecipe(item.recipe).totals.kcal,
                        0,
                      )}{" "}
                      batch kcal
                    </Muted>
                  </View>
                  <Icon name="chevron-forward" />
                </Row>
                <MiniMacros nutrients={equalPortion(item.recipe)} />
              </Card>
            </Pressable>
          ))}
        </View>
      )}
      <View style={{ marginTop: 22 }}>
        <Button
          variant="ghost"
          label="Load the sample chicken bowl as a draft"
          onPress={() => open(exampleRecipe())}
        />
      </View>
      {deleting && (
        <Sheet
          visible
          title="Remove this master recipe?"
          subtitle={`${deleting.title} will leave your recipe shelf. Recorded batches keep their original data.`}
          onClose={() => setDeleting(null)}
        >
          <Button
            label="Delete recipe"
            variant="danger"
            icon="trash-outline"
            onPress={() => {
              deleteRecipe(deleting.id);
              setDeleting(null);
            }}
          />
          <Button
            label="Keep recipe"
            variant="secondary"
            onPress={() => setDeleting(null)}
          />
        </Sheet>
      )}
      {batch && (
        <Sheet
          visible
          title={batch.recipe.title}
          subtitle={`Recorded ${new Date(batch.createdAt).toLocaleString()}. This snapshot stays unchanged when the master recipe changes.`}
          onClose={() => setBatch(null)}
        >
          <Macros
            nutrients={equalPortion(batch.recipe)}
            label="PER RECORDED CONTAINER"
          />
          <Notice>
            {batch.recipe.servings} containers
            {batch.recipe.yieldGrams
              ? ` · ${formatNumber(batch.recipe.yieldGrams)} g cooked yield`
              : " · yield not recorded"}
          </Notice>
          {batch.recipe.ingredients.map((i) => (
            <Row key={i.id} style={{ justifyContent: "space-between" }}>
              <Txt style={{ flex: 1 }}>{i.food.name}</Txt>
              <Muted>{formatNumber(i.grams)} g</Muted>
            </Row>
          ))}
          <Button
            label="Open a new draft from this batch"
            onPress={() => {
              open({ ...batch.recipe, id: id() });
              setBatch(null);
            }}
          />
        </Sheet>
      )}
    </Page>
  );
}
