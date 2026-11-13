import { Image, DimensionValue } from "react-native";

const photos = {
  "chicken-rice": require("../../assets/food/chicken-rice.png"),
  "chicken-greens": require("../../assets/food/chicken-greens.png"),
  "chickpea-bowl": require("../../assets/food/chickpea-bowl.png"),
  "lentil-pot": require("../../assets/food/lentil-pot.png"),
  "tofu-rice": require("../../assets/food/tofu-rice.png"),
  "yogurt-oats": require("../../assets/food/yogurt-oats.png"),
  "peanut-oats": require("../../assets/food/peanut-oats.png"),
  "tuna-beans": require("../../assets/food/tuna-beans.png"),
  "egg-potato": require("../../assets/food/egg-potato.png"),
};
const defaults = { plant: "chickpea-bowl", chicken: "chicken-rice", oats: "yogurt-oats", fish: "tuna-beans", egg: "egg-potato" } as const;

// Bundled editorial photos; calculations always use the recorded ingredient weights.
export function MealPhoto({ variant = "plant", recipeId, size = 160, width, height, label }: {
  variant?: keyof typeof defaults; recipeId?: string; size?: number;
  width?: DimensionValue; height?: number; label?: string;
}) {
  const key = recipeId && recipeId in photos ? recipeId as keyof typeof photos : defaults[variant];
  return <Image source={photos[key]} accessible={!!label} accessibilityLabel={label}
    resizeMode="cover" style={{ width: width ?? size, height: height ?? size, borderRadius: 16 }} />;
}
