import { View } from "react-native";
import { formatNumber, Nutrients } from "@mise/domain";
import { colors, Icon, Row, Txt } from "./ui";

const macroConfig = [
  ["protein", "Protein", colors.coral],
  ["carbs", "Carbs", colors.gold],
  ["fat", "Fat", colors.blue],
  ["fiber", "Fiber", "#90A870"],
] as const;
export function Macros({
  nutrients,
  label = "WHOLE RECIPE",
  dark = true,
}: {
  nutrients: Nutrients;
  label?: string;
  dark?: boolean;
}) {
  const ink = dark ? "#FFFFFF" : colors.ink;
  return (
    <View
      style={{
        backgroundColor: dark ? colors.green : colors.pale,
        borderRadius: 20,
        padding: 25,
        gap: 21,
      }}
    >
      <Row style={{ justifyContent: "space-between" }}>
        <Txt
          style={{
            fontSize: 10,
            letterSpacing: 1.8,
            color: dark ? "#BED2BC" : colors.green,
            fontWeight: "600",
          }}
        >
          {label}
        </Txt>
        <Icon
          name="nutrition-outline"
          color={dark ? colors.lime : colors.green}
          size={22}
        />
      </Row>
      <Row style={{ alignItems: "baseline", gap: 8 }}>
        <Txt
          style={{
            color: ink,
            fontSize: 57,
            lineHeight: 63,
            letterSpacing: -2.5,
            fontWeight: "500",
          }}
        >
          {formatNumber(nutrients.kcal, 0)}
        </Txt>
        <Txt style={{ color: dark ? "#BED2BC" : colors.muted, fontSize: 14 }}>
          kcal
        </Txt>
      </Row>
      <View
        style={{ height: 1, backgroundColor: dark ? "#416957" : "#D9E2D0" }}
      />
      <View style={{ gap: 15 }}>
        {macroConfig.map(([key, title, color]) => (
          <Row key={key} style={{ justifyContent: "space-between" }}>
            <Row style={{ gap: 9 }}>
              <View
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: 4,
                  backgroundColor: color,
                }}
              />
              <Txt
                style={{ color: dark ? "#DFE9DC" : colors.ink, fontSize: 13 }}
              >
                {title}
              </Txt>
            </Row>
            <Txt style={{ color: ink, fontSize: 15, fontWeight: "600" }}>
              {formatNumber(nutrients[key])}
              <Txt
                style={{ color: dark ? "#B4C9AF" : colors.muted, fontSize: 11 }}
              >
                {" "}
                g
              </Txt>
            </Txt>
          </Row>
        ))}
      </View>
      <Txt
        style={{
          color: dark ? "#B4C9AF" : colors.muted,
          fontSize: 11,
          lineHeight: 17,
        }}
      >
        Nutrition estimates from your selected foods.
        {nutrients.kcal === null ? " Missing values need review." : ""}
      </Txt>
    </View>
  );
}
export function MiniMacros({ nutrients }: { nutrients: Nutrients }) {
  return (
    <Row style={{ flexWrap: "wrap", gap: 17 }}>
      <Txt style={{ fontWeight: "700", color: colors.green }}>
        {formatNumber(nutrients.kcal, 0)} kcal
      </Txt>
      <Txt style={{ fontSize: 12, color: colors.muted }}>
        {formatNumber(nutrients.protein)}g protein
      </Txt>
      <Txt style={{ fontSize: 12, color: colors.muted }}>
        {formatNumber(nutrients.carbs)}g carbs
      </Txt>
      <Txt style={{ fontSize: 12, color: colors.muted }}>
        {formatNumber(nutrients.fat)}g fat
      </Txt>
      <Txt style={{ fontSize: 12, color: colors.muted }}>
        {formatNumber(nutrients.fiber)}g fiber
      </Txt>
    </Row>
  );
}
