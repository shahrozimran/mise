import { useMemo, useState } from "react";
import { Pressable, View, Keyboard, ActivityIndicator } from "react-native";
import {
  availableMeasures,
  Food,
  foodSchema,
  formatNumber,
  Ingredient,
  makeIngredient,
  parseQuantity,
  searchFoods,
} from "@mise/domain";
import { foods } from "../data/catalog";
import { id, useKitchen } from "../data/store";
import { API_URL, request, searchOnline, searchProducts } from "../services/api";
import { useOffline } from "./ConnectionStatus";
import {
  Button,
  Chip,
  colors,
  Field,
  Icon,
  Muted,
  Notice,
  Row,
  Sheet,
  Txt,
} from "./ui";

export function FoodPicker({
  visible,
  onClose,
  onAdd,
  existing,
  initialQuery = "",
  initialFood,
  initialQuantity,
  initialMeasureId,
}: {
  visible: boolean;
  onClose: () => void;
  onAdd: (ingredient: Ingredient) => void;
  existing?: Ingredient;
  initialQuery?: string;
  initialFood?: Food;
  initialQuantity?: number | string;
  initialMeasureId?: string;
}) {
  const data = useKitchen((s) => s.data)!;
  const offline = useOffline();
  const [query, setQuery] = useState(initialQuery);
  const [selected, setSelected] = useState<Food | null>(
    existing?.food ?? initialFood ?? null,
  );
  const [quantity, setQuantity] = useState(
    String(existing?.quantity ?? initialQuantity ?? 100),
  );
  const [measureId, setMeasureId] = useState(
    existing?.measureId ?? initialMeasureId ?? "g",
  );
  const [online, setOnline] = useState<Food[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [showSource, setShowSource] = useState(false);
  const list = useMemo(
    () => searchFoods([...data.customFoods, ...foods], query, 24),
    [query, data.customFoods],
  );
  const measures = selected
    ? availableMeasures(selected, data.settings.convention)
    : [];
  const measure = measures.find((m) => m.id === measureId);
  const amount = parseQuantity(quantity);
  const grams =
    amount && measure ? (amount / measure.amount) * measure.grams : null;
  async function choose(food: Food, remote = false) {
    Keyboard.dismiss();
    setError("");
    if (remote && food.source === "USDA FoodData Central") {
      setBusy(true);
      try {
        food = foodSchema.parse(
          await request(`/v1/foods/${encodeURIComponent(food.sourceId)}`),
        );
        useKitchen.getState().addCustomFood(food);
      } catch (e) {
        setError((e as Error).message);
        setBusy(false);
        return;
      }
      setBusy(false);
    }
    if (remote) useKitchen.getState().addCustomFood(food);
    setSelected(food);
    setMeasureId("g");
  }
  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      title={selected ? "How much did you use?" : "Find an ingredient"}
      subtitle={
        selected
          ? "Choose how you measured it. We’ll handle the grams."
          : `${foods.length.toLocaleString()} foods, ready without Wi-Fi.`
      }
    >
      {error ? <Notice error>{error}</Notice> : null}
      {selected ? (
        <>
          <Pressable onPress={() => setSelected(null)}>
            <Row>
              <Icon name="arrow-back" size={16} />
              <Txt style={{ color: colors.accent }}>Back to foods</Txt>
            </Row>
          </Pressable>
          <View
            style={{
              backgroundColor: colors.pale,
              padding: 17,
              borderRadius: 14,
              gap: 7,
            }}
          >
            <Txt style={{ fontSize: 20, fontWeight: "600" }}>
              {selected.name}
            </Txt>
            <Muted>
              {selected.state} · {formatNumber(selected.nutrients.kcal, 0)} kcal
              per 100 g
            </Muted>
          </View>
          <Field
            label="Quantity"
            value={quantity}
            onChangeText={setQuantity}
            keyboardType="decimal-pad"
            placeholder="e.g. 150 or 1/2"
          />
          {measureId === "g" && (
            <Row>
              {[50, 100, 200].map((value) => (
                <Chip
                  key={value}
                  label={`${value} g`}
                  active={quantity === String(value)}
                  onPress={() => setQuantity(String(value))}
                />
              ))}
            </Row>
          )}
          <Txt style={{ fontSize: 12, fontWeight: "600" }}>Measure</Txt>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {measures.map((m) => (
              <Chip
                key={m.id}
                label={`${m.amount !== 1 ? `${m.amount} ` : ""}${m.label}`}
                active={measureId === m.id}
                onPress={() => setMeasureId(m.id)}
              />
            ))}
          </View>
          <Notice>
            {grams
              ? `Equivalent to ${formatNumber(grams)} g${!["g", "kg", "oz", "lb"].includes(measureId) ? " · food-specific household estimate" : " · mass measurement"}.`
              : "Choose a valid quantity and a supported measure."}
          </Notice>
          <Button
            label={
              showSource
                ? "Hide food data source"
                : "Where do these numbers come from?"
            }
            variant="ghost"
            small
            onPress={() => setShowSource(!showSource)}
          />
          {showSource && (
            <Muted>
              {selected.source} · {selected.sourceVersion} · Food ID{" "}
              {selected.sourceId}. Nutrient values are estimates for the edible
              portion.
              {selected.source === "Open Food Facts" && ` Source: https://world.openfoodfacts.org/product/${selected.sourceId}`}
            </Muted>
          )}
          {!selected.measures.length && (
            <Muted>
              No verified household measures for this food. Weigh it in grams.
            </Muted>
          )}
          <Button
            label={existing ? "Update ingredient" : "Add to dish"}
            icon="add"
            disabled={!grams}
            onPress={() => {
              try {
                const item = makeIngredient(
                  selected,
                  amount!,
                  measureId,
                  existing?.id ?? id(),
                  data.settings.convention,
                );
                onAdd(item);
                onClose();
              } catch (e) {
                setError((e as Error).message);
              }
            }}
          />
        </>
      ) : (
        <>
          <Field
            label="Search foods"
            value={query}
            onChangeText={(text) => {
              setQuery(text);
              setOnline([]);
            }}
            placeholder="Try chicken, lentils, or olive oil"
            autoFocus
            editable={!busy}
          />
          {!offline && query.length > 1 && (
            <Button
              variant="secondary"
              label={API_URL ? "Search USDA online" : "Search packaged foods online"}
              icon="cloud-outline"
              loading={busy}
              onPress={() => {
                setBusy(true);
                setError("");
                void (API_URL ? searchOnline(query) : searchProducts(query))
                  .then((matches) => { setOnline(matches); if(!matches.length) setError("No matching products found online. Try another name or add the package label."); })
                  .catch((e) => setError(e.message))
                  .finally(() => setBusy(false));
              }}
            />
          )}
          <View>
            {[...online, ...list].map((food) => (
              <Pressable
                key={food.id}
                disabled={busy}
                onPress={() => void choose(food, online.includes(food))}
                accessibilityRole="button"
                accessibilityLabel={`Select ${food.name}`}
                style={{
                  paddingVertical: 15,
                  borderBottomWidth: 1,
                  borderBottomColor: colors.line,
                }}
              >
                <Row>
                  <View
                    style={{
                      backgroundColor: colors.pale,
                      width: 38,
                      height: 38,
                      borderRadius: 12,
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <Icon name="leaf-outline" size={19} />
                  </View>
                  <View style={{ flex: 1, gap: 4 }}>
                    <Txt style={{ fontSize: 14, fontWeight: "500" }}>
                      {food.name}
                    </Txt>
                    <Muted>
                      {food.state} · {formatNumber(food.nutrients.kcal, 0)} kcal
                      / 100 g
                    </Muted>
                  </View>
                  <Icon name="chevron-forward" size={17} color={colors.muted} />
                </Row>
              </Pressable>
            ))}
            {!list.length && !online.length && (
              <View style={{ padding: 20 }}>
                <Muted>
                  No local match. Try fewer words or create a custom food.
                </Muted>
              </View>
            )}
          </View>
          {busy && <ActivityIndicator accessibilityLabel="Loading food details" color={colors.accent} />}
          <Muted>
            Check raw versus cooked before adding. Cup and spoon weights use{" "}
            {data.settings.convention === "us"
              ? "US household"
              : "your selected"}{" "}
            measures.
          </Muted>
        </>
      )}
    </Sheet>
  );
}
