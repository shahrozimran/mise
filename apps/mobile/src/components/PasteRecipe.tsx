import { useState } from "react";
import { Pressable, View } from "react-native";
import {
  Ingredient,
  makeIngredient,
  ParsedLine,
  parseRecipeText,
} from "@mise/domain";
import { foods } from "../data/catalog";
import { id, useKitchen } from "../data/store";
import {
  Button,
  colors,
  Field,
  Icon,
  Muted,
  Notice,
  Row,
  Sheet,
  Txt,
} from "./ui";
import { FoodPicker } from "./FoodPicker";

export function PasteRecipe({
  visible,
  onClose,
  onDone,
}: {
  visible: boolean;
  onClose: () => void;
  onDone: (message: string) => void;
}) {
  const data = useKitchen((s) => s.data)!;
  const [text, setText] = useState("");
  const [rows, setRows] = useState<ParsedLine[]>([]);
  const [confirmed, setConfirmed] = useState<Record<string, Ingredient>>({});
  const [editing, setEditing] = useState<ParsedLine | null>(null);
  const [error, setError] = useState("");
  return (
    <>
      <Sheet
        visible={visible && !editing}
        onClose={onClose}
        title="From recipe to reality"
        subtitle="Paste ingredient lines. Review each match before it reaches your dish."
      >
        {!!error && <Notice error>{error}</Notice>}
        {!rows.length ? (
          <>
            <Field
              label="Recipe ingredients"
              value={text}
              onChangeText={setText}
              multiline
              maxLength={50000}
              style={{ minHeight: 210 }}
              placeholder={
                "500 g chicken breast\n1½ cups chopped onion\n2 tbsp olive oil\n3 medium eggs"
              }
            />
            <Button
              label="Find ingredients"
              icon="sparkles-outline"
              disabled={!text.trim()}
              onPress={() => {
                try {
                  setRows(
                    parseRecipeText(
                      text,
                      [...data.customFoods, ...foods],
                      data.settings.convention,
                    ),
                  );
                } catch (e) {
                  setError((e as Error).message);
                }
              }}
            />
          </>
        ) : (
          <>
            <Notice>
              Only checked ingredients will be added. Resolve uncertain amounts
              and food matches with Edit.
            </Notice>
            {rows.map((row) => (
              <View
                key={row.id}
                style={{
                  paddingVertical: 14,
                  borderBottomWidth: 1,
                  borderBottomColor: colors.line,
                  gap: 9,
                }}
              >
                <Row>
                  <Pressable
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: !!confirmed[row.id] }}
                    aria-checked={!!confirmed[row.id]}
                    accessibilityLabel={`Review ${row.original}`}
                    onPress={() => {
                      if (confirmed[row.id]) {
                        const next = { ...confirmed };
                        delete next[row.id];
                        setConfirmed(next);
                        return;
                      }
                      if (
                        row.issue ||
                        !row.food ||
                        !row.quantity ||
                        !row.measureId
                      ) {
                        setEditing(row);
                        return;
                      }
                      try {
                        setConfirmed({
                          ...confirmed,
                          [row.id]: {
                            ...makeIngredient(
                              row.food,
                              row.quantity,
                              row.measureId,
                              id(),
                              data.settings.convention,
                            ),
                            originalText: row.original,
                          },
                        });
                      } catch (e) {
                        setError((e as Error).message);
                      }
                    }}
                    style={{ padding: 8 }}
                  >
                    <Icon
                      name={confirmed[row.id] ? "checkbox" : "square-outline"}
                      color={colors.accent}
                      size={23}
                    />
                  </Pressable>
                  <View style={{ flex: 1, gap: 5 }}>
                    <Txt style={{ fontWeight: "500" }}>{row.original}</Txt>
                    <Muted>
                      {confirmed[row.id]
                        ? confirmed[row.id].food.name
                        : (row.food?.name ?? "No match yet")}
                    </Muted>
                  </View>
                  <Button
                    small
                    label="Edit"
                    variant="secondary"
                    onPress={() => setEditing(row)}
                  />
                </Row>
                {row.issue && !confirmed[row.id] && (
                  <Txt style={{ color: colors.coral, fontSize: 12 }}>
                    {row.issue}
                  </Txt>
                )}
              </View>
            ))}
            <Button
              label={`Add ${Object.keys(confirmed).length} reviewed ingredients`}
              disabled={!Object.keys(confirmed).length}
              icon="add"
              onPress={() => {
                useKitchen.getState().updateDraft({
                  ingredients: [
                    ...data.draft.ingredients,
                    ...Object.values(confirmed),
                  ],
                });
                onDone(
                  `${Object.keys(confirmed).length} ingredients added. ${rows.length - Object.keys(confirmed).length} lines left out.`,
                );
                onClose();
              }}
            />
            <Button
              label="Edit pasted text"
              variant="ghost"
              onPress={() => setRows([])}
            />
          </>
        )}
      </Sheet>
      {editing && (
        <FoodPicker
          key={editing.id}
          visible
          onClose={() => setEditing(null)}
          initialQuery={editing.food?.name ?? editing.name}
          initialFood={editing.food ?? undefined}
          initialQuantity={editing.measureId ? (editing.quantity ?? "") : ""}
          initialMeasureId={editing.measureId ?? undefined}
          existing={confirmed[editing.id]}
          onAdd={(ingredient) =>
            setConfirmed({
              ...confirmed,
              [editing.id]: { ...ingredient, originalText: editing.original },
            })
          }
        />
      )}
    </>
  );
}
