import { useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import {
  defaultPreferences,
  dietOptions,
  formatNumber,
  goalOptions,
  MealIdea,
  recipeFromIdea,
  recommendMeals,
} from "@mise/domain";
import { foods } from "../data/catalog";
import { blankRecipe, id, useKitchen } from "../data/store";
import {
  Button,
  BrandMark,
  Card,
  useTheme,
  Icon,
  Muted,
  Row,
  Sheet,
  Txt,
} from "../components/ui";
import { Enter, TouchCard } from "../components/motion";
import { MealPhoto } from "../components/MealPhoto";
import { ConnectionStatus } from "../components/ConnectionStatus";
import { SurfaceTexture } from "../components/SurfaceTexture";
import { Onboarding } from "../components/Onboarding";

export default function Home() {
  const { colors } = useTheme();
  const data = useKitchen((s) => s.data)!;
  const preferences = data.preferences ?? defaultPreferences();
  const goal = goalOptions.find((g) => g.id === preferences.goal)!;
  const diet = dietOptions.find((d) => d.id === preferences.diet)!;
  const suggestions = recommendMeals(preferences, foods);
  const wide = useWindowDimensions().width >= 850;
  const [editing, setEditing] = useState(false);
  const [selected, setSelected] = useState<MealIdea | null>(null);
  const [replace, setReplace] = useState<"blank" | "paste" | MealIdea | null>(
    null,
  );
  const [explain, setExplain] = useState(false);
  function start(value: "blank" | "paste" | MealIdea) {
    if (data.draft.ingredients.length) {
      setSelected(null);
      setReplace(value);
      return;
    }
    load(value);
  }
  function load(value: "blank" | "paste" | MealIdea) {
    const draft =
      typeof value === "string"
        ? { ...blankRecipe(), servings: preferences.servings }
        : recipeFromIdea(value, foods, preferences.servings, id);
    useKitchen.getState().updateDraft(draft);
    setSelected(null);
    setReplace(null);
    router.push(value === "paste" ? "/cook?action=paste" : "/cook");
  }
  const chosen = selected
    ? suggestions.find((s) => s.idea.id === selected.id)
    : null;
  return (
    <HomeScroll>
      <Row style={{ justifyContent: "space-between", marginBottom: 31 }}>
        <Row style={{ gap: 8 }}>
          <BrandMark />
          <Txt style={{ fontSize: 31, fontWeight: "700", letterSpacing: -1.2 }}>
            mise.
          </Txt>
        </Row>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Edit preferences"
          onPress={() => setEditing(true)}
          style={{
            backgroundColor: colors.pale,
            width: 44,
            height: 44,
            borderRadius: 22,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Txt style={{ fontWeight: "600", color: colors.accent }}>
            {preferences.name.trim().charAt(0).toUpperCase() || "You"}
          </Txt>
        </Pressable>
      </Row>
      <View style={{marginBottom:18}}><ConnectionStatus /></View>
      <Enter>
        <Txt style={{ color: colors.muted, fontSize: 14, marginBottom: 8 }}>
          MEAL PREP
        </Txt>
        <Txt
          style={{
            fontSize: 30,
            fontWeight: "600",
            letterSpacing: -1,
          }}
        >
          {preferences.name
            ? `Hello, ${preferences.name}.`
            : "Your kitchen"}
        </Txt>
        <Txt
          style={{
            color: colors.muted,
            marginTop: 10,
            fontSize: 14,
            lineHeight: 22,
          }}
        >
          Build recipes, understand each portion, and plan your next batch.
        </Txt>
      </Enter>
      <Enter delay={60} style={{ marginTop: 23 }}>
        <View
          testID="meal-focus-card"
          style={{ backgroundColor: colors.pale, borderRadius: 16, padding: 20, overflow: "hidden", gap: 12 }}
        >
          <SurfaceTexture />
          <Row style={{ justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
            <Txt style={{ color: colors.secondary, fontSize: 11, fontWeight: "600", letterSpacing: 1 }}>
              {goal.title.toUpperCase()}
            </Txt>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Change my preferences"
              onPress={() => setEditing(true)}
              style={{ minHeight: 44, justifyContent: "center", paddingHorizontal: 8 }}
            >
              <Txt style={{ fontSize: 13, fontWeight: "600", textDecorationLine: "underline" }}>Edit preferences</Txt>
            </Pressable>
          </Row>
          <Txt style={{ fontSize: 19, fontWeight: "600" }}>{diet.title}</Txt>
          <Muted>Up to {preferences.minutes} minutes · {preferences.servings} portions per batch</Muted>
        </View>
      </Enter>
      <View style={{ marginTop: 27, gap: 12 }}>
        <Txt style={{ fontSize: 20, fontWeight: "600" }}>
          Start cooking
        </Txt>
        <Row style={{ alignItems: "stretch", flexWrap: "wrap", gap: 12 }}>
          <TouchCard
            label="Build my own meal"
            onPress={() => start("blank")}
            style={{ flex: 1, minWidth: 140 }}
          >
            <Card style={{ padding: 19, height: "100%", gap: 13 }}>
              <Icon name="add" size={22} />
              <Txt style={{ fontWeight: "600", fontSize: 16 }}>
                Build my own meal
              </Txt>
              <Muted>Add foods and see what’s in each portion.</Muted>
            </Card>
          </TouchCard>
          <TouchCard
            label="Paste a recipe"
            onPress={() => start("paste")}
            style={{ flex: 1, minWidth: 140 }}
          >
            <Card style={{ padding: 19, height: "100%", gap: 13 }}>
              <Icon name="clipboard-outline" size={22} />
              <Txt style={{ fontWeight: "600", fontSize: 16 }}>
                Paste a recipe
              </Txt>
              <Muted>Turn an ingredient list into a meal.</Muted>
            </Card>
          </TouchCard>
        </Row>
      </View>
      {data.draft.ingredients.length > 0 && (
        <View style={{ marginTop: 14 }}>
          <TouchCard
            label="Continue my meal"
            onPress={() => router.push("/cook")}
          >
            <Card style={{ padding: 18 }}>
              <Row>
                <View style={{ flex: 1, gap: 5 }}>
                  <Txt style={{ color: colors.muted, fontSize: 11 }}>
                    CURRENT DRAFT
                  </Txt>
                  <Txt style={{ fontWeight: "600", fontSize: 16 }}>
                    {data.draft.title}
                  </Txt>
                  <Muted>
                    {data.draft.ingredients.length} ingredients ·{" "}
                    {data.draft.servings} portions
                  </Muted>
                </View>
                <Icon name="arrow-forward" />
              </Row>
            </Card>
          </TouchCard>
        </View>
      )}
      <View style={{ marginTop: 34, marginBottom: 17, gap: 9 }}>
        <Row style={{ justifyContent: "space-between" }}>
          <Txt style={{ fontSize: 23, fontWeight: "600", letterSpacing: -0.5 }}>
            Suggested recipes
          </Txt>
        </Row>
        <Muted>
          {diet.title} · Ready in {preferences.minutes} minutes or less
        </Muted>
      </View>
      <View style={{ flexDirection: wide ? "row" : "column", gap: 16 }}>
        {suggestions.slice(0, 3).map(({ idea, nutrients, reason }, index) => (
          <Enter
            key={idea.id}
            delay={index * 70}
            style={{ flex: wide ? 1 : undefined }}
          >
            <TouchCard
              label={`View ${idea.title}`}
              onPress={() => setSelected(idea)}
            >
              <Card style={{ padding: 0, overflow: "hidden", gap: 0 }}>
                <MealPhoto recipeId={idea.id} variant={idea.art} width="100%" height={wide ? 190 : 185} />
                <View style={{ padding: 20, gap: 10 }}>
                  {(
                    <Txt style={{ fontSize: 19, fontWeight: "600" }}>
                      {idea.title}
                    </Txt>
                  )}
                  <Txt style={{ color: colors.accent, fontSize: 12 }}>
                    {reason}
                  </Txt>
                  <Muted>{idea.description}</Muted>
                  <Row
                    style={{
                      justifyContent: "space-between",
                      borderTopWidth: 1,
                      borderTopColor: colors.line,
                      paddingTop: 14,
                    }}
                  >
                    <Txt style={{ fontWeight: "600" }}>
                      {formatNumber(nutrients.kcal, 0)}{" "}
                      <Txt style={{ fontSize: 11, color: colors.muted }}>
                        kcal / portion
                      </Txt>
                    </Txt>
                    <Row style={{ gap: 7 }}>
                      <Txt style={{ fontSize: 12, color: colors.muted }}>
                        {formatNumber(nutrients.protein, 0)} g protein
                      </Txt>
                      <Icon name="arrow-forward" size={17} />
                    </Row>
                  </Row>
                </View>
              </Card>
            </TouchCard>
          </Enter>
        ))}
      </View>
      {!suggestions.length && (
        <Card>
          <Txt style={{ fontWeight: "600", fontSize: 19 }}>
            No matching recipes yet
          </Txt>
          <Muted>
            Our starter collection has no meals matching all your choices. Keep
            your food restrictions and try more cooking time, or build your own
            meal.
          </Muted>
          <Button
            label="Adjust my preferences"
            variant="secondary"
            onPress={() => setEditing(true)}
          />
          <Button label="Build my own meal" onPress={() => start("blank")} />
        </Card>
      )}
      <Pressable
        accessibilityRole="button"
        onPress={() => setExplain(true)}
        style={{ paddingVertical: 24 }}
      >
        <Row style={{ justifyContent: "center", gap: 7 }}>
          <Icon name="help-circle-outline" size={17} color={colors.muted} />
          <Txt style={{ color: colors.muted, fontSize: 12 }}>
            Understanding calories and macros
          </Txt>
        </Row>
      </Pressable>
      {selected && chosen && (
        <Sheet
          visible
          title={selected.title}
          subtitle={selected.description}
          onClose={() => setSelected(null)}
        >
          <View
            style={{
              alignItems: "center",
              backgroundColor: colors.pale,
              borderRadius: 20,
            }}
          >
            <MealPhoto width="100%" height={220} variant={selected.art} recipeId={selected.id} />
          </View>
          <Row style={{ justifyContent: "space-between" }}>
            <Txt style={{ fontWeight: "600" }}>
              {selected.minutes} min · {preferences.servings} portions
            </Txt>
            <Txt style={{ color: colors.accent }}>
              {formatNumber(chosen.nutrients.kcal, 0)} kcal each
            </Txt>
          </Row>
          <Muted>
            Why this idea? {chosen.reason}. It matches your eating style,
            cooking time, and listed food exclusions.
          </Muted>
          <Txt style={{ fontWeight: "600" }}>What goes in · per portion</Txt>
          {selected.ingredients.map(([foodId, grams]) => (
            <Row key={foodId} style={{ justifyContent: "space-between" }}>
              <Txt style={{ flex: 1 }}>
                {foods.find((f) => f.sourceId === foodId)!.name}
              </Txt>
              <Muted>{grams} g</Muted>
            </Row>
          ))}
          <Muted>
            Photos show serving inspiration. Check package labels and cross-contact information for foods you
            avoid. Add your own seasonings, sauces, and changes in the meal
            builder.
          </Muted>
          <Button
            label="Use this recipe"
            icon="arrow-forward"
            onPress={() => start(selected)}
          />
        </Sheet>
      )}
      {replace && (
        <Sheet
          visible
          title="Start a different meal?"
          subtitle="Your current draft will be replaced. Save it in your recipes first if you want to keep it."
          onClose={() => setReplace(null)}
        >
          <Button
            label="Keep working on my meal"
            variant="secondary"
            onPress={() => {
              setReplace(null);
              router.push("/cook");
            }}
          />
          <Button
            label="Replace my current meal"
            onPress={() => load(replace)}
          />
        </Sheet>
      )}
      {explain && (
        <Sheet
          visible
          title="Good food, in plain words."
          onClose={() => setExplain(false)}
        >
          <Card>
            <Txt style={{ fontWeight: "600" }}>Calories = energy from food</Txt>
            <Muted>
              A calorie number helps you understand a portion. Your personal
              needs depend on more than a recipe.
            </Muted>
          </Card>
          <Card>
            <Txt style={{ fontWeight: "600" }}>
              Protein, carbs, and fat = nutrients
            </Txt>
            <Muted>
              Protein helps build and repair your body. Carbs and fat provide
              energy. Fiber is part of plant foods. A varied meal brings
              different nutrients together.
            </Muted>
          </Card>
          <Card>
            <Txt style={{ fontWeight: "600" }}>One batch, a few portions</Txt>
            <Muted>
              Add everything you cook. Choose how many meals you divide it into.
              Mise does the per-portion math for you.
            </Muted>
          </Card>
        </Sheet>
      )}
      {editing && (
        <Modal
          visible
          animationType="slide"
          onRequestClose={() => setEditing(false)}
        >
          <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
            <Onboarding editing onClose={() => setEditing(false)} />
          </SafeAreaView>
        </Modal>
      )}
    </HomeScroll>
  );
}

function HomeScroll({ children }: React.PropsWithChildren) {
  const { colors } = useTheme();
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ padding: 23, paddingBottom: 30 }}
    >
      <View style={{ maxWidth: 1000, width: "100%", alignSelf: "center" }}>
        {children}
      </View>
    </ScrollView>
  );
}
