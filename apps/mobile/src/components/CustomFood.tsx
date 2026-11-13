import { useState } from "react";
import { View } from "react-native";
import { foodSchema, nutrientKeys, Nutrients } from "@mise/domain";
import { id, useKitchen } from "../data/store";
import { Button, Field, Muted, Notice, Row, Sheet } from "./ui";

export function CustomFood({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const [name, setName] = useState("");
  const [basis, setBasis] = useState("100");
  const [values, setValues] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      title="Your food, your label"
      subtitle="Enter label values and the gram weight they refer to."
    >
      <Field
        label="Food name"
        value={name}
        onChangeText={setName}
        placeholder="e.g. My protein yogurt"
        maxLength={200}
      />
      <Field
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
          <Field
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
              const nutrients = Object.fromEntries(
                nutrientKeys.map((key) => [
                  key,
                  values[key]?.trim()
                    ? (Number(values[key]) / grams) * 100
                    : null,
                ]),
              ) as Nutrients;
              const food = foodSchema.parse({
                id: `custom-${id()}`,
                name: name.trim(),
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
                sourceId: "personal",
                sourceVersion: new Date().toISOString(),
              });
              useKitchen.getState().addCustomFood(food);
              onClose();
            } catch (e) {
              setError(
                e instanceof Error ? e.message : "Check the nutrition values.",
              );
            }
          }}
        />
      </Row>
    </Sheet>
  );
}
