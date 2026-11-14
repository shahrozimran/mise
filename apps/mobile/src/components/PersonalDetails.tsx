import { useState } from "react";
import { ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PersonalDetails, personalDetailsSchema, Preferences } from "@mise/domain";
import { BrandMark, Button, Field, Muted, Notice, Row, Txt, useTheme } from "./ui";
import { Enter } from "./motion";

function numericInput(value: string) {
  const normalized = value.trim().replace(",", ".");
  return /^\d+(\.\d+)?$/.test(normalized) ? Number(normalized) : NaN;
}

export function PersonalDetailsForm({
  initial,
  submitLabel,
  onSave,
}: {
  initial: Preferences;
  submitLabel: string;
  onSave: (details: PersonalDetails) => void;
}) {
  const [name, setName] = useState(initial.name);
  const [age, setAge] = useState(initial.age === null ? "" : String(initial.age));
  const [weight, setWeight] = useState(initial.weightKg === null ? "" : String(initial.weightKg));
  const [height, setHeight] = useState(initial.heightCm === null ? "" : String(initial.heightCm));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  function submit() {
    const result = personalDetailsSchema.safeParse({
      name,
      age: numericInput(age),
      weightKg: numericInput(weight),
      heightCm: numericInput(height),
    });
    if (!result.success) {
      const fields = new Set(result.error.issues.map((issue) => String(issue.path[0])));
      setErrors({
        ...(fields.has("name") && { name: "Enter your name (up to 40 characters)." }),
        ...(fields.has("age") && { age: "Enter a whole age between 1 and 120." }),
        ...(fields.has("weightKg") && { weight: "Enter a weight between 1 and 700 kg." }),
        ...(fields.has("heightCm") && { height: "Enter a height between 30 and 300 cm." }),
      });
      setError("Check the highlighted fields to continue.");
      return;
    }
    setErrors({});
    setError("");
    try {
      onSave(result.data);
    } catch {
      setError("Your details could not be saved. Please try again.");
    }
  }
  return (
    <View style={{ gap: 18 }}>
      {!!error && <Notice error>{error}</Notice>}
      <Field label="Name" value={name} onChangeText={setName} maxLength={40} autoComplete="name" autoCapitalize="words" placeholder="Your name" error={errors.name} />
      <Field label="Age (years)" value={age} onChangeText={setAge} keyboardType="number-pad" maxLength={3} placeholder="e.g. 28" error={errors.age} />
      <Row style={{ flexWrap: "wrap", alignItems: "flex-start", gap: 18 }}>
        <Field containerStyle={{ flexBasis: 200, flexGrow: 1 }} label="Current weight (kg)" value={weight} onChangeText={setWeight} keyboardType="decimal-pad" maxLength={7} placeholder="e.g. 70" error={errors.weight} />
        <Field containerStyle={{ flexBasis: 200, flexGrow: 1 }} label="Height (cm)" value={height} onChangeText={setHeight} keyboardType="decimal-pad" maxLength={7} placeholder="e.g. 175" error={errors.height} />
      </Row>
      <Muted>Your details stay on this device. You can change them in Settings.</Muted>
      <Button label={submitLabel} onPress={submit} />
    </View>
  );
}

export function PersonalDetailsIntro({ initial, onSave }: {
  initial: Preferences;
  onSave: (details: PersonalDetails) => void;
}) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" contentContainerStyle={{ padding: 24, paddingBottom: insets.bottom + 32 }}>
      <View style={{ maxWidth: 560, width: "100%", alignSelf: "center", gap: 28 }}>
        <Row><BrandMark /><Txt style={{ fontSize: 29, fontWeight: "700", letterSpacing: -1.2 }}>mise.</Txt></Row>
        <Enter>
          <View style={{ gap: 14, marginBottom: 24 }}>
            <Row style={{ justifyContent: "space-between" }}>
              <Txt style={{ color: colors.muted, fontSize: 12, fontWeight: "600" }}>YOUR PROFILE</Txt>
              <Muted>1 of 6</Muted>
            </Row>
            <View style={{ height: 4, backgroundColor: colors.pale, borderRadius: 2 }}><View style={{ width: "16.667%", height: 4, borderRadius: 2, backgroundColor: colors.accent }} /></View>
            <Txt accessibilityRole="header" style={{ fontSize: 30, fontWeight: "600", letterSpacing: -0.8 }}>Tell us about you</Txt>
            <Muted>Start with your details, then choose your meal preferences. All four fields are required.</Muted>
          </View>
          <PersonalDetailsForm initial={initial} submitLabel="Continue to preferences" onSave={onSave} />
        </Enter>
      </View>
    </ScrollView>
  );
}
