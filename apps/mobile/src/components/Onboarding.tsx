import { useRef, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  allergenOptions,
  defaultPreferences,
  dietOptions,
  goalOptions,
  Preferences,
} from "@mise/domain";
import { useKitchen } from "../data/store";
import { BrandMark, Button, colors, Field, Icon, IconName, Muted, Row, Txt } from "./ui";
import { Enter, TouchCard } from "./motion";
import { MealPhoto } from "./MealPhoto";

export const goalIcons: Record<Preferences["goal"], IconName> = {
  lose: "trending-down-outline",
  gain: "trending-up-outline",
  muscle: "barbell-outline",
  balanced: "leaf-outline",
  prep: "time-outline",
};
const titles = [
  "What brings you here?",
  "What feels like you?",
  "Anything off the menu?",
  "Make it fit your day.",
  "A kitchen that gets you.",
];
const details = [
  "There’s no perfect starting point. Just choose what matters to you.",
  "We’ll use your eating style to find meals you’ll actually enjoy.",
  "We’ll leave these ingredients out of your suggested meals.",
  "A few small details make the suggestions much more useful.",
  "Here’s what we’ll keep in mind when finding your next meal.",
];

export function Onboarding({
  editing = false,
  onClose,
}: {
  editing?: boolean;
  onClose?: () => void;
}) {
  const data = useKitchen((s) => s.data)!;
  const [step, setStep] = useState(editing ? 0 : data.onboardingStep);
  const [preferences, setPreferences] = useState<Preferences>(
    data.preferences ?? defaultPreferences(),
  );
  const [error, setError] = useState("");
  const scroll = useRef<React.ComponentRef<typeof ScrollView>>(null);
  const insets = useSafeAreaInsets();
  const wide = useWindowDimensions().width > 850;
  function change(patch: Partial<Preferences>) {
    setPreferences((current) => ({ ...current, ...patch }));
  }
  function finish() {
    try {
      useKitchen
        .getState()
        .commit((d) => ({
          ...d,
          preferences: {
            ...preferences,
            name: preferences.name.trim(),
            completedAt: new Date().toISOString(),
          },
          onboardingStep: 0,
        }));
      onClose?.();
    } catch {
      setError("Your choices could not be saved. Please try again.");
    }
  }
  function next(direction: number) {
    const nextStep = Math.max(0, Math.min(4, step + direction));
    if (!editing)
      useKitchen
        .getState()
        .commit((d) => ({
          ...d,
          preferences: { ...preferences, completedAt: null },
          onboardingStep: nextStep,
        }));
    setStep(nextStep);
    scroll.current?.scrollTo({ y: 0, animated: false });
  }
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={o.top}>
        <Row style={{ gap: 8 }}>
          <BrandMark />
          <Txt style={{ fontSize: 29, fontWeight: "700", letterSpacing: -1.2 }}>
            mise.
          </Txt>
        </Row>
        <Pressable
          accessibilityRole="button"
          onPress={editing ? onClose : finish}
          accessibilityLabel={
            editing ? "Cancel preferences" : "Skip setup for now"
          }
          style={{ padding: 12 }}
        >
          <Txt style={{ color: colors.muted, fontSize: 13 }}>
            {editing ? "Cancel" : "Skip for now"}
          </Txt>
        </Pressable>
      </View>
      <View style={[o.body, { flexDirection: wide ? "row" : "column" }]}>
        {wide && (
          <View style={o.story}>
            <View style={o.storyPill}>
              <Icon name="sparkles-outline" size={15} />
              <Txt style={{ fontSize: 12, color: colors.accent }}>
                A LITTLE PREP. A BETTER DAY.
              </Txt>
            </View>
            <Txt style={o.storyTitle}>
              Your kitchen.{"\n"}Your routine.
            </Txt>
            <Muted>
              Meals you look forward to. Portions that make sense. A routine
              that feels like yours.
            </Muted>
            <Enter delay={100} style={{ alignItems: "center", marginTop: 25 }}>
              <MealPhoto size={290} height={220} />
            </Enter>
            <Row style={{ justifyContent: "center", marginTop: 10 }}>
              <Icon name="lock-closed-outline" size={13} color={colors.muted} />
              <Muted>Your choices stay on your device.</Muted>
            </Row>
          </View>
        )}
        <View style={o.form}>
          <View
            style={{
              gap: 13,
              paddingHorizontal: 24,
              paddingTop: wide ? 12 : 3,
              paddingBottom: 18,
            }}
          >
            <Row style={{ justifyContent: "space-between" }}>
              <Txt style={o.step}>LET’S MAKE IT PERSONAL</Txt>
              <Txt style={{ fontSize: 12, color: colors.muted }}>
                {step + 1} of 5
              </Txt>
            </Row>
            <Row style={{ gap: 6 }}>
              {titles.map((_, index) => (
                <View
                  key={index}
                  style={{
                    height: 5,
                    borderRadius: 4,
                    flex: 1,
                    backgroundColor: index <= step ? colors.accent : "#253745",
                  }}
                />
              ))}
            </Row>
          </View>
          <ScrollView
            ref={scroll}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 24 }}
          >
            <Enter key={step}>
              <Txt accessibilityRole="header" style={o.title}>
                {titles[step]}
              </Txt>
              <Txt style={o.description}>{details[step]}</Txt>
              {step === 0 && (
                <View accessibilityRole="radiogroup" style={{ gap: 11 }}>
                  {goalOptions.map((option) => (
                    <TouchCard
                      key={option.id}
                      label={option.title}
                      role="radio"
                      selected={preferences.goal === option.id}
                      onPress={() => change({ goal: option.id })}
                    >
                      <View
                        style={[
                          o.option,
                          preferences.goal === option.id && o.selected,
                        ]}
                      >
                        <View
                          style={[
                            o.optionIcon,
                            { backgroundColor: option.color },
                          ]}
                        >
                          <Icon name={goalIcons[option.id]} size={25} />
                        </View>
                        <View style={{ flex: 1, gap: 5 }}>
                          <Txt style={o.optionTitle}>{option.title}</Txt>
                          <Txt style={o.optionDetail}>{option.detail}</Txt>
                        </View>
                        <Icon
                          name={
                            preferences.goal === option.id
                              ? "checkmark-circle"
                              : "ellipse-outline"
                          }
                          color={
                            preferences.goal === option.id
                              ? colors.accent
                              : "#4A5C6A"
                          }
                          size={22}
                        />
                      </View>
                    </TouchCard>
                  ))}
                </View>
              )}
              {step === 1 && (
                <View accessibilityRole="radiogroup" style={{ gap: 13 }}>
                  {dietOptions.map((option, index) => (
                    <TouchCard
                      key={option.id}
                      label={option.title}
                      role="radio"
                      selected={preferences.diet === option.id}
                      onPress={() => change({ diet: option.id })}
                    >
                      <View
                        style={[
                          o.option,
                          preferences.diet === option.id && o.selected,
                        ]}
                      >
                        <View
                          style={[
                            o.optionIcon,
                            {
                              backgroundColor: [
                                "#253745",
                                "#253745",
                                "#253745",
                                "#253745",
                              ][index],
                            },
                          ]}
                        >
                          <Icon
                            name={
                              (
                                [
                                  "restaurant-outline",
                                  "egg-outline",
                                  "leaf-outline",
                                  "fish-outline",
                                ] as IconName[]
                              )[index]
                            }
                            size={25}
                          />
                        </View>
                        <View style={{ flex: 1, gap: 7 }}>
                          <Txt style={o.optionTitle}>{option.title}</Txt>
                          <Txt style={o.optionDetail}>{option.detail}</Txt>
                        </View>
                        <Icon
                          name={
                            preferences.diet === option.id
                              ? "checkmark-circle"
                              : "ellipse-outline"
                          }
                          color={
                            preferences.diet === option.id
                              ? colors.accent
                              : "#4A5C6A"
                          }
                          size={22}
                        />
                      </View>
                    </TouchCard>
                  ))}
                </View>
              )}
              {step === 2 && (
                <View style={{ gap: 18 }}>
                  <View
                    style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}
                  >
                    {allergenOptions.map((item) => {
                      const selected = preferences.allergens.includes(item.id);
                      return (
                        <TouchCard
                          key={item.id}
                          role="checkbox"
                          label={item.title}
                          selected={selected}
                          onPress={() =>
                            change({
                              allergens: selected
                                ? preferences.allergens.filter(
                                    (a) => a !== item.id,
                                  )
                                : [...preferences.allergens, item.id],
                            })
                          }
                          style={{ minWidth: "46%", flexGrow: 1 }}
                        >
                          <View style={[o.avoid, selected && o.selected]}>
                            <Icon
                              name={
                                selected
                                  ? "checkmark-circle"
                                  : "add-circle-outline"
                              }
                              size={19}
                              color={colors.accent}
                            />
                            <Txt style={{ fontSize: 14 }}>{item.title}</Txt>
                          </View>
                        </TouchCard>
                      );
                    })}
                  </View>
                  <Button
                    variant="secondary"
                    label="None of these"
                    icon={
                      !preferences.allergens.length ? "checkmark" : undefined
                    }
                    onPress={() => change({ allergens: [] })}
                  />
                  <Field
                    label="Other foods you avoid (optional)"
                    value={preferences.avoidFoods}
                    maxLength={500}
                    onChangeText={(avoidFoods) => change({ avoidFoods })}
                    placeholder="e.g. mushrooms, pork — separate with commas"
                  />
                  <Muted>
                    Always check ingredient labels and cross-contact
                    information. Your choices filter our meal ideas, not foods
                    you add yourself.
                  </Muted>
                </View>
              )}
              {step === 3 && (
                <View style={{ gap: 23 }}>
                  <View style={{ gap: 10 }}>
                    <Txt style={o.optionTitle}>How much time do you have?</Txt>
                    <Row>
                      {([15, 30, 45] as const).map((minutes) => (
                        <TouchCard
                          key={minutes}
                          role="radio"
                          label={`${minutes} minutes`}
                          selected={preferences.minutes === minutes}
                          onPress={() => change({ minutes })}
                          style={{ flex: 1 }}
                        >
                          <View
                            style={[
                              o.smallOption,
                              preferences.minutes === minutes && o.selected,
                            ]}
                          >
                            <Icon name="time-outline" size={22} />
                            <Txt style={{ fontWeight: "600", fontSize: 17 }}>
                              {minutes} min
                            </Txt>
                            <Txt style={{ fontSize: 11, color: colors.muted }}>
                              {minutes === 15
                                ? "Keep it quick"
                                : minutes === 30
                                  ? "A little prep"
                                  : "Time to cook"}
                            </Txt>
                          </View>
                        </TouchCard>
                      ))}
                    </Row>
                  </View>
                  <View style={{ gap: 10 }}>
                    <Txt style={o.optionTitle}>
                      How many portions do you usually make?
                    </Txt>
                    <Row
                      style={{
                        justifyContent: "center",
                        backgroundColor: colors.paper,
                        borderRadius: 18,
                        padding: 14,
                        borderColor: colors.line,
                        borderWidth: 1,
                      }}
                    >
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Fewer portions"
                        disabled={preferences.servings === 1}
                        onPress={() =>
                          change({ servings: preferences.servings - 1 })
                        }
                        style={o.counter}
                      >
                        <Icon name="remove" />
                      </Pressable>
                      <View style={{ alignItems: "center", minWidth: 70 }}>
                        <Txt style={{ fontSize: 32, fontWeight: "600" }}>
                          {preferences.servings}
                        </Txt>
                        <Muted>portions</Muted>
                      </View>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="More portions"
                        disabled={preferences.servings === 12}
                        onPress={() =>
                          change({ servings: preferences.servings + 1 })
                        }
                        style={o.counter}
                      >
                        <Icon name="add" />
                      </Pressable>
                    </Row>
                  </View>
                  <View style={{ gap: 10 }}>
                    <Txt style={o.optionTitle}>
                      How do you feel in the kitchen?
                    </Txt>
                    <View style={{ gap: 8 }}>
                      <Button
                        variant={
                          preferences.experience === "new"
                            ? "primary"
                            : "secondary"
                        }
                        label="Finding my feet"
                        onPress={() => change({ experience: "new" })}
                      />
                      <Button
                        variant={
                          preferences.experience === "comfortable"
                            ? "primary"
                            : "secondary"
                        }
                        label="Pretty comfortable"
                        onPress={() => change({ experience: "comfortable" })}
                      />
                    </View>
                  </View>
                </View>
              )}
              {step === 4 && (
                <View style={{ gap: 19 }}>
                  <View
                    style={{
                      alignItems: "center",
                      backgroundColor: "#253745",
                      borderRadius: 24,
                      padding: 20,
                    }}
                  >
                    <Icon name="checkmark-circle-outline" size={44} color={colors.accent} />
                    <Txt
                      style={{ fontSize: 23, fontWeight: "600", marginTop: 6 }}
                    >
                      {
                        goalOptions.find((g) => g.id === preferences.goal)!
                          .title
                      }
                    </Txt>
                    <Txt
                      style={{
                        color: colors.muted,
                        marginTop: 9,
                        lineHeight: 23,
                        textAlign: "center",
                      }}
                    >
                      {
                        dietOptions.find((d) => d.id === preferences.diet)!
                          .title
                      }
                      {"\n"}Up to {preferences.minutes} minutes ·{" "}
                      {preferences.servings} portions
                    </Txt>
                    {preferences.allergens.length > 0 && (
                      <Txt
                        style={{
                          color: colors.accent,
                          marginTop: 9,
                          textAlign: "center",
                          fontSize: 12,
                        }}
                      >
                        Leaving out:{" "}
                        {preferences.allergens
                          .map(
                            (a) =>
                              allergenOptions.find((o) => o.id === a)!.title,
                          )
                          .join(", ")}
                      </Txt>
                    )}
                  </View>
                  <Field
                    label="What should we call you? (optional)"
                    value={preferences.name}
                    onChangeText={(name) => change({ name })}
                    maxLength={40}
                    placeholder="Your first name"
                  />
                  <Muted>
                    Suggestions help you discover meals. They don’t calculate a
                    personal calorie prescription or promise a weight change.
                    You can change these choices anytime.
                  </Muted>
                </View>
              )}
              {!!error && (
                <Txt accessibilityRole="alert" style={{ color: colors.error }}>
                  {error}
                </Txt>
              )}
            </Enter>
          </ScrollView>
          <View style={[o.footer, !editing && { paddingBottom: 22 + insets.bottom }]}>
            <Row>
              {step > 0 && (
                <Button
                  label="Back"
                  variant="secondary"
                  icon="arrow-back"
                  onPress={() => next(-1)}
                />
              )}
              <View style={{ flex: 1 }}>
                <Button
                  label={
                    step === 4
                      ? editing
                        ? "Save my preferences"
                        : "Show my meal ideas"
                      : "Continue"
                  }
                  icon={step === 4 ? "sparkles-outline" : "arrow-forward"}
                  onPress={step === 4 ? finish : () => next(1)}
                />
              </View>
            </Row>
            <Txt
              style={{
                color: colors.muted,
                textAlign: "center",
                fontSize: 11,
                marginTop: 12,
              }}
            >
              Made for your life. Change it anytime.
            </Txt>
          </View>
        </View>
      </View>
    </View>
  );
}
const o = StyleSheet.create({
  top: {
    width: "100%",
    maxWidth: 1120,
    alignSelf: "center",
    padding: 22,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  mark: { padding: 9, borderRadius: 13, backgroundColor: colors.accent },
  body: {
    flex: 1,
    maxWidth: 1120,
    width: "100%",
    alignSelf: "center",
    paddingBottom: 5,
  },
  story: { width: "43%", padding: 35, paddingTop: 32 },
  storyPill: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    marginBottom: 24,
  },
  storyTitle: {
    fontSize: 46,
    lineHeight: 54,
    fontWeight: "500",
    letterSpacing: -2.5,
    marginBottom: 20,
    color: colors.ink,
  },
  form: { flex: 1, maxWidth: 610, width: "100%", alignSelf: "center" },
  title: {
    fontSize: 31,
    lineHeight: 38,
    fontWeight: "600",
    letterSpacing: -1,
    marginBottom: 9,
  },
  description: {
    color: "#9BA8AB",
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 23,
  },
  step: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.4,
    color: colors.accent,
  },
  option: {
    minHeight: 87,
    padding: 15,
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
    borderRadius: 18,
    backgroundColor: colors.paper,
    borderColor: "#253745",
    borderWidth: 2,
  },
  selected: { borderColor: colors.accent, backgroundColor: "#253745" },
  optionIcon: {
    width: 48,
    height: 48,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  optionTitle: { fontSize: 16, fontWeight: "600", color: colors.ink },
  optionDetail: { fontSize: 12, lineHeight: 18, color: "#9BA8AB" },
  avoid: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    padding: 14,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: "#253745",
    backgroundColor: colors.paper,
  },
  smallOption: {
    alignItems: "center",
    gap: 8,
    paddingVertical: 18,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#253745",
    backgroundColor: colors.paper,
  },
  counter: {
    width: 48,
    height: 48,
    borderRadius: 15,
    backgroundColor: colors.pale,
    alignItems: "center",
    justifyContent: "center",
  },
  footer: {
    padding: 22,
    borderTopWidth: 1,
    borderTopColor: "#253745",
    backgroundColor: colors.bg,
  },
});
