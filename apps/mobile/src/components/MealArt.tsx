import { View } from "react-native";
import { colors, Icon } from "./ui";

// Lightweight vector-like native shapes keep the illustrations available offline.
export function MealArt({
  variant = "plant",
  size = 160,
}: {
  variant?: "chicken" | "plant" | "oats" | "fish" | "egg";
  size?: number;
}) {
  const unit = size / 180;
  const base = variant === "oats" ? "#EEDCC3" : "#F5E8C9";
  const protein =
    variant === "fish"
      ? "#ECA68D"
      : variant === "egg"
        ? "#F3CB5E"
        : variant === "plant"
          ? "#DCAA76"
          : "#D6A276";
  return (
    <View
      accessible={false}
      style={{
        width: size,
        height: size,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <View
        style={{
          position: "absolute",
          width: size * 0.86,
          height: size * 0.23,
          borderRadius: size,
          backgroundColor: "#163E2B12",
          bottom: size * 0.03,
          transform: [{ rotate: "-9deg" }],
        }}
      />
      <View
        style={{
          width: size * 0.87,
          height: size * 0.87,
          borderRadius: size,
          backgroundColor: "#FEFFFA",
          padding: size * 0.075,
          transform: [{ rotate: "-11deg" }],
          borderWidth: 1,
          borderColor: "#FFFFFF",
        }}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: base,
            borderRadius: size,
            overflow: "hidden",
          }}
        >
          {[
            [-3, 12],
            [14, 0],
            [25, 20],
            [1, 40],
            [21, 45],
          ].map(([x, y], index) => (
            <View
              key={`leaf-${index}`}
              style={{
                position: "absolute",
                left: x * unit,
                top: y * unit,
                width: 53 * unit,
                height: 48 * unit,
                borderRadius: 25 * unit,
                backgroundColor: ["#79A771", "#5C8C56", "#8DB67B"][index % 3],
                transform: [{ rotate: `${index * 30}deg` }],
              }}
            />
          ))}
          {[
            [77, 26],
            [96, 46],
            [74, 60],
          ].map(([x, y], index) => (
            <View
              key={`protein-${index}`}
              style={{
                position: "absolute",
                left: x * unit,
                top: y * unit,
                width: 37 * unit,
                height: 30 * unit,
                borderRadius: variant === "egg" ? 20 * unit : 10 * unit,
                backgroundColor: protein,
                borderWidth: 2 * unit,
                borderColor: "#FFFFFF88",
                transform: [{ rotate: `${index * 30 - 22}deg` }],
              }}
            />
          ))}
          {[
            [45, 85],
            [68, 102],
            [89, 94],
            [41, 108],
            [106, 90],
          ].map(([x, y], index) => (
            <View
              key={`tomato-${index}`}
              style={{
                position: "absolute",
                left: x * unit,
                top: y * unit,
                width: 19 * unit,
                height: 19 * unit,
                borderRadius: 12 * unit,
                backgroundColor: variant === "oats" ? "#B78D70" : "#DD8266",
                borderWidth: 3 * unit,
                borderColor: variant === "oats" ? "#DCC1A1" : "#F1B19B",
              }}
            />
          ))}
          <View
            style={{ position: "absolute", left: 55 * unit, top: 61 * unit }}
          >
            <Icon name="leaf" size={32 * unit} color={colors.green} />
          </View>
        </View>
      </View>
    </View>
  );
}
