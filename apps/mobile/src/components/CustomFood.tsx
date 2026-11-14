import { useState } from "react";
import { View, ViewStyle } from "react-native";
import { Food, foodSchema, nutrientKeys, Nutrients, productBarcode } from "@mise/domain";
import { id, useKitchen } from "../data/store";
import { Button, Field, Muted, Notice, Row, Sheet } from "./ui";

const productFieldStyle: ViewStyle = { flexGrow: 0, flexShrink: 0, flexBasis: "auto" };

export function CustomFood({
  visible,
  onClose,
  barcode,
  initialFood,
  onSaved,
}: {
  visible: boolean;
  onClose: () => void;
  barcode?: string;
  initialFood?: Food;
  onSaved?: (food: Food) => void;
}) {
  const initialBasis = initialFood?.measures.find((m) => m.unit === "serving")?.grams ?? 100;
  const [name, setName] = useState(initialFood?.name ?? "");
  const [brand, setBrand] = useState(initialFood?.brand ?? "");
  const [ingredientsText, setIngredientsText] = useState(initialFood?.ingredientsText ?? "");
  const [allergensText, setAllergensText] = useState(initialFood?.allergensText ?? "");
  const [barcodeText, setBarcodeText] = useState(initialFood?.barcode ?? barcode ?? "");
  const [basis, setBasis] = useState(String(initialBasis));
  const [values, setValues] = useState<Record<string, string>>(() => Object.fromEntries(nutrientKeys.map((key) => {
    const value = initialFood?.nutrients[key];
    return [key, value === null || value === undefined ? "" : String(Number((value * initialBasis / 100).toFixed(5)))];
  })));
  const [error, setError] = useState("");
  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      title={initialFood ? "Save a custom product" : "Your food, your label"}
      subtitle="Enter label values and the gram weight they refer to."
    >
      <View style={{ gap: 16 }}>
      <Field containerStyle={productFieldStyle}
        label="Food name"
        value={name}
        onChangeText={setName}
        placeholder="e.g. My protein yogurt"
        maxLength={200}
      />
      <Field containerStyle={productFieldStyle} label="Brand (optional)" value={brand} onChangeText={setBrand} maxLength={300} />
      <Field containerStyle={productFieldStyle} label="Product barcode (optional)" value={barcodeText} onChangeText={setBarcodeText} keyboardType="number-pad" maxLength={14} />
      <Field containerStyle={productFieldStyle} label="Package ingredients (optional)" value={ingredientsText} onChangeText={setIngredientsText} multiline maxLength={12000} placeholder="Copy the ingredients listed on the package" />
      <Field containerStyle={productFieldStyle} label="Allergen information (optional)" value={allergensText} onChangeText={setAllergensText} maxLength={3000} placeholder="Copy allergen and may-contain statements from the label" multiline />
      <Field containerStyle={productFieldStyle}
        label="Label serving weight (g)"
        value={basis}
        onChangeText={setBasis}
        keyboardType="decimal-pad"
      />
      <Notice>
        Use the edible weight in grams. A serving in ml needs a measured gram
        weight; we don’t assume all liquids weigh the same.
      </Notice>
      <View style={{ gap: 12 }}>
        {nutrientKeys.map((key) => (
          <Field containerStyle={productFieldStyle}
            key={key}
            label={`${{ kcal: "Calories (kcal)", protein: "Protein (g)", carbs: "Carbohydrate (g)", fat: "Fat (g)", fiber: "Fiber (g)" }[key]} per label serving`}
            value={values[key] ?? ""}
            onChangeText={(v) => setValues({ ...values, [key]: v })}
            keyboardType="decimal-pad"
            placeholder="Unknown — leave blank"
          />
        ))}
      </View>
      <Muted>
        Blank values stay unknown. Enter 0 only if the label states zero.
      </Muted>
      {!!error && <Notice error>{error}</Notice>}
      <Row>
        <Button
          label="Save custom food"
          icon="checkmark"
          onPress={() => {
            try {
              const grams = Number(basis);
              if (!name.trim() || !Number.isFinite(grams) || grams <= 0)
                throw new Error("Enter a name and a positive serving weight.");
              const savedBarcode = barcodeText.trim() ? productBarcode(barcodeText) : undefined;
              if (savedBarcode === null) throw new Error("Enter a valid product barcode or clear the optional barcode field.");
              const nutrients = Object.fromEntries(
                nutrientKeys.map((key) => [
                  key,
                  values[key]?.trim()
                    ? (Number(values[key]) / grams) * 100
                    : null,
                ]),
              ) as Nutrients;
              const food = foodSchema.parse({
                id: initialFood?.source === "Custom" ? initialFood.id : `custom-${id()}`,
                name: name.trim(),
                brand: brand.trim() || undefined,
                ingredientsText: ingredientsText.trim() || undefined,
                allergensText: allergensText.trim() || undefined,
                aliases: [],
                category: "Custom foods",
                state: "as labeled",
                nutrients,
                measures: [
                  {
                    id: "custom-serving",
                    label: "label serving",
                    unit: "serving",
                    amount: 1,
                    grams,
                  },
                ],
                source: "Custom",
                barcode: savedBarcode,
                sourceId: "personal",
                sourceVersion: initialFood?.source === "Custom" ? initialFood.sourceVersion : `${new Date().toISOString()}${initialFood ? ` · Personal copy of ${initialFood.source} ${initialFood.sourceId} · ${initialFood.sourceVersion}; confirm edited values against your package` : ""}`,
              });
              useKitchen.getState().addCustomFood(food);
              if (onSaved) onSaved(food);
              else onClose();
            } catch (e) {
              setError(
                e instanceof Error ? e.message : "Check the nutrition values.",
              );
            }
          }}
        />
      </Row>
      </View>
    </Sheet>
  );
}
