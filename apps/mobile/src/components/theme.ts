import { createContext, createElement, PropsWithChildren, useContext } from "react";
import { useColorScheme } from "react-native";

export type ThemeMode = "light" | "dark";
export type ThemeColors = Record<"bg" | "paper" | "pale" | "line" | "soft" | "ink" | "muted" | "accent" | "secondary" | "onAccent" | "coral" | "blue" | "gold" | "error", string>;
export const themes: Record<ThemeMode, ThemeColors> = {
  light: {
    bg: "#F8F6F1", paper: "#FFFFFF", pale: "#EEE8DF", line: "#DED6CB", soft: "#A99C8C",
    ink: "#252422", muted: "#68625A", accent: "#252422", secondary: "#7A6F60", onAccent: "#F8F6F1",
    coral: "#8C7065", blue: "#775144", gold: "#A18970", error: "#7C382B",
  },
  // Match the visible grayscale swatches, not the image's mismatched warm hex labels.
  dark: {
    bg: "#0E0E0E", paper: "#1B1B1B", pale: "#2B2B2B", line: "#585858", soft: "#A2A2A2",
    ink: "#EDEDED", muted: "#B7B7B7", accent: "#EDEDED", secondary: "#A2A2A2", onAccent: "#0E0E0E",
    coral: "#A2A2A2", blue: "#EDEDED", gold: "#B7B7B7", error: "#EDEDED",
  },
};
const values = {light:{mode:"light" as const,colors:themes.light},dark:{mode:"dark" as const,colors:themes.dark}};
const ThemeContext = createContext<{mode:ThemeMode;colors:ThemeColors}>(values.light);
export function ThemeProvider({children}:PropsWithChildren) {
  const scheme=useColorScheme();
  return createElement(ThemeContext.Provider,{value:values[scheme === "dark" ? "dark" : "light"]},children);
}
export const useTheme = () => useContext(ThemeContext);
